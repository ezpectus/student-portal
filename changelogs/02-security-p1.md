# Changelog 02 — P1 High-Priority Security Fixes

**Date:** 18.07.2026
**Scope:** High-priority security issues — network-level protections, redirect validation, and link security.

---

## Summary

| # | Issue | File | Severity | CWE |
|---|-------|------|----------|-----|
| 1 | No fetch timeout — hanging requests | `src/lib/client.ts:31-43` | High | CWE-400 |
| 2 | Open redirect via unvalidated backend URL | `src/actions/auth.actions.ts:104-108` | High | CWE-601 |
| 3 | No security headers (CSP, HSTS, X-Frame-Options) | `next.config.mjs:33` | High | CWE-693 |
| 4 | `target="_blank"` without `rel="noopener noreferrer"` (7 files) | Multiple | Medium | CWE-1021 |

---

## Fix 1: Fetch timeout via `AbortSignal`

**File:** `src/lib/client.ts:31-43`

**Before:**
```ts
const response = await fetch<T>(input, {
  ...cacheOption,
  headers: {
    // ...
  },
  ...otherOptions,
});
```

**After:**
```ts
const response = await fetch<T>(input, {
  ...cacheOption,
  signal: AbortSignal.timeout(10000),
  headers: {
    // ...
  },
  ...otherOptions,
});
```

**Problem:** `campusFetch` had no timeout. If the backend is slow or unresponsive, the request hangs indefinitely, tying up server resources (memory, connections). In a Server Component, this blocks the entire page render. A single slow endpoint can cascade into resource exhaustion.

**Fix:** Added `AbortSignal.timeout(10000)` — 10-second timeout. This uses the standard Web API (Node 18+ / Next.js). If the backend doesn't respond within 10 seconds, the request is aborted and throws a `TimeoutError`. Callers can catch this and show appropriate error UI.

**CWE:** CWE-400 (Uncontrolled Resource Consumption)

---

## Fix 2: Open redirect validation

**File:** `src/actions/auth.actions.ts:119-138`

**Before:**
```ts
export async function redirectToEmploymentSystem() {
  const response = await campusFetch<string>('employment-system/auth');
  const url = await response.json();
  redirect(url);
}
```

**After:**
```ts
export async function redirectToEmploymentSystem() {
  const response = await campusFetch<string>('employment-system/auth');

  if (!response.ok) {
    throw new Error(`Failed to get employment system URL: ${response.status}`);
  }

  const url = await response.json();

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('.kpi.ua')) {
      throw new Error('Untrusted redirect URL');
    }
  } catch {
    throw new Error('Invalid redirect URL');
  }

  redirect(url);
}
```

**Problem:** The URL returned from the backend was passed directly to `redirect()` without validation. If the backend is compromised or returns a malicious URL, users could be redirected to an attacker-controlled site (open redirect). This enables phishing attacks where users think they're still on kpi.ua.

**Fix:** Added three layers of validation:
1. **Response status check** — fail fast on non-OK responses
2. **URL parsing** — ensure it's a valid URL
3. **Domain allowlist** — only allow redirects to `*.kpi.ua` domains

**CWE:** CWE-601 (URL Redirection to Untrusted Site)

---

## Fix 3: Security headers in `next.config.mjs`

**File:** `next.config.mjs:33-67`

**Before:**
```js
output: 'standalone',
```

**After:**
```js
output: 'standalone',
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data:",
            "connect-src 'self' https://api.campus.kpi.ua https://ecampus.cloud.kpi.ua https://www.google-analytics.com https://www.gstatic.com",
            "frame-src 'self' https://www.google.com/recaptcha/ https://docs.google.com/",
            "object-src 'none'",
            "base-uri 'self'",
          ].join('; '),
        },
      ],
    },
  ];
},
```

**Problem:** No security headers were set. The application was vulnerable to:
- MIME-type sniffing attacks (no `X-Content-Type-Options`)
- Clickjacking via iframe embedding (no `X-Frame-Options`)
- Protocol downgrade attacks (no HSTS)
- Excessive referrer leakage (no `Referrer-Policy`)
- Unauthorized device access (no `Permissions-Policy`)
- XSS, data injection, mixed content (no CSP)

**Fix:** Added a comprehensive security headers block applied to all routes. CSP is configured with allowlists for:
- Google Analytics & Tag Manager (script-src)
- Google reCAPTCHA (script-src, frame-src)
- Google Forms (frame-src)
- Campus API & CDN (connect-src, img-src)

**Note:** `'unsafe-inline'` and `'unsafe-eval'` in `script-src` are needed for Next.js's inline scripts and dev mode. A future improvement is to use nonces.

**CWE:** CWE-693 (Protection Mechanism Failure)

---

## Fix 4: `target="_blank"` without `rel="noopener noreferrer"` (7 files)

**Files modified:**

| File | Line |
|------|------|
| `src/widgets/faq/frequently-asked-questions.tsx` | 24 |
| `src/components/not-found-page.tsx` | 33 |
| `src/components/app-sidebar/footer.tsx` | 38 |
| `src/app/[locale]/(public)/footer.tsx` | 21 |
| `src/app/[locale]/(private)/notice-board/components/notice.tsx` | 26 |
| `src/app/[locale]/(public)/validate-certificate/certificate-verifier.tsx` | 126 |
| `src/app/[locale]/(private)/accept-code-of-honor/page.tsx` | 34 |

**Before (example):**
```tsx
<Link href={process.env.NEXT_PUBLIC_KBIS_URL!} target="_blank">
```

**After (example):**
```tsx
<Link href={process.env.NEXT_PUBLIC_KBIS_URL!} target="_blank" rel="noopener noreferrer">
```

**Problem:** Links with `target="_blank"` without `rel="noopener noreferrer"` allow the opened page to access the original page's `window` object via `window.opener`. This enables:
- **Tabnabbing attacks** — the new tab can redirect the original tab to a phishing page
- **Reverse tabnabbing** — the new tab can read the original tab's URL

**Fix:** Added `rel="noopener noreferrer"` to all 7 instances. `noopener` prevents `window.opener` access; `noreferrer` prevents the referrer header from being sent to the new page.

**CWE:** CWE-1021 (Improper Restriction of Rendered UI Layers or Frames)
