'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import qs from 'query-string';
import { z } from 'zod';

import { throwApiError } from '@/lib/api-error';
import { apiFetch } from '@/lib/client';
import { USER_PROFILE_CACHE_TAG } from '@/lib/constants/cache-tags';
import { SID_COOKIE_NAME, TOKEN_COOKIE_NAME } from '@/lib/constants/cookies';
import { env } from '@/lib/env';
import { PermanentError } from '@/lib/errors';
import { getJWTPayload } from '@/lib/jwt';
import { logger } from '@/lib/logger';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { validateInput } from '@/lib/validate';
import { AuthResponse } from '@/types/models/auth-response';
import { User } from '@/types/models/user';

const authLogger = logger.createScoped('auth');

const MAIN_COOKIE_DOMAIN = env.MAIN_COOKIE_DOMAIN;
const ROOT_COOKIE_DOMAIN = env.ROOT_COOKIE_DOMAIN;

export async function setLoginCookies(token: string, sessionId: string, rememberMe: boolean) {
  const tokenData = getJWTPayload<{ exp: number }>(token);
  // exp is in seconds, Date expects milliseconds
  const tokenExpiresAt = new Date(tokenData.exp * 1000);

  const expires = rememberMe ? tokenExpiresAt : undefined;
  const resolvedCookies = await cookies();

  const isProduction = env.NODE_ENV === 'production';

  resolvedCookies.set(SID_COOKIE_NAME, sessionId, {
    domain: ROOT_COOKIE_DOMAIN,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    expires,
  });
  resolvedCookies.set(TOKEN_COOKIE_NAME, token, {
    domain: MAIN_COOKIE_DOMAIN,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    expires,
  });
}

const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean(),
});

export async function loginWithCredentials(username: string, password: string, rememberMe: boolean) {
  const validated = validateInput(loginSchema, { username, password, rememberMe }, 'loginWithCredentials');

  const rateLimit = checkRateLimit(validated.username);
  if (!rateLimit.allowed) {
    return { ok: false, error: 'rate-limited' as const, retryAfterMs: rateLimit.retryAfterMs };
  }

  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    const { localLogin } = await import('./local-auth.actions');
    const localResult = await localLogin(validated.username, validated.password, validated.rememberMe);
    if (localResult) {
      resetRateLimit(validated.username);
      return true;
    }
  }

  const payload = {
    username: validated.username,
    password: validated.password,
    grant_type: 'password',
  };

  const response = await apiFetch('oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: qs.stringify(payload),
  });

  if (!response.ok) {
    authLogger.warn('Login failed: non-OK response', { status: String(response.status) });
    return null;
  }

  const jsonResponse = (await response.json()) as AuthResponse;

  if (!jsonResponse) {
    authLogger.warn('Login failed: empty response body');
    return null;
  }

  const { sessionId, access_token } = jsonResponse;

  await setLoginCookies(access_token, sessionId, rememberMe);
  resetRateLimit(username);
  return true;
}

export async function logout() {
  const resolvedCookies = await cookies();

  resolvedCookies.delete({ domain: ROOT_COOKIE_DOMAIN, name: SID_COOKIE_NAME });
  resolvedCookies.delete({ domain: MAIN_COOKIE_DOMAIN, name: TOKEN_COOKIE_NAME });

  redirect('/');
}

const resetPasswordSchema = z.object({
  username: z.string().min(1).max(100),
  recaptchaToken: z.string().min(1).max(1000),
});

export async function resetPassword(username: string, recaptchaToken: string) {
  const validated = validateInput(resetPasswordSchema, { username, recaptchaToken }, 'resetPassword');

  const rateLimit = checkRateLimit(validated.username, 'password-reset');
  if (!rateLimit.allowed) {
    return { ok: false, error: 'rate-limited' as const, retryAfterMs: rateLimit.retryAfterMs };
  }

  try {
    const payload = {
      Captcha: validated.recaptchaToken,
      UserIdentifier: validated.username,
    };

    const response = await apiFetch('account/recovery', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.status < 200 || response.status >= 300) {
      throwApiError(response.status, 'password-reset');
    }

    resetRateLimit(username, 'password-reset');
    return null;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new PermanentError('Unknown error during password reset', 'UNKNOWN');
  }
}

export async function getUserDetails(): Promise<User | null> {
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    const { getLocalUser } = await import('./local-auth.actions');
    const localUser = await getLocalUser();
    if (localUser) return localUser as unknown as User;
  }

  const userResponse = await apiFetch('profile', {
    next: { tags: [USER_PROFILE_CACHE_TAG] },
  });

  if (!userResponse.ok) {
    return null;
  }

  return (await userResponse.json()) as User;
}

export async function redirectToEmploymentSystem() {
  const response = await apiFetch('employment-system/auth');

  if (!response.ok) {
    throwApiError(response.status, 'redirectToEmploymentSystem');
  }

  const url = (await response.json()) as string;

  try {
    const parsed = new URL(url);
    const allowedHost = env.API_BASE_URL ? new URL(env.API_BASE_URL).hostname : '';
    if (allowedHost && !parsed.hostname.endsWith(allowedHost)) {
      throw new PermanentError('Untrusted redirect URL', 'UNTRUSTED_REDIRECT');
    }
  } catch {
    throw new PermanentError('Invalid redirect URL', 'INVALID_REDIRECT');
  }

  redirect(url);
}

export async function registerUser(name: string, email: string, password: string, role: 'STUDENT' | 'TEACHER' = 'STUDENT', schoolCode?: string) {
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    const { localRegister } = await import('./local-auth.actions');
    const localResult = await localRegister({ fullName: name, email, password, role, schoolCode: schoolCode ?? '' });
    return localResult;
  }

  const payload = {
    name,
    email,
    password,
  };

  const response = await apiFetch('account/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (response.status === 409) {
    return { ok: false, error: 'email-taken' } as const;
  }

  if (!response.ok) {
    return { ok: false, error: 'generic' } as const;
  }

  return { ok: true } as const;
}

