# Changelog 34 — Message Search, Password Strength, Unread Badge

**Date:** 18.07.2026

## New Features

### Message Search in Inbox
- **Search input** in inbox toolbar with magnifying glass icon
- Filters messages by sender/recipient name and subject (case-insensitive)
- Works across all tabs (Inbox, Sent, Important)
- **Empty state:** Shows "No results found" when search yields nothing, "No messages" when inbox is empty
- **Select-all checkbox** now operates on filtered results only
- **Translations:** UK/EN for `search-placeholder`, `empty`, `no-results`
- **Types:** Added `searchQuery` state and `setSearchQuery` action to inbox reducer

### Password Strength Indicator
- **New component:** `src/components/auth/password-strength-indicator.tsx`
- Real-time strength calculation: length, uppercase, lowercase, digits, special chars
- 4-level visual bar: weak (red), fair (yellow), good (blue), strong (green)
- Hidden when password field is empty
- **Integrated** into registration form below password field
- **Tests:** 5 test cases (empty, weak, fair, strong, bar count)
- **Translations:** UK/EN for all 4 strength levels

### Unread Mail Badge in Sidebar
- **New server action:** `getUnreadMailCount()` — fetches incoming mail, counts unread, returns 0 on error (safe default)
- **New client component:** `src/components/app-sidebar/unread-mail-badge.tsx`
  - Polls every 60 seconds
  - Shows red badge with count (or "99+" for large counts)
  - Hidden when count is 0
- **MenuItem** updated to accept optional `badge` prop
- **ModulesMenuItems** renders `UnreadMailBadge` for the `msg` module

## Files Created
- `src/components/auth/password-strength-indicator.tsx`
- `src/components/auth/password-strength-indicator.test.tsx`
- `src/components/app-sidebar/unread-mail-badge.tsx`

## Files Modified
- `src/app/[locale]/(private)/module/msg/components/inbox.tsx` — search input, filtering, empty state
- `src/app/[locale]/(private)/module/msg/components/types.ts` — searchQuery state/action
- `src/app/[locale]/(public)/(auth)/register/register-form.tsx` — password strength indicator
- `src/actions/msg.actions.ts` — getUnreadMailCount action
- `src/components/app-sidebar/menu-item.tsx` — badge prop support
- `src/components/app-sidebar/modules-menu-items.tsx` — UnreadMailBadge on msg item
- `src/messages/uk.json`, `src/messages/en.json` — search, password strength, empty state translations

## Test Count
- Previous: 15 test files
- New: 16 test files (+password-strength-indicator)

## Verification

```bash
npm run tsc
npm run lint
npm test
```
