# 01 — Technology Stack Overview

**Project:** eCampus Student Portal
**Last updated:** July 2026

---

## Core Framework

| Technology | Version | Role |
|-----------|---------|------|
| **Next.js** | 15.5.20 | Application framework (App Router, Turbopack) |
| **React** | 19.2.0 | UI library (Server Components + Client Components) |
| **TypeScript** | 5.9.3 | Type-safe JavaScript (strict mode) |
| **Node.js** | ≥22.0.0 | JavaScript runtime |

### Why Next.js 15 + React 19?

Next.js 15 with App Router provides:
- **Server Components by default** — pages render on the server, reducing client bundle size
- **Server Actions** — mutations without writing API endpoints; functions run server-side, called from client
- **Streaming + Suspense** — progressive page hydration
- **Turbopack** — Rust-based bundler replacing Webpack for dev/build (10x faster HMR)
- **Built-in middleware** — request interception before routing (auth, CSRF, i18n, CSP headers)
- **File-based routing** — `page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx` per route segment

React 19 provides:
- **Server Components** — zero client JS for static content
- **use() hook** — Suspense-compatible data fetching
- **Actions** — form submissions via `action` prop (no `onSubmit` + `preventDefault` needed)
- **useFormState / useFormStatus** — form state without external libraries

---

## Styling

| Technology | Version | Role |
|-----------|---------|------|
| **Tailwind CSS** | 4.1.15 | Utility-first CSS framework |
| **tw-animate-css** | 1.4.0 | Animation utilities for Tailwind |
| **class-variance-authority** | 0.7.1 | Component variant management |
| **clsx** | 2.1.1 | Conditional class names |
| **tailwind-merge** | 3.3.1 | Dedup Tailwind classes |
| **prettier-plugin-tailwindcss** | 0.7.1 | Tailwind class sorting in Prettier |

### How styling works

```tsx
// Button variant definition (src/components/ui/button.tsx)
const buttonVariants = cva('inline-flex items-center justify-center', {
  variants: {
    variant: {
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      tertiary: 'bg-transparent text-foreground hover:bg-accent',
    },
    size: {
      small: 'h-9 px-3 text-sm',
      medium: 'h-10 px-4',
      big: 'h-11 px-6 text-lg',
    },
  },
});

// Usage
<Button variant="primary" size="small">Click me</Button>
```

Tailwind 4 uses CSS-native `@property` and cascade layers. No `tailwind.config.js` needed — configuration is in CSS `@theme` block.

---

## UI Components

| Technology | Version | Role |
|-----------|---------|------|
| **shadcn/ui** | — | Component collection (43+ components) |
| **Radix UI** | various | Headless accessible primitives |
| **Lucide React** | 0.546.0 | Icon library |
| **cmdk** | 1.1.1 | Command palette (Cmd+K) |
| **Embla Carousel** | 8.6.0 | Carousel (login page) |

### shadcn/ui philosophy

shadcn/ui is **not a package** — components are copied into `src/components/ui/` and owned by the project. This means:
- Full control over styling and behavior
- No version lock-in
- Components use Radix UI for accessibility (ARIA, keyboard nav, focus traps)
- Variants managed via CVA (class-variance-authority)

**Available components (43):**
`accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `button`, `card`, `carousel`, `checkbox`, `collapsible`, `command`, `dialog`, `dropdown-menu`, `form`, `input`, `label`, `locale-switch`, `multi-select`, `pagination`, `pagination-with-links`, `password-input`, `popover`, `profile-picture`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sort-icon`, `switch`, `table`, `tabs`, `text-button`, `text-divider`, `textarea`, `toast`, `toaster`, `tooltip`.

---

## Forms & Validation

| Technology | Version | Role |
|-----------|---------|------|
| **React Hook Form** | 7.65.0 | Form state management |
| **Zod** | 4.1.12 | Schema validation (forms, env vars, server inputs) |
| **@hookform/resolvers** | 5.2.2 | Zod resolver for RHF |

### Pattern

```tsx
// 1. Define schema inline (co-located with form)
const formSchema = z.object({
  title: z.string().min(1, { message: t('validation.title-required') }),
  content: z.string().min(1).max(5000),
});

type FormValues = z.infer<typeof formSchema>;

// 2. Initialize form
const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: { title: '', content: '' },
});

// 3. Submit with loading state
<Button loading={form.formState.isSubmitting}>Submit</Button>

// 4. Server-side validation (defense in depth)
const validated = validateInput(schema, input, 'actionName');
```

Zod is also used for **environment variable validation** at startup:
```ts
// src/lib/env.ts
const envSchema = z.object({
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  // ...
});
export const env = envSchema.parse(cleanEnv); // throws if invalid
```

---

## Data Layer

