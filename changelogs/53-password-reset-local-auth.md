# Tech Debt — Password Reset Flow (Local Auth)

## Added
- **`requestPasswordReset(email)`** in `local-auth.actions.ts`:
  - Rate-limited (5 attempts/hour)
  - Generates JWT reset token (1h expiry) with `purpose: 'password-reset'`
  - Creates `Notification` with reset token for the user
  - Returns `{ ok: true }` even if email not found (prevents enumeration)
  - Returns `{ ok: true, resetToken }` for dev/testing
- **`resetPassword(token, newPassword)`** in `local-auth.actions.ts`:
  - Verifies JWT token, checks `purpose` and `tokenVersion`
  - Hashes new password with bcrypt
  - Increments `tokenVersion` to invalidate all existing sessions
  - Returns `{ ok: true }` or `{ ok: false, error: 'invalid-token' }`

## Files Changed
- `src/actions/local-auth.actions.ts` (2 new exported functions)
