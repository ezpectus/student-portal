'use server';

import { cookies } from 'next/headers';

import { TOKEN_COOKIE_NAME } from '@/lib/constants/cookies';
import { getJWTPayload } from '@/lib/jwt';

export async function getSessionExpiry(): Promise<number | null> {
  const resolvedCookies = await cookies();
  const token = resolvedCookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const payload = await getJWTPayload<{ exp: number }>(token);
    return payload.exp;
  } catch {
    return null;
  }
}
