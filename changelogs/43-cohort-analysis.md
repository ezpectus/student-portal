# Changelog: Cohort analysis chart in admin analytics

## Overview
Added cohort-by-study-year analysis to the admin analytics dashboard. This groups active students by `studyYear` and visualizes both the number of students per cohort and the average GPA for each cohort.

## Changes

### Analytics (`src/actions/analytics.actions.ts`)
- **New `CohortData` interface** — `{ year: number; students: number; avgGpa: number }`.
- **Added `cohorts` field** to `AnalyticsData` and safe fallbacks for admin-only access and errors.
- **Added Prisma `groupBy` query** by `studyYear` for students with `studyYear > 0`, returning `_count` and `_avg.gpa`.
- **Mapped and sorted cohorts** by ascending `studyYear` with rounded average GPA.

### UI (`src/app/[locale]/(private)/module/analytics/components/analytics-view.tsx`)
- Imported `ComposedChart` from `recharts`.
- Destructured `cohorts` from analytics data.
- Added a new chart card rendering a combined bar (`students`) and line (`avgGpa`) chart with dual Y-axes.

### Translations
- `src/messages/en.json` — added `private.analytics.charts.cohorts`: "Cohorts by Study Year".
- `src/messages/uk.json` — added `private.analytics.charts.cohorts`: "Когорти за роком навчання".

## Files Modified
- `src/actions/analytics.actions.ts`
- `src/app/[locale]/(private)/module/analytics/components/analytics-view.tsx`
- `src/messages/en.json`
- `src/messages/uk.json`

## Files Created
- `changelogs/43-cohort-analysis.md`
