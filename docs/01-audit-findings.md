# 01 — Full Codebase Audit (Industry-Standard, CWE-Mapped)

**Date:** 18.07.2026  
**Auditor:** Cascade AI  
**Project:** eCampus KPI (ecampus.kpi.ua)  
**Methodology:** `hft-skills/audit/security-cwe-audit`, `hft-skills/audit/code-review-checklist`, `hft-skills/audit/fault-tolerance-audit`, `hft-skills/audit/api-design-audit`, `hft-skills/audit/solid-checklist`, `hft-skills/audit/latency-audit`

---

## Summary

| Category | P0 Critical | P1 High | P2 Medium | P3 Low |
|----------|-------------|---------|-----------|--------|
| Security (CWE) | 4 | 4 | 2 | 0 |
| Code Quality (SOLID/CR) | 0 | 3 | 5 | 4 |
| Error Handling (FT) | 0 | 2 | 3 | 0 |
| Performance | 0 | 1 | 2 | 0 |
| Accessibility | 0 | 1 | 1 | 0 |
| Testing | 0 | 1 | 0 | 0 |
| Architecture / Dead Code | 0 | 0 | 3 | 2 |
| **Total** | **4** | **12** | **16** | **6** |

**Grand total: 38 issues** (4 critical, 12 high, 16 medium, 6 low)

---

## 1. Security (CWE Mapping)

> **Reference:** `hft-skills/audit/security-cwe-audit/SKILL.md` — CWE mapping, P0-P3 severity

---

### SEC-01 · CWE-347: JWT Without Signature Verification [P0 CRITICAL]

**File:** `src/lib/jwt.ts:6`  
**Also affected:** `src/actions/auth.actions.ts:17`, `src/middleware/utils.ts:64`

```typescript
// src/lib/jwt.ts — line 6
export const getJWTPayload = <T extends JwtPayload>(token: string) => {
  return JWT.decode(token, { json: true }) as T;  // decode = NO signature check
};
```

**Why this is a problem:**  
`JWT.decode()` parses the token without verifying the cryptographic signature. Anyone can craft a fake JWT with arbitrary `modules`, `exp`, and any other claims. This token is trusted for:
- `src/middleware/utils.ts:64` — module authorization (`payload.modules.includes(module)`)
- `src/middleware/authentication.middleware.ts:15` — authentication check (`payload.exp > dayjs().unix()`)
- `src/actions/menu.actions.ts:59` — menu construction from JWT modules
- `src/actions/auth.actions.ts:17` — cookie expiry extraction

**Impact:** Privilege escalation — any user can access any module by forging a JWT with `modules: ["admin", "announcementseditor", ...]`.

**CWE-347:** Improper Verification of Cryptographic Signature

**How to fix:**
```typescript
// Option A: If backend public key is available
import jwt from 'jsonwebtoken';
const publicKey = process.env.CAMPUS_JWT_PUBLIC_KEY!;
export const getJWTPayload = <T>(token: string): T => {
  return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as T;
};

// Option B: If key is unavailable — validate structure with Zod
import { z } from 'zod';
const JwtPayloadSchema = z.object({
  exp: z.number(),
  modules: z.array(z.string()),
});
export const getJWTPayload = <T>(token: string): T => {
  const decoded = JWT.decode(token, { json: true });
  return JwtPayloadSchema.parse(decoded) as T;
};
```

> **Reference:** `hft-skills/coding-skills/jwt-json-web-tokens/SKILL.md` — Anti-pattern: "No signature verification — Tampered token accepted."

---

### SEC-02 · CWE-614 + CWE-1004: Cookies Missing `secure` and `sameSite` [P0 CRITICAL]

**File:** `src/actions/auth.actions.ts:24-25`

```typescript
// src/actions/auth.actions.ts — lines 24-25
resolvedCookies.set(SID_COOKIE_NAME, sessionId, {
  domain: ROOT_COOKIE_DOMAIN, httpOnly: true, expires
  // MISSING: secure: true, sameSite: 'lax'
});
resolvedCookies.set(TOKEN_COOKIE_NAME, token, {
  domain: MAIN_COOKIE_DOMAIN, httpOnly: true, expires
  // MISSING: secure: true, sameSite: 'lax'
});
```

