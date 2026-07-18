export type ErrorCategory = 'transient' | 'permanent' | 'expected';

export class ActionError extends Error {
  readonly category: ErrorCategory;
  readonly code: string;
  readonly statusCode: number;

  constructor(
    message: string,
    options: {
      category: ErrorCategory;
      code: string;
      statusCode?: number;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = 'ActionError';
    this.category = options.category;
    this.code = options.code;
    this.statusCode = options.statusCode ?? 500;
  }

  get retryable() {
    return this.category === 'transient';
  }
}

export class TransientError extends ActionError {
  constructor(message: string, code = 'TRANSIENT_ERROR', cause?: unknown) {
    super(message, { category: 'transient', code, statusCode: 503, cause });
    this.name = 'TransientError';
  }
}

export class PermanentError extends ActionError {
  constructor(message: string, code = 'PERMANENT_ERROR', statusCode = 400, cause?: unknown) {
    super(message, { category: 'permanent', code, statusCode, cause });
    this.name = 'PermanentError';
  }
}

export class ValidationError extends ActionError {
  constructor(message: string, code = 'VALIDATION_ERROR', cause?: unknown) {
    super(message, { category: 'expected', code, statusCode: 422, cause });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ActionError {
  constructor(message: string, code = 'NOT_FOUND', cause?: unknown) {
    super(message, { category: 'permanent', code, statusCode: 404, cause });
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ActionError {
  constructor(message: string = 'Unauthorized', code = 'UNAUTHORIZED', cause?: unknown) {
    super(message, { category: 'permanent', code, statusCode: 401, cause });
    this.name = 'UnauthorizedError';
  }
}
