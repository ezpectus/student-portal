# 08 — Monitoring, Health Checks & Resilience

**Project:** eCampus Student Portal
**Last updated:** July 2026

---

## Health Check Endpoints

### Liveness — `/api/healthz`

```typescript
// src/app/api/healthz/route.ts
export async function GET() {
  return Response.json({ status: 'ok' }, { status: 200 });
}
```

**Purpose:** "Is the process alive?" — Returns 200 if Node.js is running.

**Used by:** Docker health check (restarts container on failure).

```
Docker → wget http://localhost:3000/api/healthz
  → 200: container healthy
  → non-200 or timeout: container unhealthy → restart after 5 failures
```

### Readiness — `/api/ready`

```typescript
// src/app/api/ready/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    api: await checkApiConnectivity(),
    circuitBreaker: getCircuitBreakerState(),
  };

  const overallStatus = Object.values(checks).every(c => c.status === 'ok')
    ? 'ok' : 'degraded';

  return Response.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: Math.round(process.uptime()),
    checks,
  }, { status: overallStatus === 'ok' ? 200 : 503 });
}
```

**Purpose:** "Is the service ready to serve traffic?" — Checks database, API, and circuit breaker.

**Used by:** Load balancer (routes traffic only to healthy instances).

### Response example

```json
{
  "status": "ok",
  "timestamp": "2026-07-20T14:29:00.000Z",
  "version": "0.1.0",
  "uptime": 3600,
  "checks": {
    "database": { "status": "ok", "latencyMs": 5 },
    "api": { "status": "ok", "circuitBreaker": "closed" },
    "circuitBreaker": { "state": "closed", "failures": 0 }
  }
}
```

---

## Circuit Breaker

```typescript
// src/lib/circuit-breaker.ts
type CircuitState = 'closed' | 'open' | 'half-open';

const FAILURE_THRESHOLD = 5;       // 5 failures → open
const RESET_TIMEOUT_MS = 30_000;   // 30s → half-open
```

### States

```
CLOSED (normal operation)
  │
  │ 5 consecutive 5xx/network errors
  ▼
OPEN (fast-fail, no API calls)
  │  All requests immediately throw Error
  │  No network calls are made
  │
  │ 30 seconds elapsed
  ▼
HALF-OPEN (trial period)
  │  One request is allowed through
  │
  ├─ Success → state = CLOSED (reset failure count)
  └─ Failure → state = OPEN (reset 30s timer)
```

### Integration with API client

```typescript
// src/lib/client.ts
export async function apiFetch<T>(url: string, init?: RequestInit) {
  if (circuitBreaker.isOpen()) {
    throw new Error('Circuit breaker is open — external API unavailable');
  }

  try {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status >= 500) {
      circuitBreaker.recordFailure();
      throw new TransientError(`Server error: ${response.status}`);
    }

    circuitBreaker.recordSuccess();
    return response;
  } catch (error) {
    if (error instanceof TransientError) throw error;
    circuitBreaker.recordFailure();
    throw new TransientError('Network error');
  }
}
```

---

## Retry with Backoff

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
      if (error instanceof PermanentError) throw error;  // no retry for 4xx
      if (attempt === options.maxAttempts) throw error;

      const delay = options.baseDelayMs * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
}
```

### Error type classification

| Error type | Retry? | Example |
|-----------|--------|---------|
| `TransientError` | ✅ | 500, 502, 503, network timeout |
| `PermanentError` | ❌ | 400, 401, 403, 404, 409 |
| `ValidationError` | ❌ | Zod validation failure |
| `UnauthorizedError` | ❌ | Not authenticated |
| `NotFoundError` | ❌ | Resource doesn't exist |

---

## Structured Logging

```typescript
// src/lib/logger.ts
const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),

  createScoped: (scope: string) => ({
    debug: (msg: string, meta?: Record<string, unknown>) => log('debug', `[${scope}] ${msg}`, meta),
    // ...
  }),
};
```

### Usage

```typescript
const authLogger = logger.createScoped('auth');

