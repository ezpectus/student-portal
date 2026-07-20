import { cookies, headers } from 'next/headers';

import { CSRF_COOKIE_NAME } from '@/lib/constants/cookies';

/**
 * Server-side CSRF validation for server actions.
 * Validates that:
 * 1. CSRF cookie exists
 * 2. Origin header matches the host (defense-in-depth on top of middleware)
 * @throws {Error} If CSRF validation fails.
 */
export async function requireCsrf(): Promise<void> {
  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!csrfCookie) {
    throw new Error('CSRF: missing token');
  }

  const headersList = await headers();
  const origin = headersList.get('origin');
  const host = headersList.get('host');

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        throw new Error('CSRF: origin mismatch');
      }
    } catch {
      throw new Error('CSRF: invalid origin');
    }
  }
}
