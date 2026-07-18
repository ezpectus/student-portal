import { describe, it, expect } from 'vitest';
import { throwApiError } from '@/lib/api-error';
import { NotFoundError, PermanentError, TransientError, UnauthorizedError, ValidationError } from '@/lib/errors';

describe('throwApiError', () => {
  it('throws UnauthorizedError for 401', () => {
    expect(() => throwApiError(401)).toThrow(UnauthorizedError);
    expect(() => throwApiError(401)).toThrow('API error: 401');
  });

  it('throws NotFoundError for 404', () => {
    expect(() => throwApiError(404)).toThrow(NotFoundError);
  });

  it('throws ValidationError for 422', () => {
    expect(() => throwApiError(422)).toThrow(ValidationError);
  });

  it('throws TransientError for 503', () => {
    expect(() => throwApiError(503)).toThrow(TransientError);
  });

  it('throws TransientError for 500', () => {
    expect(() => throwApiError(500)).toThrow(TransientError);
  });

  it('throws TransientError for 502', () => {
    expect(() => throwApiError(502)).toThrow(TransientError);
  });

  it('throws PermanentError for 400', () => {
    expect(() => throwApiError(400)).toThrow(PermanentError);
  });

  it('throws PermanentError for 403', () => {
    expect(() => throwApiError(403)).toThrow(PermanentError);
  });

  it('throws PermanentError for 409', () => {
    expect(() => throwApiError(409)).toThrow(PermanentError);
  });

  it('includes context in message when provided', () => {
    expect(() => throwApiError(404, 'getCertificate')).toThrow('getCertificate: 404');
  });

  it('sets correct status codes on thrown errors', () => {
    try {
      throwApiError(401);
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect((error as UnauthorizedError).statusCode).toBe(401);
    }
  });

  it('sets retryable=true for server errors', () => {
    try {
      throwApiError(503);
    } catch (error) {
      expect(error).toBeInstanceOf(TransientError);
      expect((error as TransientError).retryable).toBe(true);
    }
  });

  it('sets retryable=false for client errors', () => {
    try {
      throwApiError(400);
    } catch (error) {
      expect(error).toBeInstanceOf(PermanentError);
      expect((error as PermanentError).retryable).toBe(false);
    }
  });
});
