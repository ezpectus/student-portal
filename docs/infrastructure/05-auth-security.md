# 05 — Authentication & Security Infrastructure

**Project:** eCampus Student Portal
**Last updated:** July 2026

---

## Authentication Modes

The project supports **two authentication modes**, controlled by `NEXT_PUBLIC_LOCAL_AUTH`:

| Mode | Env | User store | Password store | JWT signing |
|------|-----|-----------|----------------|-------------|
| **Local auth** | `NEXT_PUBLIC_LOCAL_AUTH=true` | Prisma DB | bcrypt hash in DB | `jsonwebtoken` with `JWT_SECRET` |
| **External auth** | `NEXT_PUBLIC_LOCAL_AUTH=false` | External API | External API | External API (verified via JWKS if configured) |

---

## Local Auth Flow (detailed)

```
┌─────────────────────────────────────────────────────────────────────┐
│ LOGIN FLOW                                                          │
│                                                                     │
│  User submits username + password                                   │
│  → loginWithCredentials(username, password, rememberMe)            │
│    → checkRateLimit(username) — 10 attempts / 15 min               │
│    → localLogin(username, password, rememberMe)                    │
│      → prisma.user.findUnique({ where: { username } })             │
│      → bcrypt.compare(password, user.passwordHash)                 │
│      → If invalid → return null (no error leak)                    │
│      → Sign access token: JWT.sign(payload, JWT_SECRET, {          │
│          expiresIn: '15m',  ← short-lived access token             │
│          issuer: 'student-portal-local'                            │
│        })                                                          │
│      → generateRefreshToken(user)                                  │
│        → crypto.randomBytes(48).toString('base64url')              │
│        → prisma.refreshToken.create({ data: {                      │
│            token: hash(token),  ← store hash, not plaintext        │
│            userId, expiresAt: now + 30d                            │
│          }})                                                       │
│        → Set cookie 'sp-refresh' (httpOnly, 30d)                   │
│      → setLoginCookies(access_token, sessionId, rememberMe)        │
│        → Set TOKEN_COOKIE_NAME (httpOnly, secure in prod, lax)     │
│        → Set SID_COOKIE_NAME (httpOnly, secure in prod, lax)       │
│      → Update lastActiveAt                                         │
│    → resetRateLimit(username)                                      │
│    → return true                                                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ TOKEN VALIDATION (every request)                                    │
│                                                                     │
│  middleware.ts → authenticationMiddleware                           │
│    → getAuthInfo(request)                                          │
│      → Read TOKEN_COOKIE_NAME from cookies                        │
│      → await getJWTPayload(token)                                  │
│        → Local token? JWT.verify(token, JWT_SECRET)               │
│          → Check issuer === 'student-portal-local'                 │
│          → Check exp > now                                         │
│        → External token + JWKS_URI? verifyRemoteJWT(token)        │
│          → jose.jwtVerify(token, key, { issuer: JWT_ISSUER })     │
│          → JWKS cached 10min, cooldown 30s                        │
│        → External token, no JWKS? decode-only + check exp         │
│      → Return { payload, isAuthenticated }                        │
│    → authorizationMiddleware                                       │
│      → Extract module from URL                                     │
│      → Check payload.modules.includes(module)                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ REFRESH TOKEN ROTATION                                              │
│                                                                     │
│  Access token expired (15min)                                      │
│  → Client calls refreshAccessToken()                               │
│    → Read 'sp-refresh' cookie                                      │
│    → Hash token, look up in DB                                     │
│    → Check: not revoked, not expired                               │
│    → If valid:                                                     │
│      → Revoke old token (set revokedAt)                            │
│      → Generate new refresh token (rotation)                       │
│      → Set replacedBy on old token                                 │
│      → Sign new access token (15min)                               │
│      → Set new refresh cookie                                      │
│      → Return { accessToken }                                      │
│    → If revoked/used (reuse detected):                             │
│      → Revoke ALL user's refresh tokens (compromise)               │
│      → Return error                                                │
│    → If expired:                                                   │
│      → Return error, user must re-login                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ LOGOUT FLOW                                                         │
│                                                                     │
│  localLogout()                                                      │
│    → revokeAllRefreshTokens(userId)                                │
│      → prisma.refreshToken.updateMany({                            │
│          where: { userId, revokedAt: null },                      │
│          data: { revokedAt: new Date() }                           │
│        })                                                          │
│    → Delete TOKEN_COOKIE_NAME                                      │
│    → Delete SID_COOKIE_NAME                                        │
│    → Delete 'sp-refresh' cookie                                    │
│    → redirect('/')                                                 │
│                                                                     │
│  logoutAllDevices()                                                 │
│    → revokeAllRefreshTokens(userId)                                │
│    → prisma.user.update({ tokenVersion: { increment: 1 } })       │
│    → All existing JWTs become invalid (tokenVersion mismatch)      │
│    → Delete all cookies                                            │
│    → redirect('/')                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Cookie Configuration

| Cookie | Name | httpOnly | secure | sameSite | domain | Purpose |
|--------|------|----------|--------|----------|--------|---------|
| Access token | `TOKEN_COOKIE_NAME` | ✅ | prod only | lax | `MAIN_COOKIE_DOMAIN` | JWT access token |
| Session ID | `SID_COOKIE_NAME` | ✅ | prod only | lax | `ROOT_COOKIE_DOMAIN` | External session ID |
| Refresh token | `sp-refresh` | ✅ | prod only | lax | `MAIN_COOKIE_DOMAIN` | Refresh token (30d) |
| CSRF token | `CSRF_COOKIE_NAME` | ❌ | — | lax | `/` | Double-submit CSRF token |

### Why httpOnly?

`httpOnly: true` prevents JavaScript from reading the cookie. This stops XSS attacks from stealing tokens. The CSRF cookie is `httpOnly: false` because the client needs to read it and send it in the `X-CSRF-Token` header.

### Why sameSite: 'lax'?

`lax` allows cookies to be sent on top-level navigations (user clicks a link from another site) but blocks cross-origin POST requests. This provides CSRF protection for state-changing operations while allowing OAuth callback redirects.

---

## CSRF Protection

### Double-submit cookie pattern

```
1. Middleware sets CSRF_COOKIE_NAME with random token (if missing)
   → Token generated via Web Crypto API (Edge Runtime compatible)
   → Cookie is readable by client (httpOnly: false)

