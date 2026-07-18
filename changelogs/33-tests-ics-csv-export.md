# Changelog 33 — Security Tests, ICS Export, Dashboard CSV Export

**Date:** 18.07.2026

## Testing

### JWT Security Tests (`jwt.test.ts`)
- 10 test cases covering `getJWTPayload` and `getVerifiedLocalJWTPayload`
- Tests: valid token decode, default modules, invalid token, missing exp, wrong modules type
- Verification tests: correct secret, wrong secret, wrong issuer, expired token, missing JWT_SECRET
- Covers all critical JWT security paths

### Env Schema Tests (`env.test.ts`)
- 5 test cases covering Zod env validation
- Tests: default values, invalid URL rejection, valid config acceptance, optional URL validation, NODE_ENV default
- Uses `vi.stubEnv` for clean env manipulation

### ICS Export Tests (`ics-export.test.ts`)
- 6 test cases covering `generateIcsCalendar`
- Tests: valid ICS structure, UTC date format, optional fields, special character escaping, multiple events, CRLF line endings

## New Features

### ICS Calendar Export Utility
- **New utility:** `src/lib/utils/ics-export.ts` — generates RFC 5545 compliant ICS calendars
- `generateIcsCalendar(events)` — pure function, no side effects
- `downloadIcsCalendar(filename, events)` — triggers browser download
- Supports event title, description, location, start/end dates
- Proper UTC date formatting, text escaping, CRLF line endings

### Dashboard CSV Export
- GPA Trend chart — "Export" button downloads CSV with semester + GPA data
- Attendance chart — "Export" button downloads CSV with month + attended/missed data
- Uses existing `exportToCsv` utility
- **Translations:** UK/EN `dashboard.export`

## Files Created
- `src/lib/jwt.test.ts`
- `src/lib/env.test.ts`
- `src/lib/utils/ics-export.ts`
- `src/lib/utils/ics-export.test.ts`

## Files Modified
- `src/app/[locale]/(private)/components/dashboard-charts.tsx` — CSV export buttons
- `src/messages/uk.json`, `src/messages/en.json` — export translation key

## Test Count
- Previous: 12 test files
- New: 15 test files (+jwt, +env, +ics-export)

## Verification

```bash
npm run tsc
npm run lint
npm test
```
