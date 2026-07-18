import 'server-only';

import JWT, { JwtPayload } from 'jsonwebtoken';
import { z } from 'zod';

const JwtPayloadSchema = z.object({
  exp: z.number(),
  modules: z.array(z.string()).optional(),
});

export const getJWTPayload = <T extends JwtPayload>(token: string): T => {
  const decoded = JWT.decode(token, { json: true });
  if (!decoded) {
    throw new Error('Invalid JWT: unable to decode');
  }
  const parsed = JwtPayloadSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new Error(`Invalid JWT payload: ${parsed.error.message}`);
  }
  return parsed.data as T;
};
