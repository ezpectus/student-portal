import { NextRequest } from 'next/server';

import { authenticationMiddleware } from './middleware/authentication.middleware';
import { intlMiddleware } from './middleware/intl.middleware';
import { needsLocaleHandling } from './middleware/utils';

export const config = {
  matcher: ['/', `/(uk|en|pl|de)/:path*`, '/((?!_next|api|favicon.ico|.*\\.[^/]+$).*)'],
};

export async function middleware(request: NextRequest) {
  // If the path needs locale handling, process it with i18n middleware first
  if (needsLocaleHandling(request)) {
    return intlMiddleware(request);
  }

  return authenticationMiddleware(request);
}
