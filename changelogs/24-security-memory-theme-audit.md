# 24 — Security, Memory, and Theme Audit

**Date:** 18.07.2026  
**Scope:** JWT claims, authorization boundaries, timer cleanup, theme UX, shared UI surfaces

## Security fixes

- Local JWTs now include role-specific module claims.
- Non-admin local users no longer receive the `admin` module claim.
- Local JWTs use the `student-portal-local` issuer and are signature-verified in middleware.
- `getLocalUserById` now uses an explicit safe select and does not expose `passwordHash`.

## Memory/resource fixes

- PDF iframe printing now tracks both delayed timers.
- Cleanup is idempotent, clears timers, revokes Blob URLs, and removes the iframe.
- Existing event listeners and debounced timers were reviewed and already had cleanup paths.

## UI/UX fixes

- Theme cycle is now `light → dim → dark → light`.
- Theme choice persists in localStorage.
- Dark and dim modes have explicit semantic color tokens.
- Shared tables use `bg-card`, `bg-muted`, and semantic foreground tokens instead of hard-coded white/neutral surfaces.
- Theme toggle now communicates the active mode through `aria-label` and `title`.

## Remaining risks

- Remote API JWT verification requires the external backend's issuer/JWKS contract.
- Rate limiting, refresh-token rotation, logout-all-devices, and automated E2E tests remain roadmap items.
