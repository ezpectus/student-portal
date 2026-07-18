import { z } from 'zod';

import { ValidationError } from '@/lib/errors';

/**
 * Validates server action input against a Zod schema.
 * Throws ValidationError with all field errors on failure.
 *
 * @example
 * const schema = z.object({ email: z.string().email() });
 * const { email } = validateInput(schema, { email }, 'changeEmail');
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string,
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
        return `${path}: ${issue.message}`;
      })
      .join('; ');

    const message = context
      ? `Validation failed (${context}): ${issues}`
      : `Validation failed: ${issues}`;

    throw new ValidationError(message, 'INPUT_VALIDATION', result.error);
  }

  return result.data;
}
