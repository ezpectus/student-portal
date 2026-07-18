# Changelogs

This folder documents every fix applied during the refactoring process. Each changelog file covers a batch of related fixes with exact file paths, line numbers, before/after code, and rationale.

## Files

| File | Description |
|------|-------------|
| [01-security-p0.md](./01-security-p0.md) | P0 critical security fixes: .gitignore, cookie flags, XSS sanitization, JWT validation |
| [02-security-p1.md](./02-security-p1.md) | P1 high security fixes: fetch timeout, open redirect, CSP headers, rel=noopener |
| [03-code-quality.md](./03-code-quality.md) | Code quality fixes: toast delay, filename typo, import placement, FC type, div onClick |
| [04-architecture.md](./04-architecture.md) | Architecture fixes: notFound→redirect, setTimeout leak, loading consistency |
| [05-dead-code-cleanup.md](./05-dead-code-cleanup.md) | Dead code cleanup: contants.ts rename, useEffect deps fix, unused types.ts deletion |
| [06-code-quality-and-error-handling.md](./06-code-quality-and-error-handling.md) | Phase 3: any types, FC→direct props, error boundary UI, response.ok checks, error preservation, Suspense fallbacks, SVG config dedup |
| [07-env-validation-and-deps.md](./07-env-validation-and-deps.md) | env.ts with Zod validation, file upload timeout, removed 3 unused npm deps |
| [08-accessibility-security-react-antipatterns.md](./08-accessibility-security-react-antipatterns.md) | html lang, code-of-honor fail-safe, IP header sanitization, key={index}→stable keys (12 files), conditional GA |
| [09-race-conditions-and-error-handling.md](./09-race-conditions-and-error-handling.md) | 6 race conditions: curator-search request ID, individual.tsx cleanup, multi-select async cancel, intellect-info try/catch, certificate-verifier error state, studysheet/[id] id dep |
| [10-cookie-security-aria-labels-env-validation.md](./10-cookie-security-aria-labels-env-validation.md) | Sidebar cookie security flags, 9 icon-only button aria-labels, 30+ process.env.X! → validated env.X (18 files) |
| [11-dead-code-error-handling-cleanup.md](./11-dead-code-error-handling-cleanup.md) | Delete Storybook + 3 unused UI components, fix empty catch, standardize error handling in actions |
| [12-ssr-cache-strategy-dead-file-cleanup.md](./12-ssr-cache-strategy-dead-file-cleanup.md) | Convert studysheet/[id] to SSR, replace no-cache with ISR revalidate (300s), delete dead contants.ts + Storybook files |
| [13-loading-consistency-icon-import-consolidation.md](./13-loading-consistency-icon-import-consolidation.md) | Replace inline spinners with LoadingScreen, deduplicate IconPosition type, consolidate all SVG imports to central @/app/images index (10 files) |
| [14-ssr-studysheet-list-error-checks-dead-cache.md](./14-ssr-studysheet-list-error-checks-dead-cache.md) | Convert studysheet list to SSR, add response.ok checks to 6 profile.actions mutations, remove dead cache: no-cache from file-upload.ts |
| [15-dead-code-logging-state-antipattern.md](./15-dead-code-logging-state-antipattern.md) | Delete dead study-sheet.tsx, remove redundant console.error in 4 functions, fix useEffect state sync anti-pattern in announcements-filters |
| [16-saas-rebrand-docker-modernization.md](./16-saas-rebrand-docker-modernization.md) | Rebrand as Student Portal SaaS, rewrite README, modernize Docker with PostgreSQL, add .env.example |
| [17-de-kpi-fy-codebase.md](./17-de-kpi-fy-codebase.md) | Remove KPI ID login, 37 external redirects, rename campusFetch->apiFetch, rename cookies, clean up CSP/translations/env |
| [18-remove-kpi-urls-cleanup-logging.md](./18-remove-kpi-urls-cleanup-logging.md) | Remove hardcoded KPI URLs, rename kpi-documents->documents, remove 13 console.error calls, clean up env |
| [19-final-security-audit-fixes.md](./19-final-security-audit-fixes.md) | SEC-01 JWT validation, SEC-10 IP header sanitization, CSP KPI domain removal — 37/38 audit findings resolved |
| [20-phase2-cleanup-phase3-registration.md](./20-phase2-cleanup-phase3-registration.md) | Remove KPI pages/cards/code-of-honor, clean footer translations, add registration page with form + server action |
| [21-user-roles-landing-page.md](./21-user-roles-landing-page.md) | Add Admin role, remove codeOfHonorSignDate from User model, clean KPI menu translations, add landing page with hero/features/CTA |
| [22-local-stack-launchers-and-prisma-runtime.md](./22-local-stack-launchers-and-prisma-runtime.md) | Add Windows/Unix launchers, Docker bootstrap, Prisma config/schema split, API health logs, and documentation sync |
| [23-artifact-cleanup-and-database-hardening.md](./23-artifact-cleanup-and-database-hardening.md) | Remove command artifacts, add relational indexes/constraints, protect destructive seed, and sanitize production env placeholders |
| [24-security-memory-theme-audit.md](./24-security-memory-theme-audit.md) | Harden local JWT claims, remove user data exposure, clean PDF timers, and add light/dim/dark semantic themes |
| [25-demo-auth-database-contract-and-settings.md](./25-demo-auth-database-contract-and-settings.md) | Add optional demo credentials, document DB ownership, improve Settings preferences, and revoke photo Blob URLs |
| [26-bug-sweep-demo-flow-and-theme-consistency.md](./26-bug-sweep-demo-flow-and-theme-consistency.md) | Fix username/email login mismatch, stable keys, theme surfaces, and document verification status |
| [27-notification-center.md](./27-notification-center.md) | Add user-scoped Prisma notifications, unread badge, polling, and read-state actions |
| [28-typecheck-baseline-fixes.md](./28-typecheck-baseline-fixes.md) | Fix 24 clean-install TypeScript errors across carousel, optional URLs, effects, imports, env validation, and Radix dependencies |
| [29-school-affiliation.md](./29-school-affiliation.md) | Add School model, teacher/course linkage, registration school code, and school-scoped admin actions |
| [30-legacy-refactor-actions-and-utils.md](./30-legacy-refactor-actions-and-utils.md) | Remove redundant try/catch, fix import order, consolidate date utils, fix studysheet silent-fail |
