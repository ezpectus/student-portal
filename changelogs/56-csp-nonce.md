# Tech Debt — CSP Nonce-Based script-src

## Changed
- **Removed** static CSP header from `next.config.mjs` (had `'unsafe-inline' 'unsafe-eval'`)
- **Added** per-request CSP header in `src/middleware.ts`:
  - Generates 16-byte random nonce via `crypto.randomBytes`
  - `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'` — no more `unsafe-inline` or `unsafe-eval`
  - Sets `x-nonce` response header for debugging
  - All other CSP directives preserved (style, img, font, connect, frame, object, base)

## Files Changed
- `next.config.mjs` (removed CSP from headers)
- `src/middleware.ts` (nonce generation + CSP header)
