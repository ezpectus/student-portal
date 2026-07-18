# Changelog 36 — Skeleton Loaders Replace All Spinners

**Date:** 18.07.2026

## UX Improvement: Skeleton Loaders

### Problem
All 15 loading states (13 modules + settings + profile) used `LoadingScreen` — a centered spinner icon. The architecture doc specifies "Loading skeletons (not spinners)" as the target state.

### Solution
Created reusable `TableSkeleton` component and replaced every `LoadingScreen` with context-appropriate skeletons.

### New Components
- **`src/components/table-skeleton.tsx`** — reusable skeleton for table-based layouts
  - Configurable `rows` and `columns` props
  - Shimmer animation via existing `Skeleton` primitive
  - Header row + data rows

### Updated Loading States (15 files)

| Module | Skeleton Type | Rows × Cols |
|--------|--------------|-------------|
| certificates | Table | 5×4 |
| rating | Table | 8×5 |
| studysheet | Table | 6×4 |
| studysheet/[id] | Table | 10×5 |
| directory | Table | 8×3 |
| facultycertificate | Table | 5×4 |
| facultycertificate/[id] | Table | 6×4 |
| announcementseditor | Table | 6×3 |
| attestationresults | Table | 6×4 |
| vedomoststud | Table | 6×4 |
| msg | Table | 8×3 |
| employment | Table | 4×3 |
| kurator | Table | 4×3 |
| settings | Form skeleton | 4 fields |
| profile | Profile card + form | avatar + 6 fields |

Also removed `async` from `attestationresults/loading.tsx` (loading components should not be async).

## Files Created
- `src/components/table-skeleton.tsx`

## Files Modified (15 loading.tsx files)
- `src/app/[locale]/(private)/module/certificates/loading.tsx`
- `src/app/[locale]/(private)/module/rating/loading.tsx`
- `src/app/[locale]/(private)/module/studysheet/loading.tsx`
- `src/app/[locale]/(private)/module/studysheet/[id]/loading.tsx`
- `src/app/[locale]/(private)/module/directory/loading.tsx`
- `src/app/[locale]/(private)/module/facultycertificate/loading.tsx`
- `src/app/[locale]/(private)/module/facultycertificate/[id]/loading.tsx`
- `src/app/[locale]/(private)/module/announcementseditor/loading.tsx`
- `src/app/[locale]/(private)/module/attestationresults/loading.tsx`
- `src/app/[locale]/(private)/module/vedomoststud/loading.tsx`
- `src/app/[locale]/(private)/module/msg/loading.tsx`
- `src/app/[locale]/(private)/module/employment/loading.tsx`
- `src/app/[locale]/(private)/module/kurator/loading.tsx`
- `src/app/[locale]/(private)/settings/loading.tsx`
- `src/app/[locale]/(private)/profile/loading.tsx`

## Verification

```bash
npm run tsc
npm run lint
npm test
```
