import 'server-only';

import { cookies, headers as nextHeaders } from 'next/headers';
import { getLocale } from 'next-intl/server';

import { DEFAULT_LOCALE } from '@/i18n/routing';
import { CircuitBreakerOpenError,withCircuitBreaker } from '@/lib/circuit-breaker';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

import { TOKEN_COOKIE_NAME } from './constants/cookies';

const apiLogger = logger.createScoped('api');

const getLocaleSafe = async () => {
  try {
    return getLocale();
  } catch {
    return DEFAULT_LOCALE;
  }
};

const createApiFetch = (basePath: string) => {
  return async (url: string | URL, options: RequestInit = {}): Promise<Response> => {
    const { headers = {}, ...otherOptions } = options;
    const resolvedCookies = await cookies();
    const jwt = resolvedCookies.get(TOKEN_COOKIE_NAME)?.value;
    const locale = await getLocaleSafe();

    const input = new URL(url, basePath).href;

    const contentType = new Headers(headers).get('Content-type') ?? 'application/json';
    const resolvedHeaders = await nextHeaders();

    const rawForwardedFor = resolvedHeaders.get('x-forwarded-for') || '';
    const rawRealIp = resolvedHeaders.get('x-real-ip') || '';
    const sanitizedForwardedFor = rawForwardedFor.split(',')[0]?.trim().slice(0, 45) || '';
    const sanitizedRealIp = rawRealIp.trim().slice(0, 45) || '';

    const cacheOption =
      'next' in otherOptions || 'cache' in otherOptions
        ? {}
        : { next: { revalidate: 300 } as const };

    const response = await withCircuitBreaker(
      'external-api',
      () =>
        fetch(input, {
          ...cacheOption,
          signal: AbortSignal.timeout(10000),
          headers: {
            Accept: 'application/json',
            Authorization: jwt ? `Bearer ${jwt}` : '',
            'Content-Type': contentType,
            'Accept-Language': locale,
            'X-Forwarded-For': sanitizedForwardedFor,
            'X-Real-IP': sanitizedRealIp,
            ...headers,
          },
          ...otherOptions,
        }).catch((error: unknown) => {
          apiLogger.error('API request failed', {
            url: input,
            error: error instanceof Error ? error.message : 'unknown',
          });
          throw error;
        }),
      {
        failureThreshold: 5,
        resetTimeoutMs: 30_000,
      },
    ).then((res) => {
      if (res.status >= 500) {
        throw new Error(`Server error: ${res.status}`);
      }
      return res;
    }).catch((error: unknown) => {
      if (error instanceof CircuitBreakerOpenError) {
        apiLogger.warn('Circuit breaker open, failing fast', {
          url: input,
          retryAfterMs: String(error.retryAfterMs),
        });
      }
      throw error;
    });

    if (!response.ok) {
      apiLogger.warn('API returned non-OK status', {
        url: input,
        status: String(response.status),
      });
    }

    return response;
  };
};

export const apiFetch = createApiFetch(env.API_BASE_URL);
