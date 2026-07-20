# Student Portal — Modern Student Management Platform

A production-grade SaaS web application for educational institutions. Built with Next.js 15, React 19, Prisma 7 ORM, and TypeScript. Features grades management, messaging, announcements, certificates, profiles, user registration, admin panel with user management, in-app database viewer, parent portal, analytics dashboard with charts, and a marketing landing page. Dockerized, multi-tenant ready, and fully typed.

---

## Features

### Student
- **Grades & Academic Performance** — view grades by semester, GPA, credit modules, attestation results
- **Schedule** — weekly timetable with course, room, and teacher info
- **Messages** — send and receive messages with faculty, groups, and individual students
- **Certificates** — request official documents, track status, download PDF
- **Profile** — manage contacts, bio, avatar, and account settings
- **Announcements** — institution-wide and course-level notices
- **Directory** — search faculty and staff by name, department, or contact type

### Faculty / Staff
- **Grade Book** — select course, view enrolled students, edit grades inline with audit trail
- **Certificate Management** — approve, reject, sign, and process student certificate requests
- **Announcement Editor** — create, edit, and publish announcements with audience targeting
- **Student Directory** — search and view student contact information

### Admin Panel
- **User Management** — view, filter, search, and delete users (120+ seeded)
- **User Detail View** — full profile with courses, grades, attendance, contact info
- **Statistics Dashboard** — total users, active students, average GPA at a glance
- **Analytics Dashboard** — user activity charts, role distribution pie chart, monthly registrations, faculty breakdown, grade distribution (Recharts)
- **Role-Based Access** — admin-only sidebar entry, role-aware filtering
- **Database Viewer** — browse all tables (users, courses, attendance, notifications) in-app
- **Audit Logs** — all admin and grade mutations logged with user, action, metadata, IP

### Parent Portal
- **Child Overview** — cards showing each linked child with photo, GPA, faculty, study year
- **Grades Detail** — full course list with grades, credits, teacher names, grade type (numeric/letter/ECTS)
- **Attendance Chart** — monthly attendance bar chart with present/total breakdown
- **Read-Only Access** — parents see child's academic data without edit permissions

### Authentication
- **Local Auth System** — Prisma-backed registration and login with JWT
- **Role Selection** — register as Student or Teacher
- **School Affiliation** — registration requires a school code; users, courses, and admin data are scoped to that school
- **Teacher/Course Linkage** — courses are tied to both a school and a teacher
- **Test Users** — pre-seeded admin, teacher, student, and parent accounts for instant demo
- **Demo Shortcuts** — optional role buttons on login/register when `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true`
- **Remote API Fallback** — seamlessly falls back to external API when local auth is disabled
- **Rate Limiting** — login (10 per 15min) and password reset (5 per 15min) throttled to prevent brute-force attacks

### Platform
- **Authentication** — JWT-based with httpOnly cookies, middleware route protection, user registration
- **Database** — Prisma 7 ORM with SQLite (dev) / Neon Postgres (prod), driver adapters
- **Multi-locale** — Ukrainian (default) and English, extensible to any locale
- **Server-Side Rendering** — all pages SSR with ISR caching (5-min revalidate)
- **Security** — CSP headers, HSTS, cookie security flags, CSRF protection (middleware + server-side validation), env validation (Zod), URL allow-listing
- **Responsive** — mobile-first design with TailwindCSS, works on all breakpoints
- **Accessible** — ARIA labels, keyboard navigation, semantic HTML
- **Dark Mode** — theme toggle with TailwindCSS dark: variants and localStorage persistence
- **Command Palette** — Cmd+K global search and navigation

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack, Server Components) |
| UI | React 19, TailwindCSS 4, Radix UI primitives |
| Language | TypeScript 5.9 (strict mode) |
| Database | Prisma 7 ORM + SQLite (dev) / Neon Postgres (prod) |
| Auth | bcryptjs password hashing + JWT in httpOnly cookies |
| Security | CSRF protection (double-submit cookie + Origin validation), school-scoped data isolation, audit logging |
| Forms | React Hook Form 7 + Zod 4 validation |
| i18n | next-intl (Ukrainian / English) |
| Charts | Recharts 3 (dashboard analytics) |
| Icons | Lucide React + centralized SVG index (@svgr/webpack) |
| Deploy | Vercel / Netlify / Docker multi-stage (node:22-alpine) |
| Testing | Vitest (unit), Playwright (E2E) |

---

## Test Credentials

The database is pre-seeded with four test accounts. Use these to log in immediately:

