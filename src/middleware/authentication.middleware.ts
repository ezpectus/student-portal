import dayjs from 'dayjs';
import { NextResponse, NextRequest } from 'next/server';

import { authorizationMiddleware } from './authorization.middleware';
import { PUBLIC_PATHS } from './constants';
import { intlMiddleware } from './intl.middleware';
import { getAuthInfo, gotoLogin, matchesAnyUrl } from './utils';

const isAuthenticated = (request: NextRequest) => {
  const payload = getAuthInfo(request);

  if (!payload) {
    return false;
  }

  return payload.exp && payload.exp > dayjs().unix();
};

const isLocaleRoot = (request: NextRequest) => {
  const pathSegments = request.nextUrl.pathname.split('/').filter(Boolean);
  return pathSegments.length === 1 && ['uk', 'en', 'pl', 'de'].includes(pathSegments[0]);
};

const gotoLanding = (request: NextRequest) => {
  const url = request.nextUrl.clone();
  const locale = url.pathname.split('/').filter(Boolean)[0];
  url.pathname = `/${locale}/landing`;
  return NextResponse.redirect(url);
};

export const authenticationMiddleware = (request: NextRequest) => {
  const userAuthenticated = isAuthenticated(request);

  if (userAuthenticated) {
    return authorizationMiddleware(request);
  }

  if (matchesAnyUrl(request, PUBLIC_PATHS, false)) {
    return intlMiddleware(request);
  }

  if (isLocaleRoot(request)) {
    return gotoLanding(request);
  }

  return gotoLogin(request);
};
