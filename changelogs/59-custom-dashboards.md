# v3.1 — Custom Dashboards (Drag-and-Drop Builder)

## Added
- **`custom-dashboard.tsx`** — main dashboard builder component:
  - Edit mode toggle via `<Switch>`
  - Widget visibility toggles (show/hide individual widgets)
  - HTML5 drag-and-drop reordering of visible widgets
  - Save layout to `localStorage` via `useLocalStorage` hook
  - Reset to default layout button
  - Toast notifications on save/reset
- **`dashboard-widget.tsx`** — renders individual widgets by ID:
  - 10 widget types: metrics, user-activity, role-distribution, registrations, faculty-distribution, grade-distribution, cohorts, curriculum-analytics, teacher-effectiveness, at-risk-students
  - Each widget renders its own `<Card>` with chart from recharts
  - Extracted from `analytics-view.tsx` to enable per-widget rendering
- **`analytics-view.tsx`** — simplified to delegate to `<CustomDashboard>`

## Translations
- Added `dashboard.*` keys to both `uk.json` and `en.json`:
  - `edit-mode`, `widgets`, `reset`, `saved`
  - `widget-titles.*` for all 10 widget names

## Files Changed
- `src/app/[locale]/(private)/module/analytics/components/custom-dashboard.tsx` (new)
- `src/app/[locale]/(private)/module/analytics/components/dashboard-widget.tsx` (new)
- `src/app/[locale]/(private)/module/analytics/components/analytics-view.tsx` (simplified)
- `src/messages/uk.json` (dashboard translations)
- `src/messages/en.json` (dashboard translations)
