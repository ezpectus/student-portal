# Engineering Quality Baseline

**Status:** Active review checklist  
**Updated:** 18.07.2026

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

- **Redundant try/catch rethrow:** removed `try { ... } catch (error) { throw error; }` from announcement, profile, and certificates actions.
- **Import order:** sorted imports in announcement, profile, certificates, msg actions and client.ts to match eslint-plugin-simple-import-sort.
- **Date utility consolidation:** moved `formatDate`/`formatTime` from `lib/utils.tsx` to `lib/date.utils.ts` — all date helpers in one place.
- **Silent-fail studysheet:** removed try/catch + infinite LoadingScreen pattern; errors now propagate to the error boundary with a retry button.
- **Certificate grouping optimization:** `getOtherFacultyCertificate` replaced 3× `Array.filter` passes with a single `for...of` loop.
- **Client factory naming:** renamed `Client` → `createApiFetch` for clarity; consolidated `next/headers` imports.

## Remaining risks

- Local JWT uses a static development fallback secret when `JWT_SECRET` is absent; production must provide a strong secret.
- Remote API token verification still depends on the external backend's public key/issuer contract; configure JWKS/issuer validation before treating remote JWT claims as authoritative.
- Admin action authorization supports remote API fallback but should eventually use a single verified session abstraction.
- Password reset, refresh-token rotation remain. Rate limiting (in-memory) and logout-all-devices are implemented.
- Audit log model added to Prisma schema; admin actions (delete user, update status) are logged.
- Automated Vitest/Playwright coverage is not yet configured.
- A clean-install baseline exposed 24 TypeScript errors; fixes are documented in changelog 28.
- The lockfile must be regenerated after the Next/Radix dependency update; do not use `npm audit fix --force` because it conflicts with the pinned override.
- The Docker demo seeds data on every container recreation when `SEED_DATABASE=true`; use a persistent volume and disable reseeding for production.

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
