# Changelog 30 — Security Hardening: Rate Limiting, Logout-All-Devices, Audit Log

**Date:** 18.07.2026

## Security

### Rate Limiting for Login Attempts
- **New file:** `src/lib/rate-limit.ts` — in-memory rate limiter (5 attempts per 60s window, 15-min lockout)
- **Integrated** into `loginWithCredentials` in `auth.actions.ts`
- **Login form** shows translated "too many attempts" message with remaining minutes
- **Rate reset** on successful login (both local and remote)
- **Tests:** `src/lib/rate-limit.test.ts` — covers first attempt, block after 5, independent tracking, reset

### Logout All Devices
- **Prisma schema:** Added `tokenVersion Int @default(0)` to `User` model
- **JWT payload:** `tokenVersion` included in signed tokens for both login and registration
- **Validation:** `getLocalUser` rejects tokens with stale `tokenVersion`
- **New action:** `logoutAllDevices()` — increments `tokenVersion`, clears cookies, redirects
- **Settings UI:** New "Security" section with logout-all-devices button (red-tinted card)
- **Translations:** UK/EN keys for security section

### Audit Log
- **Prisma schema:** New `AuditLog` model (action, entity, entityId, metadata, ipAddress, userId, createdAt)
- **New actions:** `src/actions/audit.actions.ts` — `getAuditLogs` (admin-only, paginated) + `logAuditEvent` (internal)
- **Admin actions logged:** `deleteUser`, `updateUserStatus` now write audit entries
- **Admin UI:** New `AuditLogViewer` component with table (time, user, action, entity, details)
- **Translations:** UK/EN keys for audit log section

### Session Expiry Warning
- **New action:** `src/actions/session.actions.ts` — `getSessionExpiry()` returns JWT exp timestamp
- **New component:** `src/components/session-expiry-banner.tsx` — polls every 30s, shows warning when <5 min remaining, auto-logout on expiry
- **Integrated** into private layout alongside CommandPalette
- **Translations:** UK/EN `global.session.expiring-soon` with `{minutes}` interpolation

### TypeScript Fixes (Pre-existing)
- Removed invalid generic type args from `apiFetch<T>()` calls (apiFetch is not generic)
- Cast `response.json()` results to proper types (`AuthResponse`, `User`, `string`)
- Added explicit `Promise<User | null>` return type to `getUserDetails()`
- Removed unused `logger` import warning

## Files Created
- `src/lib/rate-limit.ts`
- `src/lib/rate-limit.test.ts`
- `src/actions/audit.actions.ts`
- `src/actions/session.actions.ts`
- `src/app/[locale]/(private)/module/admin/components/audit-log-viewer.tsx`
- `src/components/session-expiry-banner.tsx`

## Files Modified
- `prisma/schema.prisma` — added `tokenVersion` field, `AuditLog` model, `auditLogs` relation
- `src/actions/auth.actions.ts` — rate limiting integration
- `src/actions/local-auth.actions.ts` — tokenVersion in JWT, validation, logoutAllDevices
- `src/actions/admin.actions.ts` — audit logging for delete/updateStatus
- `src/app/[locale]/(public)/(auth)/login/credentials-login.tsx` — rate-limited error handling
- `src/app/[locale]/(private)/settings/settings-form.tsx` — security section with logout-all button
- `src/app/[locale]/(private)/module/admin/admin-page-content.tsx` — AuditLogViewer integration
- `src/app/[locale]/(private)/layout.tsx` — SessionExpiryBanner integration
- `src/messages/uk.json`, `src/messages/en.json` — rate-limited, security, audit, session translations
- `docs/saas-transformation-roadmap.md` — updated progress tracking
- `docs/engineering-quality-baseline.md` — updated remaining risks

## Verification

```bash
npm run db:generate
npm run db:push
npm test
```
