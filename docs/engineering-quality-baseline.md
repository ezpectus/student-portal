# Engineering Quality Baseline

**Status:** Active review checklist  
**Updated:** 20.07.2026

## Architecture rules

- Keep `page.tsx` server-side and put interactive behavior in client components.
- Keep database access in server actions or server-only libraries.
- Use one domain type per module instead of duplicating row interfaces.
- Validate authorization inside server actions; hiding a sidebar item is not authorization.
- Use `apiFetch` for the external API; do not call `fetch` directly in actions.
- Use `dayjs` for UI date formatting.
- Use translated strings for visible text.
- Use stable database IDs as React keys.

## Anti-patterns checked in the current pass

- **Unsafe type escape:** removed `as never` from the admin detail dialog flow.
- **Duplicate schema ownership:** separated SQLite and PostgreSQL Prisma schemas.
- **Leaked secrets:** DB Explorer excludes `passwordHash` and internal foreign keys.
- **Missing action authorization:** admin actions now check local or remote admin role.
- **Unclear backend ownership:** API health logs explicitly monitor the external API because this repository does not host a backend server.
- **Copy-pasted admin types:** table, detail dialog, and page content now share module-local types.
- **Broken startup contract:** Docker now waits for PostgreSQL, applies schema, seeds demo data, then starts Next.js.
- **Weak database integrity:** added status/activity indexes and unique monthly attendance per user; intentionally avoided fake course uniqueness without semester modeling.
- **Repository clutter:** removed one-off npm output/version files and deduplicated Prisma ignore rules.
- **Command concatenation:** launch instructions use separate commands and launchers rather than concatenating `npm --version` with shell syntax.
- **Role claim drift:** local JWTs now include role-specific modules; non-admin tokens no longer advertise the admin module.
- **Unsigned local middleware tokens:** local tokens now carry a dedicated issuer and are signature-verified in middleware.
- **Timer cleanup:** PDF iframe printing now clears delayed timers and revokes the Blob URL through idempotent cleanup.
- **Theme incompleteness:** light, dim, and dark semantic tokens are now explicit; shared tables use theme-aware surfaces.

- **CSRF protection:** `requireCsrf()` guard added to all mutating server actions (admin, settings, grading, calendar, feed, chat, msg, QR attendance). Middleware validates CSRF cookie + Origin header on POST requests with `Next-Action` header.
- **School isolation:** all data access scoped to `schoolId` — cross-school reads, mutations, messaging, chat room creation, feed deletion, grade history, event CRUD, and QR attendance blocked.
- **JWT_SECRET enforcement:** removed insecure default; minimum 16 characters required; app fails fast if missing.
- **External JWT expiration check:** `getJWTPayload` now rejects expired external tokens even without signature verification.
- **SQLite WAL mode:** enabled via `PRAGMA journal_mode = WAL` to prevent SQLITE_BUSY under concurrent writes.
- **Photo storage:** avatar uploads stored as files in `/public/uploads/avatars/` instead of base64 in DB; 5MB limit + MIME type allow-list.
- **Audit logging resilience:** `logAuditEvent` wrapped in try/catch — failures logged to console, non-blocking for main mutation.
- **Prisma query logging:** restricted to development only; production logs `error` and `warn` levels.
- **File upload safety:** 5MB size limit + MIME type allow-list (JPEG/PNG/WebP/GIF) for avatar uploads.

## Remaining risks

- ~~Local JWT uses a static development fallback secret when `JWT_SECRET` is absent~~ **Fixed:** JWT_SECRET now requires minimum 16 characters, no default.
- Remote API token verification still depends on the external backend's public key/issuer contract; configure JWKS/issuer validation before treating remote JWT claims as authoritative. External JWT expiration is now checked.
- Admin action authorization supports remote API fallback but should eventually use a single verified session abstraction.
- Password reset, refresh-token rotation remain. Rate limiting (in-memory) and logout-all-devices are implemented.
- Audit log model added to Prisma schema; admin actions (delete user, update status) are logged. Audit failures are now non-blocking.
- Vitest unit tests configured: circuit-breaker, retry, validate, errors, features, logger, csv-export, password-strength, audit actions. Playwright E2E tests configured: auth, grades, messages.
- The Docker demo seeds data on every container recreation when `SEED_DATABASE=true`; use a persistent volume and disable reseeding for production.
- Photos stored as files in `/public/uploads/avatars/` — ensure this directory is persisted in Docker deployments (volume mount).

## Verification commands

```bash
npm run tsc
npm run lint
npm run db:generate
npm run db:push
npm run db:seed
npm run build
```

For the PostgreSQL deployment schema:

```bash
npm run db:generate:postgres
npm run db:push:postgres
npm run build:postgres
```
