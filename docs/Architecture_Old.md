# Architecture Before Refactoring

**Date:** 18.07.2026  
**Project:** eCampus KPI (ecampus.kpi.ua)  

---

## Overview

eCampus KPI is the frontend of the educational portal of Kyiv Polytechnic Institute. The application provides students, lecturers, and staff access to modules: grades, certificates, announcements, messages, curator, ratings, and more.

**Type:** Legacy frontend (production, used by the university)  
**Code age:** ~2 years of active development  
**Size:** ~200+ TypeScript/TSX files in `src/`  

---

## Tech Stack

| Layer | Technology | Version |
|------|-----------|--------|
| Framework | Next.js (App Router, Turbopack) | 15.4.8 |
| UI Library | React (Server Components) | 19.2.0 |
| Language | TypeScript (strict) | 5.9.x |
| Styling | Tailwind CSS | 4.1.x |
| UI Components | shadcn/ui (Radix UI) | 42 components |
| i18n | next-intl | 4.4.0 |
| Forms | React Hook Form + Zod | 7.x / 4.x |
| Auth | JWT (jsonwebtoken) | 9.0.2 |
| HTTP | campusFetch (wrapper over fetch) | — |
| Icons | Custom SVG (159 files) + lucide-react | — |
| Dates | dayjs | — |
| Deploy | Docker multi-stage (node:22-alpine) | — |
| CI/CD | GitHub Actions | — |
| Dep updates | Dependabot (weekly) | — |

---

## Project Structure

```
ecampus-refactor/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (html, body, GA)
│   │   ├── page.tsx                  # Redirect → /[locale]
│   │   ├── not-found.tsx             # 404 page
│   │   ├── font.ts                   # Google Font (Exo_2)
│   │   ├── api/
│   │   │   ├── healthz/route.ts      # Health check endpoint
│   │   │   ├── kpi-id/route.ts       # OAuth callback (KPI ID)
│   │   │   └── responses.ts          # API response helpers
│   │   ├── [locale]/                 # Locale segment (uk/en)
│   │   │   ├── layout.tsx            # Locale layout (NextIntlClientProvider, Toaster)
│   │   │   ├── not-found.tsx         # Localized 404
│   │   │   ├── (public)/             # Public routes (no auth)
│   │   │   │   ├── (auth)/           # Login, password reset
│   │   │   │   ├── (support)/        # Curator search
│   │   │   │   └── validate-certificate/
│   │   │   └── (private)/            # Private routes (auth required)
│   │   │       ├── layout.tsx        # Private layout (sidebar, header, footer)
│   │   │       ├── sub-layout.tsx    # SubLayout (breadcrumbs + grid)
│   │   │       ├── error.tsx         # Error boundary (renders <></>)
│   │   │       ├── page.tsx          # Dashboard (greeting + cards)
│   │   │       ├── header.tsx        # Header (locale switch, profile, logout)
│   │   │       ├── greeting.tsx      # Greeting component
│   │   │       ├── cards/            # Dashboard cards (announcements, info, etc.)
│   │   │       ├── module/           # Main modules
│   │   │       │   ├── studysheet/           # Study sheets
│   │   │       │   ├── attestationresults/  # Attestation
│   │   │       │   ├── vedomoststud/         # Grade sheets
│   │   │       │   ├── kurator/              # Curator info
│   │   │       │   ├── announcementseditor/ # Announcement management
│   │   │       │   ├── facultycertificate/   # Faculty certificates
│   │   │       │   ├── msg/                  # Messages
│   │   │       │   ├── directory/            # Directory (colleagues)
│   │   │       │   ├── certificates/         # Student certificates
│   │   │       │   ├── rating/               # Rating
│   │   │       │   └── employment/           # Employment system
│   │   │       ├── profile/          # User profile
│   │   │       ├── settings/         # Settings (email, photo, password)
│   │   │       ├── notice-board/     # Notice board
│   │   │       ├── accept-code-of-honor/  # Code of honor acceptance
│   │   │       ├── student-manual/   # Student manual
│   │   │       └── user-manual/      # User manual
│   │   └── images/                   # SVG icons (159 files + 147 in icons/)
│   ├── actions/                      # Server Actions (14 files)
│   │   ├── auth.actions.ts           # Login, logout, password reset, user details
│   │   ├── announcement.actions.ts   # Announcements CRUD
│   │   ├── certificates.actions.ts   # Certificates list, download, verify
│   │   ├── msg.actions.ts            # Messages (broadcast, individual)
│   │   ├── profile.actions.ts        # Profile data, contacts
│   │   ├── settings.actions.ts       # Email, photo, password update
│   │   ├── menu.actions.ts           # Menu building from JWT
│   │   ├── curator.actions.ts        # Curator info
│   │   ├── attestation.actions.ts    # Attestation results
│   │   ├── monitoring.actions.ts     # Study monitoring
│   │   ├── rating.actions.ts         # Rating data
│   │   ├── term.actions.ts           # Term info
│   │   ├── group.actions.ts          # Group search
│   │   └── colleague-contacts.actions.ts  # Colleague contacts
│   ├── components/                   # Shared components
│   │   ├── ui/                       # shadcn/ui (42 components)
│   │   ├── typography/               # Heading1-6, Paragraph, Description
│   │   ├── utils/                    # Show (conditional render)
│   │   ├── account-selector/         # KPI ID account selector
│   │   ├── not-found-page.tsx        # 404 page component
│   │   ├── suggestions-form.tsx      # iframe (Google Forms)
│   │   └── types.ts                  # UNUSED (IconPosition)
│   ├── hooks/                        # Custom hooks (6)
│   │   ├── use-toast.ts              # Toast notifications
│   │   ├── use-server-error-toast.ts # Error toast helper
│   │   ├── use-pagination.ts         # URL-based pagination
│   │   ├── use-table-sort.ts         # Client-side table sorting
│   │   ├── use-mobile.ts             # Viewport check
│   │   └── use-local-storage.ts      # Persist state in localStorage
│   ├── lib/                          # Utilities
│   │   ├── client.ts                 # campusFetch (API wrapper)
│   │   ├── jwt.ts                    # JWT decode (NO verification!)
│   │   ├── utils.tsx                 # cn(), date format, linkify, etc.
│   │   ├── date.utils.ts             # isOutdated()
│   │   ├── file-upload.ts            # File upload helper
│   │   ├── user-agent.ts             # UA parsing (ua-parser-js)
│   │   ├── pagination.utils.ts       # Pagination helpers
│   │   └── constants/                # Shared constants
│   │       ├── cookies.ts            # Cookie names
│   │       ├── cache-tags.ts         # Revalidation tags
│   │       ├── modules.ts            # Module registry (48 modules)
│   │       ├── page-size.ts          # PAGE_SIZE_DEFAULT, PAGE_SIZE_SMALL
│   │       └── user-category.ts      # User category mapping
│   ├── middleware/                   # Next.js middleware
│   │   ├── contants.ts               # ⚠️ TYPO: should be "constants.ts"
│   │   ├── authentication.middleware.ts  # JWT exp check, redirect to login
│   │   ├── authorization.middleware.ts   # Module access check
│   │   ├── code-of-honor.middleware.ts   # Code of honor enforcement
│   │   ├── intl.middleware.ts             # next-intl middleware
│   │   └── utils.ts                       # Middleware helpers
│   ├── types/                        # TypeScript types
│   │   ├── models/                   # Domain models (user, announcement, etc.)
│   │   ├── campus-jwt-payload.ts     # JWT payload interface
│   │   ├── module.ts                 # Module type
│   │   ├── locale-props.ts           # Locale props type
│   │   ├── enums/                    # Enums (profile-area, etc.)
│   │   └── global.d.ts               # Global type declarations
│   ├── messages/                     # i18n messages
│   │   ├── uk.json                   # Ukrainian (source of truth)
│   │   └── en.json                   # English
│   └── i18n/                         # i18n config
│       ├── routing.ts                # Locale routing, navigation
│       └── request.tsx               # Request config
├── .github/
│   ├── workflows/build.yml           # CI: build on PR + push
│   └── dependabot.yml                # Weekly npm updates
├── .storybook/                       # Storybook config (barely used)
├── hft-skills/                       # Reference skills library
├── Dockerfile                        # Multi-stage build
├── docker-compose.yml                # Local dev compose
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config (strict)
├── next.config.mjs                   # Next.js config
├── CLAUDE.md                         # Project overview
├── AGENTS.md                         # Coding conventions
└── AUDIT.md                          # Audit findings (→ docs/01-audit-findings.md)
```

