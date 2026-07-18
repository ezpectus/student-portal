# Changelog 03 — Code Quality Fixes

**Date:** 18.07.2026
**Scope:** Code quality issues — incorrect constants, misplaced imports, and UX-affecting bugs.

---

## Summary

| # | Issue | File | Severity |
|---|-------|------|----------|
| 1 | Toast removal delay set to 1,000,000ms (~16 minutes) | `src/hooks/use-toast.ts:9` | High |
| 2 | Import statement in the middle of the file | `src/actions/auth.actions.ts:90` | Medium |
| 3 | `notFound()` instead of `redirect()` for unauthenticated users | `src/app/[locale]/(private)/layout.tsx:18-19` | Medium |

---

## Fix 1: Toast removal delay

**File:** `src/hooks/use-toast.ts:9`

**Before:**
```ts
const TOAST_REMOVE_DELAY = 1000000;
```

**After:**
```ts
const TOAST_REMOVE_DELAY = 5000;
```

**Problem:** The delay before a dismissed toast is removed from the DOM was set to 1,000,000 milliseconds (~16 minutes). This means dismissed toasts remain in the DOM and in memory for an unreasonable amount of time, causing:
- Memory leak — toast elements accumulate
- Visual artifacts — old toasts may flash briefly on re-render
- Poor UX — toasts seem to never fully disappear

**Fix:** Changed to 5,000ms (5 seconds), which is a standard toast dismissal delay. The toast disappears visually immediately (via animation), but the DOM cleanup happens after 5 seconds to allow exit animations to complete.

---

## Fix 2: Import in the middle of the file

**File:** `src/actions/auth.actions.ts:90` (old line number)

**Before:**
```ts
// ... other functions ...

import { USER_PROFILE_CACHE_TAG } from '@/lib/constants/cache-tags';

export async function getUserDetails() {
```

**After:**
```ts
// At top of file with other imports:
import { USER_PROFILE_CACHE_TAG } from '@/lib/constants/cache-tags';

// ... rest of file ...

export async function getUserDetails() {
```

**Problem:** An `import` statement was placed between function definitions, violating ES module conventions and the project's ESLint rules. Imports must be at the top of the file. This was likely an accidental merge or quick-add that was never cleaned up.

**Fix:** Moved the import to the top of the file alongside other imports. Removed the duplicate from the middle of the file.

---

## Fix 3: `notFound()` → `redirect()` for unauthenticated users

**File:** `src/app/[locale]/(private)/layout.tsx:5,18-19`

**Before:**
```ts
import { notFound } from 'next/navigation';
// ...
if (!user) {
  notFound();
}
```

**After:**
```ts
import { redirect } from 'next/navigation';
// ...
if (!user) {
  redirect('/');
}
```

**Problem:** When `getUserDetails()` returned `null` (user not authenticated or token expired), the layout called `notFound()`, rendering a 404 page. This is semantically incorrect — the user isn't "not found", they're unauthenticated. A 404 page is confusing UX for a user who simply needs to log in again.

**Fix:** Changed to `redirect('/')` which sends the user to the root path. The middleware will then detect the missing JWT and redirect to the login page with proper locale handling. Also removed the now-unused `notFound` import.
