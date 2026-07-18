# 23 — Artifact Cleanup and Database Hardening

**Date:** 18.07.2026  
**Scope:** Generated artifacts, Prisma schema integrity, seed safety, production configuration

## Cleanup

- Removed root-level `npm-install-output.txt` and `npm-version.txt`; they were one-off command diagnostics, not project assets.
- Confirmed `public/robots.txt` is a real public asset and retained it.
- Confirmed `package-lock.json` is required and retained it.
- Confirmed no database files or runtime logs are currently tracked in the workspace.

## Database improvements

- Added `User` indexes for role, status, faculty, and last activity.
- Added `Attendance @@unique([userId, month])` to prevent duplicate monthly attendance rows.
- Added composite notification index for user/read/createdAt queries.
- Kept course rows non-unique by name because the current model has no semester dimension.
- Removed unused `path` import from the seed script.
- Added a production guard around destructive seed resets.
- Docker explicitly opts into destructive reseeding because it is a disposable demo environment.

## Security note

The production env file no longer contains the previously committed-looking KPI URL and reCAPTCHA value. Deployment secrets must be supplied through Vercel, Netlify, or Docker environment configuration.
