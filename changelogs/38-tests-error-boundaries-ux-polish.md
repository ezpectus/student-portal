# Changelog 38 — Tests, Error Boundaries, UX Polish, Config Updates

**Date:** 18.07.2026

## 1. Tests (high priority)

### Password Strength Indicator Tests
- Exported `calculateStrength` from `password-strength-indicator.tsx` for direct testing
- Added 13 test cases for calculation logic:
  - Empty string → empty/0
  - Length thresholds (>=8, >=12)
  - Uppercase, lowercase, digits, special characters each award points
  - Level boundaries: weak (≤2), fair (3), good (4), strong (≥5)
  - Max score = 6 for all criteria met
- Existing 5 render tests preserved

### Audit Actions Tests (`audit.actions.test.ts`)
- 6 test cases covering `getAuditLogs` and `logAuditEvent`:
  - Non-logged-in user → empty result / no-op
  - Non-admin user → empty result
  - Admin user → paginated fetch with correct skip/take
  - Page 2 skip calculation
  - Audit log creation with correct data shape
  - Metadata JSON serialization

### E2E Tests (Playwright)
- Added `@playwright/test` dependency
- Created `playwright.config.ts` with Chromium project, auto-start dev server
- 3 E2E spec files:
  - `auth.spec.ts` — login page elements, valid login redirect, invalid login error
  - `grades.spec.ts` — rating page table load, column headers
  - `messages.spec.ts` — inbox table, `/` keyboard shortcut focus, search filtering
- Added `test:e2e` and `test:e2e:ui` scripts to package.json
- Updated tsconfig.json to exclude e2e/ from type checking
- Updated .gitignore for Playwright output directories

## 2. UX Features (medium priority)

### Empty States with Icons
- Replaced plain `<p>` empty states with `<EmptyState>` component:
  - `history-table.tsx` — FileText icon
  - `all-docs-table.tsx` — FileText icon
  - `disciplines-table.tsx` — BookOpen icon

### Toast Notifications Polish
- Increased `TOAST_LIMIT` from 1 → 3 (multiple toasts visible simultaneously)
- Added `successToast(title, description?)` and `errorToast(title, description?)` helpers

### Mobile-Responsive Audit
- Verified all key pages use proper responsive patterns:
  - Dashboard: `grid-cols-2 lg:grid-cols-4`, `col-span-full xl:col-span-8`
  - Tables: `overflow-auto` wrapper in Table component
  - Charts: `ResponsiveContainer width="100%"`
  - No fixed-width issues found — all constraints use `max-w` not `w`

## 3. Architecture (medium priority)

### Per-Module Error Boundaries
- Created `module/error.tsx` — catches errors for all module pages with retry button
- Created `settings/error.tsx` — settings-specific error boundary
- Created `profile/error.tsx` — profile-specific error boundary
- All use `global.error` translations (title, description, retry)
- All trigger `useServerErrorToast()` on mount

## 4. Config & Docker Updates

### Docker
- Removed `--accept-data-loss` flag from `docker-entrypoint.sh` (dangerous for production)

### CI Workflow
- Updated `.github/workflows/build.yml`:
  - Added Prisma generate step
  - Added lint, type-check, test steps before build
  - Renamed workflow to "CI — Build, Lint, Test"

### Package.json
- Added `"author": "Ezpectus (Denys Stepanenko)"`, `"license": "MIT"`
- Added `test:coverage` script
- Added `@playwright/test` dev dependency

### License
- Rewritten: Copyright (c) 2026 Ezpectus (Denys Stepanenko)
- Acknowledges KPI as original source, emphasizes independent rebuild

### README
- Added GitHub profile link: [@Ezpectus](https://github.com/Ezpectus)
- Updated license section to reference MIT LICENSE file

### .gitignore
- Added `_*.cjs`, `_*-out.txt` for temporary scripts
- Added Playwright output directories

## 5. Cleanup

### Storybook Removal
- Removed `.storybook/` directory — no stories existed, no Storybook deps in package.json
- Dead config from original KPI codebase

### Landing Page Routing
- Unauthenticated users hitting `/uk` (root) now redirect to `/uk/landing` instead of `/uk/login`
- Authenticated users hitting `/uk` still see the dashboard (via `(private)/page.tsx`)
- Added `isLocaleRoot()` + `gotoLanding()` to `authentication.middleware.ts`
- No new page conflicts — middleware handles redirect before Next.js routing

### E2E Test Selectors (coding-skills: end-to-end-testing)
- Added `data-testid` attributes to login form (`login-username`, `login-password`, `login-submit`)
- Added `data-testid="msg-search"` to message search input
- Updated all 3 E2E spec files to use `getByTestId()` instead of fragile CSS selectors
- Follows Playwright best practice: stable selectors over CSS classes

## Files Modified/Created
- `src/components/auth/password-strength-indicator.tsx` — exported calculateStrength
- `src/components/auth/password-strength-indicator.test.tsx` — 13 new calculation tests
- `src/actions/audit.actions.test.ts` — NEW, 6 tests
- `e2e/auth.spec.ts` — NEW
- `e2e/grades.spec.ts` — NEW
- `e2e/messages.spec.ts` — NEW
- `playwright.config.ts` — NEW
- `src/app/[locale]/(private)/module/error.tsx` — NEW
- `src/app/[locale]/(private)/settings/error.tsx` — NEW
- `src/app/[locale]/(private)/profile/error.tsx` — NEW
- `src/app/[locale]/(private)/module/certificates/components/history-table.tsx` — EmptyState
- `src/app/[locale]/(private)/module/facultycertificate/components/all-docs-table.tsx` — EmptyState
- `src/app/[locale]/(private)/module/studysheet/components/disciplines-table.tsx` — EmptyState
- `src/hooks/use-toast.ts` — TOAST_LIMIT=3, successToast/errorToast helpers
- `src/app/[locale]/(public)/(auth)/login/credentials-login.tsx` — data-testid attributes
- `src/app/[locale]/(private)/module/msg/components/inbox.tsx` — data-testid on search
- `scripts/docker-entrypoint.sh` — removed --accept-data-loss
- `.github/workflows/build.yml` — lint+tsc+test steps
- `package.json` — author, license, test scripts, Playwright dep
- `LICENSE` — rewritten
- `README.md` — author link, license section
- `.gitignore` — _*.cjs, Playwright outputs
- `tsconfig.json` — exclude e2e/
- `docs/engineering-quality-baseline.md` — updated test status
- `.storybook/` — REMOVED (dead config)
- `src/middleware/authentication.middleware.ts` — landing redirect for unauthenticated root
- `src/middleware/constants.ts` — reverted PUBLIC_PATHS (root handled in middleware)
- `scripts/install.bat` — now installs deps + Prisma generate + Playwright browsers
- `scripts/test.bat` — now runs tsc + lint + unit tests + E2E in sequence
- `scripts/start-no-docker.bat` — auto-installs Playwright browsers if missing
- `scripts/setup-local.bat` — added Playwright browser install step

## Verification

```bash
npm install              # install @playwright/test
npx playwright install   # install browser binaries
npm run tsc
npm run lint
npm test
npm run test:e2e         # requires dev server or auto-starts one
```
