/**
 * Edge Runtime compatible CSRF utilities.
 * This file must NOT import 'server-only' or Node.js modules.
 * Used by middleware (Edge Runtime) and server actions.
 */

/**
 * Generate a random CSRF token (Edge Runtime compatible).
 */
export function generateCsrfToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate a CSRF token against the expected value using constant-time comparison.
 */
export function validateCsrfToken(token: string, expected: string): boolean {
  if (!token || !expected || token.length !== expected.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