| Role | Username | Password | School code | Access |
|------|----------|----------|---------------|--------|
| Admin | `admin` | `test12345` | `demo` | Admin Panel, Analytics Dashboard, all modules |
| Teacher | `teacher` | `test12345` | `demo` | Modules, student directory, grade book |
| Student | `student` | `test12345` | `demo` | Grades, schedule, messages, certificates |
| Parent | `parent` | `test12345` | `demo` | Parent Portal — view child's grades & attendance |

> 120 additional students and teachers are also seeded under the `demo` school.

---

## Quick Start

### Prerequisites

- Node.js 22+
- npm 10+

### Development

```bash
# Clone the repo
git clone https://github.com/yourusername/student-portal.git
cd student-portal

# Copy environment file
cp .env.example .env.development

# Install dependencies
npm install

# Set up the local SQLite database
npm run db:generate
npm run db:push
npm run db:seed

# Start dev server
npm run dev

# Or use one-click Windows launcher
scripts\\start-no-docker.bat
```

Open [http://localhost:3000](http://localhost:3000)

Log in with any test account from the table above.

### Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:push` | Create/update SQLite database schema |
| `npm run db:seed` | Seed database with demo school, 120+ users, courses, attendance |
| `npm run db:studio` | Open Prisma Studio (visual DB browser at localhost:5555) |
| `npm run db:generate` | Regenerate Prisma client for local SQLite |
| `npm run db:push:postgres` | Apply the PostgreSQL schema to Neon |
| `npm run db:generate:postgres` | Generate Prisma client from the Neon schema |
| `npm run build:postgres` | Generate PostgreSQL client and build production app |
| `npm run health` | Monitor the configured external API in a log window |
| `scripts\\start-no-docker.bat` | Start frontend, Prisma Studio, API health, and info windows |
| `scripts\\start-docker.bat` | Build/start Next.js + PostgreSQL with Compose |
| `scripts/setup-local.bat` | Install, generate, push, and seed SQLite |
| `scripts/setup-neon.bat` | Generate, push, and seed Neon PostgreSQL |
| `/module/admin` | Admin-only panel with database explorer |

---

## Deployment

### Deployment Modes

| Mode | `NEXT_PUBLIC_LOCAL_AUTH` | `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS` | Purpose |
|------|--------------------------|--------------------------------------|---------|
| **Local dev** | `true` | `true` | Development — demo buttons + registration |
| **Portfolio demo** | `true` | `true` | Deployed demo — visitors can try demo accounts and register their own |
| **Production** | `false` | `false` | Real deployment — external API auth, no demo buttons |

> The repo ships with `.env.development` (local dev) and `.env.production` (portfolio demo) pre-configured. Switch `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false` and `NEXT_PUBLIC_LOCAL_AUTH=false` for a real production deployment.

### Vercel (Recommended)

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add environment variables (see `.env.example`):
   - `DATABASE_URL` — Neon Postgres connection string
   - `JWT_SECRET` — random 32+ char string
   - `NEXT_PUBLIC_LOCAL_AUTH=true`
   - `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true` — show demo buttons (set `false` for real production)
   - `API_BASE_URL` — your API URL (or keep default)
4. Run `npm run db:push:postgres` against Neon (or configure it as the Vercel build step)
5. Deploy — Vercel auto-detects Next.js

The production schema is kept in `prisma-postgres/schema.prisma`; the local schema remains in `prisma/schema.prisma` for SQLite.

```bash
# Configure DATABASE_URL to Neon first
npm run db:generate:postgres
npm run db:push:postgres
npm run db:seed
```

### Netlify

1. Push your repo to GitHub
2. Go to [netlify.com](https://netlify.com) and import the repo
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add the same environment variables as Vercel
6. Install the Next.js Runtime plugin (Netlify auto-detects it)

### Docker

```bash
# Windows one-click launcher
scripts\\start-docker.bat

# Linux/macOS launcher
chmod +x scripts/*.sh
./scripts/start-docker.sh

# Or run directly
docker compose up --build
```

The Compose stack starts PostgreSQL first, applies `prisma-postgres/schema.prisma`, seeds the demo users, and then starts Next.js. The database volume is persisted as `pgdata`.

### No-Docker logs

`scripts/start-no-docker.bat` opens four CLI windows:

1. **Frontend** — Next.js/Turbopack logs at `http://localhost:3000`
2. **Database** — Prisma Studio at `http://localhost:5555`
3. **Backend/API** — health-watch logs for `API_BASE_URL`; this repository uses an external API rather than hosting its own backend
4. **Info** — URLs, test credentials, and runtime hints

---

## Database Ownership Contract

The database is not bundled into the browser frontend. There are two supported deployment modes:

- **Standalone demo:** Next.js Server Actions own the Prisma connection through `DATABASE_URL`; SQLite is used locally and Neon PostgreSQL is used for a public demo.
- **Production split:** the backend owns its own database and migrations; the frontend only receives `API_BASE_URL` and calls the backend. Do not expose backend `DATABASE_URL` to browser code.

The frontend repository contains both local and PostgreSQL Prisma schemas only to support the standalone demo and database viewer. They are not a replacement for a production backend data boundary.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  React 19 Server Components + Client Components          │
│  TailwindCSS + Radix UI                                  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              Next.js 15 (App Router)                     │
│                                                         │
│  Middleware          │  Server Components (SSR/ISR)     │
│  - Auth check        │  - Data fetching via Server      │
│  - i18n routing      │    Actions (Prisma / apiFetch)   │
│  - Route protection  │  - ISR cache (revalidate: 300s)  │
│                      │  - Metadata generation           │
└──────────┬───────────┴──────────────┬───────────────────┘
           │                          │
┌──────────▼──────────┐  ┌───────────▼───────────────────┐
│   Prisma ORM        │  │   REST API (Backend)          │
│   - SQLite (dev)    │  │   ASP.NET Core / External     │
│   - Neon (prod)     │  │   - JWT authentication        │
│   - User, Course,   │  │   - User, Course endpoints    │
│     School, etc.    │  └───────────────────────────────┘
└─────────────────────┘
```

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/              # Locale-prefixed routes
│   │   ├── (private)/         # Authenticated pages
│   │   │   ├── module/        # Core modules (grades, admin, etc.)
│   │   │   │   └── admin/     # Admin panel with user management
│   │   │   ├── profile/       # User profile
│   │   │   ├── settings/      # Account settings
│   │   │   └── contacts/      # Contact directory
│   │   └── (public)/          # Unauthenticated pages
│   │       ├── (auth)/        # Login, registration, password reset
│   │       └── landing/       # Marketing landing page
│   ├── images/                # Centralized SVG icon index
│   └── layout.tsx             # Root layout
├── actions/                   # Server Actions
│   ├── auth.actions.ts        # Login, register, user details (with local fallback)
│   ├── local-auth.actions.ts  # Prisma-based auth (register, login, JWT)
│   └── admin.actions.ts       # Admin panel CRUD (Prisma queries)
├── components/                # Reusable UI components
│   ├── ui/                    # Base components (button, table, dialog, etc.)
│   ├── typography/            # Heading, Paragraph, Description
│   └── utils/                 # Show (conditional render), etc.
├── hooks/                     # Custom React hooks
├── lib/                       # Core libraries
│   ├── client.ts              # API fetch wrapper
│   ├── prisma.ts              # Prisma client singleton
│   ├── env.ts                 # Zod-validated environment variables
│   └── constants/             # Shared constants (cookies, cache tags, page sizes)
├── types/                     # TypeScript types and domain models
├── middleware/                # Auth and i18n middleware
└── i18n/                      # Locale routing configuration
prisma/
├── schema.prisma              # Database schema (User, Course, Attendance, Notification)
└── seed.js                    # Database seeder (120+ users, courses, attendance)
```

---

## Engineering Quality

The current anti-pattern and verification checklist lives in `docs/engineering-quality-baseline.md`. It records server-action authorization, Prisma schema ownership, secret filtering, shared admin types, and remaining security/testing work.

## Key Design Decisions

### Dual Auth System
When `NEXT_PUBLIC_LOCAL_AUTH=true`, the app uses Prisma + SQLite for authentication. This enables standalone demo deployment without an external API. When set to `false`, it falls back to the original remote API auth.

### Prisma ORM
Type-safe database access with automatic migrations. SQLite for zero-config local development, Neon Postgres for production. The Prisma client is singleton-instantiated to prevent connection pooling issues in dev.

### Server-Side Rendering
All pages are server components that fetch data via Server Actions. No client-side loading spinners — data is ready on first render. Interactive parts (filters, tabs) are isolated into small client components.

### Centralized Icon System
All SVG icons are imported from a single index (`@/app/images`). Lucide React used for supplementary icons. This prevents duplicate imports and ensures consistent optimization.

### Error Handling
Two patterns, used consistently:
- **Throw** on non-OK — for mutations and critical reads (caller shows error toast)
- **Return safe default** — for list/search reads where the page can render an empty state

### Environment Validation
All environment variables are validated through a Zod schema at startup. No `process.env.X!` assertions — if a variable is missing, the app fails fast with a clear error.

---

## Security

- **Password hashing** — bcryptjs with 10 rounds
- **JWT** stored in httpOnly cookies (not accessible via JavaScript)
- **Refresh token rotation** — short-lived access tokens (15min) + long-lived refresh tokens (30d) with automatic rotation and reuse detection
- **JWKS support** — remote JWT signature verification via jose library when `JWKS_URI` is configured
- **JWT validation** — Zod schema validates exp, modules, iss on every request; expired external tokens rejected
- **JWT_SECRET** — minimum 16 characters, no insecure defaults (app fails fast if missing)
- **Cookie flags** — `httpOnly: true`, `secure` in production, `sameSite: 'lax'`
- **CSRF protection** — double-submit cookie + Origin header validation in middleware; `requireCsrf()` guard in all mutating server actions
- **School isolation** — all data access scoped to `schoolId`; cross-school reads, mutations, and messaging blocked
- **CSP** — Content-Security-Policy header on all routes
- **HSTS** — Strict-Transport-Security with preload
- **Rate limiting** — login (10 per 15min, 5min lockout) and password reset (5 per 15min) throttled
- **Fetch timeout** — AbortSignal.timeout(10s) on all external API calls
- **Circuit breaker** — 5xx errors trip circuit, fast-fail after 5 failures
- **Smart retry** — TransientError retried with backoff, PermanentError/ValidationError/NotFoundError fast-fail
- **Audit logging** — all admin and grade mutations logged with user, action, metadata; failures logged but non-blocking
- **File upload safety** — 5MB size limit, MIME type allow-list (JPEG/PNG/WebP/GIF) for avatar uploads
- **SQLite WAL mode** — write-ahead logging enabled to prevent SQLITE_BUSY under concurrent writes
- **Environment validation** — Zod schema, no unvalidated env access
- **URL allow-listing** — external redirects validated against trusted domains
- **IP header sanitization** — X-Forwarded-For and X-Real-IP headers sanitized against spoofing
- **Feature toggles** — env-based toggles for dark mode, command palette, admin panel, parent portal, analytics

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build; verify output in a normal terminal because some IDE terminal bridges hide stdout |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run tsc` | Type-check without emitting |
| `npm run db:push` | Create/update database schema |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:studio` | Open Prisma Studio (DB browser) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |

---

## Documentation

### Infrastructure (`docs/infrastructure/`)
- `01-stack-overview.md` — Full technology stack with versions and rationale
- `02-architecture-diagram.md` — High-level architecture, directory structure, route groups, access control matrix
- `03-request-pipeline.md` — Request lifecycle, server action patterns, external API data flow, cache invalidation
- `04-database-layer.md` — Dual-database strategy, Prisma singleton, WAL mode, schema, school isolation
- `05-auth-security.md` — Auth flows, JWT/JWKS, refresh token rotation, CSRF, CSP, cookies, rate limiting
- `06-deployment-docker.md` — Docker architecture, multi-stage build, Compose, volumes, health checks
- `07-frontend-components.md` — Component hierarchy, server/client components, shadcn/ui, table/form patterns
- `08-monitoring-health.md` — Health endpoints, circuit breaker, retry, structured logging, resilience

### Theory (`docs/theory/`)
- `01-patterns-architecture.md` — 13 design patterns with code examples and rationale
- `02-react-server-components.md` — RSC concepts, hydration, server actions, caching, error boundaries
- `03-security-concepts.md` — 12 security concepts with project-specific examples
- `04-database-concepts.md` — ORM, Prisma, SQLite vs PostgreSQL, WAL, transactions, indexing
- `05-development-workflow.md` — Dev cycle, HMR, TypeScript strict, ESLint, Vitest, Playwright, TDD, CI/CD

---

## Roadmap

See [docs/roadmap.md](./docs/roadmap.md) for the full feature roadmap including AI-powered predictions, parent portal, mobile app, LMS integration, webhook system, and multi-tenant architecture.

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

## Author

**Denys Stepanenko** — Software Engineer (.NET | Full-Stack)

GitHub: [@ezpectus](https://github.com/ezpectus)

Software Engineering student. Background in .NET backend, full-stack React, and algorithms (3000+ problems solved across LeetCode, HackerRank, Codeforces). Cybersecurity internship experience at JCB (threat modeling, secure software development).
