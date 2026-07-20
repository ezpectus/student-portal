import 'server-only';

import { createRemoteJWKSet, jwtVerify } from 'jose';
import JWT, { JwtPayload } from 'jsonwebtoken';

import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

const jwksLogger = logger.createScoped('jwks');

let cachedJWKS: ReturnType<typeof createRemoteJWKSet> | null = null;

const getJWKS = () => {
  if (!env.JWKS_URI) {
    throw new Error('JWKS_URI is not configured — cannot verify remote JWT signatures');
  }
  if (!cachedJWKS) {
    cachedJWKS = createRemoteJWKSet(new URL(env.JWKS_URI), {
      cooldownDuration: 30_000,
      cacheMaxAge: 600_000,
    });
  }
  return cachedJWKS;
};

export async function verifyRemoteJWT<T extends JwtPayload>(token: string): Promise<T> {
  const verifyOptions: Parameters<typeof jwtVerify>[2] = {
    algorithms: ['RS256', 'ES256'],
  };

  if (env.JWT_ISSUER) {
    verifyOptions.issuer = env.JWT_ISSUER;
  }

  try {
    const { payload } = await jwtVerify(token, getJWKS(), verifyOptions);
    return payload as unknown as T;
  } catch (error) {
    jwksLogger.warn('Remote JWT verification failed', {
      error: error instanceof Error ? error.message : 'unknown',
    });
    throw new Error('Remote JWT verification failed');
  }
}

export function isJwksConfigured(): boolean {
  return !!env.JWKS_URI;
}

export { JWT };
