# v2.1 — Weekly Digest Emails

## Added
- **`weekly-digest.actions.ts`**:
  - `generateWeeklyDigests()` — queries all parents, collects GPA, attendance, course count, low grade count for each child
  - `sendWeeklyDigestNotifications()` — creates `Notification` records for each parent with weekly summary
  - Safe defaults: returns `{ digests: [], totalParents: 0 }` on error
- **Cron API route** at `/api/cron/weekly-digest`:
  - `GET` endpoint authenticated via `Bearer ${CRON_SECRET}` header
  - Calls `sendWeeklyDigestNotifications()`
  - Returns `{ status, digestsSent }` JSON
  - `force-dynamic`, `maxDuration = 120`

## Files Changed
- `src/actions/weekly-digest.actions.ts` (new)
- `src/app/api/cron/weekly-digest/route.ts` (new)
