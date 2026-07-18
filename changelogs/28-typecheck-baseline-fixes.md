# 28 — Typecheck Baseline Fixes

**Date:** 18.07.2026  
**Scope:** Clean-install TypeScript baseline after dependency reset

## Findings fixed

- Typed carousel snap state as `number[]` and guarded optional `CarouselApi`.
- Added carousel event unsubscription on effect cleanup.
- Added missing cleanup return to async student lookup effect.
- Added missing `useServerErrorToast` import in profile editor.
- Removed stale import of deleted `CodeOfHonor` component.
- Added `NEXT_PUBLIC_BETA_LOGO` to validated env schema.
- Guarded optional external URLs in support, contacts, public links, FAQ, and certificate validation.
- Made header profile photo timer cleanup unconditional.
- Added missing Radix dependencies referenced by existing UI primitives: accordion, dropdown-menu, and switch.
- Added Prisma config fallback for local validation when `DATABASE_URL` is not exported in the shell.

## Verification state

The initial clean-install baseline reported 24 errors in 14 files. The source fixes cover those TypeScript categories. The dependency additions still require `npm install` to update `package-lock.json` and install the three Radix packages; the IDE command bridge timed out while waiting for npm output.
