import { describe, it, expect, vi } from 'vitest';
import { retryWithBackoff } from '@/lib/retry';
import { TransientError, PermanentError, ValidationError, NotFoundError, UnauthorizedError } from '@/lib/errors';

describe('retryWithBackoff', () => {
  it('returns result on first success', async () => {
    const op = vi.fn().mockResolvedValue('ok');
    const result = await retryWithBackoff(op);
    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    let attempt = 0;
    const op = vi.fn().mockImplementation(async () => {
      attempt++;
      if (attempt < 3) throw new Error('fail');
      return 'ok';
    });

    const result = await retryWithBackoff(op, {
      maxAttempts: 5,
      baseDelayMs: 1,
      maxDelayMs: 10,
    });
    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(3);
  });

  it('throws after max attempts', async () => {
    const op = vi.fn().mockRejectedValue(new Error('always fails'));
    await expect(
      retryWithBackoff(op, { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 5 }),
    ).rejects.toThrow('always fails');
    expect(op).toHaveBeenCalledTimes(3);
  });

  it('does not retry on first attempt success', async () => {
    const op = vi.fn().mockResolvedValue(42);
    await retryWithBackoff(op, { maxAttempts: 3 });
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('retries on TransientError', async () => {
    const op = vi
      .fn()
      .mockRejectedValueOnce(new TransientError('fail'))
      .mockResolvedValueOnce('ok');
    const result = await retryWithBackoff(op, { maxAttempts: 3, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('does NOT retry on PermanentError', async () => {
    const op = vi.fn().mockRejectedValue(new PermanentError('nope'));
    await expect(retryWithBackoff(op, { maxAttempts: 3, baseDelayMs: 1 })).rejects.toThrow(PermanentError);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on ValidationError', async () => {
    const op = vi.fn().mockRejectedValue(new ValidationError('bad input'));
    await expect(retryWithBackoff(op, { maxAttempts: 3, baseDelayMs: 1 })).rejects.toThrow(ValidationError);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on NotFoundError', async () => {
    const op = vi.fn().mockRejectedValue(new NotFoundError('missing'));
    await expect(retryWithBackoff(op, { maxAttempts: 3, baseDelayMs: 1 })).rejects.toThrow(NotFoundError);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry on UnauthorizedError', async () => {
    const op = vi.fn().mockRejectedValue(new UnauthorizedError('no access'));
    await expect(retryWithBackoff(op, { maxAttempts: 3, baseDelayMs: 1 })).rejects.toThrow(UnauthorizedError);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('exhausts retries on persistent TransientError', async () => {
    const op = vi.fn().mockRejectedValue(new TransientError('always fail'));
    await expect(retryWithBackoff(op, { maxAttempts: 3, baseDelayMs: 1 })).rejects.toThrow(TransientError);
    expect(op).toHaveBeenCalledTimes(3);
  });

  it('respects maxAttempts = 1 (no retries)', async () => {
    const op = vi.fn().mockRejectedValue(new Error('fail'));
    await expect(retryWithBackoff(op, { maxAttempts: 1, baseDelayMs: 1 })).rejects.toThrow('fail');
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('succeeds on last attempt', async () => {
    const op = vi
      .fn()
      .mockRejectedValueOnce(new TransientError('fail 1'))
      .mockRejectedValueOnce(new TransientError('fail 2'))
      .mockResolvedValueOnce('ok');
    const result = await retryWithBackoff(op, { maxAttempts: 3, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(op).toHaveBeenCalledTimes(3);
  });
});
