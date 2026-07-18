import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimit, clearExpiredEntries } from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimit('test@example.com');
    resetRateLimit('other@example.com');
  });

  it('allows first attempt', () => {
    const result = checkRateLimit('test@example.com');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks after 5 attempts', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('test@example.com');
    }
    const result = checkRateLimit('test@example.com');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('tracks identifiers independently', () => {
    for (let i = 0; i < 4; i++) {
      checkRateLimit('test@example.com');
    }
    const other = checkRateLimit('other@example.com');
    expect(other.allowed).toBe(true);
    expect(other.remaining).toBe(4);
  });

  it('resets after successful login', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('test@example.com');
    }
    resetRateLimit('test@example.com');
    const result = checkRateLimit('test@example.com');
    expect(result.remaining).toBe(4);
  });
});

describe('clearExpiredEntries', () => {
  it('does not throw', () => {
    expect(() => clearExpiredEntries()).not.toThrow();
  });
});

describe('checkRateLimit with custom namespace', () => {
  beforeEach(() => {
    resetRateLimit('user@test.com', 'password-reset');
    resetRateLimit('user@test.com', 'login');
  });

  it('tracks namespaces independently', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('user@test.com', 'login');
    }
    const result = checkRateLimit('user@test.com', 'password-reset');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('resets namespace-specific entries', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('user@test.com', 'password-reset');
    }
    resetRateLimit('user@test.com', 'password-reset');
    const result = checkRateLimit('user@test.com', 'password-reset');
    expect(result.remaining).toBe(4);
  });
});

describe('checkRateLimit with custom config', () => {
  beforeEach(() => {
    resetRateLimit('custom@test.com', 'test-custom');
  });

  it('respects custom maxAttempts', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('custom@test.com', 'test-custom', { maxAttempts: 3 });
    }
    const result = checkRateLimit('custom@test.com', 'test-custom', { maxAttempts: 3 });
    expect(result.allowed).toBe(false);
  });

  it('respects custom windowMs', () => {
    const result = checkRateLimit('custom@test.com', 'test-custom', {
      maxAttempts: 10,
      windowMs: 50,
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });
});
