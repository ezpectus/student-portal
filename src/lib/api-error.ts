import { NotFoundError, PermanentError, TransientError, UnauthorizedError, ValidationError } from '@/lib/errors';

const isClientError = (status: number) => status >= 400 && status < 500;
const isServerError = (status: number) => status >= 500;

export const throwApiError = (status: number, context?: string): never => {
  const message = context ? `${context}: ${status}` : `API error: ${status}`;

  switch (status) {
    case 401:
      throw new UnauthorizedError(message);
    case 404:
      throw new NotFoundError(message);
    case 422:
      throw new ValidationError(message);
    case 503:
      throw new TransientError(message, 'SERVICE_UNAVAILABLE');
    default:
      if (isServerError(status)) {
        throw new TransientError(message, `HTTP_${status}`);
      }
      if (isClientError(status)) {
        throw new PermanentError(message, `HTTP_${status}`, status);
      }
      throw new PermanentError(message, `HTTP_${status}`, status);
  }
};
