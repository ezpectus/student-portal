# 07 — Frontend Components & UI Architecture

**Project:** eCampus Student Portal
**Last updated:** July 2026

---

## Component Hierarchy

```
<RootLayout> (src/app/layout.tsx)
  ├── <html lang={locale}>
  │   └── <body>
  │       └── <NextIntlClientProvider>
  │           └── <Toaster /> (toast notifications)
  │               └── {children} → route content
  │
  └── <GlobalError> (src/app/global-error.tsx)
      └── Fallback UI for unhandled errors

<LocaleLayout> (src/app/[locale]/layout.tsx)
  ├── setRequestLocale
  ├── <NextIntlClientProvider messages={messages}>
  └── {children}

<PrivateLayout> (src/app/[locale]/(private)/layout.tsx)
  ├── <Header> (navigation, theme toggle, session banner)
  ├── <Sidebar> (module navigation)
  └── {children} (module pages)

<PublicLayout> (src/app/[locale]/(public)/...)
  ├── <PublicHeader>
  └── <Footer>

<ModuleLayout> (src/app/[locale]/(private)/module/layout.tsx)
  └── {children} (module-specific pages)
```

---

## Server vs Client Components

### Server Components (default)

```
page.tsx          → Always server component (data fetching, metadata)
layout.tsx        → Server component (unless needs interactivity)
error.tsx         → MUST be client component ('use client')
loading.tsx       → Server component (Suspense fallback)
```

**Server component characteristics:**
- No `'use client'` directive
- Can use `async/await` directly
- Can call server actions directly
- Cannot use hooks (`useState`, `useEffect`, etc.)
- Cannot use browser APIs (`window`, `localStorage`, `document`)
- Zero client JS shipped for these components

```typescript
// Example: src/app/[locale]/(private)/module/rating/page.tsx
export default async function RatingPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations(INTL_NAMESPACE);
  const data = await getRatingData();  // server action

  return (
    <SubLayout pageTitle={t('title')}>
      <RatingContent data={data} />  {/* client component */}
    </SubLayout>
  );
}
```

### Client Components

```
*.content.tsx     → Client wrapper for interactive pages
components/*.tsx  → Most are client components (with 'use client')
hooks/*.ts        → Always client (React hooks)
```

**Client component characteristics:**
- Must have `'use client'` as first line
- Can use hooks, browser APIs, event handlers
- Cannot be `async` (must use effects for async operations)
- Ship JS to the browser

```typescript
// Example: src/app/[locale]/(private)/module/rating/components/rating-content.tsx
'use client';

export const RatingContent = ({ data }: Props) => {
  const t = useTranslations('private.rating');
  const [selectedSemester, setSelectedSemester] = useState('all');
  // ... interactive logic
};
```

### The boundary pattern

```
page.tsx (server) → fetches data → passes to *.content.tsx (client)
```

This is the standard pattern in this project:
1. `page.tsx` fetches data on the server (fast, secure, no client JS)
2. `page.tsx` passes data as props to a client component
3. Client component handles interactivity (filters, sorting, forms)

---

## shadcn/ui Component System

### Architecture

```
src/components/ui/
├── button.tsx          # Button with variants (primary, secondary, tertiary)
├── card.tsx            # Card container (Card, CardHeader, CardTitle, CardContent, CardFooter)
├── dialog.tsx          # Modal dialog (Radix UI Dialog)
├── input.tsx           # Text input
├── table.tsx           # Table primitives (Table, TableHeader, TableBody, TableRow, TableCell)
├── select.tsx          # Dropdown select (Radix UI Select)
├── form.tsx            # Form components (RHF integration)
├── toast.tsx           # Toast notifications (Radix UI Toast)
├── badge.tsx           # Status badge with color variants
├── pagination-with-links.tsx  # URL-based pagination
├── sort-icon.tsx       # Sortable column indicator
├── ... (43 total)
```

### Button component (example of variant system)

