# 02 — Architecture Diagram & Component Map

**Project:** eCampus Student Portal
**Last updated:** July 2026

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (Client)                            │
│                                                                          │
│  ┌────────────┐  ┌─────────────┐  ┌────────────┐  ┌────────────────┐   │
│  │   Pages     │  │ Components  │  │   Hooks    │  │     Forms      │   │
│  │ (RSC + Cln) │  │ (shadcn/ui) │  │(useToast,  │  │(RHF + Zod)     │   │
│  │             │  │             │  │usePaginat. │  │                │   │
│  └──────┬──────┘  └─────────────┘  └────────────┘  └────────────────┘   │
│         │                                                                │
│  ═══════┼══════════════ Next.js App Router ══════════════════════════   │
│         │           (File-based routing, RSC, Streaming)                 │
└─────────┼────────────────────────────────────────────────────────────────┘
          │
          │  HTTP request (cookies, headers)
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           MIDDLEWARE LAYER                               │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  src/middleware.ts                                               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │   │
│  │  │   i18n    │  │   Auth   │  │   CSRF   │  │   CSP Headers    │ │   │
│  │  │ (locale  │  │ (JWT     │  │ (cookie  │  │ (Content-Sec-    │ │   │
│  │  │  routing)│  │  verify) │  │ + Origin)│  │  urity-Policy)   │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────┬───────────────────────────────────────────────────────────────┘
          │
          │  Authenticated request
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SERVER COMPONENTS LAYER                           │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  src/app/[locale]/(private)/module/*/page.tsx                    │   │
│  │                                                                   │   │
│  │  • Fetches data via server actions (@/actions/)                  │   │
│  │  • Renders HTML on server (zero client JS for static parts)      │   │
│  │  • generateMetadata() for SEO                                     │   │
│  │  • Error boundaries (error.tsx) at each route segment            │   │
│  │  • Loading states (loading.tsx) with Suspense                    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────┬───────────────────────────────────────────────────────────────┘
          │
          │  Data fetch / mutation
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SERVER ACTIONS LAYER                              │
│                                                                          │
│  src/actions/*.actions.ts                                                │
│                                                                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌─────────┐ │
│  │ auth       │ │ admin      │ │ grading    │ │ calendar │ │ chat    │ │
│  │ actions    │ │ actions    │ │ actions    │ │ actions  │ │ actions │ │
│  ├────────────┤ ├────────────┤ ├────────────┤ ├──────────┤ ├─────────┤ │
│  │ settings   │ │ feed       │ │ msg        │ │ qr-attend│ │ profile │ │
│  │ actions    │ │ actions    │ │ actions    │ │ actions  │ │ actions │ │
│  ├────────────┤ ├────────────┤ ├────────────┤ ├──────────┤ ├─────────┤ │
│  │ audit      │ │ local-auth │ │ local-user │ │ refresh  │ │ menu    │ │
│  │ actions    │ │ actions    │ │ actions    │ │ token    │ │ actions │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘ └─────────┘ │
│                                                                          │
│  Each action:                                                            │
│  1. requireCsrf() — CSRF validation (mutations only)                    │
│  2. getLocalUser() — auth check + school isolation                       │
│  3. validateInput() — Zod schema validation                              │
│  4. prisma.* — database query                                            │
│  5. logAuditEvent() — audit trail (non-blocking)                        │
│  6. revalidatePath() / revalidateTag() — cache invalidation              │
└─────────┬───────────────────────────────────────────────────────────────┘
          │
          │  Prisma query
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA ACCESS LAYER                                │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  src/lib/prisma.ts (singleton)                                   │   │
│  │                                                                   │   │
│  │  • SQLite (dev) → PrismaBetterSqlite3 + WAL mode                 │   │
│  │  • PostgreSQL (prod) → PrismaPg                                   │   │
│  │  • Query logging: dev=['query'], prod=['error','warn']           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────┐        ┌─────────────────┐                         │
│  │  SQLite (dev)   │        │  PostgreSQL      │                         │
│  │  file:./dev.db  │        │  (Docker/Neon)   │                         │
│  │  WAL mode ON    │        │  MVCC concurrency│                         │
│  └─────────────────┘        └─────────────────┘                         │
└─────────┬───────────────────────────────────────────────────────────────┘
          │
          │  External API (optional)
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL API LAYER                                  │
│                                                                          │
│  src/lib/client.ts → apiFetch()                                          │
│                                                                          │
│  • JWT injection from cookies                                            │
│  • Circuit breaker (5 failures → open → 30s reset)                      │
│  • AbortSignal.timeout(10s)                                              │
│  • IP forwarding (X-Forwarded-For, X-Real-IP)                           │
│  • Accept-Language injection                                             │
│  • Default cache: revalidate 300s                                        │
│  • 5xx → throw Error (triggers circuit breaker)                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure (detailed)

```
ecampus-refactor/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── [locale]/                     # Locale-based routing (uk, en, pl, de)
│   │   │   ├── (public)/                 # Public route group
│   │   │   │   ├── (auth)/               # Login, register, password reset
│   │   │   │   ├── (support)/            # Curator search, certificate verify
│   │   │   │   ├── landing/              # Landing page
│   │   │   │   ├── validate-certificate/ # Certificate verification
│   │   │   │   ├── error.tsx             # Public error boundary
│   │   │   │   ├── header.tsx            # Public header
│   │   │   │   └── footer.tsx            # Public footer
│   │   │   ├── (private)/                # Protected route group
│   │   │   │   ├── module/               # Feature modules
│   │   │   │   │   ├── admin/            # Admin panel
│   │   │   │   │   ├── ai-chat/          # AI assistant
│   │   │   │   │   ├── analytics/        # Analytics dashboard
│   │   │   │   │   ├── announcementseditor/ # Announcement management
│   │   │   │   │   ├── attestationresults/  # Attestation results
│   │   │   │   │   ├── calendar/         # Calendar events
│   │   │   │   │   ├── certificates/     # Certificate management
│   │   │   │   │   ├── chat/             # Chat rooms
│   │   │   │   │   ├── directory/        # User directory
│   │   │   │   │   ├── employment/       # Employment system
│   │   │   │   │   ├── facultycertificate/ # Faculty certificates
│   │   │   │   │   ├── feed/             # Social feed
│   │   │   │   │   ├── grading/          # Grade management
│   │   │   │   │   ├── kurator/          # Curator module
│   │   │   │   │   ├── msg/              # Messaging
│   │   │   │   │   ├── parent/           # Parent portal
│   │   │   │   │   ├── rating/           # Academic rating
│   │   │   │   │   ├── studysheet/       # Study sheet
│   │   │   │   │   └── vedomoststud/     # Grade book
│   │   │   │   ├── attendance/           # QR attendance
│   │   │   │   ├── onboarding/           # First-login setup
│   │   │   │   ├── profile/              # User profile
│   │   │   │   ├── settings/             # Settings
│   │   │   │   ├── header.tsx            # Private header (nav, theme toggle)
│   │   │   │   ├── error.tsx             # Private error boundary
│   │   │   │   └── loading.tsx           # Private loading skeleton
│   │   │   ├── error.tsx                 # Locale-level error boundary
│   │   │   ├── not-found.tsx             # 404 page
│   │   │   └── layout.tsx                # Root locale layout
│   │   ├── api/                          # API routes
│   │   │   ├── healthz/                  # Liveness probe
│   │   │   ├── ready/                    # Readiness probe (DB + API + circuit)
│   │   │   └── kpi-id/                   # KPI ID resolution
│   │   ├── global-error.tsx              # Global error boundary (catch-all)
│   │   ├── not-found.tsx                 # Global 404
│   │   └── layout.tsx                    # Root layout (<html>, <body>)
│   │
│   ├── actions/                          # Server Actions
│   │   ├── admin.actions.ts              # Admin: users, stats, DB viewer
│   │   ├── ai-chat.actions.ts            # AI chat responses
│   │   ├── analytics.actions.ts          # Analytics data aggregation
│   │   ├── announcement.actions.ts       # Announcement CRUD
│   │   ├── audit.actions.ts              # Audit log read/write
│   │   ├── auth.actions.ts               # External auth (login, logout)
│   │   ├── calendar.actions.ts           # Calendar event CRUD
│   │   ├── certificates.actions.ts       # Certificate generation
│   │   ├── chat.actions.ts               # Chat rooms + messages
│   │   ├── feed.actions.ts               # Social feed CRUD
│   │   ├── grading.actions.ts            # Grade management
│   │   ├── local-auth.actions.ts         # Local auth (login, register, logout)
│   │   ├── local-password.actions.ts     # Password reset flow
│   │   ├── local-user.actions.ts         # Local user data access
│   │   ├── menu.actions.ts               # Module menu construction
│   │   ├── msg.actions.ts                # Messaging (mail + parents)
│   │   ├── profile.actions.ts            # Profile data
│   │   ├── qr-attendance.actions.ts      # QR attendance generation/verification
│   │   ├── refresh-token.actions.ts      # Refresh token rotation
│   │   ├── session.actions.ts            # Session expiry check
│   │   └── settings.actions.ts           # Settings (email, photo, password)
│   │
│   ├── components/                       # React components
│   │   ├── ui/                           # shadcn/ui (43 components)
│   │   ├── typography/                   # Heading, Paragraph components
│   │   ├── utils/                        # Show, conditional helpers
│   │   ├── auth/                         # Auth-related (demo credentials)
│   │   ├── not-found-page.tsx            # 404 component
│   │   ├── theme-toggle.tsx              # Dark/dim/light toggle
│   │   └── session-expiry-banner.tsx     # Session timeout warning
│   │
│   ├── hooks/                            # Custom React hooks
│   │   ├── use-mobile.tsx                # Viewport breakpoint detection
│   │   ├── use-pagination.ts             # URL-based pagination
│   │   ├── use-server-error-toast.ts     # Standard error toast
│   │   ├── use-storage.ts                # localStorage hook (hydration-safe)
│   │   ├── use-table-sort.ts             # Client-side column sorting
│   │   ├── use-theme.ts                  # Theme management (hydration-safe)
│   │   └── use-toast.ts                  # Toast notifications
│   │
│   ├── lib/                              # Utilities & infrastructure
│   │   ├── client.ts                     # apiFetch (API client with circuit breaker)
│   │   ├── circuit-breaker.ts            # Circuit breaker pattern
│   │   ├── csrf.ts                       # CSRF token generation + validation
│   │   ├── env.ts                        # Zod-validated environment variables
│   │   ├── errors.ts                     # Typed error classes
│   │   ├── file-upload.ts                # File upload helper
│   │   ├── jwks.ts                       # JWKS remote JWT verification
│   │   ├── jwt.ts                        # JWT decode/verify
│   │   ├── logger.ts                     # Structured logging
│   │   ├── prisma.ts                     # Prisma singleton + WAL mode
│   │   ├── rate-limit.ts                 # In-memory rate limiting
│   │   ├── retry.ts                      # Exponential backoff retry
│   │   └── validate.ts                   # Zod input validation helper
│   │
│   ├── middleware/                       # Next.js middleware
│   │   ├── authentication.middleware.ts  # JWT validation + redirect
│   │   ├── authorization.middleware.ts   # Module access control
│   │   ├── intl.middleware.ts            # Locale routing
│   │   ├── constants.ts                  # Public paths, login path
│   │   └── utils.ts                      # URL matching, auth info extraction
│   │
│   ├── types/                            # TypeScript types
│   │   ├── models/                       # Domain models (user, certificate, etc.)
│   │   ├── campus-jwt-payload.ts         # JWT payload type
│   │   ├── menu-item-meta.ts             # Menu structure types
│   │   └── module.ts                     # Module definition type
│   │
│   ├── i18n/                             # Internationalization config
│   │   ├── routing.ts                    # Locale definitions + path matching
│   │   └── request.ts                    # Locale resolution
│   │
│   ├── messages/                         # Translation files
│   │   ├── uk.json                       # Ukrainian (source of truth)
│   │   └── en.json                       # English
│   │
│   └── generated/                        # Prisma generated client
│       └── prisma/                       # (auto-generated, gitignored)
│
├── prisma/                               # SQLite schema + migrations
│   ├── schema.prisma                     # Prisma schema (SQLite)
│   ├── seed.ts                           # Demo data seeder
│   └── dev.db                            # SQLite database file
│
├── prisma-postgres/                      # PostgreSQL schema
│   └── schema.prisma                     # Prisma schema (PostgreSQL)
│
├── public/                               # Static assets
│   └── uploads/                          # User uploads (gitignored)
│       └── avatars/                      # Avatar images
│
├── docs/                                 # Documentation
│   ├── infrastructure/                   # ← This folder
│   └── theory/                           # ← Concepts & theory
│
├── scripts/                              # Utility scripts
│   ├── start-no-docker.bat               # Windows launcher (no Docker)
│   ├── start-no-docker.sh                # Unix launcher (no Docker)
│   ├── start-docker.bat                  # Windows Docker launcher
│   ├── start-docker.sh                   # Unix Docker launcher
│   └── health-watch.cjs                  # Health check monitor
│
├── docker-compose.yml                    # Docker orchestration
├── Dockerfile                            # Multi-stage build
├── .env.example                          # Development env template
├── .env.docker.example                   # Docker env template
└── .gitignore                            # Git ignore rules
```

---

## Route Groups & Access Control

| Route Group | Access | Error Boundary | Purpose |
|-------------|--------|----------------|---------|
| `(public)/(auth)` | Anyone | `error.tsx` | Login, register, password reset |
| `(public)/(support)` | Anyone | `error.tsx` | Curator search, certificate verify |
| `(public)/landing` | Anyone | `error.tsx` | Marketing landing page |
| `(private)/module/*` | Authenticated + authorized | `error.tsx` (module level) | Feature modules |
| `(private)/settings` | Authenticated | `error.tsx` (settings level) | User settings |
| `(private)/profile` | Authenticated | `error.tsx` (profile level) | User profile |
| `(private)/onboarding` | Authenticated | — | First-login setup |
| `api/healthz` | Anyone | — | Liveness probe |
| `api/ready` | Anyone | — | Readiness probe |

### Authorization flow

```
Request → middleware.ts
  → needsLocaleHandling? → intlMiddleware (redirect to /{locale}/...)
  → POST + Next-Action? → CSRF check (cookie + origin)
  → authenticationMiddleware
    → getAuthInfo(request) → JWT decode/verify
    → not authenticated? → redirect to /{locale}/login
    → authenticated? → authorizationMiddleware
      → matchesUrl(MODULES_BASE_PATH)?
      → getAuthInfo → payload.modules.includes(module)?
      → not authorized? → redirect to /{locale}/not-found
      → authorized? → intlMiddleware (continue)
  → set CSP headers + nonce
  → set CSRF cookie if missing
  → return response
```

---

## Module Access Matrix

| Module | ADMIN | TEACHER | STUDENT | PARENT |
|--------|-------|---------|---------|--------|
| admin | ✅ | ❌ | ❌ | ❌ |
| grading | ✅ | ✅ | ❌ | ❌ |
| analytics | ✅ | ✅ | ❌ | ❌ |
| rating | ✅ | ✅ | ✅ | ❌ |
| studysheet | ✅ | ✅ | ✅ | ❌ |
| certificates | ✅ | ✅ | ✅ | ❌ |
| announcementseditor | ✅ | ✅ | ✅ | ❌ |
| msg | ✅ | ✅ | ✅ | ✅ |
| calendar | ✅ | ✅ | ✅ | ✅ |
| chat | ✅ | ✅ | ✅ | ❌ |
| feed | ✅ | ✅ | ✅ | ❌ |
| ai-chat | ✅ | ✅ | ✅ | ❌ |
| parent | ❌ | ❌ | ❌ | ✅ |
