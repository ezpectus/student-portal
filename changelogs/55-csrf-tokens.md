# Tech Debt — CSRF Tokens for Server Actions

## Added
- **`CSRF_COOKIE_NAME`** constant in `cookies.ts`
- **`src/lib/csrf.ts`**:
  - `generateCsrfToken()` — 32-byte random hex token via `crypto.randomBytes`
  - `validateCsrfToken(token, expected)` — constant-time comparison using SHA-256 hash
- **Middleware** (`src/middleware.ts`):
  - Sets `sp-csrf` cookie on first authenticated request (non-httpOnly, readable by client)
  - Cookie uses `sameSite: 'lax'`, `path: '/'`
  - Existing cookie is preserved if already present
- Next.js Server Actions have built-in Origin header verification; this adds a double-submit cookie layer for defense-in-depth

## Files Changed
- `src/lib/constants/cookies.ts` (added `CSRF_COOKIE_NAME`)
- `src/lib/csrf.ts` (new)
- `src/middleware.ts` (CSRF cookie injection)
