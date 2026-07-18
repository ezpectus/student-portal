# 03 — Refactoring Pipeline

**Date:** 18.07.2026  
**Author:** Denys Stepanenko  

---

## Principles

> **Reference:** `hft-skills/coding-skills/refactoring-strategies/SKILL.md` — Safe Refactoring Workflow:
> 1. Ensure tests exist and pass (if no tests → write tests first)
> 2. Make ONE small refactoring (1-5 lines)
> 3. Run tests (must still pass)
> 4. Commit (atomic, "refactor: extract calcFee function")
> 5. Repeat
>
> **Never refactor and fix bugs in the same commit.**  
> **Never refactor without tests.**  
> **Never refactor large chunks without running tests in between.**

### Commit Rules

- Each commit is atomic (one issue = one commit)
- Prefix: `fix:`, `refactor:`, `chore:`, `feat:`, `docs:`, `test:`
- Refactoring commits don't change behavior
- Bug fix commits don't change structure

---

## Phase 0: Preparation

**Goal:** Prepare repository and baseline security for refactoring.

| # | Task | Files | Definition of Done |
|---|------|-------|-------------------|
| 0.1 | Initialize Git repository | — | `git init`, initial commit, push to GitHub |
| 0.2 | Set up Vitest | `vitest.config.ts`, `src/__tests__/` | `npm run test` works, 1 smoke test passes |
| 0.3 | Set up Playwright | `playwright.config.ts`, `e2e/` | `npm run e2e` works, 1 smoke test (homepage loads) |
| 0.4 | Write baseline tests for middleware | `src/__tests__/middleware/` | Tests for auth, authorization, code-of-honor middleware |
| 0.5 | Write baseline tests for actions | `src/__tests__/actions/` | Tests for auth.actions (login, logout, getUserDetails) |

**Why tests first:** Without tests, refactoring = risk of breaking production. See anti-pattern: "Refactoring without tests — May break behavior silently."

---

## Phase 1: Critical Security Fixes

**Goal:** Eliminate 4 critical vulnerabilities.

| # | Task | Files | Priority | Definition of Done |
|---|------|-------|----------|-------------------|
| 1.1 | Add `secure: true, sameSite: 'lax'` to cookies (production) | `src/actions/auth.actions.ts:24-25` | P0 Critical | Cookies not sent over HTTP (use `secure: process.env.NODE_ENV === 'production'`) |
| 1.2 | Add JWT payload structure validation | `src/lib/jwt.ts` | P0 Critical | `getJWTPayload` validates `exp`, `modules` (type + presence). Invalid payload → throw |
| 1.3 | Sanitize `dangerouslySetInnerHTML` | `src/app/[locale]/(private)/module/msg/components/dialog/preview-dialog.tsx:47` | P0 Critical | Content sanitized with DOMPurify before rendering |
| 1.4 | Fix `.gitignore` for `.env.production` | `.gitignore` | P0 Critical | `.env.*` ignored, only `.env.example` allowed |
| 1.5 | Add CSP headers | `next.config.mjs` (headers()) | P1 High | `Content-Security-Policy` in response headers. Start with `report-only` |
| 1.6 | Add HSTS, X-Frame-Options, X-Content-Type-Options | `next.config.mjs` | P1 High | All security headers from `hft-skills/coding-skills/security-headers/SKILL.md` |
| 1.7 | Add rate limiting on login/password reset | `src/actions/auth.actions.ts` | P1 High | Max 5 attempts / 15 min per IP. Use `@upstash/ratelimit` |
| 1.8 | Add fetch timeout | `src/lib/client.ts:31` | P1 High | `AbortSignal.timeout(10000)` on every request |
| 1.9 | Validate redirect URL | `src/actions/auth.actions.ts:107` | P1 High | URL validated against trusted domain before `redirect()` |

> **Reference JWT:** `hft-skills/coding-skills/jwt-json-web-tokens/SKILL.md` — Token Validation: verify signature, check exp, iss, aud. Anti-pattern: "No signature verification — Tampered token accepted."  
> **Reference Headers:** `hft-skills/coding-skills/security-headers/SKILL.md` — recommended headers set.

---

## Phase 2: Dead Code Cleanup

**Goal:** Reduce tech debt, remove unused code.

| # | Task | Files | Definition of Done |
|---|------|-------|-------------------|
| 2.1 | Rename `contants.ts` → `constants.ts` | `src/middleware/contants.ts` + 4 imports | File renamed, all imports updated, build passes |
| 2.2 | Move import from middle of file | `src/actions/auth.actions.ts:90` | Import at top, build passes |
| 2.3 | Fix `TOAST_REMOVE_DELAY` | `src/hooks/use-toast.ts:9` | Value set to `5000` (5 sec) |
| 2.4 | Fix `useEffect` deps in `use-toast.ts` | `src/hooks/use-toast.ts:180` | `[]` instead of `[state]` |
| 2.5 | Remove unused npm dependencies | `package.json` | `date-fns`, `react-day-picker`, `@tanstack/react-table` removed, `npm install` passes |
| 2.6 | Delete `src/components/types.ts` | `src/components/types.ts` | File deleted, build passes |
| 2.7 | Decide on Storybook | `.storybook/`, `src/stories/`, `package.json` | Either remove or add stories for all UI components |
| 2.8 | Remove unused UI components (optional) | `accordion.tsx`, `dropdown-menu.tsx`, `switch.tsx` | Removed if not planned, build passes |

> **Reference:** `hft-skills/coding-skills/technical-debt-management/SKILL.md` — prioritize debt by impact and effort.

