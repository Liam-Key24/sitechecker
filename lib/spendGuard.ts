type UpstreamMeterKey = 'google_places_textsearch' | 'google_places_details' | 'google_pagespeed';

type GuardBucket = {
  windowStartMs: number;
  count: number;
};

const WINDOW_MS = parseIntegerEnv('UPSTREAM_SPEND_GUARD_WINDOW_MS', 60_000, 1_000, 3_600_000);
const DAY_WINDOW_MS = 24 * 60 * 60 * 1000;
const GUARDS_ENABLED = parseBooleanEnv('UPSTREAM_SPEND_GUARDS_ENABLED', true);

const LIMITS_PER_WINDOW: Record<UpstreamMeterKey, number> = {
  google_places_textsearch: parseIntegerEnv(
    'GOOGLE_PLACES_TEXTSEARCH_MAX_PER_WINDOW',
    12,
    0,
    10_000
  ),
  google_places_details: parseIntegerEnv(
    'GOOGLE_PLACES_DETAILS_MAX_PER_WINDOW',
    80,
    0,
    100_000
  ),
  google_pagespeed: parseIntegerEnv('GOOGLE_PAGESPEED_MAX_PER_WINDOW', 40, 0, 100_000),
};

const LIMITS_PER_DAY: Record<UpstreamMeterKey, number> = {
  google_places_textsearch: parseIntegerEnv('GOOGLE_PLACES_TEXTSEARCH_MAX_PER_DAY', 300, 0, 1_000_000),
  google_places_details: parseIntegerEnv('GOOGLE_PLACES_DETAILS_MAX_PER_DAY', 2_000, 0, 1_000_000),
  google_pagespeed: parseIntegerEnv('GOOGLE_PAGESPEED_MAX_PER_DAY', 1_000, 0, 1_000_000),
};

const windowBuckets = new Map<UpstreamMeterKey, GuardBucket>();
const dayBuckets = new Map<UpstreamMeterKey, GuardBucket>();

function parseIntegerEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function parseBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  const v = raw.trim().toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  return fallback;
}

function keyToLabel(key: UpstreamMeterKey): string {
  if (key === 'google_places_textsearch') return 'Google Places text search';
  if (key === 'google_places_details') return 'Google Places details';
  return 'Google PageSpeed';
}

export class UpstreamBudgetExceededError extends Error {
  readonly retryAfterSec: number;
  readonly meter: UpstreamMeterKey;
  readonly scope: 'window' | 'day';

  constructor(meter: UpstreamMeterKey, retryAfterSec: number, scope: 'window' | 'day') {
    const label = keyToLabel(meter);
    const scopeLabel = scope === 'day' ? 'daily' : 'short-window';
    super(
      `${label} ${scopeLabel} spend guard triggered. Please retry in about ${retryAfterSec}s, or raise the cap if intentional.`
    );
    this.name = 'UpstreamBudgetExceededError';
    this.retryAfterSec = retryAfterSec;
    this.meter = meter;
    this.scope = scope;
  }
}

export function isUpstreamBudgetExceededError(
  value: unknown
): value is UpstreamBudgetExceededError {
  return value instanceof UpstreamBudgetExceededError;
}

export function consumeUpstreamBudget(key: UpstreamMeterKey, units = 1): void {
  if (!GUARDS_ENABLED) return;
  if (units <= 0) return;

  const now = Date.now();
  const perWindowMax = LIMITS_PER_WINDOW[key];
  const perDayMax = LIMITS_PER_DAY[key];
  const windowBucket = getOrRotateBucket(windowBuckets, key, now, WINDOW_MS);
  const dayBucket = getOrRotateBucket(dayBuckets, key, now, DAY_WINDOW_MS);

  if (perWindowMax <= 0 || units > perWindowMax || windowBucket.count + units > perWindowMax) {
    const retryAfterSec = retryAfter(windowBucket, WINDOW_MS, now);
    throw new UpstreamBudgetExceededError(key, retryAfterSec, 'window');
  }

  if (perDayMax <= 0 || units > perDayMax || dayBucket.count + units > perDayMax) {
    const retryAfterSec = retryAfter(dayBucket, DAY_WINDOW_MS, now);
    throw new UpstreamBudgetExceededError(key, retryAfterSec, 'day');
  }

  windowBucket.count += units;
  dayBucket.count += units;
}

function getOrRotateBucket(
  map: Map<UpstreamMeterKey, GuardBucket>,
  key: UpstreamMeterKey,
  now: number,
  windowMs: number
): GuardBucket {
  const current = map.get(key);
  if (!current || now - current.windowStartMs >= windowMs) {
    const next: GuardBucket = { windowStartMs: now, count: 0 };
    map.set(key, next);
    return next;
  }
  return current;
}

function retryAfter(bucket: GuardBucket, windowMs: number, now: number): number {
  return Math.max(1, Math.ceil((bucket.windowStartMs + windowMs - now) / 1000));
}
