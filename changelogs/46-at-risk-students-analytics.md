# Changelog: At-risk students analytics (predictive dropout)

## Overview
Added an at-risk students chart to the admin analytics dashboard. The risk score is a heuristic based on attendance rate, GPA, and the number of failing courses, giving admins a quick view of students likely to drop out.

## Changes

### Analytics (`src/actions/analytics.actions.ts`)
- **New `RiskStudent` interface** — `{ studentName, groupName, gpa, attendanceRate, failingCourses, riskScore }`.
- **Added `riskStudents` field** to `AnalyticsData` and safe fallbacks.
- **Added Prisma query** to fetch students with their `attendance` and `courses` records.
- **Computed risk score** per student:
  - `attendanceRisk = (1 - attendanceRate) * 40`
  - `gpaRisk = (1 - gpa / 100) * 40`
  - `courseRisk = failingCourses * 10`
  - `riskScore = min(100, round(attendanceRisk + gpaRisk + courseRisk))`
- Filtered to students with `riskScore > 0`, sorted descending, top 15.

### UI (`src/app/[locale]/(private)/module/analytics/components/analytics-view.tsx`)
- Destructured `riskStudents` from analytics data.
- Added a horizontal bar chart showing the risk score per student.

### Translations
- `src/messages/en.json` — added `private.analytics.charts.at-risk-students` and `private.analytics.charts.risk-score`.
- `src/messages/uk.json` — added Ukrainian equivalents.

### Roadmap
- `docs/roadmap.md` — updated `Predictive dropout` under v3.1 to describe the heuristic implementation and marked it completed ✅.

## Files Modified
- `src/actions/analytics.actions.ts`
- `src/app/[locale]/(private)/module/analytics/components/analytics-view.tsx`
- `src/messages/en.json`
- `src/messages/uk.json`
- `docs/roadmap.md`

## Files Created
- `changelogs/46-at-risk-students-analytics.md`
