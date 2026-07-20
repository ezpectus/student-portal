# 01 — Architecture Patterns & Design Decisions

**Project:** eCampus Student Portal
**Audience:** Developers, students learning web architecture
**Language:** English with code examples

---

## Table of Contents

1. [Why This Architecture?](#why-this-architecture)
2. [Monolith vs Microservices](#monolith-vs-microservices)
3. [Server-First Architecture](#server-first-architecture)
4. [Repository Pattern (via Server Actions)](#repository-pattern-via-server-actions)
5. [Singleton Pattern (Prisma)](#singleton-pattern-prisma)
6. [Circuit Breaker Pattern](#circuit-breaker-pattern)
7. [Retry with Backoff Pattern](#retry-with-backoff-pattern)
8. [Factory Pattern (Error Types)](#factory-pattern-error-types)
9. [Strategy Pattern (Auth Modes)](#strategy-pattern-auth-modes)
10. [Middleware Pipeline Pattern](#middleware-pipeline-pattern)
11. [Observer Pattern (Toast Notifications)](#observer-pattern-toast-notifications)
12. [Compound Component Pattern (shadcn/ui)](#compound-component-pattern-shadcnui)
13. [Why Not Redux / Global State?](#why-not-redux--global-state)

---

## Why This Architecture?

### The problem

Student portals are **content-heavy, interaction-light** applications:
- Students view grades, schedules, certificates (read-heavy)
- Teachers update grades, create events (occasional writes)
- Admins manage users (rare writes)

This is fundamentally different from a real-time chat app or a collaborative editor. The architecture should match the workload.

### The solution

**Server-first with selective hydration:**
- Most pages are server-rendered HTML (fast initial load, SEO-friendly)
- Only interactive parts (forms, filters, charts) ship client JS
- No client-side data fetching for initial page load (server fetches everything)

### Why not SPA (Single Page Application)?

| Factor | SPA (e.g. Vite + React) | Server-first (Next.js App Router) |
|--------|--------------------------|------------------------------------|
| Initial load | Blank page → fetch → render | HTML immediately visible |
| SEO | Requires SSR or prerender | Built-in SSR |
| Client JS bundle | Large (all pages in bundle) | Small (only interactive parts) |
| Data fetching | Client-side (loading spinners) | Server-side (no spinners for initial data) |
| Auth | Client-side token management | Server-side cookies + middleware |
| Complexity | Routing, data loading, caching — all manual | Built-in |

---

## Monolith vs Microservices

### What this project is: **Modular Monolith**

```
One Next.js application
  ├── One database
  ├── One deployment unit
  └── Multiple "modules" (admin, rating, chat, feed, etc.)
```

### Why not microservices?

| Factor | Microservices | Modular Monolith (our choice) |
|--------|---------------|-------------------------------|
| Team size | 5+ teams | 1-3 developers |
| Deployment complexity | High (multiple services, API gateways) | Low (one container) |
| Data consistency | Distributed transactions (hard) | ACID transactions (easy) |
| Operational overhead | Kubernetes, service mesh, tracing | Docker Compose |
| Development speed | Slow (cross-service coordination) | Fast (shared codebase) |

### How modules are separated

```
src/app/[locale]/(private)/module/
  ├── admin/          → Admin panel (users, stats, audit)
  ├── rating/         → Academic rating
  ├── studysheet/     → Study sheet
  ├── grading/        → Grade management (teachers)
  ├── calendar/       → Calendar events
  ├── chat/           → Chat rooms
  ├── feed/           → Social feed
  ├── analytics/      → Analytics dashboard
  └── ... (15+ modules)
```

Each module has:
- `page.tsx` — server component, fetches data
- `components/` — client components for interactivity
- `constants.ts` — module-local enums/keys
- `types.ts` — module-local types
- `utils/` — module-local helpers

**Modules share:** database, auth, UI components, hooks, translations.
**Modules don't share:** business logic (each module's actions are self-contained).

---

## Server-First Architecture

### Concept

In a server-first architecture, the **server does the heavy lifting**:
1. Fetches data from database/API
2. Renders HTML
3. Sends HTML + minimal JS to client
4. Client "hydrates" HTML (attaches event listeners)

### Example in this project

```typescript
// page.tsx (server component) — runs on server
export default async function RatingPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('private.rating');
  const data = await getRatingData();  // ← server action, runs on server

  return (
    <SubLayout pageTitle={t('title')}>
      <RatingContent data={data} />  {/* ← client component, hydrated */}
    </SubLayout>
  );
}
```

**What happens:**
1. User navigates to `/uk/module/rating`
2. Server runs `RatingPage` function
3. `getRatingData()` queries the database (server-side, fast)
4. Server renders HTML with the data
5. Browser receives complete HTML (no loading spinner!)
6. React hydrates `RatingContent` (makes it interactive)

**What the browser receives:**
- HTML with all grades, student names, etc. already rendered
- Small JS bundle for `RatingContent` (filters, sorting)
- No data fetching on client

### Contrast: Client-side fetching (what we avoid)

```typescript
// ❌ Bad pattern (not used in this project)
'use client';
export default function RatingPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rating').then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;  // ← user sees spinner
  return <RatingContent data={data} />;
}
```

**Problems with client-side fetching:**
- User sees a loading spinner (bad UX)
- Data fetching happens after hydration (waterfall)
- No SEO (search engines see empty page)
- Larger client bundle (fetching logic, loading states)

---

## Repository Pattern (via Server Actions)

### Concept

The Repository Pattern separates data access logic from business logic. Instead of scattering database queries throughout components, all data access goes through dedicated "repository" functions.

### In this project: Server Actions as repositories

```typescript
// src/actions/grading.actions.ts — "repository" for grade data

// Read
export async function getTeacherCourses(): Promise<TeacherCourse[]> {
  const user = await getLocalUser();
  if (!user || user.role !== 'TEACHER') return [];
  try {
    const courses = await prisma.course.findMany({ where: { teacherId: user.id } });
    // ... transform and return
  } catch {
    return [];  // safe default
  }
}

// Write
export async function updateGrade(input: z.infer<typeof updateGradeSchema>) {
  await requireCsrf();
  const validated = validateInput(updateGradeSchema, input, 'updateGrade');
  const user = await getLocalUser();
  if (!user || user.role !== 'TEACHER') throw new Error('Only teachers can update grades');
  // ... prisma update + audit log + cache invalidation
}
```

### Why this matters

```
Without repository pattern:
  Component → prisma.query() (scattered, hard to test, no auth check)

With repository pattern (server actions):
  Component → serverAction() → auth check → validation → prisma.query() → audit → cache
```

**Benefits:**
- **Centralized auth** — every action checks authentication
- **Centralized validation** — Zod schemas on every input
- **Centralized error handling** — consistent patterns
- **Testable** — actions can be unit tested in isolation
- **Type-safe** — TypeScript knows the return type

---

## Singleton Pattern (Prisma)

### Concept

The Singleton pattern ensures only **one instance** of a class exists. This is critical for database connections.

### Problem without singleton

```typescript
// ❌ Bad — creates new client on every hot reload
export const prisma = new PrismaClient({ adapter });
// Dev mode: 10 hot reloads = 10 Prisma clients = 10 DB connections
// Production: usually OK (one module), but risky with multiple imports
```

### Solution with singleton

```typescript
// src/lib/prisma.ts — singleton via globalThis
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### How it works

1. First load: `globalForPrisma.prisma` is `undefined` → create new `PrismaClient` → store in `globalForPrisma.prisma`
2. Hot reload: `globalForPrisma.prisma` exists → reuse existing instance
3. Production: `globalThis` is not used (but no harm — one process, one instance)

### Why `globalThis`?

Next.js dev mode hot-reloads modules. Each reload re-executes `prisma.ts`. Without `globalThis`, each reload creates a new `PrismaClient`, exhausting database connections. `globalThis` survives hot reloads.

---

## Circuit Breaker Pattern

### Concept

The Circuit Breaker pattern prevents cascading failures when an external service is down. Instead of making every request wait for a timeout, the circuit breaker "trips" after N failures and fast-fails all subsequent requests.

### Real-world analogy

```
Electrical circuit breaker:
  Too much current → breaker trips → power cut → prevents fire

Software circuit breaker:
  Too many failures → breaker opens → requests fast-fail → prevents cascading failure
```

### Implementation

```typescript
// src/lib/circuit-breaker.ts
type CircuitState = 'closed' | 'open' | 'half-open';

let state: CircuitState = 'closed';
let failureCount = 0;
let lastFailureTime = 0;

const FAILURE_THRESHOLD = 5;       // 5 failures → open
const RESET_TIMEOUT_MS = 30_000;   // 30s → half-open

export const circuitBreaker = {
  isOpen() {
    if (state === 'open') {
      if (Date.now() - lastFailureTime > RESET_TIMEOUT_MS) {
        state = 'half-open';  // allow one trial request
        return false;
      }
      return true;  // fast-fail
    }
    return false;
  },

  recordSuccess() {
    state = 'closed';
    failureCount = 0;
  },

  recordFailure() {
    failureCount++;
    lastFailureTime = Date.now();
    if (failureCount >= FAILURE_THRESHOLD) {
      state = 'open';
    }
  },

  getState() { return state; }
};
```

### In this project

```typescript
// src/lib/client.ts
export async function apiFetch(url: string, init?: RequestInit) {
  if (circuitBreaker.isOpen()) {
    throw new Error('Circuit breaker is open');  // ← fast-fail, no network call
  }

  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
    if (response.status >= 500) {
      circuitBreaker.recordFailure();
      throw new TransientError(`Server error: ${response.status}`);
    }
    circuitBreaker.recordSuccess();
    return response;
  } catch (error) {
    circuitBreaker.recordFailure();
    throw error;
  }
}
```

### Scenario: External API goes down

```
Request 1: 5xx → failure count = 1
Request 2: 5xx → failure count = 2
Request 3: 5xx → failure count = 3
Request 4: 5xx → failure count = 4
Request 5: 5xx → failure count = 5 → CIRCUIT OPEN

Request 6: circuitBreaker.isOpen() = true → throw immediately (no 10s timeout!)
Request 7: same — instant fail
...
Request N: same — instant fail

After 30 seconds:
Request N+1: circuit half-open → one request allowed through
  → Success? → circuit closed, normal operation
  → Failure? → circuit open again, 30s timer reset
```

**Without circuit breaker:** Every request waits 10s for timeout. 100 concurrent users = 100 timeouts = thread pool exhausted = entire app frozen.

**With circuit breaker:** After 5 failures, all requests fail instantly. App stays responsive. Only one trial request every 30s.

---

## Retry with Backoff Pattern

### Concept

When a network request fails transiently (e.g. temporary network glitch), retrying immediately may overwhelm the server. **Exponential backoff** increases the delay between retries.

### Implementation

```typescript
// src/lib/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: { maxAttempts: number; baseDelayMs: number }
): Promise<T> {
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry permanent errors (4xx)
      if (error instanceof PermanentError) throw error;
      if (attempt === options.maxAttempts) throw error;

      // Exponential backoff: 200ms, 400ms, 800ms, ...
      const delay = options.baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### In this project

```typescript
// src/actions/announcement.actions.ts
const response = await retryWithBackoff(
  () => apiFetch('announcements', { next: { revalidate: 300 } }),
  { maxAttempts: 2, baseDelayMs: 200 }
);
```

**Timeline:**
```
Attempt 1: 0ms — fails (e.g. 502 Bad Gateway)
Wait:      200ms
Attempt 2: 200ms — succeeds → return response
```

### Why exponential, not linear?

```
Linear:     100ms, 200ms, 300ms, 400ms  — server may still be recovering
Exponential: 100ms, 200ms, 400ms, 800ms — gives server progressively more time
```

### Why not retry 4xx errors?

4xx errors are **permanent** (client error):
- 400 Bad Request — retrying won't fix the request
- 401 Unauthorized — retrying won't fix the token
- 404 Not Found — retrying won't make the resource appear

Only 5xx errors and network errors are **transient** (server error, might recover).

---

## Factory Pattern (Error Types)

### Concept

The Factory Pattern creates objects without specifying the exact class to create. In this project, we use typed error classes to categorize errors and control retry behavior.

### Implementation

```typescript
// src/lib/errors.ts
export class TransientError extends Error {
  constructor(message: string, code: string) {
    super(message);
    this.name = 'TransientError';
  }
}

export class PermanentError extends Error {
  constructor(message: string, code: string) {
    super(message);
    this.name = 'PermanentError';
  }
}

export class ValidationError extends Error { /* ... */ }
export class UnauthorizedError extends Error { /* ... */ }
export class NotFoundError extends Error { /* ... */ }
```

### Usage

```typescript
// In server actions
if (!user) throw new UnauthorizedError();
if (!course) throw new NotFoundError('Course not found');
if (response.status === 409) throw new PermanentError('Email already in use', 'EMAIL_TAKEN');

// In retry logic
try {
  return await fn();
} catch (error) {
  if (error instanceof PermanentError) throw error;  // no retry
  if (error instanceof TransientError) {
    // retry
  }
}
```

### Why typed errors?

Without typed errors:
```typescript
catch (error) {
  // Is this a network error? A validation error? An auth error?
  // No way to know — just a generic Error with a message string
}
```

With typed errors:
```typescript
catch (error) {
  if (error instanceof UnauthorizedError) → redirect to login
  if (error instanceof NotFoundError) → show 404 page
  if (error instanceof TransientError) → retry
  if (error instanceof PermanentError) → show error, no retry
}
```

---

## Strategy Pattern (Auth Modes)

### Concept

The Strategy Pattern lets you switch between different algorithms at runtime. In this project, authentication strategy is selected based on `NEXT_PUBLIC_LOCAL_AUTH`.

### Implementation

```typescript
// src/actions/auth.actions.ts
export async function loginWithCredentials(username, password, rememberMe) {
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    // Strategy 1: Local auth (Prisma + bcrypt + JWT)
    const { localLogin } = await import('./local-auth.actions');
    return await localLogin(username, password, rememberMe);
  }

  // Strategy 2: External auth (REST API)
  const response = await apiFetch('oauth/token', {
    method: 'POST',
    body: qs.stringify({ username, password, grant_type: 'password' }),
  });
  // ...
}
```

### Why dynamic import?

```typescript
const { localLogin } = await import('./local-auth.actions');
```

Dynamic import ensures that `local-auth.actions.ts` (which imports `bcryptjs`, `prisma`, etc.) is **not bundled** when using external auth mode. This reduces the bundle size in external auth deployments.

---

## Middleware Pipeline Pattern

### Concept

Middleware processes requests in a pipeline: each middleware handles one concern and passes the request to the next.

### In this project

```
Request → middleware.ts
  │
  ├─ 1. i18n middleware (locale routing)
  ├─ 2. CSRF validation (POST + Next-Action)
  ├─ 3. Authentication (JWT verification)
  ├─ 4. Authorization (module access control)
  ├─ 5. CSP headers (security)
  └─ 6. CSRF cookie generation
      → Response
```

### Why not one big middleware function?

Separation of concerns:
- i18n middleware only handles locale routing
- CSRF middleware only handles CSRF validation
- Auth middleware only handles authentication

Each can be tested independently. Each can be modified without affecting others.

---

## Observer Pattern (Toast Notifications)

### Concept

The Observer Pattern lets multiple components react to an event without the event source knowing about them. Toast notifications use this pattern.

### In this project

```typescript
// Trigger (anywhere in the app)
const { toast } = useToast();
toast({ title: 'Grade updated', description: 'Student: John Doe' });

// Observer (Toaster component, rendered once in root layout)
<Toaster />  // ← listens for toast events, renders them
```

### How it works

```
Component A calls toast()
  → Event added to toast queue
  → <Toaster /> (rendered in root layout) observes queue
  → <Toaster /> renders toast UI
  → Toast auto-dismisses after 5s
```

**Why this is Observer pattern:** The component calling `toast()` doesn't know how the toast will be rendered. It just fires the event. The `<Toaster />` component observes and renders.

---

## Compound Component Pattern (shadcn/ui)

### Concept

Compound Components are components that work together as a group, sharing implicit state through context.

### Example: Card

```tsx
// Usage — components work together
<Card>
  <CardHeader>
    <CardTitle>Grade Report</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Your GPA is 3.8</p>
  </CardContent>
  <CardFooter>
    <Button>Download</Button>
  </CardFooter>
</Card>
```

Each sub-component (`CardHeader`, `CardTitle`, `CardContent`, `CardFooter`) is a separate component, but they're designed to work together within `<Card>`.

### Example: Dialog

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Delete</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm deletion</DialogTitle>
      <DialogDescription>This action cannot be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="primary" onClick={handleDelete}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Why Compound Components:**
- **Flexible composition** — use only the parts you need
- **Implicit state sharing** — `Dialog` manages `open` state, children access it via context
- **Readable JSX** — `<Card><CardHeader><CardTitle>` is self-documenting

---

## Why Not Redux / Global State?

### The problem Redux solves

In SPA architectures, client-side state management is complex:
- User data needs to be available in many components
- Forms need shared state
- API responses need caching

### Why this project doesn't need Redux

| Redux use case | This project's solution |
|----------------|------------------------|
| User data in many components | Server component fetches user data, passes as props |
| API response caching | Next.js `revalidate` + cache tags |
| Form state | React Hook Form (local to form component) |
| UI state (modals, filters) | `useState` (local to component) |
| Theme | `useTheme` hook + localStorage |
| Toasts | `useToast` hook (Observer pattern) |

### The key insight

**Server Components eliminate most global state needs.** When the server fetches data and passes it as props, there's no need for a client-side store. The "store" is the server.

```typescript
// Server component fetches data once
const user = await getUserDetails();
const rating = await getRatingData();

// Passes to children as props — no global state needed
<Header user={user} />
<RatingContent data={rating} />
```
