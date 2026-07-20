# 61 — Audit Fixes: CSRF, Hydration, Cache Revalidation

**Date:** 20.07.2026
**Auditor:** Cascade AI
**Scope:** Full-codebase audit for hydration errors, CSRF gaps, missing cache revalidation, and secret leakage

---

## Summary

| Category | Issues Found | Fixed |
|----------|-------------|-------|
| Hydration mismatch | 1 | 1 |
| Missing CSRF protection | 7 | 7 |
| Missing revalidatePath | 1 | 1 |
| Secret leakage (process.env in client) | 0 | — |
| Infinite useEffect loops | 0 | — |
| Prisma client sync | 0 | — |

---

## Fixes

### HYD-01 · CalendarView hydration mismatch [P1 HIGH]

**File:** `src/app/[locale]/(private)/module/calendar/components/calendar-view.tsx:42-44`

**Problem:** `useState(() => new Date())` in initializer runs on both server and client. Around midnight on month boundaries, server could render January while client hydrates with February — causing a hydration mismatch and a broken calendar grid.

**Fix:** Initialize `currentDate` to `null`, set both `currentDate` and `today` in `useEffect` (after mount). Added null guards in `useMemo` hooks and a skeleton loading state for the first render.

```typescript
// Before (hydration risk):
const [currentDate, setCurrentDate] = useState(() => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
});

// After (hydration safe):
const [currentDate, setCurrentDate] = useState<Date | null>(null);

useEffect(() => {
  const now = new Date();
  setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  setToday(now);
}, []);
```

---

### CSRF-01 · Missing CSRF in deleteMail [P1 HIGH]

**File:** `src/actions/msg.actions.ts:136`

**Problem:** `deleteMail` is a mutation (DELETE) without `await requireCsrf()`. An attacker could craft a cross-site request to delete a user's messages.

**Fix:** Added `await requireCsrf();` at the top of the function.

---

### CSRF-02 · Missing CSRF in markAsImportant [P1 HIGH]

**File:** `src/actions/msg.actions.ts:165`

**Problem:** `markAsImportant` is a mutation (UPDATE) without CSRF protection.

**Fix:** Added `await requireCsrf();` at the top of the function.

---

### CSRF-03 · Missing CSRF in markNotificationRead [P1 HIGH]

**File:** `src/actions/notification.actions.ts:36`

**Problem:** `markNotificationRead` mutates notification state without CSRF protection.

**Fix:** Added `await requireCsrf();` and imported `requireCsrf` from `@/lib/csrf`.

---

### CSRF-04 · Missing CSRF in markAllNotificationsRead [P1 HIGH]

**File:** `src/actions/notification.actions.ts:48`

**Problem:** `markAllNotificationsRead` mutates notification state without CSRF protection.

**Fix:** Added `await requireCsrf();` at the top of the function.

---

### CSRF-05 · Missing CSRF in updateOnboardingProfile [P1 HIGH]

**File:** `src/actions/onboarding.actions.ts:13`

**Problem:** `updateOnboardingProfile` updates user profile data without CSRF protection.

**Fix:** Added `await requireCsrf();` and imported `requireCsrf` from `@/lib/csrf`.

---

### CSRF-06 · Missing CSRF in uploadOnboardingPhoto [P1 HIGH]

**File:** `src/actions/onboarding.actions.ts:44`

**Problem:** `uploadOnboardingPhoto` uploads a file and updates user data without CSRF protection.

**Fix:** Added `await requireCsrf();` at the top of the function.

---

### CSRF-07 · Missing CSRF in completeOnboarding [P1 HIGH]

**File:** `src/actions/onboarding.actions.ts:67`

**Problem:** `completeOnboarding` is a server action that invalidates cache (revalidateTag) without CSRF protection. While it doesn't directly mutate the database, it's still a state-changing action callable from the client.

**Fix:** Added `await requireCsrf();` at the top of the function.

---

### REV-01 · Missing revalidatePath in verifyAttendanceQR [P2 MEDIUM]

**File:** `src/actions/qr-attendance.actions.ts:71`

**Problem:** `verifyAttendanceQR` upserts attendance data but doesn't call `revalidatePath`. Cached pages showing attendance won't reflect the updated data until cache expires.

**Fix:** Added `revalidatePath('/module/rating');` after the transaction, imported `revalidatePath` from `next/cache`.

---

## Verified Clean (No Issues Found)

### Secret Leakage — `process.env` in Client Components

All `process.env` usage in `.tsx` files is either:
- In server-only files (`jwt.ts`, `logger.ts`, `prisma.ts`, route handlers) — safe
- With `NEXT_PUBLIC_` prefix (`demo-credentials.tsx`) — safe
- Via the Zod-validated `env` object from `@/lib/env.ts` — safe

No secrets leak into the client bundle.

### Infinite useEffect Loops

All `useEffect` dependency arrays use primitive values (`string`, `number`, `boolean`) or stable references (`useForm` return, `useCallback` results). No inline objects or arrays in dependency arrays. The `multi-select.tsx` effect at line 283 has `options` in deps but guards with `JSON.stringify` comparison to prevent loops.

### Prisma Client Sync

`postinstall` script runs `prisma generate` automatically. Generated client in `src/generated/prisma/` contains all models including `RefreshToken`, `Notification`, `ChatRoom`, `Event`, `Attendance`, `FeedPost`. Types are in sync with schema.

### useLocalStorage Hydration

`useLocalStorage` hook (`src/hooks/use-storage.ts`) was already fixed in a previous session — reads localStorage only in `useEffect`, not in `useState` initializer. Server and first client render both get `defaultValue`. No hydration mismatch.

### useTheme Hydration

`useTheme` hook uses `mounted` pattern — returns `false` until `useEffect` runs. `ThemeToggle` component renders a placeholder `<div>` until mounted. No hydration mismatch.