```typescript
// src/components/ui/button.tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        tertiary: 'bg-transparent hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        small: 'h-9 px-3',
        medium: 'h-10 px-4 py-2',
        big: 'h-11 px-6 text-lg',
      },
    },
    defaultVariants: { variant: 'primary', size: 'medium' },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'small' | 'medium' | 'big';
  loading?: boolean;  // auto-disables + shows spinner
  icon?: React.ReactNode;
}

export const Button = ({ variant, size, loading, icon, children, disabled, ...props }: ButtonProps) => (
  <button
    className={cn(buttonVariants({ variant, size }))}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? <Spinner /> : icon}
    {children}
  </button>
);
```

### Badge component (status indicators)

```typescript
// Usage in tables and lists
<Badge variant="success">Active</Badge>
<Badge variant="error">Suspended</Badge>
<Badge variant="neutral">Pending</Badge>
<Badge variant="blue">Info</Badge>
<Badge variant="orange">Warning</Badge>
<Badge variant="purple">Special</Badge>
```

---

## Table Pattern (standard across all modules)

```typescript
// Standard table component pattern
export const ThingsTable = memo(function ThingsTable({ items, totalCount }: Props) {
  const t = useTranslations('private.things.table');
  const { sortedRows, sortHandlers, getSortDirection } = useTableSort(items, undefined, ['created']);
  const { paginatedItems } = usePagination(PAGE_SIZE_DEFAULT, sortedRows);

  // Empty state: early return
  if (items.length === 0) {
    return <p className="text-muted-foreground py-12 text-center text-sm">{t('empty')}</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={sortHandlers.name}>
              {t('name')} <SortIcon direction={getSortDirection('name')} />
            </TableHead>
            <TableHead>{t('status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell><Badge variant="success">{item.status}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Show when={!!totalCount}>
        <PaginationWithLinks page={1} pageSize={PAGE_SIZE_DEFAULT} totalCount={totalCount ?? 0} />
      </Show>
    </>
  );
});
```

### Key conventions
- **Single `<Table>`** for all breakpoints (no mobile card view)
- **Empty state:** inline `<p>` with translated message
- **Pagination:** conditional via `<Show when={...}>` (hidden when single page)
- **Sorting:** `useTableSort` hook with `sortHandlers` and `getSortDirection`
- **Page size:** `PAGE_SIZE_DEFAULT` from `@/lib/constants/page-size` (never hardcoded)
- **Memoization:** `memo()` only for hot lists with stable props

---

## Form Pattern (React Hook Form + Zod)

```typescript
// Standard form component pattern
'use client';

const formSchema = z.object({
  title: z.string().min(1, { message: t('validation.title-required') }),
  content: z.string().min(1).max(5000),
});

type FormValues = z.infer<typeof formSchema>;

export const AnnouncementForm = ({ initialValues, id }: Props) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues ?? { title: '', content: '' },
  });

  const { errorToast } = useServerErrorToast();
  const { toast } = useToast();

  const onSubmit = async (values: FormValues) => {
    try {
      if (id) {
        await updateAnnouncement(id, values);
        toast({ title: t('success.updated') });
      } else {
        await createAnnouncement(values);
        toast({ title: t('success.created') });
      }
    } catch {
      errorToast();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('title')}</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" loading={form.formState.isSubmitting}>
          {id ? t('actions.update') : t('actions.create')}
        </Button>
      </form>
    </Form>
  );
};
```

### Key conventions
- **Schema inline** above `useForm` (no separate `schema.ts` unless large/shared)
- **Translated validation messages** via `t('validation.*')`
- **Loading button** — `loading={form.formState.isSubmitting}` (auto-disables + spinner)
- **Create vs edit** — one form component, `id` / `initialValues` props
- **Error handling** — `try/catch` with `useServerErrorToast()`
- **Inline forms** for CRUD (not modal dialogs, except for confirmations)

---

## Conditional Rendering Helper

```typescript
// src/components/utils/show.tsx
export const Show = ({ when, fallback = null, children }: {
  when: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) => {
  return when ? <>{children}</> : <>{fallback}</>;
};

// Usage
<Show when={!!totalCount}>
  <PaginationWithLinks totalCount={totalCount} />
</Show>

<Show when={!user} fallback={<UserProfile user={user} />}>
  <LoginPrompt />
</Show>
```

---

## Theme System

