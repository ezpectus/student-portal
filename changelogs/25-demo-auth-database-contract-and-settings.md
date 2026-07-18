# 25 — Demo Auth, Database Ownership, and Settings UX

**Date:** 18.07.2026  
**Scope:** Demo review flow, deployment architecture, settings, browser resource cleanup

## Changes

- Added optional `DemoCredentials` panel for Admin, Teacher, and Student test accounts.
- Demo account shortcuts fill the login form without auto-submitting credentials.
- Demo credentials are disabled by default and enabled only with `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true`.
- Documented the deployment contract:
  - standalone demo may use Prisma `DATABASE_URL` from Next server actions;
  - production backend must own its database;
  - frontend consumes backend through `API_BASE_URL`.
- Added a Preferences section to Settings with language switch and light/dim/dark theme control.
- Revoked photo preview Blob URLs on replacement/unmount.
- Added English and Ukrainian translations for demo credentials and settings preferences.

## Security boundary

Test credentials are presentation-only demo data. They must not be enabled on an authenticated production environment, and production database secrets must be configured in the deployment provider rather than committed files.
