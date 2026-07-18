# Changelog: Grade Types, i18n, Data Export, Documentation

## Summary

Added grade type support (NUMERIC/LETTER/ECTS) with audit trail, expanded command palette, CSV data export, Polish and German locale support, CI security audit, and comprehensive documentation.

## Block 2 — Teacher Module Enhancement

### Grade Type Support
- **Prisma schema**: Added `gradeType` field to `Course` model (default: `NUMERIC`)
- **GradeHistory model**: New model tracking all grade changes (oldGrade, newGrade, gradeType, changedBy, createdAt)
- **`src/lib/grade-utils.ts`**: Conversion helpers between NUMERIC/LETTER/ECTS, display functions
- **`grading-table.tsx`**: Grade type selector dropdown (0–100 / A–F / ECTS), display via `displayGrade()`
- **`grading.actions.ts`**: `updateGrade` now accepts `gradeType`, creates `GradeHistory` entry, `getGradeHistory()` action
- **Translations**: `grade-type` key added to uk.json and en.json

## Block 3 — UX Polish

### Command Palette Expansion
- Added 4 new commands: Grade Book, Certificates, Directory, Contacts
- New lucide-react icons: `GraduationCap`, `FileText`, `Contact`, `Users`
- Translation keys added for all new commands in uk.json and en.json
- Profile completion indicator: already implemented (`profile-completion-card.tsx`)
- Onboarding wizard: already multi-step with progress bar

## Block 4 — Architecture

### Feature Toggles
- Added `grading` to `FeatureName` union type and `DEFAULT_TOGGLES`

### Health Check Enhancement
- `/api/ready` now returns `version` and `uptime` in response body
- Circuit breaker verified: 3-state machine (closed → open → half-open), integrated in `client.ts`

## Block 5 — Future-Ready Features

### CSV Data Export
- **`src/lib/csv-export.ts`**: Generic `toCsv()` and `csvResponse()` helpers
- **`/api/export` route**: Exports grades (`?type=grades`) or attendance (`?type=attendance`) as CSV
- **`ExportButtons` component**: Download buttons on dashboard
- **Translations**: `export-grades` and `export-attendance` keys in uk.json and en.json

### Internationalization — Polish and German
- Added `pl` and `de` to `LOCALE` enum, `LOCALES` array, middleware matcher
- Created `src/messages/pl.json` and `src/messages/de.json` (based on en.json with key translations)
- Updated `locale-switch.tsx` to cycle through 4 locales (UK → EN → PL → DE)
- Updated `authentication.middleware.ts` `isLocaleRoot` to recognize all 4 locales

## Block 6 — Documentation & Deploy

### CI Security Audit
- Added `npm audit --audit-level=high` step to GitHub Actions workflow (non-blocking)

### Documentation
- **`docs/api-documentation.md`**: Full API reference — health checks, export routes, server actions, error types, cache tags, feature toggles
- **`docs/docker-production-checklist.md`**: Pre-deployment checklist — image security, network, database, env vars, compose config, pre/post-deploy verification
- **`docs/roadmap.md`**: Already created in prior session (v2.0–v3.2 roadmap)

## Files

### New
- `src/lib/grade-utils.ts` — Grade type conversion and display helpers
- `src/lib/csv-export.ts` — CSV export utility
- `src/app/api/export/route.ts` — CSV export API route
- `src/app/[locale]/(private)/components/export-buttons.tsx` — Export buttons component
- `src/messages/pl.json` — Polish translations
- `src/messages/de.json` — German translations
- `docs/api-documentation.md` — API documentation
- `docs/docker-production-checklist.md` — Docker production checklist

### Modified
- `prisma/schema.prisma` — Added `gradeType` to Course, `GradeHistory` model, `gradeChanges` to User
- `src/actions/grading.actions.ts` — Grade type support, GradeHistory creation, `getGradeHistory()`
- `src/app/[locale]/(private)/module/grading/components/grading-table.tsx` — Grade type selector
- `src/components/command-palette/command-palette.tsx` — 4 new commands
- `src/lib/features.ts` — Added `grading` feature toggle
- `src/app/api/ready/route.ts` — Version and uptime in response
- `src/i18n/routing.ts` — Added PL and DE locales
- `src/middleware.ts` — Updated matcher for 4 locales
- `src/middleware/authentication.middleware.ts` — Updated `isLocaleRoot` for 4 locales
- `src/components/ui/locale-switch.tsx` — 4-locale cycle switch
- `src/app/[locale]/(private)/page.tsx` — ExportButtons on dashboard
- `src/messages/uk.json` — Export and grade-type translations
- `src/messages/en.json` — Export and grade-type translations
- `.github/workflows/build.yml` — Security audit step
- `README.md` — Updated in prior session

## Verification
```bash
npm run tsc
npm run lint
npm test
```
