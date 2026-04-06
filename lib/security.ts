import type { NextRequest } from 'next/server';
import { isIP } from 'node:net';
import {
  MAX_LOCATION_LENGTH,
  MAX_CATEGORY_LENGTH,
  MAX_KEYWORDS_LENGTH,
} from '@/lib/searchLimits';

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
  const normalized = raw.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') {
    return false;
  }
  return fallback;
}

export const SECURITY_LIMITS = {
  SEARCH: {
    RATE_LIMIT_WINDOW_MS: 60_000,
    RATE_LIMIT_MAX: 20,
    MAX_LOCATION_CHARS: MAX_LOCATION_LENGTH,
    MAX_CATEGORY_CHARS: MAX_CATEGORY_LENGTH,
    MAX_KEYWORDS_CHARS: MAX_KEYWORDS_LENGTH,
    CACHE_TTL_MS: 45_000,
    CACHE_MAX_ENTRIES: 200,
  },
  ANALYSE: {
    RATE_LIMIT_WINDOW_MS: 60_000,
    RATE_LIMIT_MAX: 30,
    MAX_BUSINESS_ID_CHARS: 64,
    RECENT_ANALYSIS_TTL_MS: parseIntegerEnv(
      'ANALYSE_RECENT_ANALYSIS_TTL_MS',
      7 * 24 * 60 * 60 * 1000,
      60_000,
      30 * 24 * 60 * 60 * 1000
    ),
    MIN_REANALYZE_INTERVAL_MS: parseIntegerEnv(
      'ANALYSE_MIN_REANALYZE_INTERVAL_MS',
      24 * 60 * 60 * 1000,
      60_000,
      30 * 24 * 60 * 60 * 1000
    ),
    ALLOW_FORCE_BYPASS_COOLDOWN: parseBooleanEnv(
      'ANALYSE_ALLOW_FORCE_BYPASS_COOLDOWN',
      false
    ),
  },
  STATUS: {
    RATE_LIMIT_WINDOW_MS: 60_000,
    RATE_LIMIT_MAX: 180,
    MAX_BUSINESS_ID_CHARS: 64,
  },
  NETWORK: {
    REQUEST_TIMEOUT_MS: 12_000,
    MAX_RETRIES: 2,
    BASE_RETRY_DELAY_MS: 250,
  },
} as const;

type RateBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
};

const buckets = new Map<string, RateBucket>();
let cleanupTick = 0;

function nowMs(): number {
  return Date.now();
}

function maybeCleanupBuckets(): void {
  cleanupTick += 1;
  if (cleanupTick % 200 !== 0) return;
  const now = nowMs();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size <= 10_000) return;
  // Keep memory bounded during abuse: drop oldest entries beyond cap.
  const toDrop = buckets.size - 10_000;
  let dropped = 0;
  for (const key of buckets.keys()) {
    buckets.delete(key);
    dropped += 1;
    if (dropped >= toDrop) break;
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get('x-real-ip')?.trim();
  if (real) return real;
  return 'unknown';
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  maybeCleanupBuckets();
  const now = nowMs();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const next: RateBucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, next);
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt: next.resetAt,
      retryAfterSec: 0,
    };
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  const allowed = bucket.count <= limit;
  const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  return {
    allowed,
    limit,
    remaining,
    resetAt: bucket.resetAt,
    retryAfterSec: allowed ? 0 : retryAfterSec,
  };
}

export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
  if (!result.allowed) {
    headers['Retry-After'] = String(result.retryAfterSec);
  }
  return headers;
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const v = ip.toLowerCase();
  return v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80:');
}

function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost') return true;
  if (h.endsWith('.localhost')) return true;
  if (h.endsWith('.local')) return true;
  if (h.endsWith('.internal')) return true;
  return false;
}

export function validateExternalWebsiteUrl(raw: string): {
  ok: true;
  normalizedUrl: string;
} | {
  ok: false;
  reason: string;
} {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, reason: 'Invalid website URL format' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Only http(s) website URLs are allowed' };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: 'Credentialed website URLs are not allowed' };
  }

  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    return { ok: false, reason: 'Non-standard website ports are blocked' };
  }

  const hostname = parsed.hostname;
  if (!hostname) return { ok: false, reason: 'Website hostname is missing' };
  if (isBlockedHostname(hostname)) {
    return { ok: false, reason: 'Local/internal website hostnames are blocked' };
  }

  const ipVersion = isIP(hostname);
  if (ipVersion === 4 && isPrivateIpv4(hostname)) {
    return { ok: false, reason: 'Private IPv4 website hosts are blocked' };
  }
  if (ipVersion === 6 && isPrivateIpv6(hostname)) {
    return { ok: false, reason: 'Private IPv6 website hosts are blocked' };
  }

  parsed.hash = '';
  return { ok: true, normalizedUrl: parsed.toString() };
}
