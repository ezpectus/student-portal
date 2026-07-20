import { NextRequest, NextResponse } from 'next/server';

import { CSRF_COOKIE_NAME } from '@/lib/constants/cookies';
import { generateCsrfToken } from '@/lib/csrf-utils';

import { authenticationMiddleware } from './middleware/authentication.middleware';
import { intlMiddleware } from './middleware/intl.middleware';
import { needsLocaleHandling } from './middleware/utils';

export const config = {
  matcher: ['/', `/(uk|en|pl|de)/:path*`, '/((?!_next|api|favicon.ico|.*\\.[^/]+$).*)'],
};

function buildCspHeader(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://www.google-analytics.com https://www.gstatic.com",
    "frame-src 'self' https://www.google.com/recaptcha/ https://docs.google.com/",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ');
}

export async function middleware(request: NextRequest) {
  if (needsLocaleHandling(request)) {
    return intlMiddleware(request);
  }

  if (request.method === 'POST' && request.headers.has('Next-Action')) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;

    if (!csrfCookie) {
      return new NextResponse('CSRF: missing token', { status: 403 });
    }

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return new NextResponse('CSRF: origin mismatch', { status: 403 });
        }
      } catch {
        return new NextResponse('CSRF: invalid origin', { status: 403 });
      }
    }
  }

  let response: NextResponse | Response;
  try {
    response = await authenticationMiddleware(request);
  } catch (error) {
    console.error('[middleware] authenticationMiddleware failed, allowing request to proceed:', error);
    response = intlMiddleware(request);
  }

  const nonce = btoa(crypto.getRandomValues(new Uint8Array(16)).toString());
  const res = response instanceof NextResponse ? response : NextResponse.next();

  res.headers.set('Content-Security-Policy', buildCspHeader(nonce));
  res.headers.set('x-nonce', nonce);

  if (!request.cookies.has(CSRF_COOKIE_NAME)) {
    const csrfToken = generateCsrfToken();
    res.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    });
  }

  return res;
}