2. Client reads cookie, sends token in X-CSRF-Token header on mutations

3. Middleware validates:
   → Cookie token === Header token? → valid (constant-time comparison)
   → Also checks: Origin header === Host? → valid

4. If either check fails → 403 Forbidden
```

### Implementation

CSRF utilities are split into two files for runtime compatibility:

- **`src/lib/csrf-utils.ts`** — Edge Runtime safe. `generateCsrfToken()` uses Web Crypto API `crypto.randomUUID()`. `validateCsrfToken()` uses constant-time character comparison. Imported by `middleware.ts`.
- **`src/lib/csrf.ts`** — Server-only. `requireCsrf()` uses `next/headers` (not available in Edge Runtime). Imported by all server actions.

```typescript
// src/middleware.ts — CSRF check on POST with Next-Action header
if (request.method === 'POST' && request.headers.has('Next-Action')) {
  const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!csrfCookie) return new NextResponse('CSRF: missing token', { status: 403 });

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host) {
    const originHost = new URL(origin).host;
    if (originHost !== host) return new NextResponse('CSRF: origin mismatch', { status: 403 });
  }
}

// src/lib/csrf.ts — Server action guard (server-only, not Edge compatible)
export async function requireCsrf() {
  const cookieStore = await cookies();
  const csrfCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  if (!csrfCookie) throw new Error('CSRF: missing token');

  const headersList = await headers();
  const origin = headersList.get('origin');
  const host = headersList.get('host');
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) throw new Error('CSRF: origin mismatch');
    } catch {
      throw new Error('CSRF: invalid origin');
    }
  }
}

