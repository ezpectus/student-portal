import 'server-only';

import JWT, { JwtPayload } from 'jsonwebtoken';
import { z } from 'zod';

import { isJwksConfigured, verifyRemoteJWT } from '@/lib/jwks';

const JwtPayloadSchema = z.object({
  exp: z.number(),
  modules: z.array(z.string()).default([]),
  iss: z.string().optional(),
  iat: z.number().optional(),
});

const LOCAL_JWT_ISSUER = 'student-portal-local';

export const getJWTPayload = async <T extends JwtPayload>(token: string): Promise<T> => {
  const decoded = JWT.decode(token, { json: true });
  if (!decoded) {
    throw new Error('Invalid JWT: unable to decode');
  }
  const parsed = JwtPayloadSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new Error(`Invalid JWT payload: ${parsed.error.message}`);
  }

  if (parsed.data.iss === LOCAL_JWT_ISSUER) {
    return parsed.data as unknown as T;
  }

  const now = Math.floor(Date.now() / 1000);
  if (parsed.data.exp <= now) {
    throw new Error('JWT: token expired');
  }

  if (isJwksConfigured()) {
    return await verifyRemoteJWT<T>(token);
  }

  return parsed.data as unknown as T;
};

export const getVerifiedLocalJWTPayload = <T extends JwtPayload>(token: string): T => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required to verify local authentication tokens');
  }

  const verified = JWT.verify(token, secret, { issuer: LOCAL_JWT_ISSUER });
  const parsed = JwtPayloadSchema.safeParse(verified);
  if (!parsed.success) {
    throw new Error(`Invalid local JWT payload: ${parsed.error.message}`);
  }
  return parsed.data as unknown as T;
};

export { LOCAL_JWT_ISSUER };
