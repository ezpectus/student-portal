import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import JWT from 'jsonwebtoken';
import { getJWTPayload, getVerifiedLocalJWTPayload, LOCAL_JWT_ISSUER } from '@/lib/jwt';

const TEST_SECRET = 'test-secret-key-for-vitest';

function signToken(payload: Record<string, unknown>, secret: string = TEST_SECRET, options?: JWT.SignOptions) {
  return JWT.sign(payload, secret, { issuer: LOCAL_JWT_ISSUER, ...options });
}

describe('getJWTPayload', () => {
  it('decodes a valid token with exp and modules', () => {
    const token = signToken({ exp: Math.floor(Date.now() / 1000) + 3600, modules: ['admin', 'rating'] });
    const payload = getJWTPayload<{ exp: number; modules: string[] }>(token);
    expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
    expect(payload.modules).toEqual(['admin', 'rating']);
  });

  it('defaults modules to empty array when missing', () => {
    const token = signToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    const payload = getJWTPayload<{ exp: number; modules: string[] }>(token);
    expect(payload.modules).toEqual([]);
  });

  it('throws on invalid token string', () => {
    expect(() => getJWTPayload('not-a-jwt')).toThrow('unable to decode');
  });

  it('throws on token missing exp', () => {
    const token = JWT.sign({ modules: ['admin'] }, TEST_SECRET, { issuer: LOCAL_JWT_ISSUER });
    expect(() => getJWTPayload(token)).toThrow('Invalid JWT payload');
  });

  it('throws on token with wrong modules type', () => {
    const token = signToken({ exp: Math.floor(Date.now() / 1000) + 3600, modules: 'not-an-array' });
    expect(() => getJWTPayload(token)).toThrow('Invalid JWT payload');
  });
});

describe('getVerifiedLocalJWTPayload', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_SECRET', TEST_SECRET);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('verifies and returns payload from a properly signed token', () => {
    const token = signToken({ exp: Math.floor(Date.now() / 1000) + 3600, modules: ['rating'] });
    const payload = getVerifiedLocalJWTPayload<{ exp: number; modules: string[] }>(token);
    expect(payload.modules).toEqual(['rating']);
    expect(payload.iss).toBe(LOCAL_JWT_ISSUER);
  });

  it('throws when JWT_SECRET is not set', () => {
    vi.stubEnv('JWT_SECRET', '');
    expect(() => getVerifiedLocalJWTPayload('some-token')).toThrow('JWT_SECRET is required');
  });

  it('throws on token signed with wrong secret', () => {
    const token = signToken({ exp: Math.floor(Date.now() / 1000) + 3600 }, 'wrong-secret');
    expect(() => getVerifiedLocalJWTPayload(token)).toThrow();
  });

  it('throws on token from wrong issuer', () => {
    const token = JWT.sign({ exp: Math.floor(Date.now() / 1000) + 3600, modules: [] }, TEST_SECRET, {
      issuer: 'wrong-issuer',
    });
    expect(() => getVerifiedLocalJWTPayload(token)).toThrow();
  });

  it('throws on expired token', () => {
    const token = signToken(
      { exp: Math.floor(Date.now() / 1000) - 100, modules: [] },
      TEST_SECRET,
    );
    expect(() => getVerifiedLocalJWTPayload(token)).toThrow();
  });
});
