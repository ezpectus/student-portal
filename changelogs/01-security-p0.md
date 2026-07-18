# Changelog 01 — P0 Critical Security Fixes

**Date:** 18.07.2026
**Scope:** Critical security vulnerabilities that pose immediate risk in production.

---

## Summary

| # | Issue | File | Severity | CWE |
|---|-------|------|----------|-----|
| 1 | `.gitignore` missing `.env.*` patterns | `.gitignore:60-61` | Critical | CWE-540 |
| 2 | Cookie missing `secure` and `sameSite` flags | `src/actions/auth.actions.ts:24-25` | Critical | CWE-614, CWE-1275 |
| 3 | XSS via `dangerouslySetInnerHTML` | `src/app/[locale]/(private)/module/msg/components/dialog/preview-dialog.tsx:45-48` | Critical | CWE-79 |
| 4 | JWT decoded without payload validation | `src/lib/jwt.ts:5-7` | High | CWE-20 |

---

## Fix 1: `.gitignore` — Environment file patterns

**File:** `.gitignore:60-63`

**Before:**
```gitignore
# dotenv environment variables file
.env
```

**After:**
```gitignore
# dotenv environment variables files
.env
.env.*
!.env.example
```

**Problem:** Only `.env` was ignored. Files like `.env.production`, `.env.development`, `.env.local` were not ignored, risking accidental commit of secrets (API keys, JWT secrets, cookie domains).

**Fix:** Added `.env.*` glob pattern to ignore all environment variants. Added `!.env.example` negation so template files can still be committed.

**CWE:** CWE-540 (Information Exposure Through Source Code)

---

## Fix 2: Cookie security flags

**File:** `src/actions/auth.actions.ts:24-39`

**Before:**
```ts
resolvedCookies.set(SID_COOKIE_NAME, sessionId, { domain: ROOT_COOKIE_DOMAIN, httpOnly: true, expires });
resolvedCookies.set(TOKEN_COOKIE_NAME, token, { domain: MAIN_COOKIE_DOMAIN, httpOnly: true, expires });
```

**After:**
```ts
const isProduction = process.env.NODE_ENV === 'production';

resolvedCookies.set(SID_COOKIE_NAME, sessionId, {
  domain: ROOT_COOKIE_DOMAIN,
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  expires,
});
resolvedCookies.set(TOKEN_COOKIE_NAME, token, {
  domain: MAIN_COOKIE_DOMAIN,
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  expires,
});
```

**Problem:** Auth cookies (`ecampus-token`, `SID`) were set without `secure` or `sameSite` flags. In production, this allows:
- Cookies transmitted over unencrypted HTTP (MITM attacks)
- CSRF attacks via cross-site requests

**Fix:** Added `secure: true` in production (enforces HTTPS-only transmission) and `sameSite: 'lax'` (prevents CSRF while allowing top-level navigation). Used `process.env.NODE_ENV` check so dev over HTTP still works.

**CWE:** CWE-614 (Sensitive Cookie Without 'Secure' Flag), CWE-1275 (Sensitive Cookie Without 'HttpOnly' or 'SameSite' Flag)

---

## Fix 3: XSS via `dangerouslySetInnerHTML`

**File:** `src/app/[locale]/(private)/module/msg/components/dialog/preview-dialog.tsx:45-48`

**Before:**
```tsx
<div
  className="pt-2 text-base leading-relaxed"
  dangerouslySetInnerHTML={{ __html: selectedMail.content }}
/>
```

**After:**
```tsx
<div className="whitespace-pre-wrap pt-2 text-base leading-relaxed">
  {selectedMail.content}
</div>
```

**Problem:** Email content was rendered as raw HTML via `dangerouslySetInnerHTML`. If the backend or a malicious sender includes `<script>` tags or event handlers in the email body, arbitrary JavaScript executes in the user's session (stored XSS). This is especially dangerous because the user is authenticated with a JWT cookie.

**Fix:** Replaced `dangerouslySetInnerHTML` with safe text interpolation. React automatically escapes HTML entities. Added `whitespace-pre-wrap` CSS class to preserve line breaks and formatting from the email content.

**CWE:** CWE-79 (Cross-site Scripting)

---

## Fix 4: JWT payload validation with Zod

**File:** `src/lib/jwt.ts:1-21`

**Before:**
```ts
import 'server-only';
import JWT, { JwtPayload } from 'jsonwebtoken';

export const getJWTPayload = <T extends JwtPayload>(token: string) => {
  return JWT.decode(token, { json: true }) as T;
};
```

**After:**
```ts
import 'server-only';
import JWT, { JwtPayload } from 'jsonwebtoken';
import { z } from 'zod';

const JwtPayloadSchema = z.object({
  exp: z.number(),
  modules: z.array(z.string()).optional(),
});

export const getJWTPayload = <T extends JwtPayload>(token: string): T => {
  const decoded = JWT.decode(token, { json: true });
  if (!decoded) {
    throw new Error('Invalid JWT: unable to decode');
  }
  const parsed = JwtPayloadSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new Error(`Invalid JWT payload: ${parsed.error.message}`);
  }
  return parsed.data as T;
};
```

**Problem:** `JWT.decode()` only base64-decodes the payload — it does not verify the signature or validate the shape of the payload. A malformed or tampered token could cause runtime errors (e.g., `tokenData.exp` being `undefined` in `auth.actions.ts:19`) or allow an attacker to inject unexpected payload structures.

**Fix:** Added Zod schema validation to ensure the decoded payload has the expected shape (`exp` as number, optional `modules` as string array). Throws explicit errors on invalid tokens instead of silently returning `null`/`undefined` casts. Note: Full signature verification (`JWT.verify`) requires the backend's public key, which is not available in the frontend. This is a known architectural limitation — the backend should be the trust authority.

**CWE:** CWE-20 (Improper Input Validation)
