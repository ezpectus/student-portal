import { describe, it, expect } from 'vitest';
import { z } from 'zod';

import { validateInput } from '@/lib/validate';
import { ValidationError } from '@/lib/errors';

describe('validateInput', () => {
  const testSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  it('returns parsed data when valid', () => {
    const data = { email: 'test@example.com', password: 'password123' };
    const result = validateInput(testSchema, data);
    expect(result).toEqual(data);
  });

  it('throws ValidationError when email is invalid', () => {
    expect(() =>
      validateInput(testSchema, { email: 'not-an-email', password: 'password123' }),
    ).toThrow(ValidationError);
  });

  it('throws ValidationError when password is too short', () => {
    expect(() =>
      validateInput(testSchema, { email: 'test@example.com', password: 'short' }),
    ).toThrow(ValidationError);
  });

  it('includes context in error message', () => {
    try {
      validateInput(testSchema, { email: 'bad' }, 'changeEmail');
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).message).toContain('changeEmail');
    }
  });

  it('includes field path in error message', () => {
    try {
      validateInput(testSchema, { email: 'bad', password: 'password123' });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).message).toContain('email');
    }
  });

  it('throws ValidationError for non-object input', () => {
    expect(() => validateInput(testSchema, null)).toThrow(ValidationError);
    expect(() => validateInput(testSchema, 'string')).toThrow(ValidationError);
    expect(() => validateInput(testSchema, 123)).toThrow(ValidationError);
  });

  it('preserves Zod error as cause', () => {
    try {
      validateInput(testSchema, { email: 'bad', password: 'short' });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).cause).toBeDefined();
    }
  });

  it('works with primitive schemas', () => {
    const stringSchema = z.string().min(1);
    expect(validateInput(stringSchema, 'hello')).toBe('hello');
    expect(() => validateInput(stringSchema, '')).toThrow(ValidationError);
  });

  it('works with array schemas', () => {
    const arraySchema = z.array(z.number()).min(1);
    expect(validateInput(arraySchema, [1, 2, 3])).toEqual([1, 2, 3]);
    expect(() => validateInput(arraySchema, [])).toThrow(ValidationError);
  });
});
