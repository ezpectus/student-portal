import 'server-only';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  maxAttempts?: number;
  windowMs?: number;
  lockoutMs?: number;
}

const DEFAULT_CONFIG: Required<RateLimitConfig> = {
  maxAttempts: 5,
  windowMs: 60 * 1000,
  lockoutMs: 15 * 60 * 1000,
};

const store = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  identifier: string,
  namespace: string = 'login',
  config: RateLimitConfig = {},
): { allowed: boolean; retryAfterMs: number; remaining: number } {
  const { maxAttempts, windowMs, lockoutMs } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  const key = `${namespace}:${identifier}`;
  const entry = store.get(key);

  if (entry && entry.resetAt > now && entry.count >= maxAttempts) {
    return { allowed: false, retryAfterMs: entry.resetAt - now, remaining: 0 };
  }

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0, remaining: maxAttempts - 1 };
  }

  entry.count++;
  if (entry.count >= maxAttempts) {
    store.set(key, { count: entry.count, resetAt: now + lockoutMs });
    return { allowed: false, retryAfterMs: lockoutMs, remaining: 0 };
  }

  return { allowed: true, retryAfterMs: 0, remaining: maxAttempts - entry.count };
}

export function resetRateLimit(identifier: string, namespace: string = 'login') {
  store.delete(`${namespace}:${identifier}`);
}

export function clearExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}