```typescript
// src/hooks/use-theme.ts
export type Theme = 'light' | 'dim' | 'dark';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(stored ?? (prefersDark ? 'dark' : 'light'));
    setMounted(true);
  }, []);

  // ... toggle logic
  return { theme, toggle, mounted };
};
```

### Hydration safety

The `mounted` flag prevents hydration mismatch:
- Server renders `theme = 'light'` (default)
- Client first render: `theme = 'light'`, `mounted = false` (matches server)
- After mount: `useEffect` reads `localStorage`, sets real theme, `mounted = true`
- Theme toggle only renders after `mounted` is true

```typescript
// src/components/theme-toggle.tsx
export const ThemeToggle = () => {
  const { theme, toggle, mounted } = useTheme();
  if (!mounted) return <div className="h-9 w-9" />;  // placeholder
  return <Button onClick={toggle}>{theme === 'light' ? <Moon /> : <Sun />}</Button>;
};
```

### CalendarView hydration safety

`CalendarView` uses `new Date()` which returns different values on server vs client. To prevent hydration mismatch:

- `currentDate` and `today` are initialized to `null` (same on server and first client render)
- `useEffect` sets both to the real date after mount
- A skeleton grid is rendered until `currentDate` is set

```typescript
// Before (hydration risk — server/client could get different months):
const [currentDate, setCurrentDate] = useState(() => new Date());

// After (hydration safe — null on both server and first client render):
const [currentDate, setCurrentDate] = useState<Date | null>(null);

useEffect(() => {
  const now = new Date();
  setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  setToday(now);
}, []);

if (!currentDate) {
  return <SkeletonGrid />;  // placeholder until mounted
}
```

### useLocalStorage hydration safety

`useLocalStorage` reads `window.localStorage` only in `useEffect`, not in `useState` initializer:

- Server: `value = defaultValue` (no `window` access)
- Client first render: `value = defaultValue` (matches server)
- After mount: `useEffect` reads `localStorage`, updates `value` if stored value exists

This prevents hydration mismatch for `StudySheetContent`, `AiChatContent`, and `CustomDashboard`.

---

## Error Boundaries

```
src/app/global-error.tsx          → Catches errors outside locale routing
src/app/[locale]/error.tsx        → Catches errors in locale layout
src/app/[locale]/(public)/error.tsx    → Catches errors in public routes
src/app/[locale]/(private)/error.tsx   → Catches errors in private routes
src/app/[locale]/(private)/module/error.tsx → Catches errors in module pages
src/app/[locale]/(private)/profile/error.tsx → Catches errors in profile
src/app/[locale]/(private)/settings/error.tsx → Catches errors in settings
```

### Error boundary hierarchy

```
global-error.tsx (outermost)
  └── [locale]/error.tsx
       └── (public)/error.tsx OR (private)/error.tsx
            └── (private)/module/error.tsx
                 └── module/rating/page.tsx (actual page)
```

When a server component throws, the error propagates up to the nearest `error.tsx`. Each boundary can show a different fallback UI.

### Error boundary implementation

```typescript
// src/app/[locale]/(private)/error.tsx
'use client';

export default function PrivateError({ error, reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('global.error');

  useEffect(() => {
    console.error('[private-error]', error.message, error.digest);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <Heading2>{t('title')}</Heading2>
      <Paragraph>{t('description')}</Paragraph>
      <Button variant="primary" onClick={reset}>{t('retry')}</Button>
    </div>
  );
}
```

- `reset` — Retries the failed render (Next.js built-in)
- `error.digest` — Unique error ID for debugging
- Must be `'use client'` — error boundaries need interactivity (retry button)

---

## Loading States

```
src/app/[locale]/(private)/loading.tsx          → Global private loading
src/app/[locale]/(private)/module/rating/loading.tsx → Module-specific loading
src/app/[locale]/(private)/profile/loading.tsx  → Profile loading
src/app/[locale]/(private)/settings/loading.tsx → Settings loading
```

Loading states are shown while server components fetch data. They use Suspense boundaries automatically.

```typescript
// loading.tsx (simplified)
export default function Loading() {
  return (
    <div className="flex items-center justify-center p-12">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
```
