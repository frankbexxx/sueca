/**
 * Resolve catalog asset paths against the configured remote base.
 * Relative `music/v1/...` paths are preferred; absolute URLs are only
 * accepted when they share the configured base origin and music/v1 prefix.
 */

/**
 * Join base + relative path, or re-validate absolute URL under base.
 * Returns null when the path must not be used for fetch/stream.
 */
export function resolveRemoteAssetUrl(
  baseUrl: string,
  pathOrUrl: string
): string | null {
  if (!baseUrl || typeof pathOrUrl !== 'string') return null;
  const trimmed = pathOrUrl.trim();
  if (!trimmed || trimmed.includes('..')) return null;

  const base = baseUrl.replace(/\/+$/, '');

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const abs = new URL(trimmed);
      const baseU = new URL(base);
      if (abs.origin !== baseU.origin) return null;
      const path = abs.pathname.replace(/^\/+/, '');
      if (!path.startsWith('music/v1/')) return null;
      return `${base}/${path}`;
    } catch {
      return null;
    }
  }

  const rel = trimmed.replace(/^\/+/, '');
  if (!rel.startsWith('music/v1/')) return null;
  return `${base}/${rel}`;
}

/** Rewrite track.url fields in a raw catalog object (never throws). */
export function rewriteRemoteCatalogUrls(
  raw: unknown,
  baseUrl: string
): unknown {
  try {
    if (!raw || typeof raw !== 'object') return raw;
    const r = raw as Record<string, unknown>;
    const list = Array.isArray(r.tracks) ? r.tracks : null;
    if (!list) return raw;

    const tracks = list.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const t = item as Record<string, unknown>;
      if (typeof t.url !== 'string') return item;
      const resolved = resolveRemoteAssetUrl(baseUrl, t.url);
      if (!resolved) {
        return { ...t, url: '' };
      }
      return { ...t, url: resolved };
    });

    return { ...r, tracks };
  } catch {
    return raw;
  }
}