---

## Phase 3: Code Quality

**Goal:** Unify patterns, fix convention violations.

| # | Task | Files | Definition of Done |
|---|------|-------|-------------------|
| 3.1 | Unify error handling in actions | All `src/actions/*.actions.ts` | Read operations with empty state → return safe default. Mutations → throw. Contract documented in JSDoc |
| 3.2 | Add `response.ok` checks in `getContacts`/`getContactTypes` | `src/actions/profile.actions.ts` | Check `response.ok` before `response.json()` |
| 3.3 | Fix `resetPassword` error handling | `src/actions/auth.actions.ts:85-87` | Real error propagated, not replaced with "Bad request" |
| 3.4 | Validate env variables at startup | `src/lib/env.ts` (new) | Zod schema for all env variables, throw if invalid |
| 3.5 | Remove `any` types | `src/app/api/responses.ts:3`, `src/i18n/request.tsx:9` | Replaced with generics / `unknown` |
| 3.6 | Convert `studysheet/[id]/page.tsx` to server component | `src/app/[locale]/(private)/module/studysheet/[id]/page.tsx` | `page.tsx` is server, data fetched on server, client component only for tabs |
| 3.7 | Add fallback UI to error boundary | `src/app/[locale]/(private)/error.tsx` | Renders error message + "try again" button (using `reset()` from Next.js) |
| 3.8 | Add `lang` attribute to `<html>` | `src/app/layout.tsx` or `src/app/[locale]/layout.tsx` | `<html lang={locale}>` via dynamic layout or middleware |
| 3.9 | Add `aria-label` to icon-only buttons | `header.tsx`, dialogs, tables | All interactive elements without text have `aria-label` |
| 3.10 | Replace `FC` with direct type | `src/app/[locale]/(private)/header.tsx` | `FC<Props>` → `({ user }: Props)` |

> **Reference:** `hft-skills/coding-skills/error-handling-strategies/SKILL.md` — Error Categories (Transient, Permanent, Critical, Expected). Anti-pattern: "Catch and ignore — Silent failures, bugs hidden."

---

## Phase 4: Performance

**Goal:** Enable caching and optimization.

| # | Task | Files | Definition of Done |
|---|------|-------|-------------------|
| 4.1 | Change default cache strategy in `campusFetch` | `src/lib/client.ts:29` | Default: `{ next: { revalidate: 300 } }` (5 min) instead of `cache: 'no-cache'` |
| 4.2 | Add `next: { revalidate }` to read-only actions | All `*.actions.ts` read operations | Each read operation explicitly specifies revalidate or tags |
| 4.3 | Enable image optimization (or document reason) | `next.config.mjs:50` | Either `unoptimized: false` + remote patterns, or documented reason for keeping `true` |
| 4.4 | Extract SVG config to shared variable | `next.config.mjs` | SVGO config in variable, used in both turbopack and webpack |

---

## Phase 5: Testing

**Goal:** Cover critical logic with tests.

| # | Task | Files | Definition of Done |
|---|------|-------|-------------------|
| 5.1 | Unit tests for all actions | `src/__tests__/actions/` | Each action has tests: success + error cases |
| 5.2 | Unit tests for middleware | `src/__tests__/middleware/` | Auth, authorization, code-of-honor fully covered |
| 5.3 | Unit tests for hooks | `src/__tests__/hooks/` | useToast, usePagination, useTableSort |
| 5.4 | Integration tests for auth flow | `src/__tests__/integration/` | Login → cookies set → middleware passes → logout → cookies cleared |
| 5.5 | E2E: login flow | `e2e/login.spec.ts` | Playwright: credentials login → dashboard visible |
| 5.6 | E2E: certificate request | `e2e/certificates.spec.ts` | Playwright: navigate to certificates → request → see in history |
| 5.7 | E2E: module access control | `e2e/auth.spec.ts` | Student can't access admin modules → redirect to not-found |

> **Reference:** `hft-skills/coding-skills/refactoring-strategies/SKILL.md` — "Always have tests before refactoring. Make small, atomic changes (1-5 lines per step). Run tests after each step."

---

## Phase Sequence Diagram

```
Phase 0: Preparation
  │
  │  git init + Vitest + Playwright + baseline tests
  │
  ▼
Phase 1: Security (critical)
  │
  │  cookies secure + JWT validation + XSS fix + CSP + rate limiting + timeout
  │
  ▼
Phase 2: Cleanup
  │
  │  rename + dead code removal + toast fix
  │
  ▼
Phase 3: Code Quality
  │
  │  error handling unification + env validation + a11y + server component fix
  │
  ▼
Phase 4: Performance
  │
  │  cache strategy + image optimization
  │
  ▼
Phase 5: Testing (full coverage)
  │
  │  unit + integration + e2e
  │
  ▼
Ready for production
```

---

## Definition of Done

- [ ] `npm run build` passes without errors
- [ ] `npm run lint` passes without errors
- [ ] `npm run test` — all tests green
- [ ] `npm run e2e` — all e2e tests green
- [ ] Security headers present (verify via securityheaders.com)
- [ ] Cookies have `secure` and `sameSite` in production
- [ ] JWT payload validated (not just decoded)
- [ ] No `any` types in production code
- [ ] No unused npm dependencies
- [ ] All `page.tsx` are server components (except justified exceptions)
- [ ] Error boundary renders fallback UI
- [ ] `<html>` has `lang` attribute
- [ ] Test coverage: actions > 80%, middleware > 90%
