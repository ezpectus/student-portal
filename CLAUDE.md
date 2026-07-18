# CLAUDE.md - Student Portal Project Guide

## Project Overview

Student Portal is a SaaS-oriented educational management frontend. It supports student modules, local demo authentication, Prisma-backed user management, an admin database explorer, and an optional external REST API integration.

## Tech Stack

- **Framework**: Next.js 15.5.20 (App Router with Turbopack)
- **React**: 19.2.0 with Server Components
- **Language**: TypeScript 5+ (strict mode)
- **Styling**: Tailwind CSS 4.1.10
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Forms**: React Hook Form + Zod validation
- **i18n**: next-intl (Ukrainian default, English)
- **Data**: Prisma 6.19.3 with SQLite locally and PostgreSQL/Neon in deployment
- **Auth**: bcryptjs + JWT in httpOnly cookies, with external REST API fallback
- **Backend**: External REST API is configurable; this repository does not host an API server

## Quick Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Run production server
npm run lint         # Run ESLint
npm run tsc          # Type check only
npm run db:generate  # Generate local SQLite Prisma client
npm run db:push      # Apply local schema
npm run db:seed      # Seed demo users and academic data
npm run db:studio    # Open Prisma Studio
scripts\\start-no-docker.bat # Start local windows with separate logs
scripts\\start-docker.bat    # Start Docker stack
./scripts/start-no-docker.sh  # Unix no-Docker launcher
./scripts/start-docker.sh     # Unix Docker launcher
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Locale-based routing (uk, en)
│   │   ├── (public)/      # Public routes (auth, support)
│   │   └── (private)/     # Protected routes (modules)
│   └── api/               # API routes (healthz, kpi-id)
├── actions/               # Server actions (auth, certificates, etc.)
├── components/
│   ├── ui/               # shadcn/ui components (43+)
│   └── typography/       # Text components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities & constants
├── middleware/           # Auth & i18n middleware
├── types/                # TypeScript types & enums
├── messages/             # Translation files (en.json, uk.json)
└── i18n/                 # i18n configuration
```

## Code Style

- **ESLint**: Next.js + Prettier config
- **Prettier**: Single quotes, trailing commas, 120 print width, Tailwind plugin
- **Imports**: Sorted with eslint-plugin-simple-import-sort
- **Path alias**: `@/*` maps to `./src/*`

## TypeScript Configuration

Strict mode enabled with:
- `noUnusedLocals`, `noUnusedParameters`
- `noImplicitReturns`, `strictNullChecks`
- `noFallthroughCasesInSwitch`

## Key Patterns

### Server Actions
```typescript
'use server';
// Actions in src/actions/*.actions.ts
```

### API Client
```typescript
import { apiFetch } from '@/lib/client';
// Automatically injects the configured auth token from cookies
```

### Translations
- Files: `src/messages/{uk,en}.json`
- Supported tags: `<p>`, `<br/>`, `<h1-h6>`, `<ul>`, `<li>`, `<tel>`, `<email>`

### SVG Imports
```typescript
import Icon from './icon.svg';        // As React component
import iconUrl from './icon.svg?url'; // As URL string
```

## Environment Variables

Required in `.env.development` / `.env.production`:
- `API_BASE_URL` - Optional external REST API URL
- `DATABASE_URL` - SQLite or Neon PostgreSQL connection string
- `JWT_SECRET` - Secret for local demo JWTs
- `NEXT_PUBLIC_LOCAL_AUTH` - Enables Prisma-backed local auth
- `MAIN_COOKIE_DOMAIN`, `ROOT_COOKIE_DOMAIN` - Cookie domains
- `NEXT_PUBLIC_RECAPTCHA_KEY` - Optional password-reset reCAPTCHA key

## Authentication

- JWT stored in cookies
- Middleware handles auth checks (`src/middleware/`)
- Multiple account types: student, lecturer, curator, admin
- Code of honor acceptance required for new users

## Locales

- Default: Ukrainian (uk)
- Supported: English (en)
- URL pattern: `/{locale}/...`

## Deployment

- Docker multi-stage build (Node 22-alpine)
- Standalone Next.js output
- PostgreSQL service with healthcheck in Docker Compose
- Local no-Docker launchers for Windows and Unix shells

## Quality and Testing

The anti-pattern checklist and current risks are tracked in `docs/engineering-quality-baseline.md`. TypeScript and lint scripts are configured. Automated Vitest/Playwright coverage is still planned.

## Useful Paths

- Components: `src/components/ui/`
- Server actions: `src/actions/`
- Types/Enums: `src/types/`
- Translations: `src/messages/`
- Middleware: `src/middleware/`