// Usage in server actions:
export async function updateGrade(input) {
  await requireCsrf();  // ← first line of every mutation
  // ... rest of action
}
```

### CSRF Coverage Audit (July 2026)

All mutation server actions now call `await requireCsrf()`:

| Action file | Function | Status |
|-------------|----------|--------|
| `auth.actions.ts` | `loginWithCredentials`, `registerUser`, `logout` | ✅ (auth exempt) |
| `settings.actions.ts` | `changeEmail`, `changePhoto`, `changePassword`, `updateNotificationPreferences` | ✅ |
| `profile.actions.ts` | `createContact`, `updateContact`, `deleteContact`, `updateIntellectInfo`, `acceptCodeOfHonor`, `acceptPrivacyConsent` | ✅ (fixed) |
| `certificates.actions.ts` | `updateCertificate`, `createCertificateRequest`, `signCertificate` | ✅ (fixed) |
| `announcement.actions.ts` | `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement` | ✅ (fixed) |
| `calendar.actions.ts` | `createEvent`, `updateEvent`, `deleteEvent` | ✅ |
| `chat.actions.ts` | `createChatRoom`, `sendChatMessage` | ✅ |
| `feed.actions.ts` | `createFeedPost`, `deleteFeedPost`, `createFeedComment`, `toggleFeedLike` | ✅ |
| `msg.actions.ts` | `sendMail`, `sendMailToParents`, `deleteMail`, `markAsImportant` | ✅ |
| `notification.actions.ts` | `markNotificationRead`, `markAllNotificationsRead` | ✅ |
| `onboarding.actions.ts` | `updateOnboardingProfile`, `uploadOnboardingPhoto`, `completeOnboarding` | ✅ |
| `qr-attendance.actions.ts` | `generateAttendanceQR`, `verifyAttendanceQR` | ✅ |
| `grading.actions.ts` | `updateGrade` | ✅ |
| `admin.actions.ts` | `deleteUser`, `updateUserStatus` | ✅ |

---

## JWT Verification

### Local JWT (jsonwebtoken)

```typescript
// src/lib/jwt.ts
function getVerifiedLocalJWTPayload<T>(token: string): T {
  const secret = process.env.JWT_SECRET;
  const payload = JWT.verify(token, secret, { issuer: 'student-portal-local' }) as T;
  return payload;
}
```

- **Algorithm:** HS256 (HMAC with SHA-256)
- **Secret:** `JWT_SECRET` env var (min 16 chars, validated by Zod)
- **Issuer:** `student-portal-local` (prevents token confusion between services)
- **Expiry:** 15 minutes (access token)

### Remote JWT (JWKS via jose)

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
    issuer: env.JWT_ISSUER,
  });
  return payload as T;
}
```

- **Algorithm:** RS256 (RSA signature) — standard for JWKS
- **Key source:** `JWKS_URI` endpoint (e.g. `https://api.example.com/.well-known/jwks.json`)
- **Caching:** Keys cached 10 minutes, 30s cooldown between network fetches
- **Issuer:** `JWT_ISSUER` env var (optional, checked if set)

### JWT payload structure

```typescript
interface JwtPayload {
  exp: number;       // Expiration time (Unix seconds)
  iss: string;       // Issuer
  iat: number;       // Issued at (Unix seconds)
  modules: string[]; // Authorized module names
  userId?: number;   // Local auth only
  username?: string; // Local auth only
  role?: string;     // Local auth only
  schoolId?: number; // Local auth only
  tokenVersion?: number; // Local auth only (for logout-all-devices)
}
```

---

## Rate Limiting