authLogger.warn('Login failed: non-OK response', { status: String(response.status) });
// Output (production): {"level":"warn","msg":"[auth] Login failed: non-OK response","status":"401","timestamp":"2026-07-20T14:29:00Z"}
```

### Log levels

| Level | When to use | Production? |
|-------|-------------|-------------|
| `debug` | Detailed state, query logs | ❌ (dev only) |
| `info` | Normal operations (login, logout) | ✅ |
| `warn` | Expected failures (bad credentials, rate limit) | ✅ |
| `error` | Unexpected failures (DB error, API down) | ✅ |

---

## Error Handling Patterns

### Pattern 1: Safe default (reads)

```typescript
// List/search actions — page can render empty state
export async function getAnnouncements() {
  try {
    const response = await apiFetch('announcements');
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];  // ← safe default, no error to caller
  }
}
```

### Pattern 2: Throw (required data + mutations)

```typescript
// Required data — page cannot render without it
export async function getCertificate(id: number) {
  const response = await apiFetch(`certificates/${id}`);
  if (!response.ok) throwApiError(response.status);
  return await response.json();
}

// Mutations — client catches and shows toast
export async function updateGrade(input) {
  await requireCsrf();
  // ... validation, auth checks
  await prisma.course.update({ ... });
  // if this throws, client catch block shows error toast
}
```

### Client-side error handling

```typescript
// Standard pattern in every form/action component
const { errorToast } = useServerErrorToast();
const { toast } = useToast();

const handleAction = async () => {
  try {
    await someServerAction();
    toast({ title: t('success.title'), description: t('success.description') });
  } catch {
    errorToast();  // shows global.server-error toast
  }
};
```

---

## Session Expiry Monitoring

```typescript
// src/components/session-expiry-banner.tsx
export const SessionExpiryBanner = () => {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkExpiry = async () => {
      const exp = await getSessionExpiry();
      if (!mounted || !exp) return;

      const ms = exp * 1000 - Date.now();
      setRemainingMs(ms);

      if (ms < 5 * 60 * 1000) {  // less than 5 minutes
        // Show warning banner
      }
    };

    const interval = setInterval(checkExpiry, 60_000);  // check every minute
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // ... render banner
};
```

---

## Resilience Summary

| Threat | Mitigation | Status |
|--------|------------|--------|
| External API down | Circuit breaker (5 failures → 30s fast-fail) | ✅ |
| External API slow | AbortSignal.timeout(10s) | ✅ |
| Transient network error | Retry with exponential backoff (2 attempts) | ✅ |
| Database unavailable | Error boundaries + safe defaults | ✅ |
| Middleware crash | try/catch fallback to intlMiddleware | ✅ |
| Rate limit bypass | In-memory rate limiting (per process) | ⚠️ (no Redis) |
| CSRF attack | Double-submit cookie + Origin validation | ✅ |
| XSS attack | CSP headers + nonce-based script loading | ✅ |
| Brute force | Rate limiting (10 attempts / 15 min) | ✅ |
| Token theft | httpOnly + secure + sameSite cookies | ✅ |
| Token reuse | Refresh token rotation + reuse detection | ✅ |
| Session fixation | tokenVersion increment on logout-all | ✅ |
| Audit log failure | Non-blocking (try/catch, console.error) | ✅ |
| File upload DoS | 5MB limit + type allow-list | ✅ |
| Disk full (uploads) | Docker volume + no auto-cleanup | ⚠️ |
| OOM kill | Docker memory limit 512M | ⚠️ (may be tight) |

---

## Health Watch Script

```bash
# scripts/health-watch.cjs
# Continuously monitors /api/healthz and /api/ready
# Logs status changes, alerts on failures

node scripts/health-watch.cjs
# → Polls every 30s
# → Logs: [2026-07-20 14:29:00] OK — status: ok, uptime: 3600s
# → Alert: [2026-07-20 14:29:30] FAIL — status: degraded, database: down
```
