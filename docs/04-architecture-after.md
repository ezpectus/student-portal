# 04 — Target Architecture After Refactoring

**Date:** 18.07.2026  
**Author:** Denys Stepanenko  

---

## Overview of Changes

Refactoring does not change the tech stack — it **eliminates weak points** and **unifies patterns**. The architecture remains Next.js App Router + Server Components + Server Actions, but with fixes for security, quality, performance, and testing.

---

## What Changes

| Layer | Before | After |
|-------|--------|-------|
| **JWT** | `decode()` without verification | Structure validation + exp + modules (or `verify()` if key available) |
| **Cookies** | `httpOnly` only | `httpOnly` + `secure` + `sameSite: 'lax'` (production) |
| **Security headers** | None | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| **Rate limiting** | None | Login/password reset: 5 attempts / 15 min |
| **Error handling** | 3 different patterns | 2 documented patterns: read → safe default, mutation → throw |
| **Caching** | `cache: 'no-cache'` default | `next: { revalidate: 300 }` default + tags for invalidation |
| **Images** | `unoptimized: true` | Documented decision (CDN or Next.js optimization) |
| **Error boundary** | `<></>` (empty) | Fallback UI with message + "try again" button |
| **`<html>`** | Without `lang` | `lang={locale}` |
| **Env vars** | `process.env.X!` (non-null) | Zod validation at startup, throw if invalid |
| **Tests** | 0 | Vitest (unit) + Playwright (e2e), coverage > 80% actions |
| **Dead code** | 3 unused packages, Storybook with 1 story | Cleaned up |
| **`studysheet/[id]`** | `'use client'` + `useEffect` fetch | Server component, data on server |

---

## Target Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Browser (Client)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  Pages   │  │ Components│  │  Hooks   │  │    Forms     │ │
│  │ (RSC +   │  │ (shadcn/  │  │(useToast,│  │(RHF + Zod)   │ │
│  │  Client) │  │  ui)      │  │usePagination│  │            │ │
│  └────┬─────┘  └──────────┘  └──────────┘  └──────────────┘ │
│       │  ✅ All page.tsx are server components                │
│  ─────┼────────────── Next.js App Router ────────────────── │
│       │  ✅ Error boundary with fallback UI                  │
│       │  ✅ <html lang={locale}>                             │
│  ┌────▼──────────────────────────────────────────────────┐   │
│  │              Server Actions (src/actions/)            │   │
│  │  ✅ Unified error handling:                           │   │
│  │     • Read → return safe default (empty array/null)   │   │
│  │     • Mutation → throw (client catches → toast)       │   │
│  │  ✅ JSDoc contract on each action                     │   │
│  └────┬──────────────────────────────────────────────────┘   │
│       │                                                       │
│  ┌────▼──────────────────────────────────────────────────┐   │
│  │           campusFetch (src/lib/client.ts)             │   │
│  │  ✅ Default: next: { revalidate: 300 } (5 min)        │   │
│  │  ✅ Tags for targeted invalidation                    │   │
│  │  ✅ JWT from cookies (httpOnly + secure + sameSite)    │   │
│  └────┬──────────────────────────────────────────────────┘   │
│       │                                                       │
│  ┌────▼──────────────────────────────────────────────────┐   │
│  │    Middleware (src/middleware/)                        │   │
│  │  ✅ JWT payload validation (structure + exp)          │   │
│  │  ✅ Security headers (CSP, HSTS, X-Frame, etc.)        │   │
│  │  ✅ Rate limiting on login/password reset              │   │
│  │  ✅ constants.ts (renamed from contants.ts)            │   │
│  └────┬──────────────────────────────────────────────────┘   │
│       │                                                       │
│  ┌────▼──────────────────────────────────────────────────┐   │
│  │    Env Validation (src/lib/env.ts) — NEW              │   │
│  │  ✅ Zod schema for all env variables                   │   │
│  │  ✅ Throw at startup if variables are invalid          │   │
│  └───────────────────────────────────────────────────────┘   │
│       │                                                       │
└───────┼───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│              Campus Backend API (REST)                         │
│  • JWT authentication                                          │
│  • Endpoints: /profile, /announcements, /certificates, ...    │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                    Testing Infrastructure                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│  │     Vitest       │  │  Playwright     │  │  GitHub       │ │
│  │  (unit tests)    │  │  (e2e tests)    │  │  Actions CI   │ │
│  │  • actions       │  │  • login flow   │  │  • build      │ │
│  │  • middleware    │  │  • certificates │  │  • lint       │ │
│  │  • hooks         │  │  • auth control │  │  • test       │ │
│  │  • lib/utils     │  │  • navigation   │  │  • e2e        │ │
│  └─────────────────┘  └─────────────────┘  └───────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

---

## Target Authentication Flow

```
┌─────────┐     ┌──────────┐     ┌────────────┐     ┌──────────┐
│  User   │────▶│  Login   │────▶│ Campus API │────▶│  JWT +   │
│ Browser │     │  Page    │     │  (REST)    │     │ SessionID│
└─────────┘     └──────────┘     └────────────┘     └────┬─────┘
                    │                                    │
                    │  ✅ Rate limiting: 5 attempts/15m  │
                    │                                    ▼
┌─────────────────────────────────────────────────────────────┐
│  setLoginCookies()                                           │
│  ✅ ecampus-token (JWT) → httpOnly + secure + sameSite=lax   │
│  ✅ SID (session ID)   → httpOnly + secure + sameSite=lax   │
│  • Domain: MAIN_COOKIE_DOMAIN / ROOT_COOKIE_DOMAIN           │
│  • Expires: from JWT.exp                                     │
└─────────────────────────────────────────────────────────────┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Middleware (every request)                                  │
│  ✅ Security headers: CSP, HSTS, X-Frame-Options, ...        │
│  1. intl.middleware → locale detection                       │
│  2. authentication.middleware → JWT payload validation:       │
│     ✅ Structure check (modules: string[], exp: number)   │
│     ✅ Check exp > now                                       │
│     • If expired/invalid → redirect to /login               │
│  3. code-of-honor.middleware → check honor signed            │
│  4. authorization.middleware → check modules from JWT        │
│     • payload.modules.includes(requestedModule)              │
│     • If unauthorized → redirect to /not-found               │
└─────────────────────────────────────────────────────────────┘
```

---

## Target Error Handling Strategy

> **Reference:** `hft-skills/coding-skills/error-handling-strategies/SKILL.md`

### Read Operations (GET data for display)

```typescript
/**
 * @returns Safe default on error: { items: [], total: 0 }
 * @throws Never — errors are logged and swallowed
 */
export async function getAnnouncements(): Promise<{ items: Announcement[]; total: number }> {
  try {
    const response = await campusFetch<Announcement[]>('announcements', {
      next: { revalidate: 300, tags: ['announcements'] },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const items = await response.json();
    return { items, total: items.length };
  } catch (error) {
    logger.error('getAnnouncements failed', { error });
    return { items: [], total: 0 };
  }
}
```

### Mutations (create, update, delete)

```typescript
/**
 * @throws Error on failure — caller must catch and show toast
 */
export async function deleteAnnouncement(id: number): Promise<void> {
  const response = await campusFetch(`announcements/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  revalidatePath('/module/announcementseditor');
}
```

### Client Code

```typescript
// Read: just use data (empty state if error)
const { items, total } = await getAnnouncements();

