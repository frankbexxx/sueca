import { getDurableBuildVersion } from '../services/durableLocalStorage';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { loadDiagnosticMatchLogs, getDiagnosticMatchLog } from './store';
import {
  DIAGNOSTIC_EXPORT_KIND,
  DIAGNOSTIC_SCHEMA_VERSION,
  DiagnosticExportEnvelope,
  DiagnosticMatchLog
} from './types';

export function anonymizeDiagnosticLog(log: DiagnosticMatchLog): DiagnosticMatchLog {
  const players = log.players.map((p, i) => ({
    ...p,
    name: `Player ${i + 1}`
  }));
  const cloned = JSON.parse(JSON.stringify(log)) as DiagnosticMatchLog;
  cloned.players = players;
  return cloned;
}

export function buildDiagnosticExportFilename(opts?: {
  gameVariant?: string;
  logId?: string;
  all?: boolean;
}): string {
  const day = new Date().toISOString().slice(0, 10);
  if (opts?.all) return `suecao-diagnostic-${day}.json`;
  const variant = (opts?.gameVariant || 'match').replace(/[^a-z0-9-]+/gi, '-');
  const short =
    opts?.logId?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) ||
    Date.now().toString(36);
  return `suecao-${variant}-${day}-${short}.json`;
}

export async function exportDiagnosticMatchLogs(options?: {
  logId?: string;
  anonymizePlayers?: boolean;
}): Promise<DiagnosticExportEnvelope> {
  const anonymizePlayers = options?.anonymizePlayers ?? false;
  let logs: DiagnosticMatchLog[];
  if (options?.logId) {
    const one = await getDiagnosticMatchLog(options.logId);
    logs = one ? [one] : [];
  } else {
    logs = await loadDiagnosticMatchLogs();
  }
  if (anonymizePlayers) {
    logs = logs.map(anonymizeDiagnosticLog);
  }
  return {
    kind: DIAGNOSTIC_EXPORT_KIND,
    schemaVersion: DIAGNOSTIC_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    buildVersion: getDurableBuildVersion(),
    anonymizePlayers,
    logCount: logs.length,
    logs,
    replayLevelClaim: 1,
    notes: [
      'LEVEL 1 diagnostic reconstruct: deal, plays, bids/Festa/Hearts pass, scores.',
      'RNG seed is recorded but production shuffle/AI still use Math.random (not LEVEL 2).',
      'Separate from user match history (sueca-match-history-v1).'
    ]
  };
}

export function serializeDiagnosticExport(envelope: DiagnosticExportEnvelope): string {
  return JSON.stringify(envelope, null, 2);
}

/** Parse/validate an export or bare log for regression-test bridges. */
export function parseDiagnosticExport(json: string): {
  ok: boolean;
  envelope?: DiagnosticExportEnvelope;
  logs: DiagnosticMatchLog[];
  error?: string;
} {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, logs: [], error: 'not_object' };
    }
    const p = parsed as Record<string, unknown>;
    if (p.kind === DIAGNOSTIC_EXPORT_KIND && Array.isArray(p.logs)) {
      const logs = (p.logs as unknown[]).filter(
        (l) => l && typeof l === 'object' && typeof (l as DiagnosticMatchLog).logId === 'string'
      ) as DiagnosticMatchLog[];
      return { ok: true, envelope: p as unknown as DiagnosticExportEnvelope, logs };
    }
    if (typeof p.logId === 'string' && Array.isArray(p.events)) {
      return { ok: true, logs: [p as unknown as DiagnosticMatchLog] };
    }
    return { ok: false, logs: [], error: 'unrecognized_shape' };
  } catch (e) {
    return { ok: false, logs: [], error: e instanceof Error ? e.message : 'parse_error' };
  }
}

/**
 * Locate an AI decision in a log (King analysis use case).
 */
export function findAiDecision(
  log: DiagnosticMatchLog,
  opts: { seq?: number; seat?: number; chosenRank?: string; chosenSuit?: string }
) {
  return log.events.filter((e) => {
    if (e.type !== 'AI_DECISION') return false;
    if (opts.seq != null && e.seq !== opts.seq) return false;
    if (opts.seat != null && e.payload.seat !== opts.seat) return false;
    if (opts.chosenRank && e.payload.chosenCard.rank !== opts.chosenRank) return false;
    if (opts.chosenSuit && e.payload.chosenCard.suit !== opts.chosenSuit) return false;
    return true;
  });
}

function triggerBrowserDownload(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function shareViaWebShareFiles(filename: string, text: string): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
      return false;
    }
    const file = new File([text], filename, { type: 'application/json' });
    const data: ShareData = {
      files: [file],
      title: 'Suecão diagnóstico',
      text: 'Log técnico Suecão (JSON)'
    };
    if (navigator.canShare && !navigator.canShare(data)) {
      return false;
    }
    await navigator.share(data);
    return true;
  } catch (err) {
    // AbortError = user cancelled share sheet — still counts as usable path.
    if (err instanceof Error && err.name === 'AbortError') return true;
    return false;
  }
}

async function shareViaCapacitorFileUri(
  filename: string,
  text: string
): Promise<{ ok: boolean; path?: string }> {
  const relative = `suecao-exports/${filename}`;
  await Filesystem.writeFile({
    path: relative,
    data: text,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
    recursive: true
  });
  const { uri } = await Filesystem.getUri({
    path: relative,
    directory: Directory.Cache
  });
  await Share.share({
    title: 'Suecão diagnóstico',
    text: 'Log técnico Suecão para análise',
    url: uri,
    dialogTitle: 'Partilhar diagnóstico Suecão'
  });
  return { ok: true, path: uri };
}

/**
 * Production-usable export: opens the Android share sheet with the JSON file
 * so a non-technical tester can send it (WhatsApp, Drive, email, Files, …).
 * Web: downloads the JSON.
 */
export async function shareOrDownloadDiagnosticExport(options?: {
  logId?: string;
  anonymizePlayers?: boolean;
}): Promise<{ ok: boolean; filename: string; path?: string; method: string; error?: string }> {
  try {
    const envelope = await exportDiagnosticMatchLogs(options);
    const filename = buildDiagnosticExportFilename({
      all: !options?.logId,
      gameVariant: envelope.logs[0]?.gameVariant,
      logId: envelope.logs[0]?.logId
    });
    const text = serializeDiagnosticExport(envelope);

    if (!Capacitor.isNativePlatform()) {
      triggerBrowserDownload(filename, text);
      return { ok: true, filename, method: 'download' };
    }

    // Prefer OS share sheet with a real File attachment.
    if (await shareViaWebShareFiles(filename, text)) {
      return { ok: true, filename, method: 'web-share-file' };
    }

    try {
      const shared = await shareViaCapacitorFileUri(filename, text);
      return {
        ok: true,
        filename,
        path: shared.path,
        method: 'capacitor-share-uri'
      };
    } catch (err) {
      // Last resort: still write the file and download if WebView allows.
      try {
        const written = await Filesystem.writeFile({
          path: `suecao-exports/${filename}`,
          data: text,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
          recursive: true
        });
        triggerBrowserDownload(filename, text);
        return {
          ok: true,
          filename,
          path: written.uri,
          method: 'filesystem+download-fallback',
          error: err instanceof Error ? err.message : String(err)
        };
      } catch (err2) {
        return {
          ok: false,
          filename,
          method: 'none',
          error: err2 instanceof Error ? err2.message : String(err2)
        };
      }
    }
  } catch (err) {
    return {
      ok: false,
      filename: '',
      method: 'none',
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
