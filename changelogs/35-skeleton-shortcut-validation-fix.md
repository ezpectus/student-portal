# Changelog 35 — Dashboard Skeleton, Search Shortcut, Validation Fix

**Date:** 18.07.2026

## New Features

### Dashboard Loading Skeleton
- **New component:** `src/app/[locale]/(private)/components/dashboard-skeleton.tsx`
- Shimmer placeholders matching dashboard layout: greeting, metric cards, charts, announcements, support card
- Uses existing `Skeleton` UI primitive with `animate-pulse`
- **New loading.tsx:** `src/app/[locale]/(private)/loading.tsx` — renders skeleton during dashboard data fetch
- Replaces generic spinner with structured, production-grade loading state

### Message Search Keyboard Shortcut
- Press `/` anywhere on messages page to focus the search input
- Ignores `/` when already typing in an input/textarea (no interference)
- Added to keyboard shortcuts help dialog under new "Actions" group
- **Translations:** UK/EN for `shortcuts.groups.actions` and `shortcuts.items.search-messages`

## Bug Fixes

### Settings Action: Use Validated Input
- `updateNotificationPreferences` was validating input via `validateInput()` but then passing raw `preferences` to the API and Prisma
- Fixed: now passes `validated` to both `apiFetch` body and `prisma.user.update` data
- Ensures Zod-validated data is always used, not the raw untrusted input

## Files Created
- `src/app/[locale]/(private)/components/dashboard-skeleton.tsx`
- `src/app/[locale]/(private)/loading.tsx`

## Files Modified
- `src/app/[locale]/(private)/module/msg/components/inbox.tsx` — keyboard shortcut, search ref
- `src/components/command-palette/keyboard-shortcuts-help.tsx` — actions group
- `src/actions/settings.actions.ts` — use validated data in API + Prisma calls
- `src/messages/uk.json`, `src/messages/en.json` — shortcut translations

## Verification

```bash
npm run tsc
npm run lint
npm test
```
