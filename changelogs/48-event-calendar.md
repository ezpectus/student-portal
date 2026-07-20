# v2.1 — Event Calendar

## Added
- **Prisma model**: `Event` with fields id, title, description, startDate, endDate, location, type, schoolId, createdBy, createdAt
  - Relations: `School.events`, `User.events`
- **Server actions** (`src/actions/calendar.actions.ts`):
  - `getEvents()` — fetch events for current school, sorted by startDate
  - `createEvent()` — Zod-validated, role-restricted (TEACHER/ADMIN)
  - `updateEvent()` — Zod-validated, owner-or-admin check
  - `deleteEvent()` — owner-or-admin check
  - Cache invalidation via `revalidatePath`
- **UI components**:
  - `calendar/page.tsx` — server component, fetches events + translations
  - `calendar/loading.tsx` — skeleton loading state
  - `calendar/constants.ts` — event types (general, exam, conference, holiday, deadline) with colors
  - `calendar/components/calendar-view.tsx` — month grid with navigation, event dots, upcoming events sidebar
  - `calendar/components/calendar-form.tsx` — create/edit form with Zod validation
  - `calendar/components/event-list.tsx` — compact event list with edit buttons
- **Module registration**: added `calendar` to `MODULES` array and `getModulesForRole`
- **Menu translations**: `calendar` added to `global.modules` and `global.menu` in both locales

## Translations
- `uk.json`: `private.calendar.*` (title, upcoming, no-events, weekdays, actions, form fields, types, buttons)
- `en.json`: same keys in English

## Files Changed
- `prisma/schema.prisma` (Event model + relations)
- `src/actions/calendar.actions.ts` (new)
- `src/app/[locale]/(private)/module/calendar/` (new module, 6 files)
- `src/lib/constants/modules.ts`
- `src/actions/local-auth.actions.ts` (getModulesForRole)
- `src/messages/uk.json`
- `src/messages/en.json`
