# 26 — Bug Sweep, Demo Flow, and Theme Consistency

**Date:** 18.07.2026  
**Scope:** Runtime bugs found during the post-demo review

## Fixed

- Local login now accepts both username and email, matching the translated form label.
- Local registration normalizes email and username before duplicate checks and persistence.
- Carousel dots now use stable snap values instead of array indexes as React keys.
- Linkified URL fragments now use content-based occurrence keys instead of bare array indexes.
- Login/register demo credentials are optional and controlled by `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS`.
- Settings now exposes language and light/dim/dark preferences in one control section.
- Remaining shared UI surfaces were changed from hardcoded white backgrounds to semantic theme tokens.
- Photo preview Blob URLs are revoked on replacement/unmount.

## Verification

- `npm run tsc` returned exit code 0 during the sweep.
- Literal searches found no `as any` or `as never` under `src`.
- Remaining timers/listeners have cleanup paths.
- Lint/Prisma CLI output is still affected by the IDE terminal bridge I/O timeout and must be confirmed in a normal terminal.

## Remaining

- Remote API JWT needs issuer/JWKS configuration.
- Add automated tests for login identifiers, role module claims, demo panel visibility, and theme cycling.
