# Changelog: Teacher effectiveness analytics

## Overview
Added teacher effectiveness analysis to the admin analytics dashboard. The chart ranks teachers by average course grade and failure rate, giving admins a quick view of which teachers may need support.

## Changes

### Analytics (`src/actions/analytics.actions.ts`)
- **New `TeacherEffectiveness` interface** — `{ teacherName, courseCount, avgGrade, failureRate, failures, students }`.
- **Added `teacherEffectiveness` field** to `AnalyticsData` and safe fallbacks.
- **Added Prisma query** to fetch teachers with their `taughtCourses` grades.
- **Computed metrics** per teacher: course count, average grade, failure count, failure rate, filtered to teachers with at least one course, sorted by failure rate then average grade, top 10.

### UI (`src/app/[locale]/(private)/module/analytics/components/analytics-view.tsx`)
- Destructured `teacherEffectiveness` from analytics data.
- Added a horizontal bar chart (`BarChart` with `layout="vertical"`) comparing average grade and failure rate per teacher.

### Translations
- `src/messages/en.json` — added `private.analytics.charts.teacher-effectiveness` and `private.analytics.charts.avg-grade`.
- `src/messages/uk.json` — added Ukrainian equivalents.

### Roadmap
- `docs/roadmap.md` — marked `Teacher effectiveness` under v3.1 as completed ✅.

## Files Modified
- `src/actions/analytics.actions.ts`
- `src/app/[locale]/(private)/module/analytics/components/analytics-view.tsx`
- `src/messages/en.json`
- `src/messages/uk.json`
- `docs/roadmap.md`

## Files Created
- `changelogs/45-teacher-effectiveness-analytics.md`
