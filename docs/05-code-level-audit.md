# 05 — Code-Level Audit: Every Issue with File, Line, and Fix

**Date:** 18.07.2026  
**Scope:** `src/` — all TypeScript/TSX files  
**Method:** Line-by-line grep + manual review of every source file

---

## Table of Contents

1. [Security (P0–P3)](#1-security-p0p3)
2. [Code Quality & Conventions](#2-code-quality--conventions)
3. [Error Handling](#3-error-handling)
4. [Performance](#4-performance)
5. [Accessibility](#5-accessibility)
6. [React Anti-Patterns](#6-react-anti-patterns)
7. [Dead Code & Dependencies](#7-dead-code--dependencies)
8. [Testing](#8-testing)
9. [Positive Aspects](#9-positive-aspects)

---

## 1. Security (P0–P3)

### P0-01. Stored XSS via `dangerouslySetInnerHTML` [CWE-79]

**File:** `src/app/[locale]/(private)/module/msg/components/dialog/preview-dialog.tsx:47`

```tsx
<div
  className="pt-2 text-base leading-relaxed"
  dangerouslySetInnerHTML={{ __html: selectedMail.content }}
/>
```

**Problem:** Email content (`selectedMail.content`) is rendered as raw HTML without sanitization. If an attacker sends a message containing `<script>` or `<img onerror=...>`, the script executes in the user's browser when they preview the message. This is a stored XSS — the payload persists in the backend and triggers on every preview.

**Impact:** Session hijacking, token theft, credential exfiltration, defacement.

**Fix:** Install `dompurify` and sanitize before rendering:
```tsx
import DOMPurify from 'dompurify';
// ...
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedMail.content) }}
```

---

### P0-02. JWT decoded without signature verification [CWE-345]

**File:** `src/lib/jwt.ts:6`

```ts
export const getJWTPayload = <T extends JwtPayload>(token: string) => {
  return JWT.decode(token, { json: true }) as T;
};
```

**Problem:** `JWT.decode()` only base64-decodes the payload — it does NOT verify the signature. Any user can craft a fake JWT with arbitrary `modules` array and `exp` value. The `as T` cast suppresses the null return type, hiding cases where decode fails.

**Used in:**
- `src/middleware/utils.ts:64` — `getJWTPayload<CampusJwtPayload>(token)` for auth decisions
- `src/actions/auth.actions.ts:17` — `JWT.decode(token) as { exp: number }` for cookie expiry

**Impact:** Privilege escalation — user can add any module to their JWT and access restricted pages. Authentication bypass — user can set `exp` to a far-future timestamp.

**Fix:** If the backend public key is available, use `JWT.verify()`. If not, at minimum validate the payload structure:
```ts
export const getJWTPayload = <T extends JwtPayload>(token: string): T | null => {
  const payload = JWT.decode(token, { json: true });
  if (!payload || typeof payload.exp !== 'number') return null;
  return payload as T;
};
```

---

### P0-03. Cookies missing `secure` and `sameSite` flags [CWE-614, CWE-1004]

**File:** `src/actions/auth.actions.ts:24-25`

```ts
resolvedCookies.set(SID_COOKIE_NAME, sessionId, { domain: ROOT_COOKIE_DOMAIN, httpOnly: true, expires });
resolvedCookies.set(TOKEN_COOKIE_NAME, token, { domain: MAIN_COOKIE_DOMAIN, httpOnly: true, expires });
```

**Problem:** `httpOnly` is set (good — prevents XSS access), but `secure` and `sameSite` are missing. Without `secure`, cookies are sent over plaintext HTTP (MITM risk). Without `sameSite`, cookies are sent on cross-site requests (CSRF risk).

**Impact:** Token interception over HTTP, CSRF attacks.

**Fix:**
```ts
resolvedCookies.set(SID_COOKIE_NAME, sessionId, {
  domain: ROOT_COOKIE_DOMAIN,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  expires,
});
```

---

### P0-04. `.env.production` not gitignored [CWE-200]

**File:** `.gitignore:61`

```
# dotenv environment variables file
.env
```

**Problem:** Only `.env` is ignored. `.env.production` (which exists in the repo root and contains API URLs, cookie domains, reCAPTCHA key, GA ID) is NOT ignored. If committed, production secrets leak to anyone with repo access.

**Fix:** Change to `.env*` or add `.env.production` explicitly:
```
.env*
!.env.example
```

---

### P1-05. No Content-Security-Policy headers [CWE-1021]

**File:** `next.config.mjs` (entire file — no `headers()` config)

**Problem:** No CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, or Permissions-Policy headers are set anywhere. The app is vulnerable to clickjacking, MIME sniffing, and data exfiltration.

**Fix:** Add to `next.config.mjs`:
```js
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'Content-Security-Policy', value: "default-src 'self'; ..." },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ],
  }];
}
```

---

### P1-06. No rate limiting on auth endpoints [CWE-307]

**Files:**
- `src/actions/auth.actions.ts:28` — `loginWithCredentials`
- `src/actions/auth.actions.ts:68` — `resetPassword`
- `src/app/api/kpi-id/route.ts:7` — `GET` handler

**Problem:** No rate limiting on login or password reset. An attacker can brute-force passwords or spam password reset requests indefinitely.

**Fix:** Use `@upstash/ratelimit` or middleware-based in-memory rate limiting (e.g., 5 attempts per 15 minutes per IP).

---

### P1-07. Open redirect via unvalidated URL [CWE-601]

**File:** `src/actions/auth.actions.ts:104-107`

```ts
export async function redirectToEmploymentSystem() {
  const response = await campusFetch<string>('employment-system/auth');
  const url = await response.json();
  redirect(url);
}
```

**Problem:** The `url` from the backend response is passed directly to `redirect()` without validation. If the backend is compromised or the response is tampered with, the user could be redirected to a malicious site.

**Fix:** Validate the URL domain before redirecting:
```ts
const parsed = new URL(url);
if (!parsed.hostname.endsWith('.kpi.ua')) throw new Error('Invalid redirect URL');
redirect(url);
```

---

### P1-08. No fetch timeout [CWE-1127]

**Files:**
- `src/lib/client.ts:31` — `await fetch<T>(input, { ... })`
- `src/lib/file-upload.ts:18` — `await fetch(input, { ... })`

**Problem:** No `AbortSignal.timeout()` or timeout mechanism. If the backend hangs, the request hangs indefinitely, consuming server resources.

**Fix:**
```ts
const response = await fetch(input, {
  ...options,
  signal: AbortSignal.timeout(10000), // 10s timeout
});
```

---

### P1-09. IP header forwarding without validation [CWE-20]

**File:** `src/lib/client.ts:38-39`

```ts
'X-Forwarded-For': resolvedHeaders.get('x-forwarded-for') || '',
'X-Real-IP': resolvedHeaders.get('x-real-ip') || '',
```

**Problem:** `X-Forwarded-For` and `X-Real-IP` headers from the incoming request are forwarded to the backend without validation. A client can spoof these headers to fake their IP address, potentially bypassing IP-based rate limiting or logging.

**Fix:** Only trust these headers if the request comes from a known proxy. Otherwise, use `request.ip` or strip the headers.

---

### P2-10. Non-null assertions on environment variables [CWE-758]

**Files (15 occurrences):**
- `src/lib/client.ts:49` — `process.env.CAMPUS_API_BASE_PATH!`
- `src/lib/file-upload.ts:38` — `process.env.CAMPUS_API_BASE_PATH!`
- `src/app/layout.tsx:19` — `process.env.NEXT_PUBLIC_GA_ID!`
- `src/components/suggestions-form.tsx:6` — `process.env.NEXT_PUBLIC_SUGGESTIONS_FORM!`
- `src/components/not-found-page.tsx:33` — `process.env.NEXT_PUBLIC_KBIS_URL!`
- `src/components/app-sidebar/footer.tsx:38` — `process.env.NEXT_PUBLIC_KBIS_URL!`
- `src/app/[locale]/(private)/kpi-documents/page.tsx:32,38,44,50` — 4 env vars with `!`
- `src/app/[locale]/(private)/user-manual/page.tsx:9` — `process.env.NEXT_PUBLIC_USER_MANUAL_URL!`
- `src/app/[locale]/(private)/student-manual/page.tsx:11` — `process.env.NEXT_PUBLIC_STUDENT_MANUAL_URL!`
- `src/app/[locale]/(private)/cards/information-card.tsx:21,26,31,36,41,46` — 6 env vars with `!`
- `src/app/[locale]/(private)/cards/social-networks-card.tsx:26,35,44,53` — 4 env vars with `!`
- `src/app/[locale]/(private)/contacts/page.tsx:39,44,49,54,59,64` — 6 env vars with `!`
- `src/app/[locale]/(public)/validate-certificate/certificate-verifier.tsx:126` — `process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_LINK!`
- `src/widgets/faq/frequently-asked-questions.tsx:24` — `process.env.NEXT_PUBLIC_CAMPUS_DOCUMENT_TEMPLATE!`

**Problem:** The `!` non-null assertion operator suppresses TypeScript's null check. If an env var is missing, the value is `undefined` at runtime, causing silent failures (empty base URL, GA with `gaId="undefined"`, broken links).

**Fix:** Create `src/lib/env.ts` with Zod validation:
```ts
import { z } from 'zod';
const envSchema = z.object({
  CAMPUS_API_BASE_PATH: z.string().url(),
  NEXT_PUBLIC_GA_ID: z.string(),
  // ... all env vars
});
export const env = envSchema.parse(process.env);
```

---

### P2-11. `loginWithCredentials` returns `null` on failure without error info [CWE-209]

**File:** `src/actions/auth.actions.ts:43-44`

```ts
if (response.status < 200 || response.status >= 300) {
  return null;
}
```

**Problem:** All non-2xx responses (401, 403, 500, network error) return `null`. The client cannot distinguish between wrong password and server error. No logging of the actual status code.

**Fix:** Log the status, return a typed error:
```ts
if (!response.ok) {
  console.error('Login failed:', response.status);
  return { error: 'invalid-credentials' };
}
```

---

### P2-12. `resetPassword` replaces all errors with "Bad request" [CWE-209]

**File:** `src/actions/auth.actions.ts:85-87`

```ts
} catch (error) {
  throw new Error('Bad request');
}
```

**Problem:** Network timeout, 500, 502, and actual 400 are all replaced with "Bad request". The client never knows the real cause.

**Fix:** Re-throw the original error or create specific error types:
```ts
} catch (error) {
  if (error instanceof Error) throw error;
  throw new Error('Unknown error');
}
```

---

## 2. Code Quality & Conventions

### Q-01. Import statement in the middle of the file

**File:** `src/actions/auth.actions.ts:90`

```ts
import { USER_PROFILE_CACHE_TAG } from '@/lib/constants/cache-tags';
```

**Problem:** This import appears after 89 lines of code, violating AGENTS.md §5: "Imports must always be at the top of the file." ESLint may not catch this if import sorting is configured but mid-file imports aren't flagged.

**Fix:** Move to the top of the file with other imports.

---

### Q-02. Filename typo: `contants.ts` should be `constants.ts`

**File:** `src/middleware/contants.ts`

**Problem:** The filename is misspelled. It's imported in 4 files:
- `src/middleware/authentication.middleware.ts:5`
- `src/middleware/authorization.middleware.ts:2`
- `src/middleware/code-of-honor.middleware.ts:4`
- `src/middleware/utils.ts:5`

**Fix:** Rename to `constants.ts` and update all 4 imports.

---

### Q-03. `TOAST_REMOVE_DELAY = 1000000` (~16.7 minutes)

**File:** `src/hooks/use-toast.ts:9`

```ts
const TOAST_REMOVE_DELAY = 1000000;
```

**Problem:** Toast notifications remain in the DOM for ~16.7 minutes after being dismissed. This is the default shadcn/ui boilerplate value that was never customized. Memory leak: dismissed toast components stay mounted.

**Fix:** `const TOAST_REMOVE_DELAY = 5000;` (5 seconds)

---

### Q-04. `useEffect` with `state` in dependencies

**File:** `src/hooks/use-toast.ts:180`

```ts
React.useEffect(() => {
  listeners.push(setState);
  return () => {
    const index = listeners.indexOf(setState);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}, [state]);
```

**Problem:** `state` is in the dependency array, so the effect re-runs (unregister + re-register listener) on every state change. This is wasteful — the listener registration should only happen once.

**Fix:** Remove `state` from deps: `}, []);`

---

### Q-05. `any` type in API response helpers

**File:** `src/app/api/responses.ts:3`

```ts
export const okResponse = (data?: any) =>
```

**Fix:** Use a generic: `export const okResponse = <T = unknown>(data?: T) =>`

---

### Q-06. `as any` cast in i18n locale check

**File:** `src/i18n/request.tsx:9`

```ts
if (!locale || !routing.locales.includes(locale as any)) {
```

**Fix:** `if (!locale || !routing.locales.includes(locale as string))`

---

### Q-07. `as unknown as` double cast in table sort

**File:** `src/app/[locale]/(private)/module/announcementseditor/components/announcements-table/announcements-table.tsx:34`

```ts
['title', 'start'] as unknown as Array<keyof AdminAnnouncementItem & string>,
```

**Problem:** Double cast bypasses type safety entirely. If the keys don't match the actual sortable fields, sorting will silently fail.

**Fix:** Use proper typing for the `useTableSort` generic parameter.

---

### Q-08. `FC` type in Header (deprecated in React 19)

**File:** `src/app/[locale]/(private)/header.tsx:3,24`

```ts
import { FC, useEffect, useRef, useState } from 'react';
// ...
export const Header: FC<Props> = ({ user }) => {
```

**Problem:** `FC` (FunctionComponent) is deprecated in React 19. The rest of the codebase uses direct prop typing: `({ user }: Props)`.

**Fix:**
```ts
import { useEffect, useRef, useState } from 'react';
export const Header = ({ user }: Props) => {
```

---

### Q-09. `SubLayout` uses `useTranslations` without `'use client'`

**File:** `src/app/[locale]/(private)/sub-layout.tsx:10,20`

```tsx
import { useTranslations } from 'next-intl';
// ...
export const SubLayout = ({ children, breadcrumbs = [], pageTitle, className }: SubLayoutProps) => {
  const t = useTranslations('global.menu');
```

**Problem:** No `'use client'` directive, but uses `useTranslations` (which works in both server and client contexts with next-intl). This creates ambiguity — the component is imported by both server `page.tsx` files and client components. It works but is confusing for maintainers.

**Fix:** Either add `'use client'` or document that this is a server-compatible component.

---

### Q-10. `TODO` and `FIXME` comments left in code

**Files:**
- `src/middleware/code-of-honor.middleware.ts:10` — `// TODO: Refactor to not use actions here`
- `src/app/[locale]/(private)/student-manual/page.tsx:9` — `// TODO: remove this page when the manual is ready for lecturers`
- `src/app/[locale]/(public)/(auth)/password-reset/password-reset-form.tsx:13-15` — `// FIXME: This version of recaptcha library should be replace with official one`
- `src/app/[locale]/(public)/(auth)/password-reset/layout.tsx:3-5` — Same FIXME

**Problem:** TODOs and FIXMEs indicate incomplete work. The recaptcha FIXME is especially concerning — using a non-official library (`react19-google-recaptcha-v3`) for security-critical functionality.

**Fix:** Track these as issues. For recaptcha, migrate to the official `react-google-recaptcha-v3` when React 19 support lands.

---

### Q-11. `console.error` used for all error logging (no structured logging)

**Files (20+ occurrences):**
- `src/actions/announcement.actions.ts:51,66,90,110,127,143,156,169,182`
- `src/actions/certificates.actions.ts:90`
- `src/actions/colleague-contacts.actions.ts:12,18,28,34`

**Problem:** All errors are logged via `console.error` with string concatenation. No structured logging, no correlation IDs, no log levels. In production, these get mixed into stdout/stderr without filtering capability.

**Fix:** Use a structured logger (e.g., `pino` or `winston`) with JSON output, log levels, and request correlation IDs.

---

### Q-12. Duplicate SVG configuration in `next.config.mjs`

**File:** `next.config.mjs:7-31` (turbopack) and `next.config.mjs:56-93` (webpack)

**Problem:** The same SVGO config (`removeViewBox: false`) is duplicated for Turbopack and webpack. If one is updated, the other may be forgotten.

**Fix:** Extract to a shared variable:
```js
const svgoConfig = { plugins: [{ name: 'preset-default', params: { overrides: { removeViewBox: false } } }] };
```

---

## 3. Error Handling

### E-01. Inconsistent error handling strategy across actions

**Files:** All `src/actions/*.actions.ts` (14 files)

**Problem:** Three different patterns coexist:

| Pattern | Files | Behavior |
|---------|-------|----------|
| **Throw** on non-OK | `certificates.actions.ts`, `msg.actions.ts`, `attestation.actions.ts`, `rating.actions.ts`, `monitoring.actions.ts`, `term.actions.ts`, `settings.actions.ts` | Client catches, shows toast |
| **Return safe default** | `announcement.actions.ts`, `menu.actions.ts`, `colleague-contacts.actions.ts` | Client never sees error |
| **Return null** | `auth.actions.ts` (`loginWithCredentials`, `getUserDetails`) | Client must null-check |

AGENTS.md §3 documents two patterns, but they're not applied consistently.

**Fix:** Unify: read operations with empty state → return safe default. Mutations → throw. Document the contract in JSDoc on each action.

---

### E-02. `getContacts` / `getContactTypes` — no `response.ok` check

**File:** `src/actions/profile.actions.ts:10-18, 20-28`

```ts
export async function getContacts() {
  try {
    const response = await campusFetch<Contact[]>('profile/contacts');
    return response.json();  // ← no response.ok check
  } catch (error) {
    return [];
  }
}
```

**Problem:** If the server returns 401/403/500, `response.json()` may throw (if body isn't JSON) or return an error object that doesn't match `Contact[]`. The catch returns `[]`, hiding the error.

**Fix:**
```ts
if (!response.ok) return [];
return response.json();
```

---

### E-03. `profile.actions.ts` — all mutations throw generic errors

**File:** `src/actions/profile.actions.ts:39,52,64,77,87,99`

```ts
} catch (error) {
  throw new Error('Error while creating contact');
}
```

**Problem:** Every mutation catches the original error and throws a new generic one. The original error (network timeout, 401, 500, validation error) is lost. The client only sees "Error while creating contact" with no actionable information.

**Fix:** Re-throw the original error or include the original in the new error:
```ts
} catch (error) {
  throw new Error('Error while creating contact', { cause: error });
}
```

---

### E-04. `studysheet/[id]/page.tsx` — empty catch block

**File:** `src/app/[locale]/(private)/module/studysheet/[id]/page.tsx:41-43`

```ts
} catch (error) {
  setIsLoading(false);
}
```

**Problem:** Error is silently swallowed. No toast, no error state, no logging. User sees a blank page (line 54: `if (!creditModule) return null;`).

**Fix:**
```ts
} catch (error) {
  errorToast();
  setIsLoading(false);
}
```

---

### E-05. Error boundary renders empty fragment

**File:** `src/app/[locale]/(private)/error.tsx:13`

```tsx
return <></>;
```

**Problem:** When a rendering error occurs in any private route, the user sees a blank white page. A toast is shown (line 10), but if the toast system itself is broken, there's zero feedback. No recovery option (no "try again" button).

**Fix:**
```tsx
return (
  <div className="flex flex-col items-center justify-center min-h-screen gap-4">
    <Heading2>{t('error.title')}</Heading2>
    <Paragraph>{t('error.description')}</Paragraph>
    <Button onClick={reset}>{t('error.retry')}</Button>
  </div>
);
```

---

### E-06. `codeOfHonor.middleware.ts` — catches all errors and continues

**File:** `src/middleware/code-of-honor.middleware.ts:33-35`

```ts
} catch (error) {
  return authorizationMiddleware(request);
}
```

**Problem:** If `getUserDetails()` fails (network error, 500, timeout), the middleware silently falls through to authorization. This means a backend outage could bypass the code-of-honor enforcement — users who haven't signed the honor code get access.

**Fix:** On error, redirect to a safe page or show an error page. Don't silently proceed.

---

## 4. Performance

### P-01. `cache: 'no-cache'` as default in `campusFetch`

**File:** `src/lib/client.ts:29`

```ts
const cacheOption = 'next' in otherOptions ? {} : { cache: 'no-cache' as const };
```

**Problem:** Unless the caller explicitly passes `next: { ... }`, every request bypasses cache. This means:
- No ISR for pages using `campusFetch` without `next: { revalidate }`
- Duplicate requests for the same endpoint
- Slower page loads

**Fix:** Change default to `{ next: { revalidate: 300 } }` (5 minutes) or remove the `cache` option entirely (Next.js defaults to `force-cache` for server components).

---

### P-02. `images.unoptimized: true`

**File:** `next.config.mjs:50`

```js
unoptimized: true,
```

**Problem:** Image optimization is fully disabled. No WebP/AVIF conversion, no responsive `srcset`, no lazy-loading via Next.js Image. Larger payload for mobile devices.

**Fix:** Set `unoptimized: false` and configure `remotePatterns` (already done on lines 35-48). Or document the reason if CDN handles optimization.

---

### P-03. `studysheet/[id]/page.tsx` — client-side fetch instead of SSR

**File:** `src/app/[locale]/(private)/module/studysheet/[id]/page.tsx:1,35-47`

```tsx
'use client';
// ...
useEffect(() => {
  async function fetchData() {
    const data = await getMonitoringById(id as string);
```

**Problem:** This is the only `page.tsx` in the project marked `'use client'`. It fetches data via `useEffect` instead of server-side rendering. Consequences:
- No SSR data (blank loading screen on first render)
- No streaming
- Server action (`getMonitoringById`) runs as a client-to-server RPC call
- Violates the project pattern where all `page.tsx` are server components

**Fix:** Convert to a server component. Move the tab logic to a client component child.

---

### P-04. `study-sheet.tsx` — also client-side fetch

**File:** `src/app/[locale]/(private)/module/studysheet/components/study-sheet.tsx:1,41-43`

```tsx
'use client';
// ...
useEffect(() => {
  fetchData();
}, []);
```

**Problem:** Same pattern as P-03. The `StudySheet` component is a client component that fetches data via `useEffect`. The parent `page.tsx` (`studysheet/page.tsx`) is a server component but just renders `<StudySheet />` without fetching data.

**Fix:** Fetch data in `page.tsx` (server) and pass as props.

---

## 5. Accessibility

### A-01. `<html>` tag has no `lang` attribute

**File:** `src/app/layout.tsx:15`

```tsx
<html>
```

**Problem:** Screen readers cannot determine the page language. For a bilingual (uk/en) app, this is critical. WCAG 2.1 Level A: 3.1.1 Language of Page.

**Fix:** Since this is the root layout where locale isn't directly available, use the `[locale]/layout.tsx` to set `lang` dynamically, or use middleware to set the header.

---

### A-02. Icon-only buttons missing `aria-label`

**File:** `src/app/[locale]/(private)/header.tsx:82`

```tsx
<Button variant="secondary" icon={<SignOut />} onClick={handleLogout} />
```

**Problem:** The logout button has no text or `aria-label`. Screen readers announce it as "button" with no context. A `TooltipContent` exists (line 84) but tooltip ≠ `aria-label`.

**Other affected:** Dialog close buttons, table action buttons throughout the app.

**Fix:** Add `aria-label={t('button.logout')}` to the button.

---

### A-03. Only 6 `aria-label` instances in the entire codebase

**Problem:** A grep for `aria-label` across `src/` returns only 6 results (in `pagination.tsx`, `breadcrumb.tsx`, `password-input.tsx`, `sidebar.tsx`). Many interactive elements lack accessible names.

**Fix:** Audit all icon-only buttons, close buttons, and interactive non-text elements. Add `aria-label` to each.

---

## 6. React Anti-Patterns

### R-01. `key={index}` used in 14 list renders

**Files:**
- `src/app/[locale]/(private)/module/vedomoststud/components/table.tsx:59`
- `src/app/[locale]/(private)/module/facultycertificate/components/all-docs-table.tsx:99`
- `src/app/[locale]/(private)/module/studysheet/components/disciplines-table.tsx:49`
- `src/app/[locale]/(private)/module/studysheet/[id]/components/internal-materials-table.tsx:36`
- `src/app/[locale]/(private)/module/studysheet/[id]/components/journal-table.tsx:45`
- `src/app/[locale]/(private)/module/studysheet/[id]/components/external-materials-table.tsx:36`
- `src/app/[locale]/(private)/module/studysheet/[id]/components/event-plan-table.tsx:32`
- `src/app/[locale]/(private)/module/kurator/page.tsx:63`
- `src/app/[locale]/(private)/module/directory/components/colleague-card.tsx:38`
- `src/app/[locale]/(private)/module/attestationresults/page.tsx:53`
- `src/app/[locale]/(private)/module/certificates/components/request-certificate-form.tsx:78`
- `src/app/[locale]/(private)/profile/components/info-list.tsx:16`
- `src/app/[locale]/(private)/profile/components/lecturer-info.tsx:38`
- `src/app/[locale]/(private)/cards/announcements-card/announcements-carousel.tsx:53`
- `src/lib/utils.tsx:44` — `linkifyText` function

**Problem:** Using array index as `key` causes rendering bugs when items are reordered, inserted, or deleted. React may reuse the wrong DOM nodes, causing stale state.

**Fix:** Use a unique identifier from the data (e.g., `key={item.id}` or `key={item.name}`).

---

### R-02. `useEffect` with empty deps and missing `fetchData` dep

**File:** `src/app/[locale]/(private)/module/studysheet/components/study-sheet.tsx:41-43`

```tsx
useEffect(() => {
  fetchData();
}, []);
```

**Problem:** `fetchData` is defined with `useCallback` (line 30) but not listed in deps. If `fetchData` changes, the effect won't re-run. This may cause stale closures.

**Fix:** Either add `fetchData` to deps or inline the fetch logic.

---

### R-03. `header.tsx` — `useEffect` with `[user]` deps and `sleep(5000)`

**File:** `src/app/[locale]/(private)/header.tsx:37-51`

```tsx
useEffect(() => {
  const deferProfileImageUpdate = async () => {
    await sleep(5000);
    setProfilePhotoUrl();
  };
  if (firstRender.current) {
    setProfilePhotoUrl();
    firstRender.current = false;
  } else {
    deferProfileImageUpdate();
  }
}, [user]);
```

**Problem:** On every `user` prop change, the component waits 5 seconds then updates the photo URL. This is a workaround for CDN cache purging. The `sleep(5000)` blocks the effect, and if the component unmounts during the sleep, `setProfilePhotoUrl` is called on an unmounted component (React warning).

**Fix:** Use a cleanup timeout:
```tsx
useEffect(() => {
  const timer = setTimeout(() => setProfilePhotoUrl(), 5000);
  return () => clearTimeout(timer);
}, [user]);
```

---

### R-04. `Suspense` without fallback

**File:** `src/app/[locale]/(private)/notice-board/page.tsx:33-35`

```tsx
<Suspense>
  <NoticeList announcements={announcements} />
</Suspense>
```

**Problem:** `<Suspense>` without a `fallback` prop renders `null` while suspended. User sees a blank area with no loading indicator.

**Also in:** `src/app/[locale]/(public)/header.tsx:14-16` and `src/app/[locale]/(public)/(auth)/password-reset/success/page.tsx:45-47`

**Fix:** Add a fallback: `<Suspense fallback={<LoadingScreen />}>`

---

## 7. Dead Code & Dependencies

### D-01. Unused npm dependencies

| Package | Version | Evidence |
|---------|---------|----------|
| `date-fns` | 4.1.0 | Zero imports across `src/` — `dayjs` is used everywhere |
| `react-day-picker` | 9.11.0 | Zero imports across `src/` |
| `@tanstack/react-table` | 8.21.3 | Zero imports across `src/` — custom `useTableSort` hook is used instead |

**Fix:** Remove from `package.json` and run `npm install`.

---

### D-02. Storybook with only 1 story

**Files:** `.storybook/` (config), `src/stories/Button.stories.tsx` (only story)

**Problem:** Storybook 8.6.12 is installed with all dependencies (~50 MB in `node_modules`), but there's only one story for `Button`. Not used in CI/CD.

**Fix:** Either commit to Storybook (add stories for all 42 UI components) or remove it entirely.

---

### D-03. Unused file: `src/components/types.ts`

**File:** `src/components/types.ts`

```ts
export type IconPosition = 'start' | 'end';
```

**Problem:** Single type export, zero imports across the entire codebase.

**Fix:** Delete the file.

---

### D-04. Unused UI components (candidates for removal)

| Component | Imported outside itself? |
|-----------|--------------------------|
| `src/components/ui/accordion.tsx` | No |
| `src/components/ui/dropdown-menu.tsx` | No (only self-references) |
| `src/components/ui/switch.tsx` | No |

**Fix:** Remove if not planned for near-term use.

---

## 8. Testing

### T-01. Zero tests in the entire project

**Problem:** No unit tests, no integration tests, no e2e tests. No testing framework configured. `CLAUDE.md` confirms: "No testing framework currently configured."

Storybook is installed but is not a testing tool.

**Risk:** Any refactoring or fix could silently break behavior. The middleware (auth, authorization, code-of-honor) is security-critical and completely untested.

**Fix:**
1. Install Vitest: `npm install -D vitest @testing-library/react jsdom`
2. Install Playwright: `npm install -D @playwright/test`
3. Write baseline tests for middleware first (auth, authorization)
4. Write baseline tests for `auth.actions.ts` (login, logout, getUserDetails)
5. Add `npm run test` and `npm run e2e` to CI pipeline

---

## 9. Positive Aspects

The project has solid foundations:

- **TypeScript strict mode** — `strict`, `noUnusedLocals`, `noUnusedParameters`, `strictNullChecks` all enabled
- **Server Actions architecture** — `'use server'` + `campusFetch` wrapper is the correct Next.js pattern
- **i18n** — Full localization via `next-intl` (uk/en), 2 message files
- **ESLint + Prettier** — Configured with `eslint-plugin-simple-import-sort`
- **Docker multi-stage build** — Node 22-alpine, standalone output, non-root user
- **Dependabot** — Weekly npm dependency updates
- **CI/CD** — GitHub Actions build on PR and push
- **AGENTS.md / CLAUDE.md** — Detailed convention documentation
- **shadcn/ui** — 42 UI components, consistent design system
- **Zod + React Hook Form** — Form validation with schema
- **reCAPTCHA v3** — On password reset form
- **JWT in httpOnly cookies** — Not accessible from JavaScript (but needs signature verification)
- **Health check endpoint** — `/api/healthz`
- **`'server-only'` import in jwt.ts** — Prevents client-side usage

---

## Summary: Issue Count by Severity

| Severity | Count | Categories |
|----------|-------|------------|
| **P0 Critical** | 4 | XSS, JWT, cookies, env leak |
| **P1 High** | 5 | CSP, rate limiting, open redirect, timeout, IP spoofing |
| **P2 Medium** | 2 | Env validation, error info loss |
| **Code Quality** | 12 | Imports, typo, toast, deps, types, FC, TODOs, logging, SVG dup |
| **Error Handling** | 6 | Inconsistent strategy, missing checks, generic errors, empty catch, error boundary, middleware catch |
| **Performance** | 4 | No cache, unoptimized images, client-side fetch (×2) |
| **Accessibility** | 3 | No lang, missing aria-label, insufficient aria-labels |
| **React Anti-Patterns** | 4 | key={index} (×14), useEffect deps, sleep in effect, Suspense without fallback |
| **Dead Code** | 4 | 3 npm packages, Storybook, unused file, unused components |
| **Testing** | 1 | Zero tests |
| **i18n (new)** | 5 | Hardcoded UA strings, missing setRequestLocale, missing generateMetadata |
| **Navigation (new)** | 3 | Missing loading.tsx, missing Suspense fallback, hardcoded redirect paths |
| **Security: target=_blank** | 1 | 7 links missing rel="noopener noreferrer" (CWE-1022) |
| **Architecture & Infra** | 12 | Radix direct import, FC+async, loading inconsistency, notFound vs redirect, async in client component, row click fetch, div onClick, setTimeout leak, router without locale, no HEALTHCHECK, no engines, no test script |
| **Total** | **66** | |

---

## 10. Internationalization (i18n) Issues

### I-01. Hardcoded Ukrainian strings in source code (bypasses i18n)

**File:** `src/lib/constants/employment-type.ts:4-8`

```ts
export const EMPLOYMENT_TYPE = {
  [EmploymentType.Unknown]: 'невідомо',
  [EmploymentType.FullTime]: 'основне',
  [EmploymentType.PartTime]: 'сумісник',
  [EmploymentType.PartTimeInternal]: 'внутрішній сумісник',
  [EmploymentType.PartTimeExternal]: 'зовнішній сумісник',
};
```

**Problem:** Ukrainian strings are hardcoded instead of using translation keys. When the app is in English, these will still display in Ukrainian.

**Fix:** Move to translation files under `global.enums.*` and use `useTranslations` / `getTranslations`.

---

**File:** `src/components/ui/locale-switch.tsx:26`

```tsx
return <LocaleOption text="Перейти на українську" icon={<FlagUA />} />;
```

**Problem:** Hardcoded Ukrainian text for the locale switch button. Should use translation key.

**Fix:** Use `t('switch-to-ukrainian')` from translation files.

---

**File:** `src/components/ui/pagination.tsx:68`

```tsx
<span>Далі</span>
```

**Problem:** Hardcoded "Далі" (Ukrainian for "Next"). Should use translation key.

**Fix:** Use `t('next')` from translation files.

---

**File:** `src/app/[locale]/(private)/module/facultycertificate/page.content.tsx:81`

```tsx
placeholder="Пошук за імʼям студента, призначенням..."
```

**Problem:** Hardcoded Ukrainian placeholder text in a client component. Bypasses i18n entirely.

**Fix:** Use `t('search-placeholder')` from translation files.

---

**File:** `src/app/[locale]/(public)/(auth)/login-carousel.tsx:19-79`

```ts
const IMAGES: CarouselImage[] = [
  { src: 'img1.jpg', description: 'Корпус № 1 КПІ ім. Ігоря Сікорського', ... },
  // ... 10 images, all with Ukrainian descriptions
];
```

**Problem:** 10 carousel image descriptions are hardcoded in Ukrainian. No i18n.

**Fix:** Move descriptions to translation files or fetch from CMS.

---

### I-02. Missing `setRequestLocale()` in 10+ page components

**Problem:** `setRequestLocale(locale)` is required by `next-intl` for static rendering optimization. It's called in some pages but not others:

**Pages WITH `setRequestLocale`:**
- `src/app/[locale]/layout.tsx:55`
- `src/app/[locale]/(private)/module/directory/page.tsx:24`
- `src/app/[locale]/(private)/user-manual/page.tsx:26`
- `src/app/[locale]/(private)/student-manual/page.tsx:28`
- `src/app/[locale]/(private)/terms-of-service/page.tsx:22`
- `src/app/[locale]/(private)/notice-board/page.tsx:24`
- `src/app/[locale]/(private)/kpi-documents/page.tsx:23`
- `src/app/[locale]/(private)/frequently-asked-questions/page.tsx:29`
- `src/app/[locale]/(private)/contacts/page.tsx:25`
- `src/app/[locale]/(private)/about/page.tsx:22`

**Pages MISSING `setRequestLocale`:**
- `src/app/[locale]/(private)/module/announcementseditor/page.tsx`
- `src/app/[locale]/(private)/module/announcementseditor/create/page.tsx`
- `src/app/[locale]/(private)/module/announcementseditor/[id]/edit/page.tsx`
- `src/app/[locale]/(private)/module/attestationresults/page.tsx`
- `src/app/[locale]/(private)/module/certificates/page.tsx`
- `src/app/[locale]/(private)/module/employment/page.tsx`
- `src/app/[locale]/(private)/module/facultycertificate/page.tsx`
- `src/app/[locale]/(private)/module/facultycertificate/[id]/page.tsx`
- `src/app/[locale]/(private)/module/kurator/page.tsx`
- `src/app/[locale]/(private)/module/msg/page.tsx`
- `src/app/[locale]/(private)/module/rating/page.tsx`
- `src/app/[locale]/(private)/module/studysheet/page.tsx`
- `src/app/[locale]/(private)/module/studysheet/[id]/page.tsx`
- `src/app/[locale]/(private)/module/vedomoststud/page.tsx`
- `src/app/[locale]/(private)/profile/page.tsx`
- `src/app/[locale]/(private)/settings/page.tsx`

**Impact:** These pages cannot be statically rendered. Every request forces dynamic rendering, degrading performance.

**Fix:** Add `setRequestLocale(locale)` to every page component that receives `params`.

---

### I-03. Missing `generateMetadata` in 2 module pages

**Files:**
- `src/app/[locale]/(private)/module/facultycertificate/[id]/page.tsx` — no `generateMetadata`
- `src/app/[locale]/(private)/module/studysheet/[id]/page.tsx` — no `generateMetadata` (also a client component, so can't have one)

**Problem:** These pages have no `<title>` or `<meta>` tags. SEO and browser tab titles are empty.

**Fix:** Add `generateMetadata` to server component pages. For `studysheet/[id]`, convert to server component first (see P-03).

---

## 11. Navigation & UX Issues

### N-01. Missing `loading.tsx` in 7 module directories

**Problem:** Only 5 of 12 module directories have `loading.tsx`:

**Have `loading.tsx`:**
- `announcementseditor`, `attestationresults`, `directory`, `msg`, `vedomoststud`

**Missing `loading.tsx`:**
- `certificates`, `employment`, `facultycertificate`, `facultycertificate/[id]`, `kurator`, `rating`, `studysheet`, `studysheet/[id]`

**Impact:** When navigating to these pages, users see a blank screen during server-side data fetching. No loading indicator.

**Fix:** Add `loading.tsx` to each missing directory:
```tsx
import { LoadingScreen } from '@/components/loading-screen';
export default function Loading() {
  return <LoadingScreen />;
}
```

---

### N-02. `studysheet/[id]/page.tsx` — `useParams()` returns `string | string[]`, cast to `string`

**File:** `src/app/[locale]/(private)/module/studysheet/[id]/page.tsx:23,38`

```tsx
const { id } = useParams();
// ...
const data = await getMonitoringById(id as string);
```

**Problem:** `useParams()` returns `Record<string, string | string[]>`. The `id` could be an array if the URL has multiple segments. The `as string` cast hides this.

**Fix:** Use `useParams<{ id: string }>()` or validate: `const id = Array.isArray(rawId) ? rawId[0] : rawId;`

---

### N-03. `facultycertificate/page.content.tsx` — hardcoded redirect path without locale

**File:** `src/app/[locale]/(private)/module/facultycertificate/page.content.tsx:52`

```tsx
router.push(`/module/facultycertificate?${qs.stringify(params)}`);
```

**Problem:** The URL doesn't include the locale prefix. In a localized app, this should use `router.push` from `@/i18n/routing` which auto-prefixes the locale, or include the locale manually.

**Fix:** Use `useRouter` from `@/i18n/routing` instead of `next/navigation`:
```tsx
import { useRouter } from '@/i18n/routing';
```

---

## 12. Security: `target="_blank"` without `rel="noopener noreferrer"` [CWE-1022]

### S-01. 7 `target="_blank"` links missing `rel="noopener noreferrer"`

**Problem:** `target="_blank"` without `rel="noopener noreferrer"` allows the opened page to access `window.opener`, potentially redirecting the original page to a malicious URL (reverse tabnabbing). Next.js `<Link>` component auto-injects `rel="noopener"` for external links, but only when it detects an external URL. For internal-looking paths or dynamic URLs, it may not.

**Affected files:**

| File | Line | Element |
|------|------|---------|
| `src/widgets/faq/frequently-asked-questions.tsx` | 24 | `<Link href={process.env.NEXT_PUBLIC_CAMPUS_DOCUMENT_TEMPLATE!} target="_blank">` |
| `src/components/not-found-page.tsx` | 33 | `<Link href={process.env.NEXT_PUBLIC_KBIS_URL!} target="_blank">` |
| `src/components/app-sidebar/footer.tsx` | 38 | `<Link href={process.env.NEXT_PUBLIC_KBIS_URL!} target="_blank">` |
| `src/app/[locale]/(public)/footer.tsx` | 21 | `<Link href={process.env.NEXT_PUBLIC_KBIS_URL!} target="_blank">` |
| `src/app/[locale]/(private)/notice-board/components/notice.tsx` | 26 | `<Link href={announcement.link?.uri \|\| ''} target="_blank">` |
| `src/app/[locale]/(public)/validate-certificate/certificate-verifier.tsx` | 126 | `<Link href={process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_LINK!} target="_blank">` |
| `src/app/[locale]/(private)/accept-code-of-honor/page.tsx` | 34 | `<Link target="_blank" href={process.env.NEXT_PUBLIC_CODE_OF_HONOR!}>` |

**Fix:** Add `rel="noopener noreferrer"` to every `target="_blank"` link.

---

## 13. Architecture & Infrastructure Issues

### A-01. `msg/page.tsx` imports Radix Tabs directly instead of using `@/components/ui/tabs`

**File:** `src/app/[locale]/(private)/module/msg/page.tsx:10`

```tsx
import { Tabs, TabsList, TabsContent } from '@radix-ui/react-tabs';
```

**Problem:** The project has a `@/components/ui/tabs.tsx` wrapper that adds styling and variants. This page bypasses the wrapper and imports Radix directly, getting unstyled tabs. The `TabSheetTrigger` (line 9) comes from the wrapper, but `Tabs`, `TabsList`, and `TabsContent` come from Radix. This is inconsistent — `compose.tsx:1` correctly imports all from `@/components/ui/tabs`.

**Fix:** Replace with:
```tsx
import { Tabs, TabsList, TabsContent, TabSheetTrigger } from '@/components/ui/tabs';
```

---

### A-02. `SupportCard` uses deprecated `FC` type and is `async`

**File:** `src/app/[locale]/(private)/cards/support-card.tsx:8,14`

```tsx
import { FC } from 'react';
export const SupportCard: FC<Props> = async ({ className }) => {
```

**Problem:** `FC` is deprecated in React 19. Also, `FC` and `async` don't mix — `FC` expects a synchronous return, but `async` returns a `Promise`. This type-checks only because of loose typing in `FC`.

**Fix:**
```tsx
export const SupportCard = async ({ className }: Props) => {
```

---

### A-03. `loading.tsx` files are inconsistent

**Files:**
- `src/app/[locale]/(private)/module/msg/loading.tsx:4` — `export default async function` (async for no reason — no awaits)
- Other loading files use `LoadingScreen` component, this one uses a raw `<SpinnerGap />`

**Problem:** The `msg/loading.tsx` is marked `async` but doesn't await anything. It also uses a different loading UI than the rest of the app (`LoadingScreen`).

**Fix:** Use `LoadingScreen` and remove `async`:
```tsx
import { LoadingScreen } from '@/components/loading-screen';
export default function MsgLoading() {
  return <LoadingScreen />;
}
```

---

### A-04. `private/layout.tsx` calls `notFound()` when user is null

**File:** `src/app/[locale]/(private)/layout.tsx:16-19`

```tsx
const user = await getUserDetails();
if (!user) {
  notFound();
}
```

**Problem:** When `getUserDetails()` returns null (e.g., JWT expired, backend down), the user sees a 404 page instead of being redirected to login. The middleware should have caught this, but if the backend goes down between middleware and layout, the user gets a confusing 404.

**Fix:** Redirect to login instead:
```tsx
if (!user) {
  redirect('/login');
}
```

---

### A-05. `msg/page.tsx` — `Compose` is an async server component rendered inside `<TabsContent>`

**File:** `src/app/[locale]/(private)/module/msg/page.tsx:63-64`

```tsx
<TabsContent value={MessageTranslationKeys.Compose}>
  <Compose profileArea={profileArea} />
</TabsContent>
```

**Problem:** `Compose` is an `async` server component (`src/app/[locale]/(private)/module/msg/components/compose.tsx:13`). It's rendered inside `<TabsContent>` which is a Radix client component. In Next.js, async server components cannot be children of client components unless wrapped in a `Suspense` boundary with proper streaming. This may cause hydration issues or silent failures.

**Fix:** Wrap in `<Suspense>`:
```tsx
<TabsContent value={MessageTranslationKeys.Compose}>
  <Suspense fallback={<LoadingScreen />}>
    <Compose profileArea={profileArea} />
  </Suspense>
</TabsContent>
```

---

### A-06. `inbox.tsx` — `handleRowClick` fetches mail data on every row click

**File:** `src/app/[locale]/(private)/module/msg/components/inbox.tsx:89-90`

```tsx
const handleRowClick = async (mail: Message) => {
  const mailData = await getMail(mail.id);
```

**Problem:** Every row click triggers a server action (`getMail`) which makes an API call. There's no loading indicator during this fetch — the user clicks and nothing happens until the data arrives. If the API is slow, the user may click multiple times.

**Fix:** Add a loading state and disable further clicks while fetching.

---

### A-07. `inbox.tsx` — `onClick` on `<div>` instead of `<button>` for action icons

**File:** `src/app/[locale]/(private)/module/msg/components/inbox.tsx:124,127,133`

```tsx
<div onClick={handleDeleteClick} className="flex cursor-pointer items-center justify-center">
  <Trash2 className="h-6 w-6 text-neutral-500" />
</div>
```

**Problem:** Using `<div onClick>` for interactive elements is an accessibility violation (WCAG 2.1 Level A: 4.1.2 Name, Role, Value). Screen readers don't announce divs as buttons. Keyboard users can't focus or activate them.

**Fix:** Use `<button>` or `<Button variant="ghost">` with `aria-label`.

---

### A-08. `inbox.tsx` — `setTimeout` for refresh loading state

**File:** `src/app/[locale]/(private)/module/msg/components/inbox.tsx:111`

```tsx
setTimeout(() => dispatch({ type: 'setIsRefreshing', isRefreshing: false }), 500);
```

**Problem:** Artificial 500ms delay before hiding the refresh spinner. If the component unmounts during this timeout, `dispatch` is called on an unmounted component. Also, the delay is confusing — the data is already loaded but the spinner keeps spinning.

**Fix:** Remove the `setTimeout`, set `isRefreshing: false` in the `finally` block directly.

---

### A-09. `password-reset/success/page.tsx` — `router.replace('/')` without locale

**File:** `src/app/[locale]/(public)/(auth)/password-reset/success/page.tsx:9,17`

```tsx
import { useRouter } from 'next/navigation';
// ...
const redirectToLogin = () => router.replace('/');
```

**Problem:** Uses `next/navigation`'s `useRouter` instead of `@/i18n/routing`'s `useRouter`. The `router.replace('/')` doesn't include the locale prefix, so the user may be redirected to a locale-less URL which triggers the i18n middleware to add a locale, causing an extra redirect.

**Fix:**
```tsx
import { useRouter } from '@/i18n/routing';
```

---

### A-10. Dockerfile — no `HEALTHCHECK` instruction

**File:** `Dockerfile` (entire file)

**Problem:** No `HEALTHCHECK` instruction. The container has a `/api/healthz` endpoint but Docker doesn't know if the app is healthy. Orchestrators (K8s, Docker Compose) can't automatically restart unhealthy containers.

**Fix:** Add:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/healthz || exit 1
```

---

### A-11. `package.json` — no `engines` field

**File:** `package.json` (entire file)

**Problem:** No `engines` field specifying Node.js version. The Dockerfile uses `node:22-alpine`, but local developers could use Node 18 or 20 and get unexpected behavior.

**Fix:** Add:
```json
"engines": {
  "node": ">=22.0.0"
}
```

---

### A-12. `package.json` — no `test` script

**File:** `package.json:5-13`

```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build --turbopack",
  "start": "next start",
  "lint": "next lint",
  "tsc": "tsc --noEmit",
  "storybook": "storybook dev -p 6006",
  "build-storybook": "storybook build"
}
```

**Problem:** No `test` script. Running `npm test` does nothing. CI pipeline has no test step.

**Fix:** Add `"test": "vitest run"` and `"test:watch": "vitest"` after installing Vitest.