| Technology | Version | Role |
|-----------|---------|------|
| **Prisma** | 7.8.0 | ORM with type-safe queries |
| **@prisma/adapter-better-sqlite3** | 7.8.0 | SQLite adapter (local dev) |
| **@prisma/adapter-pg** | 7.8.0 | PostgreSQL adapter (production) |
| **better-sqlite3** | 12.11.1 | Native SQLite driver |
| **pg** | 8.22.0 | PostgreSQL driver |

### Dual-database strategy

```
Development:  SQLite (file:./dev.db) via PrismaBetterSqlite3
Production:   PostgreSQL via PrismaPg (Neon or Docker Postgres)
```

Prisma 7 uses **adapters** instead of direct driver bindings. The adapter is selected at runtime based on `DATABASE_URL`:

```ts
// src/lib/prisma.ts
const isPostgres = databaseUrl.startsWith('postgresql://');
const adapter = isPostgres
  ? new PrismaPg({ connectionString: databaseUrl })
  : new PrismaBetterSqlite3({ url: databaseUrl });
```

Two separate Prisma schemas exist:
- `prisma/schema.prisma` — SQLite (provider: sqlite)
- `prisma-postgres/schema.prisma` — PostgreSQL (provider: postgresql)

Both must be kept in sync manually.

---

## Authentication & Security

| Technology | Version | Role |
|-----------|---------|------|
| **jsonwebtoken** | 9.0.2 | JWT signing/verification (local auth) |
| **jose** | 6.2.3 | JWKS-based remote JWT verification |
| **bcryptjs** | 2.4.3 | Password hashing |
| **server-only** | 0.0.1 | Prevents server code in client bundles |

### Auth flow

```
Local auth mode (NEXT_PUBLIC_LOCAL_AUTH=true):
  Login → bcrypt verify → sign JWT (15min access) + refresh token (30d)
  → httpOnly cookies → middleware validates on each request

External auth mode:
  Login → POST to external API → receive JWT
  → httpOnly cookies → middleware validates JWT
  → JWKS signature verification if JWKS_URI configured
```

---

## Internationalization

| Technology | Version | Role |
|-----------|---------|------|
| **next-intl** | 4.13.2 | i18n for App Router |

- **Default locale:** Ukrainian (uk)
- **Supported:** English (en)
- **URL pattern:** `/{locale}/...` (e.g. `/uk/module/rating`, `/en/settings`)
- **Translation files:** `src/messages/{uk,en}.json`
- **Server:** `getTranslations({ locale, namespace })`
- **Client:** `useTranslations('namespace')`

---

## Charts & Data Visualization

| Technology | Version | Role |
|-----------|---------|------|
| **Recharts** | 3.9.2 | React charting library (Area, Bar, Pie) |

Used in: dashboard (GPA trend, grade distribution, attendance), analytics module (10 widget types).

---

## Testing

| Technology | Version | Role |
|-----------|---------|------|
| **Vitest** | 4.1.10 | Unit test runner |
| **@testing-library/react** | 16.1.0 | Component testing |
| **@testing-library/jest-dom** | 6.6.3 | DOM assertion matchers |
| **Playwright** | 1.54.0 | E2E browser testing |
| **jsdom** | 25.0.1 | DOM environment for Vitest |

---

## Build & Quality

| Technology | Version | Role |
|-----------|---------|------|
| **ESLint** | 9 | Linter (Next.js + Prettier config) |
| **Prettier** | 3.6.2 | Code formatter |
| **eslint-plugin-simple-import-sort** | 12.1.1 | Auto-sort imports |
| **@svgr/webpack** | 8.1.0 | SVG → React component loader |
| **tsx** | 4.20.5 | TypeScript execution (scripts, seed) |

---

## Utility Libraries

| Technology | Version | Role |
|-----------|---------|------|
| **dayjs** | 1.11.18 | Date formatting and manipulation |
| **radash** | 12.1.1 | Utility functions (group, etc.) |
| **query-string** | 9.3.1 | URL query string parsing |
| **url-pattern** | 1.0.3 | URL pattern matching (middleware) |
| **ua-parser-js** | 2.0.10 | User-agent parsing |
| **file-saver** | 2.0.5 | Client-side file download (CSV export) |
| **react19-google-recaptcha-v3** | 1.0.0 | reCAPTCHA v3 integration |

---

## Dependency Graph (simplified)

```
                    ┌─────────────┐
                    │  Next.js 15  │
                    │  (App Router) │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
     ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼──────┐
     │  React 19  │  │  Prisma 7  │  │ next-intl  │
     │  (RSC+Cln) │  │ (SQLite/PG)│  │  (uk/en)   │
     └─────┬─────┘  └─────┬─────┘  └────────────┘
           │               │
     ┌─────▼─────┐  ┌─────▼─────┐
     │ Tailwind 4 │  │  bcryptjs  │
     │ + shadcn/ui│  │  + JWT     │
     └───────────┘  └───────────┘
```
