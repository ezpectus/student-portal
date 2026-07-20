# 03 — Request Pipeline & Data Flow

**Project:** eCampus Student Portal
**Last updated:** July 2026

---

## Request Lifecycle (full trace)

```
User clicks link or submits form
  │
  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 1. BROWSER                                                          │
│    • Sends HTTP request with cookies (JWT, session ID, CSRF)       │
│    • Next-Action header for server action calls                    │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. NEXT.JS MIDDLEWARE (src/middleware.ts)                           │
│                                                                     │
│  Step 2a: Locale routing                                           │
│    needsLocaleHandling(request)?                                   │
│    → YES: intlMiddleware(request) → redirect to /{locale}/...     │
│    → NO: continue                                                  │
│                                                                     │
│  Step 2b: CSRF validation (POST + Next-Action header)              │
│    • Check CSRF_COOKIE_NAME exists in request cookies              │
│    • If missing → 403 "CSRF: missing token"                        │
│    • Check Origin header matches Host                              │
│    • If mismatch → 403 "CSRF: origin mismatch"                     │
│    • If invalid URL → 403 "CSRF: invalid origin"                   │
│                                                                     │
│  Step 2c: Authentication                                           │
│    authenticationMiddleware(request) [try/catch]                  │
│    → getAuthInfo(request):                                         │
│      • Read TOKEN_COOKIE_NAME from cookies                        │
│      • await getJWTPayload(token):                                 │
│        - If JWKS_URI configured: verifyRemoteJWT(token) via jose  │
│        - Else: decode + verify (local) or decode-only (external)  │
│      • Return { payload, isAuthenticated, isAuthorized }           │
│    → Not authenticated? → redirect to /{locale}/login             │
│    → Authenticated? → authorizationMiddleware(request, authInfo)  │
│      • Extract module from URL path                                │
│      • Check payload.modules includes module                       │
│      • Not authorized? → redirect to /{locale}/not-found          │
│    → CATCH: log error, fall back to intlMiddleware (no crash)     │
│                                                                     │
│  Step 2d: Security headers                                         │
│    • Generate random nonce (16 bytes base64)                       │
│    • Set Content-Security-Policy header                            │
│    • Set x-nonce header                                            │
│                                                                     │
│  Step 2e: CSRF cookie                                              │
│    • If CSRF_COOKIE_NAME missing → set new cookie                  │
│    • httpOnly: false (needs to be readable by client)              │
│    • sameSite: lax, path: /                                        │
│                                                                     │
│  → Return NextResponse (modified or passthrough)                   │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. NEXT.JS ROUTER (App Router)                                      │
│                                                                     │
│  • Match URL to file system route                                   │
│    /uk/module/rating → src/app/[locale]/(private)/module/rating/   │
│  • Load layout.tsx chain (root → locale → private → module)        │
│  • Load page.tsx (server component)                                 │
│  • Load error.tsx (if exists for this segment)                      │
│  • Load loading.tsx (if exists, wraps in Suspense)                  │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. SERVER COMPONENT RENDER (page.tsx)                               │
│                                                                     │
│  • setRequestLocale(locale) — set locale for this request          │
│  • generateMetadata({ locale }) — SEO meta tags                    │
│  • getTranslations(namespace) — load translation strings           │
│  • Call server actions to fetch data:                              │
│    const data = await getRatingData();                             │
│    → Server action runs:                                           │
│      1. getLocalUser() — reads JWT from cookie, queries DB        │
│      2. Authorization check (role, schoolId)                       │
│      3. prisma.query() — database access                           │
│      4. Return typed data or safe default                          │
│  • Render JSX with data (HTML generated on server)                 │
│  • Stream HTML to client (Suspense boundaries)                     │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. CLIENT HYDRATION                                                │
│                                                                     │
│  • Browser receives HTML + JS bundle                                │
│  • React hydrates server HTML (attaches event listeners)           │
│  • Client components ('use client') become interactive             │
│  • useEffect hooks run (localStorage, window APIs)                 │
│  • Hydration must match server output exactly                      │
│    (mismatch → console error, React 19 auto-recoveries)            │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. USER INTERACTION (client-side)                                   │
│                                                                     │
│  User fills form / clicks button                                    │
│  → React Hook Form validates (Zod schema, client-side)             │
│  → Calls server action (RPC to server):                            │
│    await updateGrade({ courseId, grade });                         │
│  → Server action runs on server:                                   │
│    1. requireCsrf() — validates CSRF token                         │
│    2. validateInput(schema, input) — Zod validation                │
│    3. getLocalUser() — auth + school isolation                     │
│    4. prisma.update() — database mutation                          │
│    5. logAuditEvent() — audit trail (non-blocking)                 │
│    6. revalidateTag() / revalidatePath() — cache invalidation      │
│    7. Return result or throw error                                 │
│  → Client receives result:                                         │
│    • Success → toast notification + UI update                      │
│    • Error → useServerErrorToast() shows error message             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Server Action Call Patterns

### Pattern 1: Read with safe default (list/search)

```typescript
// src/actions/announcement.actions.ts
export const getAnnouncements = async () => {
  try {
    const response = await retryWithBackoff(() => apiFetch('announcements'));
    if (!response.ok) return [];  // safe default
    return await response.json();
  } catch {
    return [];  // safe default — page renders empty state
  }
};
```

**When to use:** Page can render an empty state. User sees "no data" instead of error page.

### Pattern 2: Read with throw (required data)

```typescript
// src/actions/certificates.actions.ts
export async function getCertificate(id: number) {
  const response = await apiFetch(`certificates/${id}`);
  if (!response.ok) throwApiError(response.status);
  return await response.json();
}
```

**When to use:** Page cannot render without this data. Error boundary catches and shows error UI.

### Pattern 3: Mutation with throw

```typescript
// src/actions/grading.actions.ts
export async function updateGrade(input: z.infer<typeof updateGradeSchema>) {
  await requireCsrf();
  const validated = validateInput(updateGradeSchema, input, 'updateGrade');
  const user = await getLocalUser();
  if (!user || user.role !== 'TEACHER') throw new Error('Only teachers can update grades');

  const course = await prisma.course.findFirst({ where: { id: validated.courseId, teacherId: user.id } });
  if (!course) throw new Error('Course not found');

  await prisma.course.update({ where: { id: validated.courseId }, data: { grade: validated.grade } });
  await logAuditEvent({ action: 'update_grade', entity: 'Course', entityId: validated.courseId });
  revalidateTag(RATING_CACHE_TAG);
}
```

**When to use:** Mutations. Client wraps in try/catch with `useServerErrorToast()`.

### Client-side calling pattern

```typescript
// Component (client)
const { errorToast } = useServerErrorToast();
const { toast } = useToast();

