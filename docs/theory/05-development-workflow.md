# 05 — Development Workflow, Testing & CI/CD Concepts

**Project:** eCampus Student Portal
**Audience:** Developers learning modern web development workflow
**Language:** English with code examples

---

## Table of Contents

1. [The Development Cycle](#the-development-cycle)
2. [Local Development Setup](#local-development-setup)
3. [Hot Module Replacement (HMR)](#hot-module-replacement-hmr)
4. [TypeScript: Why Strict Mode?](#typescript-why-strict-mode)
5. [ESLint: Automated Code Quality](#eslint-automated-code-quality)
6. [Prettier: Code Formatting](#prettier-code-formatting)
7. [Import Sorting](#import-sorting)
8. [Unit Testing with Vitest](#unit-testing-with-vitest)
9. [E2E Testing with Playwright](#e2e-testing-with-playwright)
10. [Test-Driven Development (TDD)](#test-driven-development-tdd)
11. [Git Workflow](#git-workflow)
12. [Continuous Integration (CI)](#continuous-integration-ci)
13. [Docker-Based Deployment](#docker-based-deployment)
14. [Environment Management](#environment-management)
15. [Debugging Techniques](#debugging-techniques)

---

## The Development Cycle

### The modern web development loop

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT CYCLE                             │
│                                                                  │
│  1. Write code (TypeScript + React + Tailwind)                  │
│  2. HMR auto-reloads browser (instant feedback)                 │
│  3. TypeScript checks types (real-time in IDE)                  │
│  4. ESLint checks patterns (on save or manually)                │
│  5. Test locally (Vitest unit tests)                            │
│  6. Commit to Git                                                │
│  7. CI runs: tsc + lint + test + build                          │
│  8. Deploy to staging (Docker)                                   │
│  9. E2E tests on staging (Playwright)                           │
│  10. Deploy to production (Docker)                               │
│  11. Monitor health (/api/healthz, /api/ready)                  │
│  12. Fix bug → back to step 1                                    │
└─────────────────────────────────────────────────────────────────┘
```

### In this project

```
Write code → npm run dev (Turbopack HMR)
          → IDE shows TypeScript errors inline
          → npm run lint (ESLint)
          → npm run tsc (type check)
          → npm run test (Vitest)
          → git commit
          → npm run build (production build check)
          → docker compose up (Docker deploy)
```

---

## Local Development Setup

### First-time setup

```bash
# 1. Clone repository
git clone <repo-url>
cd ecampus-refactor

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env
# Edit .env with your values (JWT_SECRET, DATABASE_URL, etc.)

# 4. Generate Prisma client
npm run db:generate

# 5. Create database schema
npm run db:push

# 6. Seed demo data
npm run db:seed

# 7. Start dev server
npm run dev
# → http://localhost:3000
```

### Daily workflow

```bash
# Start development
npm run dev          # Turbopack dev server with HMR

# Make changes in IDE
# → Browser auto-refreshes (HMR)
# → TypeScript errors shown inline
# → No need to restart server

# Check types
npm run tsc          # tsc --noEmit (type check only, no output)

# Check lint
npm run lint         # eslint .

# Run tests
npm run test         # vitest run (one-time)
npm run test:watch   # vitest (watch mode, re-runs on change)

# Database changes
npm run db:push      # Apply schema changes to SQLite
npm run db:studio    # Open Prisma Studio (GUI database browser)
```

---

## Hot Module Replacement (HMR)

### What is HMR?

HMR updates modules in the browser **without a full page reload**. This means:
- You edit a component → browser updates that component only
- State is preserved (form inputs, scroll position)
- Changes appear in milliseconds

### Turbopack (Next.js 15)

```bash
npm run dev
# → next dev --turbopack
```

Turbopack is a Rust-based bundler (replacing Webpack):
- **10x faster** initial compile than Webpack
- **Near-instant** HMR (even on large projects)
- Built into Next.js 15 (no configuration needed)

### What HMR can and can't do

```
✅ HMR works:
  - Edit a component's JSX → updates instantly
  - Edit CSS/Tailwind classes → updates instantly
  - Edit a hook → updates instantly

❌ HMR can't help:
  - Edit server-only code (prisma.ts, env.ts) → full reload
  - Edit middleware.ts → full reload
  - Edit next.config.ts → requires restart
  - Database schema changes → requires db:push + restart
```

---

## TypeScript: Why Strict Mode?

### What is strict mode?

TypeScript strict mode enables all type-checking options:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "strictNullChecks": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### What each option does

| Option | What it catches | Example |
|--------|----------------|---------|
| `strict` | All strict checks | Enables all below |
| `strictNullChecks` | `null`/`undefined` not assignable to other types | `const x: string = null` → error |
| `noUnusedLocals` | Variables declared but never used | `const x = 1;` (never used) → error |
| `noUnusedParameters` | Function params never used | `function f(a, b) { return a; }` → error on `b` |
| `noImplicitReturns` | Not all code paths return a value | `if (x) return 1;` (no else) → error |
| `noFallthroughCasesInSwitch` | Switch cases that fall through | `case 1: case 2: break;` → error on case 1 |

### Why strict mode matters

```typescript
// Without strict mode — runtime crash
function getUser(id: number) {
  return db.users.find(id);  // might return null
}

const user = getUser(42);
console.log(user.name);  // 💥 TypeError: Cannot read property 'name' of null

// With strict mode — caught at compile time
function getUser(id: number): User | null {
  return db.users.find(id);
}

const user = getUser(42);
console.log(user.name);  // ❌ TypeScript error: Object is possibly 'null'
// Fix:
if (user) {
  console.log(user.name);  // ✅ TypeScript knows user is not null here
}
```

### In this project

```bash
npm run tsc
# → tsc --noEmit
# → Checks all TypeScript files without producing output
# → 0 errors = type-safe codebase
```

---

## ESLint: Automated Code Quality

### What is ESLint?

ESLint is a linter that analyzes code for potential problems and enforces coding standards.

### Configuration in this project

```json
// eslint.config.mjs (simplified)
{
  extends: ['next/core-web-vitals', 'prettier'],
  plugins: ['simple-import-sort'],
  rules: {
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
  },
}
```

### What ESLint catches

| Rule | What it catches | Example |
|------|----------------|---------|
| `react-hooks/exhaustive-deps` | Missing useEffect dependencies | `useEffect(() => { fn() }, [])` where `fn` uses state |
| `no-unused-vars` | Unused variables | `const x = 1;` (never used) |
| `react/no-unescaped-entities` | Unescaped quotes in JSX | `<p>It's nice</p>` → should be `It&apos;s` |
| `simple-import-sort/imports` | Unsorted imports | Auto-fixable with `--fix` |
| `next/no-img-element` | Using `<img>` instead of `<Image>` | Performance warning |

### Running ESLint

```bash
npm run lint              # Check all files
npx eslint src/file.tsx   # Check specific file
npx eslint src/ --fix     # Auto-fix what can be fixed
```

### The import sort rule

```typescript
// ❌ Before auto-fix (unsorted)
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

// ✅ After auto-fix (sorted by group)
import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

**Groups:** (1) React/third-party → (2) `@/` aliases → (3) relative imports

---

## Prettier: Code Formatting

### What is Prettier?

Prettier is an opinionated code formatter. It enforces consistent style without arguments.

### Configuration

```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 120,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### What Prettier does

```typescript
// Before Prettier
const x={a:1,b:2,c:3}
function foo( a , b ){return a+b}

// After Prettier
const x = { a: 1, b: 2, c: 3 };
function foo(a, b) {
  return a + b;
}
```

### ESLint + Prettier integration

```json
// eslint.config.mjs
{
  extends: ['next/core-web-vitals', 'prettier'],
  // 'prettier' preset disables ESLint rules that conflict with Prettier
}
```

This means:
- **ESLint** catches code quality issues (unused vars, hook deps)
- **Prettier** handles formatting (spaces, quotes, line length)
- They don't conflict (Prettier rules override ESLint formatting rules)

---

## Import Sorting

### Why sort imports?

1. **Consistency** — every file has the same import order
2. **Reduced merge conflicts** — imports don't shift around randomly
3. **Faster reviews** — reviewers know where to expect imports

### The plugin: `eslint-plugin-simple-import-sort`

```bash
npm run lint -- --fix
# → Auto-sorts all imports
```

### Sort order

```
1. Side-effect imports:     import './globals.css'
2. Third-party packages:    import React from 'react'
3. @/ path aliases:         import { Button } from '@/components/ui/button'
4. Relative imports:        import { Content } from './content'
5. Type imports:            import type { Props } from './types'
```

---

## Unit Testing with Vitest

### What is Vitest?

Vitest is a fast unit test runner built for Vite. It's the modern replacement for Jest.

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

### Test structure

```typescript
// src/lib/jwt.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getJWTPayload } from './jwt';

describe('getJWTPayload', () => {
  it('should decode a valid local JWT', async () => {
    const token = 'eyJhbG...'; // valid JWT
    const payload = await getJWTPayload(token);
    expect(payload.userId).toBe(1);
    expect(payload.role).toBe('STUDENT');
  });

  it('should throw on expired token', async () => {
    const expiredToken = 'eyJhbG...'; // expired JWT
    await expect(getJWTPayload(expiredToken)).rejects.toThrow();
  });

  it('should return null for missing token', () => {
    expect(getJWTPayload('')).toBeNull();
  });
});
```

### Running tests

```bash
npm run test           # Run all tests once
npm run test:watch     # Watch mode (re-runs on file change)
npm run test:coverage  # Run tests + show coverage report
```

### What to test

| Layer | What to test | Example |
|-------|-------------|---------|
| **Utility functions** | Pure functions with known inputs/outputs | JWT decode, date formatting, validation |
| **Server actions** | Auth checks, validation, error handling | `updateGrade` throws without auth |
| **Hooks** | State changes, side effects | `useTableSort` sorts correctly |
| **Components** | Rendering, user interactions | Form submits with valid data |

### What NOT to test

- **shadcn/ui components** — tested by the library
- **Prisma queries** — test against real DB (integration test)
- **Next.js internals** — framework handles its own testing

---

## E2E Testing with Playwright

### What is Playwright?

Playwright is a browser automation tool for end-to-end testing. It opens a real browser, navigates pages, clicks buttons, and verifies behavior.

### Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});
```

### Test structure

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('/uk/login');

  await page.fill('[name="username"]', 'admin');
  await page.fill('[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/uk\/module/);
  await expect(page.locator('h1')).toContainText('Dashboard');
});

test('invalid credentials show error', async ({ page }) => {
  await page.goto('/uk/login');

  await page.fill('[name="username"]', 'wrong');
  await page.fill('[name="password"]', 'wrong');
  await page.click('button[type="submit"]');

  await expect(page.locator('[role="alert"]')).toBeVisible();
});
```

### Running E2E tests

```bash
npm run test:e2e        # Run all E2E tests (headless)
npm run test:e2e:ui     # Run with UI (visible browser)
```

### Unit vs E2E tests

| Factor | Unit tests (Vitest) | E2E tests (Playwright) |
|--------|--------------------|-----------------------|
| Speed | Fast (<1s per test) | Slow (5-30s per test) |
| Scope | Single function/component | Full user flow |
| Environment | jsdom (simulated) | Real browser |
| Database | Mocked | Real database |
| When to run | Every save / CI | Before deploy / CI |
| Cost | Low | High (browser startup) |

---

## Test-Driven Development (TDD)

### The TDD cycle

```
1. RED:    Write a test that fails (feature doesn't exist yet)
2. GREEN:  Write minimal code to make the test pass
3. REFACTOR: Improve code while keeping tests green
```

### Example: Adding a new validation function

```typescript
// Step 1: RED — write test first
describe('validateGrade', () => {
  it('should accept grades 0-100', () => {
    expect(validateGrade(0)).toBe(true);
    expect(validateGrade(100)).toBe(true);
    expect(validateGrade(50)).toBe(true);
  });

  it('should reject grades outside 0-100', () => {
    expect(validateGrade(-1)).toBe(false);
    expect(validateGrade(101)).toBe(false);
  });
});

// Step 2: GREEN — write minimal implementation
export function validateGrade(grade: number): boolean {
  return grade >= 0 && grade <= 100;
}

// Step 3: REFACTOR — use Zod for consistency
import { z } from 'zod';
export const gradeSchema = z.number().min(0).max(100);
export const validateGrade = (grade: number) => gradeSchema.safeParse(grade).success;
```

### Why TDD?

1. **Tests are guaranteed** — you can't forget to write them
2. **Better design** — writing tests first forces you to think about the API
3. **Confidence** — when refactoring, tests catch regressions
4. **Documentation** — tests show how the code is supposed to be used

---

## Git Workflow

### Commit conventions

This project uses conventional commit messages:

```
feat:     new feature
fix:      bug fix
docs:     documentation only
refactor: code change that neither fixes a bug nor adds a feature
test:     adding or correcting tests
chore:    build process, auxiliary tools, dependencies
```

### Example commit

```
feat: add JWKS verification, refresh token rotation, SPOF fixes

Security & resilience improvements:

- Remote JWT: JWKS-based signature verification via jose library
  with 30s cooldown / 10min cache. Falls back to decode-only when
  JWKS_URI is not configured. getJWTPayload is now async.

- Refresh token rotation: short-lived access tokens (15min) +
  long-lived refresh tokens (30d) with automatic rotation on
  each refresh. Old tokens revoked in DB.

- Docker: uploads volume mount for persistent file storage.

- PostgreSQL schema: fully synced with SQLite schema.

- SPOF fixes: middleware try/catch fallback, error boundaries
  at [locale] and (public) route levels.

Verification: tsc --noEmit 0 errors, eslint 0 errors.
```

### Branch strategy

```
main          → production-ready code
develop       → integration branch (if needed)
feature/*     → new features (e.g., feature/refresh-tokens)
fix/*         → bug fixes (e.g., fix/hydration-mismatch)
```

---

## Continuous Integration (CI)

### What CI does

```
Push to repository → CI pipeline runs:
  1. npm install          (install dependencies)
  2. npm run tsc          (type check)
  3. npm run lint         (lint check)
  4. npm run test         (unit tests)
  5. npm run build        (production build)
  → All pass → deploy to staging
  → Any fail → block deploy, notify developer
```

### Why CI matters

- **Catches errors early** — type errors, lint violations, test failures
- **Consistent environment** — same Node version, same dependencies
- **No "works on my machine"** — CI runs in a clean container
- **Forces quality** — can't merge broken code

### CI for this project (recommended setup)

```yaml
# .github/workflows/ci.yml (example)
name: CI
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run tsc
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

---

## Docker-Based Deployment

### The deployment flow

```
Developer pushes code
  → CI runs tests
  → Tests pass
  → Build Docker image:
    docker compose build
  → Start services:
    docker compose up -d
  → Health check:
    curl http://localhost:3000/api/healthz
  → Ready check:
    curl http://localhost:3000/api/ready
```

### Docker vs traditional deployment

| Factor | Traditional (PM2, systemd) | Docker |
|--------|---------------------------|--------|
| Environment | "Works on my machine" risk | Identical everywhere |
| Dependencies | Install on server | Bundled in image |
| Rollback | Difficult | `docker compose down` + old image |
| Scaling | Manual process | `docker compose up --scale app=3` |
| Isolation | Shared OS | Container isolation |
| Resource limits | OS-level | Container-level (memory, CPU) |

---

## Environment Management

### Environment files

| File | Purpose | Git tracked? |
|------|---------|-------------|
| `.env.example` | Template with no real values | ✅ |
| `.env.docker.example` | Docker template | ✅ |
| `.env` | Local development values | ❌ (gitignored) |
| `.env.docker` | Docker deployment values | ❌ (gitignored) |
| `.env.production` | Production values | ❌ (gitignored) |

### Environment variable validation

```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  NEXT_PUBLIC_LOCAL_AUTH: z.string().optional(),
  JWKS_URI: z.string().url().optional(),
  JWT_ISSUER: z.string().optional(),
});

export const env = envSchema.parse(cleanEnv);
// → Throws at startup if any required var is missing/invalid
// → No runtime surprises (missing JWT_SECRET won't crash mid-request)
```

### The `NEXT_PUBLIC_` prefix rule

```
NEXT_PUBLIC_LOCAL_AUTH=true    → ✅ available in client AND server
JWT_SECRET=abc123              → ✅ server only (not in client bundle)
DATABASE_URL=file:./dev.db     → ✅ server only
```

**Without the prefix:** Variable is only available in server components, server actions, and API routes. If a client component tries to read it, it's `undefined`.

**With the prefix:** Variable is inlined into the client bundle at build time. Anyone can see it in the browser.

---

## Debugging Techniques

### 1. Server-side logging

```typescript
import { logger } from '@/lib/logger';

const authLogger = logger.createScoped('auth');

export async function login(username: string, password: string) {
  authLogger.info('Login attempt', { username });
  // ...
  if (!valid) {
    authLogger.warn('Login failed: invalid credentials', { username });
    return null;
  }
  authLogger.info('Login successful', { userId: user.id });
}
```

### 2. Prisma query logging

```typescript
// src/lib/prisma.ts
new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : ['error', 'warn'],
});
// Development: logs every SQL query
// Production: logs only errors and warnings
```

### 3. Prisma Studio

```bash
npm run db:studio
# → Opens http://localhost:5555
# → GUI for browsing and editing database records
```

### 4. React DevTools

- **Components tab** — inspect component tree, props, state
- **Profiler tab** — record renders, find performance bottlenecks

### 5. Next.js DevTools

```bash
# Next.js 15 has built-in dev indicators
# → Shows which components are server vs client
# → Shows render time per route
```

### 6. Network debugging

```typescript
// Log all API calls in development
if (process.env.NODE_ENV === 'development') {
  logger.info('API call', { url, method, status: response.status });
}
```

### Common debugging scenarios

| Problem | How to debug |
|---------|-------------|
| Hydration mismatch | Check `useEffect` vs render for browser APIs |
| "Cannot read property of undefined" | Check Prisma `select` vs `include` |
| Auth not working | Check cookie domain, JWT_SECRET, token expiry |
| Build fails | `npm run tsc` to find type errors |
| Lint fails | `npm run lint -- --fix` for auto-fixable issues |
| Test fails | Read error message, add `console.log` in test |
| DB query slow | Check indexes, use Prisma query logging |
| OOM (out of memory) | Check for memory leaks, increase Docker memory limit |

---

## Summary: The Quality Pipeline

```
Code written
  │
  ├─ IDE: TypeScript errors (real-time)
  ├─ IDE: ESLint warnings (real-time)
  │
  ├─ npm run tsc     → 0 type errors?
  ├─ npm run lint    → 0 lint errors?
  ├─ npm run test    → all tests pass?
  ├─ npm run build   → production build succeeds?
  │
  ├─ Docker build    → image builds?
  ├─ Health check    → /api/healthz returns 200?
  ├─ Ready check     → /api/ready returns 200?
  │
  └─ ✅ Deployed and monitored
```

Every step is a gate. If any step fails, the pipeline stops. This ensures that only quality code reaches production.
