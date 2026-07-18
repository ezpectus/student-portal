import 'server-only';

import { logger } from '@/lib/logger';

const cbLogger = logger.createScoped('circuit-breaker');

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxCalls: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
  halfOpenMaxCalls: 1,
};

interface CircuitBreakerEntry {
  state: CircuitState;
  failureCount: number;
  openedAt: number;
  halfOpenCalls: number;
}

const breakers = new Map<string, CircuitBreakerEntry>();

export class CircuitBreakerOpenError extends Error {
  readonly circuitName: string;
  readonly retryAfterMs: number;

  constructor(circuitName: string, retryAfterMs: number) {
    super(`Circuit breaker "${circuitName}" is open. Retry after ${retryAfterMs}ms.`);
    this.name = 'CircuitBreakerOpenError';
    this.circuitName = circuitName;
    this.retryAfterMs = retryAfterMs;
  }
}

export const getCircuitState = (name: string): CircuitState => {
  const entry = breakers.get(name);
  return entry?.state ?? 'closed';
};

export const resetCircuit = (name: string) => {
  breakers.delete(name);
  cbLogger.info('Circuit reset', { circuit: name });
};

export const clearExpiredCircuits = () => {
  const now = Date.now();
  for (const [name, entry] of breakers) {
    if (entry.state === 'open' && now - entry.openedAt > entry.resetTimeoutMs * 2) {
      breakers.delete(name);
    }
  }
};

const ensureEntry = (name: string, config: CircuitBreakerConfig): CircuitBreakerEntry => {
  let entry = breakers.get(name);
  if (!entry) {
    entry = {
      state: 'closed',
      failureCount: 0,
      openedAt: 0,
      halfOpenCalls: 0,
    };
    breakers.set(name, entry);
  }
  return entry;
};

const tryTransitionToHalfOpen = (entry: CircuitBreakerEntry, name: string, config: CircuitBreakerConfig): boolean => {
  if (entry.state !== 'open') return false;
  const elapsed = Date.now() - entry.openedAt;
  if (elapsed >= config.resetTimeoutMs) {
    entry.state = 'half-open';
    entry.halfOpenCalls = 0;
    cbLogger.info('Circuit transitioning to half-open', { circuit: name });
    return true;
  }
  return false;
};

const recordSuccess = (name: string, entry: CircuitBreakerEntry) => {
  if (entry.state === 'half-open') {
    entry.state = 'closed';
    entry.failureCount = 0;
    entry.halfOpenCalls = 0;
    cbLogger.info('Circuit recovered (half-open → closed)', { circuit: name });
  } else if (entry.state === 'closed') {
    entry.failureCount = 0;
  }
};

const recordFailure = (name: string, entry: CircuitBreakerEntry, config: CircuitBreakerConfig) => {
  if (entry.state === 'half-open') {
    entry.state = 'open';
    entry.openedAt = Date.now();
    entry.failureCount = 0;
    entry.halfOpenCalls = 0;
    cbLogger.warn('Circuit re-opened (half-open probe failed)', {
      circuit: name,
    });
    return;
  }

  if (entry.state === 'closed') {
    entry.failureCount++;
    if (entry.failureCount >= config.failureThreshold) {
      entry.state = 'open';
      entry.openedAt = Date.now();
      cbLogger.error('Circuit opened (failure threshold reached)', {
        circuit: name,
        failures: String(entry.failureCount),
        threshold: String(config.failureThreshold),
      });
    }
  }
};

export const withCircuitBreaker = async <T>(
  name: string,
  operation: () => Promise<T>,
  config: Partial<CircuitBreakerConfig> = {},
): Promise<T> => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const entry = ensureEntry(name, mergedConfig);

  if (entry.state === 'open') {
    const transitioned = tryTransitionToHalfOpen(entry, name, mergedConfig);
    if (!transitioned) {
      const retryAfterMs = mergedConfig.resetTimeoutMs - (Date.now() - entry.openedAt);
      throw new CircuitBreakerOpenError(name, Math.max(0, retryAfterMs));
    }
  }

  if (entry.state === 'half-open' && entry.halfOpenCalls >= mergedConfig.halfOpenMaxCalls) {
    throw new CircuitBreakerOpenError(name, mergedConfig.resetTimeoutMs);
  }

  if (entry.state === 'half-open') {
    entry.halfOpenCalls++;
  }

  try {
    const result = await operation();
    recordSuccess(name, entry);
    return result;
  } catch (error) {
    recordFailure(name, entry, mergedConfig);
    throw error;
  }
};
