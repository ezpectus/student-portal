# Changelog: Teacher Grading Module, Architecture & Documentation

## Summary

Added Teacher Grade Book module, expanded cache tags to dashboard and admin actions, polished empty states across all tables, updated PWA manifest, and created project roadmap.

## New Features

### Teacher Grade Book (`module/grading/`)
- **Server actions** (`src/actions/grading.actions.ts`):
  - `getTeacherCourses()` — returns courses grouped by name with student count
  - `getCourseStudents(courseName)` — returns students enrolled in a course
  - `updateGrade({ courseId, grade })` — updates grade with Zod validation, audit log, and cache tag revalidation
- **UI components**:
  - `grading-view.tsx` — course selector dropdown with empty state
  - `grading-table.tsx` — inline editable grade table with save/cancel, toast notifications
- **Sidebar**: grading menu item visible only to TEACHER role
- **Module registration**: added to `MODULES` constant and `getModulesForRole()` for TEACHER and ADMIN
- **Translations**: full uk.json and en.json for all grading strings

## Architecture Improvements

### Cache Tags
- Added `DASHBOARD_CACHE_TAG` and `ADMIN_CACHE_TAG` to `src/lib/constants/cache-tags.ts`
- `getDashboardData` wrapped with `unstable_cache` (60s revalidate, `DASHBOARD_CACHE_TAG`)
- `updateGrade` revalidates both `RATING_CACHE_TAG` and `DASHBOARD_CACHE_TAG`
- `deleteUser` and `updateUserStatus` in admin actions now call `revalidateTag(ADMIN_CACHE_TAG)`

### Empty State Polish
- `admin-table.tsx`: replaced plain text with `<EmptyState icon={<Users />}>`
- `announcements-table.tsx`: replaced plain text with `<EmptyState icon={<Megaphone />}>`

## PWA
- Updated `site.webmanifest`: branded as "Student Portal", added description, orientation, start_url, theme_color matching app

## Documentation
- `docs/roadmap.md`: full feature roadmap (v2.0–v3.2) covering AI predictions, parent portal, mobile app, LMS integration, webhooks, multi-tenant, enterprise features
- `README.md`: updated with Grade Book feature, testing status (Vitest + Playwright), expanded security section, test commands, roadmap link

## Files Modified
- `src/actions/grading.actions.ts` — NEW
- `src/app/[locale]/(private)/module/grading/page.tsx` — NEW
- `src/app/[locale]/(private)/module/grading/components/grading-view.tsx` — NEW
- `src/app/[locale]/(private)/module/grading/components/grading-table.tsx` — NEW
- `src/actions/dashboard.actions.ts` — MODIFIED (unstable_cache)
- `src/actions/admin.actions.ts` — MODIFIED (revalidateTag)
- `src/actions/local-auth.actions.ts` — MODIFIED (grading module for teacher)
- `src/lib/constants/modules.ts` — MODIFIED (added grading)
- `src/lib/constants/cache-tags.ts` — MODIFIED (2 new tags)
- `src/components/app-sidebar/app-sidebar.tsx` — MODIFIED (teacher grading menu)
- `src/app/[locale]/(private)/module/admin/components/admin-table.tsx` — MODIFIED (EmptyState)
- `src/app/[locale]/(private)/module/announcementseditor/components/announcements-table/announcements-table.tsx` — MODIFIED (EmptyState)
- `src/messages/uk.json` — MODIFIED (grading translations)
- `src/messages/en.json` — MODIFIED (grading translations)
- `public/site.webmanifest` — MODIFIED (PWA branding)
- `docs/roadmap.md` — NEW
- `README.md` — MODIFIED (features, security, testing, roadmap)

## Verification
```bash
npm run tsc
npm run lint
npm test
```