**Why this is a problem:**  
- Without `secure: true`, the browser sends the JWT cookie over plain HTTP if the user visits an `http://` URL — MITM attack vector.
- Without `sameSite: 'lax'`, the cookie is sent on cross-site requests — CSRF attack vector.

**CWE-614:** Sensitive Cookie in HTTPS Session Without 'Secure' Attribute  
**CWE-1004:** Sensitive Cookie Without 'HttpOnly' (httpOnly present, sameSite missing)

**How to fix:**
```typescript
resolvedCookies.set(TOKEN_COOKIE_NAME, token, {
  domain: MAIN_COOKIE_DOMAIN,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  expires,
});
```

---

### SEC-03 · CWE-79: Stored XSS via `dangerouslySetInnerHTML` [P0 CRITICAL]

**File:** `src/app/[locale]/(private)/module/msg/components/dialog/preview-dialog.tsx:47`

```tsx
// preview-dialog.tsx — line 47
<div
  className="pt-2 text-base leading-relaxed"
  dangerouslySetInnerHTML={{ __html: selectedMail.content }}
/>
```

**Why this is a problem:**  
Email/message content from the backend is rendered as raw HTML without sanitization. An attacker can send a message with `<script>` or `<img onerror>` tags, executing arbitrary JS in the victim's browser.

**Impact:** Session hijacking via API calls, defacement, data exfiltration from DOM.

**CWE-79:** Improper Neutralization of Input During Web Page Generation (XSS)

**How to fix:**
```typescript
// Option A: DOMPurify
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedMail.content) }} />

// Option B: Render as text (safest)
<div className="whitespace-pre-wrap">{selectedMail.content}</div>

// Option C: Markdown renderer
<ReactMarkdown>{selectedMail.content}</ReactMarkdown>
```

---

### SEC-04 · CWE-200: `.env.production` Not in `.gitignore` [P0 CRITICAL]

**File:** `.gitignore:61`

```gitignore
# dotenv environment variables file
.env
```

**Why this is a problem:**  
`.gitignore` only ignores `.env`, NOT `.env.production` or `.env.development`. These files contain production API URLs, cookie domains, reCAPTCHA key, GA ID. If committed to git, they are exposed.

**CWE-200:** Exposure of Sensitive Information to an Unauthorized Actor

**How to fix:**
```gitignore
.env
.env.*
!.env.example
```

---

### SEC-05 · CWE-601: Open Redirect [P1 HIGH]

**File:** `src/actions/auth.actions.ts:104-107`

```typescript
export async function redirectToEmploymentSystem() {
  const response = await campusFetch<string>('employment-system/auth');
  const url = await response.json();
  redirect(url);  // NO URL validation
}
```

**CWE-601:** URL Redirection to Untrusted Site

**How to fix:**
```typescript
if (!response.ok) throw new Error('Failed to get employment URL');
const url = await response.json();
const parsed = new URL(url);
if (!parsed.hostname.endsWith('.kpi.ua')) throw new Error('Untrusted redirect URL');
redirect(url);
```

---

### SEC-06 · CWE-1127: No Timeout on Fetch Requests [P1 HIGH]

**Files:** `src/lib/client.ts:31`, `src/lib/file-upload.ts:18`

No fetch request has a timeout. If backend is slow/unresponsive, serverless functions hang indefinitely.

**CWE-1127:** Excessive Attack Surface

**How to fix:**
```typescript
signal: AbortSignal.timeout(10000), // 10 second timeout
```

> **Reference:** `hft-skills/audit/fault-tolerance-audit/SKILL.md` — "No timeout: thread hangs forever"

---

### SEC-07 · CWE-693: No CSP or Security Headers [P1 HIGH]

**Files:** `next.config.mjs`, `src/middleware.ts`

