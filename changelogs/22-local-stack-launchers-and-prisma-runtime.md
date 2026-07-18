# 22 — Local Stack Launchers and Prisma Runtime

**Date:** 18.07.2026  
**Scope:** Local development, Docker demo runtime, Prisma configuration, documentation

## Changes

- Added `scripts/start-no-docker.bat` with separate CLI windows for:
  - Next.js frontend;
  - Prisma Studio;
  - external API health monitoring;
  - runtime information and demo credentials.
- Added Unix equivalents:
  - `scripts/start-no-docker.sh`;
  - `scripts/start-docker.sh`.
- Added Docker setup launcher: `scripts/start-docker.bat`.
- Added database setup launchers for SQLite and Neon:
  - `scripts/setup-local.bat` / `.sh`;
  - `scripts/setup-neon.bat` / `.sh`.
- Added `scripts/health-watch.cjs` because this repository consumes an external API and does not host a backend server.
- Added `prisma.config.ts` and moved `DATABASE_URL` configuration out of schema files.
- Kept SQLite and PostgreSQL schemas separate:
  - `prisma/schema.prisma`;
  - `prisma-postgres/schema.prisma`.
- Updated Docker Compose to pass `DATABASE_URL`, `JWT_SECRET`, local auth flags, PostgreSQL healthchecks, schema bootstrap, and demo seed configuration.
- Updated `Dockerfile` to generate the PostgreSQL Prisma client and include the runtime schema/entrypoint.
- Updated `README.md`, `CLAUDE.md`, `docs/saas-transformation-roadmap.md`, and `docs/high-impact-features.md`.

## Design Notes

- The project does not pretend to host an API backend: the third CLI window monitors the configured external API and clearly reports its availability.
- Prisma database access is server-only. The in-app DB Explorer exposes safe fields and never returns `passwordHash`.
- Docker startup is deterministic: PostgreSQL healthcheck → schema push → demo seed → Next.js server.

## Follow-up

- Add Vitest and Playwright smoke tests.
- Add GitHub Actions for typecheck, lint, build, and E2E checks.
- Add notification read/unread actions and session management.
