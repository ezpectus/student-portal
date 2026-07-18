# Changelog 04 — Architecture & Accessibility Fixes

**Date:** 18.07.2026
**Scope:** Architectural improvements and accessibility fixes — proper semantic HTML and removal of unnecessary async patterns.

---

## Summary

| # | Issue | File | Severity |
|---|-------|------|----------|
| 1 | `div` with `onClick` instead of `button` (3 instances) | `src/app/[locale]/(private)/module/msg/components/inbox.tsx:124,127,133` | Medium |
| 2 | Unnecessary `setTimeout` in refresh handler | `src/app/[locale]/(private)/module/msg/components/inbox.tsx:111` | Low |

---

## Fix 1: `div` with `onClick` → semantic `<button>` (3 instances)

**File:** `src/app/[locale]/(private)/module/msg/components/inbox.tsx:124-135`

**Before:**
```tsx
<div onClick={handleDeleteClick} className="flex cursor-pointer items-center justify-center">
  <Trash2 className="h-6 w-6 text-neutral-500" />
</div>
<div onClick={handleMarkAsImportant} className="flex cursor-pointer items-center justify-center">
  <Star className="h-6 w-6 text-neutral-500" />
</div>
// ...
<div onClick={handleRefresh} className="flex cursor-pointer items-center justify-center" title={t('refresh')}>
  <ArrowClockwise className={`h-5 w-5 text-neutral-500 ${state.isRefreshing ? 'animate-spin' : ''}`} />
</div>
```

**After:**
```tsx
<button type="button" onClick={handleDeleteClick} className="flex cursor-pointer items-center justify-center" aria-label={t('actions.delete')}>
  <Trash2 className="h-6 w-6 text-neutral-500" />
</button>
<button type="button" onClick={handleMarkAsImportant} className="flex cursor-pointer items-center justify-center" aria-label={t('actions.mark-important')}>
  <Star className="h-6 w-6 text-neutral-500" />
</button>
// ...
<button type="button" onClick={handleRefresh} className="flex cursor-pointer items-center justify-center" title={t('refresh')} aria-label={t('refresh')}>
  <ArrowClockwise className={`h-5 w-5 text-neutral-500 ${state.isRefreshing ? 'animate-spin' : ''}`} />
</button>
```

**Problem:** Interactive elements (delete, mark as important, refresh) were implemented as `<div>` elements with `onClick` handlers. This causes:
- **Accessibility failure** — `<div>` elements are not focusable, not keyboard-accessible, and not announced as interactive by screen readers
- **No keyboard support** — users navigating with Tab cannot reach these controls
- **Semantic incorrectness** — clickable elements should be `<button>` or `<a>`

**Fix:** Replaced all three `<div onClick>` with `<button type="button" onClick>`. Added `aria-label` attributes for screen reader support since the buttons contain only icons (no visible text). Used `type="button"` to prevent accidental form submission.

---

## Fix 2: Unnecessary `setTimeout` in refresh handler

**File:** `src/app/[locale]/(private)/module/msg/components/inbox.tsx:110-112`

**Before:**
```ts
} finally {
  setTimeout(() => dispatch({ type: 'setIsRefreshing', isRefreshing: false }), 500);
}
```

**After:**
```ts
} finally {
  dispatch({ type: 'setIsRefreshing', isRefreshing: false });
}
```

**Problem:** The `finally` block wrapped the state update in a `setTimeout(..., 500)`, adding an artificial 500ms delay before hiding the loading spinner. This is an anti-pattern because:
- The `setTimeout` reference is never stored, so it can't be cleaned up if the component unmounts (potential memory leak / state update on unmounted component)
- The delay serves no functional purpose — the spinner should stop as soon as the async operation completes
- It masks the actual response time from the user

**Fix:** Removed the `setTimeout` wrapper. The `isRefreshing` state is set to `false` immediately in the `finally` block, which is the correct pattern — the spinner stops the moment the async operation finishes (success or error).
