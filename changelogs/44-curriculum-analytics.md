# Changelog: Curriculum analytics — high failure rate courses

## Overview
Added curriculum risk analytics to the admin dashboard. The new chart surfaces courses with the highest percentage of failing grades, helping admins and teachers identify problematic courses early.

## Changes

### Analytics (`src/actions/analytics.actions.ts`)
- **New `CourseRisk` interface** — `{ courseName, totalStudents, failures, failureRate }`.
- **Added `courseRisk` field** to `AnalyticsData` and safe fallbacks.
- **Aggregated course records** by `name` from the same `prisma.course` query used for grade distribution.
- **Calculated failure rate** as the percentage of records with `grade < 60`, sorted descending, top 10.

### UI (`src/app/[locale]/(private)/module/analytics/components/analytics-view.tsx`)
- Destructured `courseRisk` from analytics data.
- Added a horizontal bar chart (`BarChart` with `layout="vertical"`) showing failure rate per course.
- Used red (`#ef4444`) bars and percentage-formatted X-axis/tooltip.

### Translations
- `src/messages/en.json` — added `private.analytics.charts.curriculum-analytics` and `private.analytics.charts.failure-rate`.
- `src/messages/uk.json` — added Ukrainian equivalents.

### Roadmap
- `docs/roadmap.md` — marked `Cohort analysis` and `Curriculum analytics` under v3.1 as completed ✅.

## Files Modified
- `src/actions/analytics.actions.ts`
- `src/app/[locale]/(private)/module/analytics/components/analytics-view.tsx`
- `src/messages/en.json`
- `src/messages/uk.json`
- `docs/roadmap.md`

## Files Created
- `changelogs/44-curriculum-analytics.md`
