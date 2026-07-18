import { logger } from '@/lib/logger';
import { ActionError } from '@/lib/errors';

type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterFactor?: number;
};

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 5000,
  jitterFactor: 0.3,
};

const isRetryable = (error: unknown): boolean => {
  if (error instanceof ActionError) {
    return error.retryable;
  }
  return true;
};

const calculateDelay = (
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitterFactor: number,
): number => {
  const exponentialDelay = baseDelayMs * 2 ** (attempt - 1);
  const clampedDelay = Math.min(exponentialDelay, maxDelayMs);
  const jitter = clampedDelay * jitterFactor * (Math.random() - 0.5) * 2;
  return Math.max(0, Math.round(clampedDelay + jitter));
};

export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> => {
  const { maxAttempts, baseDelayMs, maxDelayMs, jitterFactor } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !isRetryable(error)) {
        logger.error('Retry exhausted', {
          attempt: String(attempt),
          maxAttempts: String(maxAttempts),
          retryable: String(isRetryable(error)),
        });
        throw error;
      }

      const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs, jitterFactor);
      logger.warn('Retry attempt failed, backing off', {
        attempt: String(attempt),
        delay: String(delay),
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
