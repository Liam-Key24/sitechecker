import type { Business } from './types';

/** Matches overview / card “analyzed” semantics. */
export function isBusinessAnalyzed(b: Business): boolean {
  return Boolean(b.breakdown || typeof b.final_score === 'number');
}

/** Prefer final_score; fall back to web_standards_score from breakdown. */
export function resolveListingScore(b: Business): number | null {
  if (typeof b.final_score === 'number' && Number.isFinite(b.final_score)) return b.final_score;
  if (
    typeof b.breakdown?.web_standards_score === 'number' &&
    Number.isFinite(b.breakdown.web_standards_score)
  ) {
    return b.breakdown.web_standards_score;
  }
  return null;
}

/** Title-case words in a place segment (e.g. "new york" → "New York"). */
function titleCasePlaceSegment(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Display label for the search location: e.g. "leeds" → "Leeds, UK";
 * respects an existing "City, Country" in the query string.
 */
export function formatLocationDisplay(raw: string): string {
  const t = raw.trim();
  if (!t) return '';

  const parts = t.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const city = titleCasePlaceSegment(parts[0]);
    const rest = parts
      .slice(1)
      .map((p) => {
        const u = p.toUpperCase();
        if (u.length <= 3 && /^[A-Z]+$/.test(u)) return u;
        return titleCasePlaceSegment(p);
      })
      .join(', ');
    return `${city}, ${rest}`;
  }

  return `${titleCasePlaceSegment(parts[0] ?? t)}, UK`;
}