const handleUpdate = async () => {
  try {
    await updateGrade({ courseId: 1, grade: 95 });
    toast({ title: t('success') });
  } catch {
    errorToast();  // shows global.server-error toast
  }
};
```

---

## Data Flow: External API Mode

When `NEXT_PUBLIC_LOCAL_AUTH !== 'true'`, data flows through the external API:

```
Server Action
  → apiFetch('endpoint', init)
    → Read JWT from cookies
    → Set Authorization: Bearer {jwt}
    → Set Accept-Language: {locale}
    → Set X-Forwarded-For: {ip}
    → Check circuit breaker state
      → OPEN → throw Error (fast-fail, no network call)
      → CLOSED/HALF-OPEN → proceed
    → fetch(url, { ...init, signal: AbortSignal.timeout(10000) })
    → Response:
      → 2xx → return response
      → 4xx → throw PermanentError (no retry)
      → 5xx → throw TransientError → circuit breaker records failure
        → 5 failures → circuit OPEN for 30s
    → Network error → throw TransientError → retry with backoff
```

### Circuit breaker states

```
CLOSED (normal)
  │
  │ 5 consecutive 5xx errors
  ▼
OPEN (fast-fail, no calls)
  │
  │ 30 seconds timeout
  ▼
HALF-OPEN (one trial call allowed)
  │
  ├─ success → CLOSED
  └─ failure → OPEN (reset timer)
```

---

## Cache Invalidation Flow

```
Mutation (server action)
  → revalidatePath('/module/rating')     // invalidate specific path
  → revalidateTag(RATING_CACHE_TAG)      // invalidate by tag
  → revalidateTag(DASHBOARD_CACHE_TAG)   // cascade invalidation

Next request:
  → Next.js checks cache
  → Cache miss (tag/path invalidated)
  → Re-execute server component
  → Fresh data from DB/API
  → New cache entry
```

### Cache tags used

| Tag | File | Invalidated by |
|-----|------|----------------|
| `USER_PROFILE_CACHE_TAG` | `cache-tags.ts` | Photo change, email change, profile update |
| `RATING_CACHE_TAG` | `cache-tags.ts` | Grade update |
| `DASHBOARD_CACHE_TAG` | `cache-tags.ts` | Grade update, attendance change |
| `ANNOUNCEMENTS_CACHE_TAG` | `cache-tags.ts` | Announcement create/update/delete |
| `ADMIN_CACHE_TAG` | `cache-tags.ts` | User status change, user deletion |

---

## Error Propagation Flow

```
Server action throws Error
  │
  ├─ Called from server component (page.tsx)
  │   → Error propagates to nearest error.tsx
  │   → Error boundary renders fallback UI
  │   → User sees error page with "Try again" button
  │
  ├─ Called from client component (form submit)
  │   → Error propagates to try/catch in component
  │   → useServerErrorToast() shows toast
  │   → User stays on page, can retry
  │
  └─ Called from middleware
      → Caught by try/catch in middleware.ts
      → Falls back to intlMiddleware (no crash)
      → User may see unauthenticated page (redirect to login)
```
