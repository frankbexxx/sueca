import React, { useEffect, useState } from 'react';
import { ShellHeader } from '../navigation/ShellHeader';
import {
  loadDiagnosticMatchLogs,
  shareOrDownloadDiagnosticExport
} from '../../diagnostics';
import { DiagnosticMatchLog } from '../../diagnostics/types';
import '../../styles/shell-screens.css';

interface DiagnosticExportScreenProps {
  showBack: boolean;
  onBack: () => void;
}

export const DiagnosticExportScreen: React.FC<DiagnosticExportScreenProps> = ({
  showBack,
  onBack
}) => {
  const [logs, setLogs] = useState<DiagnosticMatchLog[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [anonymize, setAnonymize] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadDiagnosticMatchLogs().then((list) => {
      if (!cancelled) setLogs(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const runExport = async (logId?: string) => {
    setBusy(true);
    setStatus(null);
    try {
      const result = await shareOrDownloadDiagnosticExport({
        logId,
        anonymizePlayers: anonymize
      });
      if (result.ok) {
        setStatus(
          result.path
            ? `Exportado: ${result.filename} (${result.method})`
            : `Exportado: ${result.filename}`
        );
      } else {
        setStatus(result.error || 'Falha no export');
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Falha no export');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="shell-screen screen-diagnostic-export">
      <ShellHeader
        title="Diagnóstico"
        subtitle="Logs técnicos para análise (não é o histórico de carreira)"
        showBack={showBack}
        onBack={onBack}
      />
      <section className="shell-panel">
        <p className="shell-empty" style={{ marginBottom: '0.75rem' }}>
        Exporta um ficheiro JSON que podes enviar (WhatsApp, email, Drive…).
        Isto não é o histórico de carreira — é só para diagnóstico técnico.
      </p>
        <label className="shell-list-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={anonymize}
            onChange={(e) => setAnonymize(e.target.checked)}
          />
          Anonimizar nomes (Player 1–4)
        </label>
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            type="button"
            className="sueca-btn sueca-btn--primary"
            disabled={busy || logs.length === 0}
            onClick={() => void runExport()}
          >
            Exportar todos ({logs.length})
          </button>
          {logs.slice(0, 5).map((log) => (
            <button
              key={log.logId}
              type="button"
              className="sueca-btn sueca-btn--secondary"
              disabled={busy}
              onClick={() => void runExport(log.logId)}
            >
              {log.gameVariant} · {log.rulesPresetId} ·{' '}
              {(log.completedAt || log.startedAt).slice(0, 16).replace('T', ' ')}
            </button>
          ))}
        </div>
        {logs.length === 0 && (
          <p className="shell-empty" style={{ marginTop: '0.75rem' }}>
            Ainda não há logs diagnósticos. Joga uma partida completa para gerar.
          </p>
        )}
        {status && (
          <p className="shell-list-row-meta" style={{ marginTop: '0.75rem' }}>
            {status}
          </p>
        )}
      </section>
    </div>
  );
};
