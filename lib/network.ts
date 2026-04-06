import { SECURITY_LIMITS } from '@/lib/security';

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set([
  'UND_ERR_SOCKET',
  'ECONNRESET',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'ENOTFOUND',
  'ECONNREFUSED',
  'UND_ERR_CONNECT_TIMEOUT',
]);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getNestedErrorCode(err: unknown): string | null {
  if (typeof err !== 'object' || err === null) return null;
  if ('code' in err && typeof err.code === 'string') return err.code;
  if ('cause' in err) return getNestedErrorCode(err.cause);
  return null;
}

function isRetryableError(err: unknown): boolean {
  const code = getNestedErrorCode(err);
  if (code && RETRYABLE_ERROR_CODES.has(code)) return true;
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('fetch failed') ||
    msg.includes('socket') ||
    msg.includes('timed out') ||
    msg.includes('network')
  );
}

export type FetchPolicyOptions = {
  timeoutMs?: number;
  retries?: number;
  baseRetryDelayMs?: number;
};

export async function fetchWithPolicy(
  input: string | URL,
  init?: RequestInit,
  options?: FetchPolicyOptions
): Promise<Response> {
  const timeoutMs = options?.timeoutMs ?? SECURITY_LIMITS.NETWORK.REQUEST_TIMEOUT_MS;
  const retries = options?.retries ?? SECURITY_LIMITS.NETWORK.MAX_RETRIES;
  const baseRetryDelayMs =
    options?.baseRetryDelayMs ?? SECURITY_LIMITS.NETWORK.BASE_RETRY_DELAY_MS;

  let lastErr: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const mergedSignal =
        init?.signal && typeof AbortSignal.any === 'function'
          ? AbortSignal.any([init.signal, ac.signal])
          : (init?.signal ?? ac.signal);
      const response = await fetch(input, { ...init, signal: mergedSignal });
      if (attempt < retries && RETRYABLE_STATUS_CODES.has(response.status)) {
        await delay(baseRetryDelayMs * (attempt + 1));
        continue;
      }
      return response;
    } catch (err) {
      lastErr = err;
      if (attempt >= retries || !isRetryableError(err)) {
        throw err;
      }
      await delay(baseRetryDelayMs * (attempt + 1));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastErr;
}
