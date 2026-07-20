# 02 — React Server Components: Concepts & Theory

**Project:** eCampus Student Portal
**Audience:** Developers learning Next.js 15 / React 19
**Language:** English with code examples

---

## Table of Contents

1. [What Are Server Components?](#what-are-server-components)
2. [Server vs Client Components](#server-vs-client-components)
3. [The Hydration Process](#the-hydration-process)
4. [Hydration Mismatches](#hydration-mismatches)
5. [Server Actions: RPC Without API Routes](#server-actions-rpc-without-api-routes)
6. [Streaming and Suspense](#streaming-and-suspense)
7. [Caching in Next.js 15](#caching-in-nextjs-15)
8. [Route Groups and Layouts](#route-groups-and-layouts)
9. [Error Boundaries in App Router](#error-boundaries-in-app-router)
10. [The 'use client' Directive](#the-use-client-directive)
11. [Why Not 'use server' on Every Function?](#why-not-use-server-on-every-function)

---

## What Are Server Components?

### The old world: Client-side everything

Before React Server Components (RSC), all React components ran in the browser:

```
Browser downloads JS bundle → React renders all components → User sees content
```

**Problems:**
- Large JS bundle (every component, every dependency)
- Client must fetch data (loading spinners)
- No SEO (search engines see empty `<div id="root">`)
- Sensitive logic runs in browser (accessible to anyone)

### The new world: Server Components

React Server Components run **on the server** and send **HTML** to the browser:

```
Server runs component → Fetches data → Renders HTML → Sends HTML to browser
Browser receives HTML → React hydrates (makes interactive parts work)
```

**Benefits:**
- Zero JS for static content (smaller bundle)
- Server-side data fetching (no loading spinners for initial data)
- SEO (search engines see full HTML)
- Sensitive logic stays on server (database access, API keys)

### Example in this project

```typescript
// src/app/[locale]/(private)/module/rating/page.tsx
// This is a SERVER component — runs on the server

export default async function RatingPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // These run on the SERVER:
  const t = await getTranslations('private.rating');
  const data = await getRatingData();  // queries Prisma database

  // This HTML is generated on the server and sent to the browser
  return (
    <SubLayout pageTitle={t('title')}>
      <RatingContent data={data} />  {/* client component */}
    </SubLayout>
  );
}
```

**What the browser receives:**
- Complete HTML with grades, student names, etc.
- Small JS bundle for `RatingContent` (only the interactive part)
- No data fetching on the client

---

## Server vs Client Components

| Feature | Server Component | Client Component |
|---------|-----------------|-----------------|
| Directive | (none — default) | `'use client'` |
| Can use `async/await` | ✅ | ❌ (must use effects) |
| Can use `useState`, `useEffect` | ❌ | ✅ |
| Can use browser APIs (`window`, `localStorage`) | ❌ | ✅ |
| Can use event handlers (`onClick`) | ❌ | ✅ |
| Can access database directly | ✅ | ❌ |
| Can access API keys/secrets | ✅ | ❌ |
| Ships JS to browser | ❌ (zero JS) | ✅ |
| Can import server-only packages | ✅ (bcrypt, prisma) | ❌ |

### When to use which?

```
Server Component:
  - Page that fetches data and renders it
  - Static content (text, images, layout)
  - Data-heavy pages (tables, lists)
  - SEO-critical pages

Client Component:
  - Interactive forms (React Hook Form)
  - Stateful UI (tabs, modals, dropdowns)
  - Browser APIs (localStorage, window, charts)
  - Event handlers (onClick, onChange)
```

### The boundary pattern in this project

```
page.tsx (server) → fetches data → passes props to *.content.tsx (client)
```

```typescript
// page.tsx (server component)
export default async function Page() {
  const data = await fetchData();  // server-side fetch
  return <Content data={data} />;  // pass to client component
}

// content.tsx (client component)
'use client';
export const Content = ({ data }: Props) => {
  const [filter, setFilter] = useState('all');  // client state
  return <Table data={filteredData} />;
};
```

---

## The Hydration Process

### What is hydration?

Hydration is the process where React takes server-rendered HTML and makes it interactive:

```
1. Server generates HTML: <button>Click me</button>
2. Browser receives HTML (visible immediately)
3. Browser downloads JS bundle
4. React "hydrates" the button: attaches onClick handler
5. Button is now interactive
```

### Step-by-step

```
Time 0ms:   Browser sends request
Time 50ms:  Server starts rendering
Time 100ms: Server finishes rendering, sends HTML
Time 150ms: Browser receives HTML, displays it (user sees content!)
Time 200ms: Browser downloads JS bundle
Time 400ms: JS bundle parsed and executed
Time 450ms: React hydrates — attaches event listeners
Time 450ms: Page is fully interactive
```

**Key insight:** The user sees content at 150ms (HTML), but can interact at 450ms (after hydration). For read-heavy pages (grades, schedules), this is fine — the user is reading, not clicking.

---

## Hydration Mismatches

### What is a hydration mismatch?

A hydration mismatch occurs when the HTML rendered on the server doesn't match what React renders on the client during hydration.

### Common causes

#### 1. Using `localStorage` or `window` in render

```typescript
// ❌ BAD — server has no window, client does
'use client';
export const BadComponent = () => {
  const theme = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return <div className={theme ? 'dark' : 'light'}>Hello</div>;
};
```

**Server:** `window` is undefined → crash or different output
**Client:** `window` exists → different output
**Result:** Hydration mismatch warning, React re-renders (flash of content)

#### 2. Using `Date.now()` or `Math.random()` in render

```typescript
// ❌ BAD — server and client have different times
'use client';
export const BadComponent = () => {
  return <div>Current time: {new Date().toLocaleTimeString()}</div>;
};
```

**Server:** renders "14:29:01"
**Client:** renders "14:29:03" (2 seconds later)
**Result:** Mismatch

#### 3. Conditional rendering based on cookies/headers

```typescript
// ❌ BAD — cookies differ between server and client
'use client';
export const BadComponent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Can't read cookies in render — must use useEffect
  return isLoggedIn ? <Dashboard /> : <Login />;
};
```

### How this project avoids hydration mismatches

#### Pattern 1: `mounted` flag

```typescript
// src/hooks/use-theme.ts — CORRECT pattern
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('light');  // default
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // This runs AFTER hydration — safe to use browser APIs
    const stored = localStorage.getItem('theme');
    setTheme(stored ?? 'light');
    setMounted(true);
  }, []);

  return { theme, toggle, mounted };
};

// Usage — only render theme-dependent UI after mount
const { theme, mounted } = useTheme();
if (!mounted) return <div className="h-9 w-9" />;  // placeholder
return <Button onClick={toggle}>{theme === 'dark' ? <Sun /> : <Moon />}</Button>;
```

#### Pattern 2: `useLocalStorage` with useEffect

```typescript
// src/hooks/use-storage.ts — CORRECT pattern
export const useLocalStorage = <T>(key: string, defaultValue?: T) => {
  // Start with default value (same on server and client)
  const [value, setValue] = useState<T | undefined>(defaultValue);

  // Read from localStorage AFTER mount (only on client)
  useEffect(() => {
    const stored = window.localStorage.getItem(key);
    if (stored) setValue(JSON.parse(stored));
  }, [key]);

  return [value, setValue];
};
```

**Server:** `value = defaultValue` (no localStorage access)
**Client first render:** `value = defaultValue` (matches server!)
**Client after useEffect:** `value = storedValue` (re-render with real value)

---

## Server Actions: RPC Without API Routes

### What are Server Actions?

Server Actions are functions that run **on the server** but can be called **from the client**. They're like RPC (Remote Procedure Call) — you call a function, it runs on the server, you get the result.

### Without Server Actions (traditional API route)

```typescript
// 1. Create API route: src/app/api/grade/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const user = await getUser(request);
  // ... validation, auth, update
  return Response.json({ success: true });
}

// 2. Call from client
const response = await fetch('/api/grade', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ courseId: 1, grade: 95 }),
});
const result = await response.json();
```

### With Server Actions (this project)

```typescript
// 1. Create server action: src/actions/grading.actions.ts
'use server';
export async function updateGrade(input: z.infer<typeof updateGradeSchema>) {
  await requireCsrf();
  const validated = validateInput(updateGradeSchema, input, 'updateGrade');
  const user = await getLocalUser();
  // ... validation, auth, update
  await prisma.course.update({ where: { id: validated.courseId }, data: { grade: validated.grade } });
  revalidateTag(RATING_CACHE_TAG);
}

// 2. Call from client — just call the function!
await updateGrade({ courseId: 1, grade: 95 });
```

### Why Server Actions are better

| Factor | API Routes | Server Actions |
|--------|-----------|----------------|
| Type safety | Manual (request/response types) | Automatic (function signature) |
| Boilerplate | URL, method, headers, JSON parse | None |
| Validation | Manual in route handler | Zod schema in action |
| Auth | Manual in route handler | `getLocalUser()` in action |
| Cache invalidation | Manual `revalidatePath()` call | Same, but co-located |
| Error handling | HTTP status codes | Throw/catch (natural) |
| CSRF | Manual | Built-in (Next-Action header) |

### How it works under the hood

```
Client calls updateGrade({ courseId: 1, grade: 95 })
  → Next.js serializes arguments to JSON
  → Sends POST request with Next-Action header
  → Middleware validates CSRF (Next-Action header triggers CSRF check)
  → Next.js deserializes arguments
  → Calls server function with arguments
  → Function returns or throws
  → Next.js serializes result
  → Client receives result or error
```

---

## Streaming and Suspense

### What is Streaming?

Streaming sends HTML in chunks as it becomes available, instead of waiting for the entire page to render.

### Without streaming

```
Request → Server renders ALL data → Sends complete HTML → Browser displays
         (slow if one query is slow)
```

### With streaming

```
Request → Server sends HTML shell immediately → Browser displays shell
       → Server finishes query A → Sends chunk A → Browser updates
       → Server finishes query B → Sends chunk B → Browser updates
```

### In this project: `loading.tsx`

```
src/app/[locale]/(private)/module/rating/
  ├── page.tsx       → fetches data (may take 200ms)
  └── loading.tsx    → shown while page.tsx renders
```

```
Browser receives:
  1. Layout HTML (header, sidebar) — immediately
  2. <Suspense fallback={<Loading />}> — immediately
  3. Rating data HTML — when page.tsx finishes (200ms later)
```

The user sees the layout immediately and the content appears when ready. No blank page.

---

## Caching in Next.js 15

### Cache levels

```
1. Request Memoization (same request, same render)
   → fetch('api/data') called twice in same render → 1 network call

2. Data Cache (across requests, time-based)
   → fetch('api/data', { next: { revalidate: 300 } }) → cached 5 minutes

3. Full Route Cache (entire page HTML)
   → Static pages cached at build time

4. Router Cache (client-side, navigations)
   → Previously visited pages cached in browser
```

### In this project

```typescript
// Time-based caching (5 minutes)
const response = await apiFetch('announcements', {
  next: { revalidate: 300, tags: [ANNOUNCEMENTS_CACHE_TAG] },
});

// Tag-based invalidation (when data changes)
export async function createAnnouncement(data) {
  // ... create announcement
  revalidateTag(ANNOUNCEMENTS_CACHE_TAG);  // ← invalidates all cached responses with this tag
}
```

### Cache invalidation flow

```
1. User A visits /announcements → Server fetches from API → Caches response (tag: announcements)
2. User B visits /announcements → Server serves cached response (fast!)
3. Admin creates announcement → Server action calls revalidateTag('announcements')
4. User C visits /announcements → Cache miss → Server fetches fresh data → New cache
```

---

## Route Groups and Layouts

### Route groups `(name)`

Route groups organize routes **without affecting the URL**:

```
src/app/[locale]/
  ├── (public)/          → URL: /uk/login (not /uk/(public)/login)
  │   ├── (auth)/login/
  │   └── landing/
  └── (private)/         → URL: /uk/module/rating (not /uk/(private)/module/rating)
      ├── module/rating/
      └── settings/
```

### Why route groups?

1. **Shared layouts** — `(private)` has a different layout than `(public)` (header, sidebar)
2. **Error boundaries** — each group can have its own `error.tsx`
3. **Loading states** — each group can have its own `loading.tsx`
4. **Clean URLs** — group names don't appear in the URL

### Layout nesting

```
<RootLayout>           (src/app/layout.tsx)
  └── <LocaleLayout>   (src/app/[locale]/layout.tsx)
       └── <PrivateLayout>  (src/app/[locale]/(private)/layout.tsx)
            └── <ModuleLayout>  (src/app/[locale]/(private)/module/layout.tsx)
                 └── <Page>  (src/app/[locale]/(private)/module/rating/page.tsx)
```

Each layout wraps its children. Layouts persist across navigations (don't re-render when navigating between pages in the same group).

---

## Error Boundaries in App Router

### How error boundaries work

```
page.tsx throws Error
  → Next.js looks for nearest error.tsx
  → error.tsx renders fallback UI
  → User sees error page (not white screen)
  → User clicks "Try again" → reset() → page.tsx re-renders
```

### Error boundary hierarchy

```
global-error.tsx (catches everything)
  └── [locale]/error.tsx
       └── (private)/error.tsx
            └── (private)/module/error.tsx
                 └── (private)/module/rating/page.tsx (throws)
```

The error propagates up to the nearest `error.tsx`. If `module/error.tsx` exists, it catches. If not, `(private)/error.tsx` catches. And so on.

### Why `error.tsx` must be a client component

```typescript
// error.tsx MUST be 'use client'
'use client';

export default function Error({ error, reset }) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

Error boundaries need interactivity (the "Try again" button calls `reset()`). Server components can't have event handlers.

---

## The 'use client' Directive

### What it does

`'use client'` marks a file as a **client component**. This means:
- The component runs in the browser
- It can use hooks, state, effects, event handlers
- It's included in the client JS bundle

### Where to put it

```typescript
// FIRST LINE of the file — no comments or blank lines before it
'use client';

import { useState } from 'react';

export const MyComponent = () => {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
};
```

### The client boundary

```
page.tsx (server)
  → imports Content.tsx (client)
    → imports Button.tsx (client, because it's imported by a client component)
    → imports utils.ts (client, same reason)
```

Once you cross into `'use client'`, **everything imported from that file is also client**. This is why server components should import client components at the latest possible point.

```typescript
// ✅ GOOD — only Content is client, Table/Chart are server if possible
// page.tsx (server)
import { Content } from './content';  // client
export default async function Page() {
  const data = await fetchData();  // server
  return <Content data={data} />;  // boundary here
}

// ❌ BAD — everything is client
// page.tsx
'use client';  // ← entire page is client, no server benefits
import { Content } from './content';
export default function Page() {
  // can't use async/await, can't fetch on server
}
```

---

## Why Not 'use server' on Every Function?

### What `'use server'` does

`'use server'` marks a file's exports as **Server Actions**. These functions:
- Run on the server
- Can be called from client components
- Are serialized over the network (arguments and return values)

### Why not mark everything as `'use server'`?

1. **Server Actions can't return non-serializable values** (functions, Dates, Symbols)
2. **Server Actions create a network request** — calling them from a server component is wasteful (no need for RPC when you're already on the server)
3. **Server Actions have CSRF checks** — unnecessary overhead for server-to-server calls

### When to use `'use server'`

```typescript
// ✅ Use 'use server' for functions called from CLIENT components
'use server';
export async function updateGrade(input) {
  // Called from client: await updateGrade({...})
  // Runs on server, returns serializable result
}

// ✅ Don't use 'use server' for functions called from SERVER components
export async function getRatingData() {
  // Called from server: const data = await getRatingData();
  // Already on server, no need for RPC
  return await prisma.course.findMany();
}
```

### The convention in this project

```
src/actions/*.actions.ts    → 'use server' (called from client components)
src/lib/*.ts                → no directive (called from server only)
```

Files with `'use server'`:
- `auth.actions.ts`, `admin.actions.ts`, `grading.actions.ts`, etc.

Files without `'use server'`:
- `prisma.ts`, `jwt.ts`, `env.ts`, `csrf.ts`, etc.

---

## Summary: Mental Model

```
┌─────────────────────────────────────────────────────┐
│                    SERVER                             │
│                                                       │
│  Server Components (default)                         │
│  ├── Can fetch data, access DB, use secrets          │
│  ├── Generate HTML                                   │
│  └── Zero client JS                                  │
│                                                       │
│  Server Actions ('use server')                       │
│  ├── Called from client (RPC)                        │
│  ├── Run on server                                   │
│  └── Return serializable data                        │
│                                                       │
│  Server-only utilities (no directive)                │
│  ├── Called from server components/actions           │
│  ├── Never sent to client                            │
│  └── Can use prisma, bcrypt, etc.                    │
└─────────────────────────────────────────────────────┘
                        │
                        │ HTML + JS bundle
                        ▼
┌─────────────────────────────────────────────────────┐
│                    CLIENT                             │
│                                                       │
│  Client Components ('use client')                    │
│  ├── Interactive (hooks, events)                     │
│  ├── Hydrated from server HTML                       │
│  ├── Can use browser APIs (in useEffect)             │
│  └── Ship JS to browser                              │
│                                                       │
│  Client hooks ('use client')                         │
│  ├── useState, useEffect, etc.                       │
│  └── Used by client components                       │
└─────────────────────────────────────────────────────┘
```
