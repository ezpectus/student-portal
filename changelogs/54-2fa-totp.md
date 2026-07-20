# Tech Debt — 2FA/TOTP for Admin Accounts

## Added
- **Prisma schema**: `twoFactorSecret`, `twoFactorEnabled`, `twoFactorPending` fields on `User` model
- **`two-factor.actions.ts`**:
  - `setup2FA()` — generates TOTP secret via `otplib`, stores in pending state, returns `{ secret, otpauthUrl }`
  - `verify2FA({ token })` — verifies 6-digit code against pending secret, enables 2FA on success
  - `disable2FA()` — clears secret and disables 2FA
  - `verify2FALogin(userId, token)` — called during login to verify TOTP code
  - `get2FAStatus()` — returns `{ enabled, pending }` for current user
  - All actions use `getLocalUser()` for auth, admin-only for setup

## Dependencies
- Requires `otplib` package: `npm install otplib`

## Files Changed
- `prisma/schema.prisma` (3 new fields on User)
- `src/actions/two-factor.actions.ts` (new)