No `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

**CWE-693:** Protection Mechanism Failure

**How to fix:** Add `headers()` to `next.config.mjs` with all recommended headers.

> **Reference:** `hft-skills/coding-skills/security-headers/SKILL.md` — full recommended headers set

---

### SEC-08 · CWE-307: No Rate Limiting on Auth Endpoints [P1 HIGH]

**Affected:** `loginWithCredentials`, `resetPassword`, `/api/kpi-id`  
No restriction on authentication attempt frequency — brute-force and spam possible.

**CWE-307:** Improper Restriction of Excessive Authentication Attempts

**How to fix:** `@upstash/ratelimit` — 5 attempts per 15 minutes per IP.

---

### SEC-09 · CWE-155: Sidebar Cookie Without Security Flags [P2 MEDIUM]

**File:** `src/components/ui/sidebar.tsx:76`

```typescript
document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
```

**CWE-155:** Improperly Controlled Modification of User-Controlled Cookie

**How to fix:** Add `; secure; samesite=lax`.

---

### SEC-10 · CWE-20: Unvalidated `X-Forwarded-For` Forwarding [P2 MEDIUM]

**File:** `src/lib/client.ts:38-39`

```typescript
'X-Forwarded-For': resolvedHeaders.get('x-forwarded-for') || '',
'X-Real-IP': resolvedHeaders.get('x-real-ip') || '',
```

Client can spoof IP address. Undermines IP-based rate limiting on backend.

**CWE-20:** Improper Input Validation

---

## 2. Code Quality (Code Review + SOLID)

> **Reference:** `hft-skills/audit/code-review-checklist/SKILL.md` — Categories A-J  
> **Reference:** `hft-skills/audit/solid-checklist/SKILL.md`

---

### CR-01 · Import Statement in the Middle of File [P1 HIGH]

**File:** `src/actions/auth.actions.ts:90`

```typescript
// line 90 — after 88 lines of code
import { USER_PROFILE_CACHE_TAG } from '@/lib/constants/cache-tags';
```

**How to fix:** Move to top of file with other imports.

---

### CR-02 · Typo in Filename `contants.ts` [P1 HIGH]

**File:** `src/middleware/contants.ts` — should be `constants.ts`  
**Affected imports:** `authentication.middleware.ts:5`, `authorization.middleware.ts:2`, `code-of-honor.middleware.ts:4`, `utils.ts:5`

**How to fix:** Rename file, update 4 imports, run `npm run build`.

---

### CR-03 · `TOAST_REMOVE_DELAY = 1000000` (~16 minutes) [P1 HIGH]

**File:** `src/hooks/use-toast.ts:9`

```typescript
const TOAST_REMOVE_DELAY = 1000000; // 16.7 minutes — shadcn/ui boilerplate default
```

**How to fix:** `const TOAST_REMOVE_DELAY = 5000;` (5 seconds)

---

### CR-04 · `useEffect` with `state` in Dependencies [P2 MEDIUM]

**File:** `src/hooks/use-toast.ts:180`

```typescript
}, [state]); // re-registers listener on every state change
```

**How to fix:** `}, []);`

---

### CR-05 · Duplicated SVG Configuration [P2 MEDIUM]

**File:** `next.config.mjs:7-31` (turbopack) and `next.config.mjs:56-93` (webpack)  
Same SVGO config written twice — DRY violation.

**How to fix:** Extract to shared variable.

---

### CR-06 · `any` Types [P2 MEDIUM]

**Files:**
- `src/app/api/responses.ts:3` — `data?: any`
- `src/i18n/request.tsx:9` — `locale as any`
- `src/types/global.d.ts:16` — `TypedResponse<T = any>`
- `src/app/[locale]/(private)/module/announcementseditor/components/announcements-table/announcements-table.tsx:34` — `as unknown as Array<...>`

**How to fix:** Replace with `unknown` or proper generics.

---

### CR-07 · `studysheet/[id]/page.tsx` — Client-Side Page with `useEffect` Fetch [P2 MEDIUM]

**File:** `src/app/[locale]/(private)/module/studysheet/[id]/page.tsx:1-47`

Only client-side `page.tsx` in the project. No SSR, no streaming, error swallowed in empty catch.

**How to fix:** Convert to server component, move interactivity to client component.

---

### CR-08 · Error Boundary Renders Empty Fragment [P2 MEDIUM]

**File:** `src/app/[locale]/(private)/error.tsx:13`

```typescript
return <></>; // user sees blank white page
```

**How to fix:** Add fallback UI with error message + `reset()` button.

---

### CR-09 · `SubLayout` Without `'use client'` Using Client Hook [P2 MEDIUM]

**File:** `src/app/[locale]/(private)/sub-layout.tsx`  
Uses `useTranslations` without `'use client'` directive — ambiguous.

---

### CR-10 · Mixed Component Declaration Styles [P3 LOW]

Function declarations vs arrow + const. AGENTS.md §6 recommends arrow form for new code.

---

### CR-11 · `Header` Uses Deprecated `FC` Type [P3 LOW]

**File:** `src/app/[locale]/(private)/header.tsx:3,24`  
`FC` is deprecated in React 19.

**How to fix:** `export const Header = ({ user }: Props) => {`

---

### CR-12 · Empty `catch` Block in `studysheet/[id]/page.tsx` [P3 LOW]

**File:** `src/app/[locale]/(private)/module/studysheet/[id]/page.tsx:41-43`  
Error silently swallowed, no user feedback.

---

### CR-13 · Empty `catch {}` in `print-certificate.ts` [P3 LOW]

**File:** `src/app/[locale]/(private)/module/facultycertificate/utils/print-certificate.ts:25`

```typescript
} catch {} // completely empty
```

---

## 3. Error Handling (Fault Tolerance)

> **Reference:** `hft-skills/audit/fault-tolerance-audit/SKILL.md`

---

### FT-01 · Inconsistent Error Handling Strategy in Actions [P1 HIGH]

Three different patterns: throw, return safe default, return null. No JSDoc contracts.

**How to fix:** Read → return safe default. Mutation → throw. Document with JSDoc.

> **Reference:** `hft-skills/coding-skills/error-handling-strategies/SKILL.md`

---

### FT-02 · `console.error` Without Structured Logging [P1 HIGH]

All actions use `console.error`. No correlation IDs, no log levels, no structured fields.

**How to fix:** Use `pino` or structured logger.

---

### FT-03 · `resetPassword` Replaces All Errors with "Bad request" [P2 MEDIUM]

**File:** `src/actions/auth.actions.ts:85-87`  
Network timeout, 500, 403 — all become "Bad request".

---

### FT-04 · `getContacts`/`getContactTypes` — No `response.ok` Check [P2 MEDIUM]

**File:** `src/actions/profile.actions.ts:10-18, 20-28`

---

### FT-05 · `redirectToEmploymentSystem` — No `response.ok` Check [P2 MEDIUM]

**File:** `src/actions/auth.actions.ts:104-107`

---

## 4. Performance

> **Reference:** `hft-skills/audit/latency-audit/SKILL.md`

---

### PERF-01 · `cache: 'no-cache'` Default in `campusFetch` [P1 HIGH]

**File:** `src/lib/client.ts:29`  
Every request bypasses cache. No ISR.

**How to fix:** Default `{ next: { revalidate: 300 } }` (5 min).

---

### PERF-02 · `images.unoptimized: true` [P2 MEDIUM]

**File:** `next.config.mjs:50`  
No WebP/AVIF, no responsive srcset, no lazy-loading.

---

### PERF-03 · `studysheet/[id]/page.tsx` — Client-Side Fetch [P2 MEDIUM]

No SSR, no streaming, loading screen on every visit.

---

## 5. Accessibility

---

### A11Y-01 · `<html>` Without `lang` Attribute [P1 HIGH]

**File:** `src/app/layout.tsx:15`  
Screen readers cannot determine page language. WCAG 2.1 Level A violation.

**How to fix:** `<html lang={locale}>` via dynamic layout.

---

### A11Y-02 · Insufficient `aria-label` on Interactive Elements [P2 MEDIUM]

Only 6 `aria-label` in project. Icon-only buttons (logout, dialog close) lack accessible names.

---

## 6. Testing

---

### TEST-01 · Zero Tests [P1 HIGH]

No unit, integration, or e2e tests. No testing framework configured.

> **Reference:** `hft-skills/coding-skills/refactoring-strategies/SKILL.md` — "Never refactor without tests"

**How to fix:** Install Vitest + Playwright. Write baseline tests for middleware and actions.

---

## 7. Architecture / Dead Code

> **Reference:** `hft-skills/audit/solid-checklist/SKILL.md`

---

### ARCH-01 · Storybook — 1 Story, ~50 MB Dependencies [P2 MEDIUM]

**Folders:** `.storybook/`, `src/stories/`

---

### ARCH-02 · Unused UI Components [P2 MEDIUM]

`accordion.tsx`, `dropdown-menu.tsx`, `switch.tsx` — not imported anywhere.

---

### ARCH-03 · Unused npm Dependencies [P2 MEDIUM]

`date-fns`, `react-day-picker`, `@tanstack/react-table` — not imported.

---

### ARCH-04 · `src/components/types.ts` — Unused File [P3 LOW]

One type `IconPosition`, zero imports.

---

### ARCH-05 · 159 SVG + 147 Icons — Potential Dead Code [P3 LOW]

Requires per-file analysis.

---

## 8. Files and Folders to Delete

### Safe to Delete

| Path | Reason |
|------|--------|
| `src/stories/Button.stories.tsx` | Only story, not used in CI |
| `.storybook/` | Storybook not used in production |
| `src/components/types.ts` | Unused file (1 type, 0 imports) |

### Delete After Verification

| Path | Reason |
|------|--------|
| `src/components/ui/accordion.tsx` | Not imported |
| `src/components/ui/dropdown-menu.tsx` | Not imported |
| `src/components/ui/switch.tsx` | Not imported |

### Remove from `package.json`

| Package | Reason |
|---------|--------|
| `date-fns` + `@types/date-fns` | Unused, dayjs is used |
| `react-day-picker` | Unused |
| `@tanstack/react-table` | Unused |
| `@chromatic-com/storybook` | Only for Storybook |
| `@storybook/*` (7 packages) | If removing Storybook |
| `storybook` | If removing Storybook |
| `eslint-plugin-storybook` | If removing Storybook |

---

## 9. FAANG-Level Audit: Maintainability & Resilience

### 9.1 Architectural Maintainability

| Criterion | Score | Notes |
|----------|-------|-------|
| SRP | 7/10 | `studysheet/[id]/page.tsx` violates |
| OCP | 8/10 | `modules.ts` registry pattern |
| DIP | 6/10 | `campusFetch` only abstraction |
| Consistent patterns | 7/10 | 11/12 server pages, 1 client |
| Error handling contract | 3/10 | 3 patterns, no JSDoc |
| Test coverage | 0/10 | 0% |
| Dead code ratio | 5/10 | 3 packages, 3 components, Storybook |
| Naming consistency | 6/10 | `contants.ts` typo, mixed styles |

**Overall maintainability: 5.3/10**

### 9.2 Security Hardening

| Control | Status | Priority |
|---------|--------|----------|
| JWT signature verification | Missing | P0 |
| Cookie security flags | Missing | P0 |
| XSS prevention (CSP + sanitize) | Missing | P0 |
| Secrets not in git | `.env.production` not gitignored | P0 |
| Rate limiting | Missing | P1 |
| Security headers | Missing | P1 |
| Open redirect prevention | Missing | P1 |
| Request timeout | Missing | P1 |
| Input validation on API routes | Partial | P2 |
| IP spoofing prevention | Missing | P2 |
| Structured logging | Missing | P1 |
| Error monitoring (Sentry) | Missing | P2 |
| Dependency vulnerability scanning | Dependabot only | P2 |
| CORS configuration | Missing | P2 |

### 9.3 Fault Tolerance & Resilience

| Category | Score |
|----------|-------|
| Timeout | 0/10 |
| Retry | 0/10 |
| Circuit breaker | 0/10 |
| Fallback | 3/10 |
| Health check | 5/10 |
| Graceful shutdown | 0/10 |
| State recovery | 7/10 |
| Error propagation | 4/10 |
| Monitoring & alerting | 1/10 |

**Overall resilience: 2.2/10**

### 9.4 API Design

| # | Criterion | Status |
|---|----------|--------|
| 1 | All endpoints require auth | `/api/healthz` open (OK) |
| 2 | Consistent error response format | 3 different patterns |
| 3 | Input validation on all endpoints | Zod on forms only |
| 4 | Rate limiting | None |
| 5 | No sensitive data in responses | `getKPIIDAccounts` returns `access_token` |
| 6 | CORS configured | None |
| 7 | Request/response logging | None |
| 8 | Pagination | `usePagination` + `PaginationWithLinks` |

### 9.5 Extensibility ("Nothing Breaks When Adding New Things")

| Scenario | Risk | Reason |
|----------|------|--------|
| New module | Low | Add to `modules.ts` + create folder |
| New server action | Medium | No error handling contract |
| New env variable | High | `process.env.X!` — no runtime validation |
| New page | Low | Server component pattern documented |
| New locale | Low | next-intl routing |
| API backend change | High | No typed API responses (some `any`) |
| Adding tests | High | No framework — configure from scratch |

---

## 10. Git Repository Location

The `.git` directory is at:
```
s:\VSC projects\ecampus-refactor\.git
```

To remove it (start fresh):
```cmd
rmdir /s /q "s:\VSC projects\ecampus-refactor\.git"
```

---

## 11. Verification of Other AI's Findings

| Finding | Confirmed | Comment |
|---------|-----------|---------|
| JWT without verification | Yes | `src/lib/jwt.ts:6` |
| Cookies without `secure` | Yes | `src/actions/auth.actions.ts:24-25` |
| No CSP | Yes | Not in middleware or next.config |
| No rate limiting | Yes | Not found |
| Import in middle of file | Yes | `src/actions/auth.actions.ts:90` |
| Typo `contants` | Yes | `src/middleware/contants.ts` |
| `TOAST_REMOVE_DELAY = 1000000` | Yes | `src/hooks/use-toast.ts:9` |
| `useEffect` with state in deps | Yes | `src/hooks/use-toast.ts:180` |
| SVG config duplication | Yes | `next.config.mjs` |
| Actions swallow errors | Yes | Inconsistent |
| No error boundaries | Partial | `error.tsx` renders `<></>` |
| `process.env.NEXT_PUBLIC_GA_ID!` | Yes | `src/app/layout.tsx:19` |
| Zero tests | Yes | Confirmed |
| `cache: 'no-cache'` | Yes | `src/lib/client.ts:29` |
| `images.unoptimized: true` | Yes | `next.config.mjs:50` |
| `<html>` without `lang` | Yes | `src/app/layout.tsx:15` |
| No `aria-label` | Yes | Only 6 occurrences |

### Additional Findings (Not Reported by Other AI)

| # | Finding | CWE | File | Severity |
|---|---------|-----|------|----------|
| +1 | `dangerouslySetInnerHTML` — stored XSS | CWE-79 | `preview-dialog.tsx:47` | P0 |
| +2 | `.env.production` not in `.gitignore` | CWE-200 | `.gitignore:61` | P0 |
| +3 | Open redirect | CWE-601 | `auth.actions.ts:107` | P1 |
| +4 | No timeout on fetch | CWE-1127 | `client.ts:31` | P1 |
| +5 | `sameSite` missing on cookies | CWE-1004 | `auth.actions.ts:24-25` | P0 |
| +6 | Sidebar cookie without security flags | CWE-155 | `sidebar.tsx:76` | P2 |
| +7 | `X-Forwarded-For` without validation | CWE-20 | `client.ts:38-39` | P2 |
| +8 | Empty `catch {}` in print-certificate | — | `print-certificate.ts:25` | P3 |
| +9 | `redirectToEmploymentSystem` no `response.ok` | — | `auth.actions.ts:104` | P2 |
| +10 | 20+ `process.env.X!` non-null assertions | CWE-20 | Multiple files | P2 |

---

## 12. Positive Aspects

- **TypeScript strict mode** — fully enabled
- **Server Actions** — correct architecture with `campusFetch` wrapper
- **i18n** — full localization via next-intl (uk/en)
- **ESLint + Prettier** — configured, import sorting
- **Docker multi-stage** — Node 22-alpine, standalone, non-root user
- **Dependabot** — weekly npm updates
- **CI/CD** — GitHub Actions build on PR and push
- **AGENTS.md / CLAUDE.md** — detailed convention documentation
- **shadcn/ui** — 42 UI components, consistent design
- **Zod + React Hook Form** — form validation
- **reCAPTCHA v3** — on password reset form
- **JWT in httpOnly cookies** — not accessible from JS
- **Health check endpoint** — `/api/healthz`