// Mutation: try/catch with toast
try {
  await deleteAnnouncement(id);
  toast({ title: t('delete.success') });
} catch {
  errorToast();
}
```

---

## Target File Structure (changes)

```
src/
├── lib/
│   ├── env.ts                        # NEW: Zod env validation
│   ├── client.ts                     # CHANGED: default revalidate: 300
│   ├── jwt.ts                        # CHANGED: payload validation
│   └── logger.ts                     # NEW: structured logging (optional)
├── middleware/
│   ├── constants.ts                  # RENAMED from contants.ts
│   └── ...
├── actions/
│   └── *.actions.ts                  # CHANGED: unified error handling
├── app/
│   ├── layout.tsx                    # CHANGED: <html lang={locale}>
│   └── [locale]/
│       └── (private)/
│           ├── error.tsx             # CHANGED: fallback UI instead of <></>
│           └── module/
│               └── studysheet/
│                   └── [id]/
│                       ├── page.tsx          # CHANGED: server component
│                       └── components/
│                           └── study-sheet-client.tsx  # NEW: client tabs
├── __tests__/                        # NEW: Vitest unit tests
│   ├── actions/
│   ├── middleware/
│   ├── hooks/
│   └── lib/
└── ...

e2e/                                  # NEW: Playwright e2e tests
├── login.spec.ts
├── certificates.spec.ts
└── auth.spec.ts

# REMOVED:
# .storybook/
# src/stories/
# src/components/types.ts
# date-fns, react-day-picker, @tanstack/react-table from package.json
```

---

## CI/CD Pipeline (target)

```yaml
# .github/workflows/ci.yml
name: CI

on: [pull_request, push]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node 22
      - npm ci
      - npm run lint

  test-unit:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node 22
      - npm ci
      - npm run test

  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup-node 22
      - npm ci
      - npx playwright install
      - npm run build
      - npm run e2e

  build:
    runs-on: ubuntu-latest
    needs: [lint, test-unit]
    steps:
      - checkout
      - setup-node 22
      - npm ci
      - npm run build
```

---

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Tests | 0 | > 100 (unit + e2e) |
| Action coverage | 0% | > 80% |
| Middleware coverage | 0% | > 90% |
| Security headers | 0 | 8+ (CSP, HSTS, X-Frame, etc.) |
| `any` types | 7+ | 0 |
| Unused npm packages | 3+ | 0 |
| Error boundaries with UI | 0 | 1 (private routes) |
| `<html lang>` | No | Yes |
| `secure` cookies | No | Yes (production) |
| Cache strategy | no-cache | revalidate: 300 default |
| Server component pages | 11/12 | 12/12 |
