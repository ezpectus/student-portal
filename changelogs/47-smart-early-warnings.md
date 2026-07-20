# v2.0 — Smart Early Warnings

## Added
- `src/actions/early-warnings.actions.ts` — server action `generateEarlyWarnings()` that:
  - Fetches all students with GPA, attendance, and course grades
  - Calculates risk score (0–100) based on attendance rate (40%), GPA deficit (40%), failing courses (10% each)
  - Creates `Notification` records for students with risk score > 0
  - Notifies linked parents via `ParentStudent` relation
  - Deduplicates notifications (skips if already sent in last 24h)
  - Returns `{ warningsSent, parentsNotified }`
- "Send Warnings" button in analytics dashboard at-risk students card header
  - Calls `generateEarlyWarnings()` with toast feedback
  - Loading state on button while sending

## Translations
- `uk.json`: `private.analytics.warnings.send`, `.sent`, `.description`
- `en.json`: same keys in English

## Files Changed
- `src/actions/early-warnings.actions.ts` (new)
- `src/app/[locale]/(private)/module/analytics/components/analytics-view.tsx`
- `src/messages/uk.json`
- `src/messages/en.json`
