import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('env schema validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllEnvs();
  });

  it('applies defaults for optional fields', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('API_BASE_URL', 'https://api.example.com');
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('JWT_SECRET', 'a-valid-test-secret-at-least-16-chars');
    vi.stubEnv('NEXT_PUBLIC_LOCAL_AUTH', '');

    const { env } = await import('@/lib/env');
    expect(env.DATABASE_URL).toBe('file:./dev.db');
    expect(env.JWT_SECRET).toBe('a-valid-test-secret-at-least-16-chars');
    expect(env.NEXT_PUBLIC_LOCAL_AUTH).toBe('true');
  });

  it('throws when API_BASE_URL is not a valid URL', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('API_BASE_URL', 'not-a-url');

    await expect(import('@/lib/env')).rejects.toThrow();
  });

  it('accepts valid configuration', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('API_BASE_URL', 'https://api.example.com');
    vi.stubEnv('JWT_SECRET', 'a-valid-test-secret-at-least-16-chars');
    vi.stubEnv('DATABASE_URL', 'file:./test.db');

    const { env } = await import('@/lib/env');
    expect(env.API_BASE_URL).toBe('https://api.example.com');
    expect(env.JWT_SECRET).toBe('a-valid-test-secret-at-least-16-chars');
  });

  it('validates optional URL fields', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('API_BASE_URL', 'https://api.example.com');
    vi.stubEnv('NEXT_PUBLIC_GITHUB_URL', 'not-a-url');

    await expect(import('@/lib/env')).rejects.toThrow();
  });

  it('defaults NODE_ENV to development', async () => {
    vi.stubEnv('NODE_ENV', '');
    vi.stubEnv('API_BASE_URL', 'https://api.example.com');
    vi.stubEnv('JWT_SECRET', 'a-valid-test-secret-at-least-16-chars');

    const { env } = await import('@/lib/env');
    expect(env.NODE_ENV).toBe('development');
  });
});
