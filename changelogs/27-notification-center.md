# 27 — Notification Center

**Date:** 18.07.2026  
**Scope:** Prisma notifications, private header UX, polling, read-state mutations

## Changes

- Added `notification.actions.ts` with user-scoped list/count queries.
- Added `markNotificationRead` and `markAllNotificationsRead` using `updateMany` scoped by authenticated `userId`.
- Added `NotificationCenter` to the private header.
- Added unread badge, 15-second polling, manual refresh, mark-all-read, and empty state.
- Polling uses cancellation state and clears its interval on unmount.
- Added English and Ukrainian translations.
- Notification payload selects only safe fields and does not expose internal sender data.
- Header background now uses semantic theme tokens.

## Security contract

Notification mutations cannot mark another user's notification because every update includes both notification ID and authenticated local user ID in the `where` clause.

## Remaining

- Remote API users need a backend notification adapter if notification data should be shared with the external backend.
- Add automated tests for unread count, user isolation, polling cleanup, and mark-all-read behavior.
