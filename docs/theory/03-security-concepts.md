# 03 — Security Concepts: Theory & Practice

**Project:** eCampus Student Portal
**Audience:** Developers learning web security
**Language:** English with code examples

---

## Table of Contents

1. [JWT (JSON Web Tokens)](#jwt-json-web-tokens)
2. [JWKS (JSON Web Key Set)](#jwks-json-web-key-set)
3. [Refresh Token Rotation](#refresh-token-rotation)
4. [CSRF (Cross-Site Request Forgery)](#csrf-cross-site-request-forgery)
5. [CSP (Content Security Policy)](#csp-content-security-policy)
6. [httpOnly, secure, sameSite Cookies](#httponly-secure-samesite-cookies)
7. [Password Hashing (bcrypt)](#password-hashing-bcrypt)
8. [Rate Limiting](#rate-limiting)
9. [School Isolation (Multi-Tenancy)](#school-isolation-multi-tenancy)
10. [Secret Management](#secret-management)
11. [XSS Prevention](#xss-prevention)
12. [Path Traversal Prevention](#path-traversal-prevention)

---

## JWT (JSON Web Tokens)

### What is a JWT?

A JWT is a compact, self-contained token for securely transmitting information between parties as a JSON object.

### Structure

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJTVFVERU5UIiwiaWF0IjoxNjk... .SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
│                                          │                                                                  │
│  Header (base64)                         │  Payload (base64)                                                │  Signature (HMAC-SHA256)
│  { "alg": "HS256", "typ": "JWT" }        │  { "userId": 1, "role": "STUDENT", "exp": 169... }              │  HMAC-SHA256(header.payload, secret)
```

### Three parts

1. **Header** — algorithm and token type
2. **Payload** — claims (user ID, role, expiration, issuer)
3. **Signature** — cryptographic signature to verify integrity

### Why use JWT?

**Without JWT (session-based):**
```
Login → Server creates session → Stores session ID in DB → Sends session cookie
Request → Server reads cookie → Looks up session in DB → Gets user data
```
**Problem:** Every request requires a database lookup.

**With JWT (token-based):**
```
Login → Server creates JWT (contains user data) → Sends JWT in cookie
Request → Server reads JWT → Verifies signature → Gets user data from JWT
```
**Benefit:** No database lookup per request. The JWT itself contains the user data, and the signature proves it hasn't been tampered with.

### In this project

```typescript
// Signing a JWT (local auth)
import JWT from 'jsonwebtoken';

const payload = {
  userId: user.id,
  username: user.username,
  role: user.role,
  schoolId: user.schoolId,
  tokenVersion: user.tokenVersion,
  modules: getModulesForRole(user.role),
};

const token = JWT.sign(payload, env.JWT_SECRET, {
  expiresIn: '15m',              // short-lived access token
  issuer: 'student-portal-local', // prevents token confusion
});

// Verifying a JWT
const payload = JWT.verify(token, env.JWT_SECRET, {
  issuer: 'student-portal-local',
}) as LocalJWTPayload;
```

### JWT claims used in this project

| Claim | Purpose | Example |
|-------|---------|---------|
| `exp` | Expiration time (Unix seconds) | `1690000000` (15 min from now) |
| `iss` | Issuer (who created the token) | `student-portal-local` |
| `iat` | Issued at (Unix seconds) | `1690000000` |
| `userId` | User's database ID | `42` |
| `role` | User's role | `STUDENT` |
| `modules` | Authorized module list | `['rating', 'studysheet', 'calendar']` |
| `schoolId` | School isolation ID | `1` |
| `tokenVersion` | Logout-all-devices mechanism | `0` |

### Why `tokenVersion`?

```typescript
// When user clicks "Logout all devices":
await prisma.user.update({
  where: { id: user.id },
  data: { tokenVersion: { increment: 1 } },
});

// Every request validates:
if (payload.tokenVersion !== user.tokenVersion) return null;
// Old tokens have old tokenVersion → invalidated
```

This allows instant invalidation of all existing tokens without a token blocklist.

---

## JWKS (JSON Web Key Set)

### What is JWKS?

JWKS is a set of public keys used to verify JWT signatures. It's published at a well-known URL endpoint.

### Why JWKS?

When the JWT is signed by an **external service** (not our app), we don't have the signing key. But the external service can publish its public keys via JWKS, allowing us to verify signatures without sharing secrets.

### How it works

```
1. External API signs JWT with its PRIVATE key (RS256)
2. External API publishes its PUBLIC keys at https://api.example.com/.well-known/jwks.json
3. Our app fetches the public keys (cached for 10 minutes)
4. Our app verifies JWT signature using the public key
5. If the key rotates, our app fetches new keys (30s cooldown)
```

### JWKS response format

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "key-1",
      "alg": "RS256",
      "n": "0vx7agoebGcQ...",
      "e": "AQAB"
    }
  ]
}
```

### In this project

```typescript
// src/lib/jwks.ts
import { createRemoteJWKSet, jwtVerify } from 'jose';

let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(new URL(env.JWKS_URI!), {
      cooldownDuration: 30_000,   // 30s between fetches
      cacheMaxAge: 600_000,       // 10min cache for keys
    });
  }
  return jwksCache;
}

export async function verifyRemoteJWT<T>(token: string): Promise<T> {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: env.JWT_ISSUER,  // optional issuer check
  });
  return payload as T;
}
```

### Why caching?

Without caching, every request would fetch the JWKS endpoint → network latency + potential DDoS on the JWKS endpoint.

```
Request 1: Fetch JWKS → cache (10min)
Request 2-1000: Use cached keys (no network call)
After 10min: Fetch fresh keys (in case keys rotated)
```

### HS256 vs RS256

| Algorithm | Key type | Use case |
|-----------|----------|----------|
| HS256 (HMAC) | Shared secret | Same service signs + verifies (local auth) |
| RS256 (RSA) | Public/private pair | Different services (external API signs, we verify) |

---

## Refresh Token Rotation

### The problem

Access tokens should be **short-lived** (15 minutes) to limit damage if stolen. But users don't want to log in every 15 minutes. Solution: **refresh tokens**.

### How it works

```
Login:
  → Access token (15min) + Refresh token (30d) in httpOnly cookies

After 15 minutes:
  → Access token expired
  → Client calls refreshAccessToken()
  → Server validates refresh token
  → Issues NEW access token + NEW refresh token (rotation)
  → OLD refresh token is revoked

After 30 days:
  → Refresh token expired
  → User must log in again
```

### Why rotation?

If a refresh token is stolen, the attacker can use it once. After that one use:
- The old token is revoked
- A new token is issued (to the legitimate user)
- If the attacker tries to use the old token again → reuse detected → ALL tokens revoked

### In this project

```typescript
// src/actions/refresh-token.actions.ts

export async function refreshAccessToken() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('sp-refresh')?.value;
  if (!refreshToken) throw new Error('No refresh token');

  const hashedToken = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { token: hashedToken } });

  // Check: not found, revoked, or expired
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new Error('Invalid refresh token');
  }

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  // Generate new refresh token
  const newRefreshToken = crypto.randomBytes(48).toString('base64url');
  await prisma.refreshToken.create({
    data: {
      token: hashToken(newRefreshToken),
      userId: stored.userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  // Set new cookies
  cookieStore.set('sp-refresh', newRefreshToken, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 });

  // Sign new access token
  const newAccessToken = JWT.sign({ userId: stored.userId, ... }, env.JWT_SECRET, { expiresIn: '15m' });
  return { accessToken: newAccessToken };
}
```

### Token reuse detection

```typescript
// If a REVOKED token is used again → possible token theft
if (stored.revokedAt) {
  // Revoke ALL user's refresh tokens (compromise detected)
  await prisma.refreshToken.updateMany({
    where: { userId: stored.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  throw new Error('Token reuse detected — all sessions revoked');
}
```

---

## CSRF (Cross-Site Request Forgery)

### What is CSRF?

CSRF is an attack where a malicious website tricks the user's browser into making a request to your site using the user's existing cookies.

### Example attack

```
1. User logs into student-portal.com (cookies set)
2. User visits evil.com in another tab
3. evil.com has: <form action="https://student-portal.com/api/delete-account" method="POST">
4. evil.com auto-submits the form
5. Browser sends the request WITH the user's cookies
6. Student portal deletes the account (thinking it's the user's request)
```

### Defense: Double-submit cookie pattern

```
1. Server sets a random CSRF token in a cookie (readable by JS)
2. Client reads the cookie and sends the same token in a header
3. Server compares: cookie token === header token?
   → If they match, the request is from the same origin
   → If they don't match, it's a CSRF attack
```

**Why this works:** An evil website can make the browser send cookies, but it **cannot read** cookies from another domain (Same-Origin Policy). So it can't know the CSRF token value to put in the header.

### In this project

```typescript
// src/middleware.ts — CSRF check on POST with Next-Action header
if (request.method === 'POST' && request.headers.has('Next-Action')) {
  const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!csrfCookie) return new NextResponse('CSRF: missing token', { status: 403 });

  // Also check Origin header
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host) {
    if (new URL(origin).host !== host) {
      return new NextResponse('CSRF: origin mismatch', { status: 403 });
    }
  }
}

// src/lib/csrf.ts — Server action guard
export async function requireCsrf() {
  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  if (!csrfCookie) throw new Error('CSRF: missing cookie token');
}

// Usage in every mutation:
export async function updateGrade(input) {
  await requireCsrf();  // ← first line
  // ...
}
```

### Defense in depth: Origin header check

Even if the CSRF cookie is somehow leaked, the Origin header check provides a second layer:
- `Origin: https://student-portal.com` (legitimate)
- `Origin: https://evil.com` (blocked — doesn't match host)

---

## CSP (Content Security Policy)

### What is CSP?

CSP is an HTTP header that tells the browser which sources of content are allowed. It's the primary defense against XSS (Cross-Site Scripting).

### Without CSP

```
Attacker injects: <script>alert(document.cookie)</script>
Browser executes it → cookies stolen → account compromised
```

### With CSP

```
CSP: script-src 'self' 'nonce-abc123' 'strict-dynamic'

Browser sees injected script without nonce → BLOCKS it
Browser only executes scripts with the correct nonce
```

### In this project

```typescript
// src/middleware.ts
function buildCspHeader(nonce: string): string {
  return [
    "default-src 'self'",                                          // block everything by default
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ...`,     // only nonce'd scripts
    "style-src 'self' 'unsafe-inline'",                            // Tailwind needs inline styles
    "img-src 'self' data: https: blob:",                           // images from any HTTPS
    "font-src 'self' data:",
    "connect-src 'self' https://www.google-analytics.com ...",
    "frame-src 'self' https://www.google.com/recaptcha/ ...",
    "object-src 'none'",                                           // no Flash/Java
    "base-uri 'self'",                                             // no <base> injection
  ].join('; ');
}

// Each request gets a unique nonce
const nonce = randomBytes(16).toString('base64');
res.headers.set('Content-Security-Policy', buildCspHeader(nonce));
```

### Nonce-based script loading

```
Request 1: nonce = "abc123"
  → CSP: script-src 'nonce-abc123'
  → Only scripts with nonce="abc123" execute

Request 2: nonce = "def456"
  → CSP: script-src 'nonce-def456'
  → Scripts from request 1 (nonce="abc123") won't execute
```

This means even if an attacker injects a script tag, it won't have the correct nonce and won't execute.

---

## httpOnly, secure, sameSite Cookies

### Three cookie security flags

| Flag | What it does | Why it matters |
|------|-------------|----------------|
| `httpOnly: true` | JavaScript can't read the cookie | Prevents XSS from stealing tokens |
| `secure: true` | Cookie only sent over HTTPS | Prevents man-in-the-middle from reading cookies |
| `sameSite: 'lax'` | Cookie sent on same-site requests + top-level navigations | Prevents CSRF (cross-site requests don't include cookie) |

### In this project

```typescript
// Access token cookie
resolvedCookies.set(TOKEN_COOKIE_NAME, token, {
  domain: MAIN_COOKIE_DOMAIN,
  httpOnly: true,           // ← JS can't read this
  secure: isProduction,     // ← HTTPS only in production
  sameSite: 'lax',          // ← blocks cross-site POST
  expires,
});

// CSRF cookie (needs to be readable by JS)
res.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
  httpOnly: false,          // ← JS CAN read this (needed for double-submit)
  sameSite: 'lax',
  path: '/',
});
```

### Why CSRF cookie is NOT httpOnly

The double-submit pattern requires JavaScript to read the CSRF cookie and send it in a header. If the cookie were `httpOnly`, JS couldn't read it, and the pattern wouldn't work.

---

## Password Hashing (bcrypt)

### Why hash passwords?

**Never store plaintext passwords.** If the database is leaked, all passwords are exposed.

### What is bcrypt?

bcrypt is a password hashing function designed to be **slow** (by design). This makes brute-force attacks expensive.

### How bcrypt works

```
Hash: bcrypt.hash("mypassword", 10)
  → "$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqK3bFQ/8FQK3bFQ/8FQK3bFQ"

Verify: bcrypt.compare("mypassword", hash)
  → true (password matches)
  → false (password doesn't match)
```

### The "cost factor" (10)

```
Cost 10: ~100ms per hash
Cost 12: ~400ms per hash
Cost 14: ~1.6s per hash

Attacker with cost 10: 10,000 hashes/second
Attacker with cost 14: 625 hashes/second
```

Higher cost = slower hashing = more expensive for attackers. But also slower for legitimate logins.

### In this project

```typescript
// Registration: hash password
import bcrypt from 'bcryptjs';

const passwordHash = await bcrypt.hash(password, 10);
await prisma.user.create({
  data: { username, email, passwordHash, ... },
});

// Login: verify password
const user = await prisma.user.findUnique({ where: { username } });
const valid = await bcrypt.compare(password, user.passwordHash);
if (!valid) return null;  // don't reveal which failed (username vs password)
```

### Why `bcryptjs` and not `bcrypt`?

`bcrypt` is a native C++ addon (faster, but requires compilation). `bcryptjs` is pure JavaScript (slower, but no compilation needed — works everywhere, including Vercel Edge).

---

## Rate Limiting

### What is rate limiting?

Rate limiting restricts the number of requests a user can make in a time window. This prevents brute-force attacks.

### In this project

```typescript
// src/lib/rate-limit.ts
const WINDOW_MS = 15 * 60 * 1000;  // 15 minutes
const MAX_ATTEMPTS = 10;            // 10 attempts per window

export function checkRateLimit(identifier: string) {
  const key = `login:${identifier}`;
  const entry = rateLimitMap.get(key);

  if (!entry || Date.now() > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: Date.now() + WINDOW_MS });
    return { allowed: true };
  }

  entry.count++;
  if (entry.count > MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: entry.resetAt - Date.now() };
  }

  return { allowed: true };
}
```

### Limits

| Action | Max attempts | Window |
|--------|-------------|--------|
| Login | 10 | 15 minutes |
| Password reset | 5 | 15 minutes |
| Registration | 5 | 1 hour |

### Limitation: in-memory

```typescript
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
```

This map lives in process memory. If the server restarts, all rate limits reset. With multiple server instances, each has its own map (user gets 10 attempts per instance).

**Production solution:** Use Redis for distributed rate limiting.

---

## School Isolation (Multi-Tenancy)

### What is multi-tenancy?

Multi-tenancy means multiple organizations (schools) share the same application instance, but their data is isolated.

### In this project

Every database query that involves school-scoped data **must** filter by `schoolId`:

```typescript
// ✅ CORRECT — school isolation enforced
const posts = await prisma.feedPost.findMany({
  where: {
    ...(user.schoolId ? { schoolId: user.schoolId } : {}),  // ← filter by school
  },
});

// ❌ DANGEROUS — no school filter, leaks data from all schools
const posts = await prisma.feedPost.findMany({});
```

### Super-admin exception

When `schoolId` is `null` (super-admin), the filter is skipped:

```typescript
// schoolId = null → no filter → sees all schools
// schoolId = 1 → filter by schoolId → sees only school 1
const where = user.schoolId ? { schoolId: user.schoolId } : {};
```

### Why this matters

Without school isolation:
- School A's admin can see School B's students
- School A's teacher can edit School B's grades
- A data breach at one school compromises all schools

---

## Secret Management

### What are secrets?

Secrets are sensitive values that must not be exposed:
- `JWT_SECRET` — signing key for JWTs
- `POSTGRES_PASSWORD` — database password
- `JWKS_URI` — (not secret, but shouldn't be in client bundle)

### How this project manages secrets

```typescript
// src/lib/env.ts — Zod validation at startup
const envSchema = z.object({
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWKS_URI: z.string().url().optional(),
  JWT_ISSUER: z.string().optional(),
});

export const env = envSchema.parse(cleanEnv);
// If any required var is missing/invalid → app crashes at startup (fail fast)
```

### Rules

1. **Never commit `.env` files** — `.gitignore` excludes them
2. **Use `.env.example`** — template with no real values
3. **Server-only access** — secrets are only read in server components/actions
4. **`NEXT_PUBLIC_` prefix** — only for values that are safe to expose to the client
5. **Zod validation** — catches missing/invalid env vars at startup, not at runtime

---

## XSS Prevention

### What is XSS?

XSS (Cross-Site Scripting) is when an attacker injects malicious JavaScript into your page.

### Defenses in this project

1. **CSP headers** — block inline scripts without nonce
2. **React auto-escaping** — React escapes all string content by default
3. **`httpOnly` cookies** — even if XSS occurs, attacker can't steal cookies
4. **No `dangerouslySetInnerHTML`** — project doesn't use raw HTML injection

### React auto-escaping

```tsx
// React automatically escapes this — safe
const userInput = '<script>alert("xss")</script>';
return <div>{userInput}</div>;
// Renders as text: <script>alert("xss")</script>
// Does NOT execute the script

// ❌ DANGEROUS — bypasses escaping
return <div dangerouslySetInnerHTML={{ __html: userInput }} />;
// This WOULD execute the script — not used in this project
```

---

## Path Traversal Prevention

### What is path traversal?

An attacker tries to access files outside the intended directory:

```
Upload file with name: ../../etc/passwd
→ Writes to /etc/passwd instead of /public/uploads/avatars/
```

### Defense in this project

```typescript
// src/actions/settings.actions.ts
const filename = `${user.id}-${randomBytes(8).toString('hex')}.${ext}`;
// → "42-a1b2c3d4e5f6g7h8.jpg"
// → No user-controlled path components

const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
await mkdir(uploadDir, { recursive: true });
await writeFile(path.join(uploadDir, filename), buffer);
// → "/app/public/uploads/avatars/42-a1b2c3d4e5f6g7h8.jpg"
```

**Key:** The filename is generated server-side using `crypto.randomBytes`, not from user input. The user cannot control the file path.
