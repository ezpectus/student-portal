# v3.2 — Announcement Scheduling

## Added
- **`scheduledAt` field** in announcement form:
  - `datetime-local` input in announcement form UI
  - Zod-validated in `schema.ts` (optional, must be valid ISO date if provided)
  - Mapped in `toAnnouncementCreate()` — empty string becomes `null`
  - Added to `AnnouncementCreateData` type
  - Added to `announcementCreateSchema` in `announcement.actions.ts`
- **Cron API route** at `/api/cron/publish-scheduled`:
  - `GET` endpoint authenticated via `Bearer ${CRON_SECRET}` header
  - Fetches admin announcements, filters by `scheduledAt <= now` and `!isPublished`
  - Calls `PATCH announcements/:id/publish` via `apiFetch` for each due announcement
  - Revalidates `ANNOUNCEMENTS_CACHE_TAG` on success
  - Returns `{ status, published, checked }` JSON
  - `force-dynamic`, `maxDuration = 60`
- **Type updates**:
  - `Announcement` interface: added `scheduledAt?: string | null` and `isPublished?: boolean`

## Translations
- `uk.json`: `private.announcementseditor.form.fields.scheduledAt`
- `en.json`: same key in English

## Environment
- Requires `CRON_SECRET` env variable for cron route authentication

## Files Changed
- `src/app/[locale]/(private)/module/announcementseditor/types.ts`
- `src/app/[locale]/(private)/module/announcementseditor/components/schema.ts`
- `src/app/[locale]/(private)/module/announcementseditor/components/announcement-form.tsx`
- `src/actions/announcement.actions.ts`
- `src/types/models/announcement.ts`
- `src/app/api/cron/publish-scheduled/route.ts` (new)
- `src/messages/uk.json`
- `src/messages/en.json`