---

## Architectural Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Pages   │  │ Components│  │  Hooks   │  │  Forms  │ │
│  │ (RSC +   │  │ (shadcn/  │  │(useToast,│  │(RHF +   │ │
│  │  Client) │  │  ui)      │  │usePagination│  │ Zod)  │ │
│  └────┬─────┘  └──────────┘  └──────────┘  └─────────┘ │
│       │                                                  │
│  ─────┼────────────── Next.js App Router ────────────── │
│       │                                                  │
│  ┌────▼──────────────────────────────────────────────┐  │
│  │              Server Actions (src/actions/)        │  │
│  │  auth | announcement | certificates | msg | ...   │  │
│  └────┬──────────────────────────────────────────────┘  │
│       │                                                  │
│  ┌────▼──────────────────────────────────────────────┐  │
│  │           campusFetch (src/lib/client.ts)         │  │
│  │  • Injects JWT from cookies                       │  │
│  │  • Sets Accept-Language header                     │  │
│  │  • cache: 'no-cache' by default ⚠️                 │  │
│  └────┬──────────────────────────────────────────────┘  │
│       │                                                  │
│  ┌────▼──────────────────────────────────────────────┐  │
│  │           Middleware (src/middleware/)            │  │
│  │  • Authentication (JWT exp check)                 │  │
│  │  • Authorization (module access from JWT)         │  │
│  │  • Code of Honor enforcement                      │  │
│  │  • i18n (next-intl)                               │  │
│  └────┬──────────────────────────────────────────────┘  │
│       │                                                  │
└───────┼──────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│              Campus Backend API (REST)                     │
│  • JWT authentication                                      │
│  • Endpoints: /profile, /announcements, /certificates,    │
│    /messages, /rating, /monitoring, /curator, etc.        │
│  • External service (not part of this repo)               │
└───────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
┌─────────┐     ┌──────────┐     ┌────────────┐     ┌──────────┐
│  User   │────▶│  Login   │────▶│ Campus API │────▶│  JWT +   │
│ Browser │     │  Page    │     │  (REST)    │     │ SessionID│
└─────────┘     └──────────┘     └────────────┘     └────┬─────┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────┐
│  setLoginCookies()                                           │
│  • ecampus-token (JWT) → httpOnly, NO secure ⚠️              │
│  • SID (session ID)   → httpOnly, NO secure ⚠️              │
│  • Domain: MAIN_COOKIE_DOMAIN / ROOT_COOKIE_DOMAIN           │
│  • Expires: from JWT.exp                                     │
└─────────────────────────────────────────────────────────────┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Middleware (every request)                                  │
│  1. intl.middleware → locale detection                       │
│  2. authentication.middleware → JWT.decode() ⚠️ (no verify)  │
│     • Check exp > now                                        │
│     • If expired → redirect to /login                        │
│  3. code-of-honor.middleware → check honor signed            │
│  4. authorization.middleware → check modules from JWT        │
│     • payload.modules.includes(requestedModule)              │
│     • If unauthorized → redirect to /not-found               │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow (Server Component)

```
┌─────────────────────────────────────────────────────────┐
│  page.tsx (Server Component)                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  1. generateMetadata({ params })                  │  │
│  │     → getTranslations({ locale, namespace })      │  │
│  │     → return { title }                            │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  2. const data = await someAction()               │  │
│  │     → Server Action                               │  │
│  │     → campusFetch<T>(url)                         │  │
│  │     → reads JWT from cookies()                    │  │
│  │     → fetch(CAMPUS_API_BASE_PATH + url, {         │  │
│  │         headers: { Authorization: Bearer JWT,     │  │
│  │                     Accept-Language: locale },    │  │
│  │         cache: 'no-cache' ⚠️                       │  │
│  │       })                                          │  │
│  │     → return response.json() as T                 │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  3. <SubLayout>                                   │  │
│  │       <DataTable items={data} />                  │  │
│  │       <PaginationWithLinks totalCount={...} />    │  │
│  │     </SubLayout>                                  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Module System

48 modules are defined in `src/lib/constants/modules.ts`. Each module has:
- `name` — URL slug (e.g., `studysheet`, `certificates`, `msg`)
- `isExternal` — function or boolean: if `true`, module opens on an external URL (legacy campus), if `false` — rendered inside Next.js

**Internal modules (rendered in Next.js):**
- `studysheet` — study sheets
- `attestationresults` — attestation
- `vedomoststud` — grade sheets
- `kurator` — curator info
- `announcementseditor` — announcement management
- `facultycertificate` — faculty certificates
- `msg` — messages
- `directory` — directory (colleagues)
- `certificates` — student certificates
- `rating` — rating
- `employment` — employment system

**External modules (redirect to legacy campus):** 37 modules (`rnp`, `vote`, `rectorialcontrol`, `studdoc`, `plans_individual`, `journals`, `np`, `lists`, etc.)

---

## Architectural Weak Points

### 1. Authentication — Trusting Unsigned JWT
JWT is decoded without signature verification (`JWT.decode` instead of `JWT.verify`). The payload (including module list) is fully controlled by the client. This is not a bug — it's an architectural decision, but it's vulnerable.

> **Reference:** `hft-skills/coding-skills/jwt-json-web-tokens/SKILL.md` — Anti-pattern: "No signature verification — Tampered token accepted."

### 2. No API-Level Caching
`campusFetch` defaults to `cache: 'no-cache'`. Every request to the backend bypasses cache. For ISR pages, you need to explicitly pass `next: { revalidate }`, but most actions don't.

### 3. Inconsistent Error Handling
Three different patterns in actions (throw / return [] / return null). No unified strategy. Client code doesn't know what to expect.

> **Reference:** `hft-skills/coding-skills/error-handling-strategies/SKILL.md` — Anti-pattern: "Catch and ignore — Silent failures, bugs hidden."

### 4. Single Client-Side page.tsx
`studysheet/[id]/page.tsx` — the only page marked `'use client'` with `useEffect` fetch. All other page.tsx files are server components. This breaks pattern consistency.

### 5. Error Boundary Renders Nothing
`error.tsx` in `(private)` shows a toast and renders `<></>`. User sees a blank white screen.

### 6. No Tests
Zero tests. Refactoring without tests is dangerous.

> **Reference:** `hft-skills/coding-skills/refactoring-strategies/SKILL.md` — "Never refactor without tests. Make small, atomic changes (1-5 lines per step). Run tests after each step."

### 7. Dead Code
3 unused npm dependencies, 3 unused UI components, Storybook with 1 story, unused `types.ts`.

> **Reference:** `hft-skills/coding-skills/technical-debt-management/SKILL.md` — prioritize debt by impact and effort.
