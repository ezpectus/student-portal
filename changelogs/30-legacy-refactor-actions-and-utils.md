# 30 — Legacy refactor: actions, client, date utils

## Summary

Cleaned up redundant patterns, fixed import ordering, consolidated date utilities, and removed a silent-fail anti-pattern in the study sheet page.

## Changes

### Actions — redundant try/catch removal

- **`announcement.actions.ts`**: Removed `try { ... } catch (error) { throw error; }` from `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`. Removed unused `error` binding in `getAnnouncements` catch.
- **`profile.actions.ts`**: Removed redundant try/catch wrappers from `createContact`, `updateContact`, `deleteContact`, `updateIntellectInfo`, `acceptCodeOfHonor`, `acceptPrivacyConsent`. Removed unused `error` bindings in `getContacts`, `getContactTypes`.
- **`certificates.actions.ts`**: Removed redundant try/catch from `getCertificatePDF`.

### Actions — import order

- **`announcement.actions.ts`**: Sorted imports (external → `@/lib` → `@/types` → `@/app`).
- **`profile.actions.ts`**: Sorted imports (external → `@/lib` → `@/types`).
- **`certificates.actions.ts`**: Sorted imports (external → `@/lib` → `@/types`).
- **`msg.actions.ts`**: Sorted imports (external → `@/lib` → `@/types`).

### Actions — performance

- **`certificates.actions.ts`**: `getOtherFacultyCertificate` replaced 3× `Array.filter` passes with a single `for...of` loop grouping into rejected/approved/created buckets.

### Client

- **`lib/client.ts`**: Renamed `Client` → `createApiFetch` (descriptive factory name). Consolidated `next/headers` imports. Removed unused `error` binding in `getLocaleSafe` catch. Added default `unknown` to generic parameter.

### Date utilities

- **`lib/date.utils.ts`**: Added `formatDate` and `formatTime` (moved from `lib/utils.tsx`).
- **`lib/utils.tsx`**: Removed `formatDate`, `formatTime`, and unused `dayjs` import.
- **`msg/components/inbox.tsx`**: Updated import from `@/lib/utils` → `@/lib/date.utils`.
- **`msg/components/dialog/preview-dialog.tsx`**: Updated import from `@/lib/utils` → `@/lib/date.utils`.

### Study sheet page

- **`studysheet/page.tsx`**: Removed silent-fail try/catch + infinite `LoadingScreen` pattern. Errors now propagate to the `(private)/error.tsx` error boundary, which shows a retry button — consistent with all other module pages.

## Verification

```bash
npm run tsc
npm run lint
```

Both pass clean.
