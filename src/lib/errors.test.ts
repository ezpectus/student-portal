import { describe, it, expect } from 'vitest';
import {
  ActionError,
  TransientError,
  PermanentError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from '@/lib/errors';

describe('ActionError', () => {
  it('stores category, code, and statusCode', () => {
    const err = new ActionError('test', {
      category: 'transient',
      code: 'TEST_001',
      statusCode: 503,
    });
    expect(err.message).toBe('test');
    expect(err.category).toBe('transient');
    expect(err.code).toBe('TEST_001');
    expect(err.statusCode).toBe(503);
    expect(err.retryable).toBe(true);
    expect(err.name).toBe('ActionError');
  });

  it('defaults statusCode to 500', () => {
    const err = new ActionError('test', { category: 'permanent', code: 'TEST' });
    expect(err.statusCode).toBe(500);
  });
});

describe('TransientError', () => {
  it('is retryable with 503 status', () => {
    const err = new TransientError('network down');
    expect(err.category).toBe('transient');
    expect(err.retryable).toBe(true);
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe('TRANSIENT_ERROR');
    expect(err.name).toBe('TransientError');
  });
});

describe('PermanentError', () => {
  it('is not retryable', () => {
    const err = new PermanentError('bad request', 'BAD_INPUT', 400);
    expect(err.category).toBe('permanent');
    expect(err.retryable).toBe(false);
    expect(err.statusCode).toBe(400);
  });
});

describe('ValidationError', () => {
  it('has expected category and 422 status', () => {
    const err = new ValidationError('invalid email');
    expect(err.category).toBe('expected');
    expect(err.statusCode).toBe(422);
    expect(err.retryable).toBe(false);
    expect(err.name).toBe('ValidationError');
  });
});

describe('NotFoundError', () => {
  it('has 404 status', () => {
    const err = new NotFoundError('user not found');
    expect(err.statusCode).toBe(404);
    expect(err.category).toBe('permanent');
  });
});

describe('UnauthorizedError', () => {
  it('has 401 status and default message', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Unauthorized');
  });
});