```typescript
// src/lib/rate-limit.ts
const WINDOW_MS = 15 * 60 * 1000;  // 15 minutes
const MAX_ATTEMPTS = 10;            // 10 attempts per window

export function checkRateLimit(identifier: string, type: 'login' | 'password-reset' = 'login') {
  const key = `${type}:${identifier}`;
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

| Action | Limit | Window |
|--------|-------|--------|
| Login | 10 attempts | 15 minutes |
| Password reset | 5 attempts | 15 minutes |
| Registration | 5 attempts | 1 hour |

### Limitations

- **In-memory only** — resets on process restart. In production with multiple instances, use Redis.
- **Per-process** — each Next.js worker has its own rate limit map. A user could get 10 attempts per worker.

---

## Security Headers (CSP)

```typescript
// src/middleware.ts
function buildCspHeader(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://www.google-analytics.com https://www.gstatic.com",
    "frame-src 'self' https://www.google.com/recaptcha/ https://docs.google.com/",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; ');
}
```

| Directive | Value | Purpose |
|-----------|-------|---------|
| `default-src` | `'self'` | Block all external resources by default |
| `script-src` | `'self' 'nonce-{random}' 'strict-dynamic'` | Only scripts with nonce or dynamically loaded by nonce'd scripts |
| `style-src` | `'self' 'unsafe-inline'` | Allow inline styles (Tailwind, Radix) |
| `img-src` | `'self' data: https: blob:` | Allow images from any HTTPS + data URIs |
| `object-src` | `'none'` | Block Flash/Java/plugins |
| `base-uri` | `'self'` | Prevent `<base>` tag injection |

### Nonce-based script loading

Each request gets a unique nonce. Only scripts with the matching nonce execute. This prevents injected scripts from running (XSS mitigation).

---

## Audit Logging

```typescript
// src/actions/audit.actions.ts
export async function logAuditEvent(params: {
  action: string;
  entity: string;
  entityId?: number;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  const user = await getLocalUser();
  if (!user) return;

  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress,
        userId: user.id,
      },
    });
  } catch (error) {
    console.error('[audit] Failed to log audit event:', error);
    // Non-blocking: audit failure should not break the main operation
  }
}
```

### Audited actions

| Action | Entity | Triggered by |
|--------|--------|-------------|
| `change_email` | User | Settings → change email |
| `change_photo` | User | Settings → change photo |
| `change_password` | User | Settings → change password |
| `change_notifications` | User | Settings → notification preferences |
| `update_grade` | Course | Grading → update grade |
| `update_status` | User | Admin → update user status |
| `delete_user` | User | Admin → delete user |

### Non-blocking design

Audit logging is wrapped in try/catch. If the audit log write fails (e.g. DB error), the main operation still succeeds. This prevents audit infrastructure from becoming a SPOF.

---

## File Upload Security

```typescript
// src/actions/settings.actions.ts — changePhoto
const file = formData.get('file') as File | null;
if (!file) throw new Error('No file provided');

// Size limit: 5MB
if (file.size > 5 * 1024 * 1024) {
  throw new Error('File size exceeds 5MB limit');
}

// Type allow-list (not block-list)
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
}

// Random filename (prevent path traversal)
const ext = file.type.split('/')[1];
const filename = `${user.id}-${randomBytes(8).toString('hex')}.${ext}`;

// Store on filesystem, not in DB
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
await mkdir(uploadDir, { recursive: true });
await writeFile(path.join(uploadDir, filename), buffer);
```

### Security measures

1. **Size limit** — 5MB max (prevents memory exhaustion)
2. **Type allow-list** — only JPEG, PNG, WebP, GIF (not block-list)
3. **Random filename** — `crypto.randomBytes` prevents path traversal and filename collisions
4. **Filesystem storage** — not base64 in DB (prevents DB bloat)
5. **Docker volume** — `uploads:/app/public/uploads` persists across container restarts
