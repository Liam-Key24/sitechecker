/** Hard cap for Google Places / search pipeline load */
export const MAX_SEARCH_LIMIT = 100;

export const MIN_SEARCH_LIMIT = 1;
export const MAX_LOCATION_LENGTH = 120;
export const MAX_CATEGORY_LENGTH = 48;
export const MAX_KEYWORDS_LENGTH = 160;

function parseEnvInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Max automatic /api/analyse calls after a search.
 * Default is intentionally 0 to avoid surprise paid API bursts.
 */
export const MAX_AUTO_ANALYZE_ON_LOAD = Math.max(
  0,
  Math.min(25, parseEnvInt('NEXT_PUBLIC_AUTO_ANALYZE_ON_LOAD', 0))
);

export function clampSearchLimit(raw: number): number {
  if (!Number.isFinite(raw)) return 20;
  return Math.min(MAX_SEARCH_LIMIT, Math.max(MIN_SEARCH_LIMIT, Math.floor(raw)));
}

export function clampSearchLimitFromString(s: string | null | undefined, fallback = 20): number {
  const n = parseInt(String(s ?? ''), 10);
  return clampSearchLimit(Number.isFinite(n) ? n : fallback);
}
