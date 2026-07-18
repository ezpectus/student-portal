'use server';

import { cookies } from 'next/headers';
import { getJWTPayload } from '@/lib/jwt';
import { TOKEN_COOKIE_NAME } from '@/lib/constants/cookies';

export async function getSessionExpiry(): Promise<number | null> {
  const resolvedCookies = await cookies();
  const token = resolvedCookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const payload = getJWTPayload<{ exp: number }>(token);
    return payload.exp;
  } catch {
    return null;
  }
}
