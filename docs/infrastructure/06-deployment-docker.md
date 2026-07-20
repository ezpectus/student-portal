# 06 — Deployment & Docker Infrastructure

**Project:** eCampus Student Portal
**Last updated:** July 2026

---

## Docker Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Service: app (Next.js)                          │   │
│  │  Image: Built from Dockerfile (multi-stage)      │   │
│  │  Port: ${APP_PORT:-3000}:3000                    │   │
│  │  Health: GET /api/healthz (15s interval)         │   │
│  │  Memory limit: 512M, CPU limit: 1.0              │   │
│  │  Volumes:                                        │   │
│  │    uploads:/app/public/uploads (user files)      │   │
│  │  Depends on: postgres (healthy)                  │   │
│  │  Env: .env.docker                                │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────▼───────────────────────────┐   │
│  │  Service: postgres (PostgreSQL 17 Alpine)        │   │
│  │  Port: ${DB_PORT:-5432}:5432                     │   │
│  │  Health: pg_isready (10s interval)               │   │
│  │  Volume: pgdata:/var/lib/postgresql/data         │   │
│  │  Password: ${POSTGRES_PASSWORD}                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Service: adminer (DB admin GUI)                 │   │
│  │  Port: ${ADMINER_PORT:-8080}:8080                │   │
│  │  Depends on: postgres (healthy)                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Volumes:                                                │
│    pgdata:   PostgreSQL data (persistent)               │
│    uploads:  User-uploaded files (persistent)           │
└─────────────────────────────────────────────────────────┘
```

---

## Dockerfile (Multi-Stage Build)

```dockerfile
# Stage 1: Dependencies
FROM node:22-alpine AS deps
# Install only production + dev deps for build

# Stage 2: Builder
FROM node:22-alpine AS builder
# Copy source, build Next.js standalone output
# prisma generate (SQLite or PostgreSQL based on DATABASE_URL)

# Stage 3: Runner (production image)
FROM node:22-alpine AS runner
# Copy standalone output + public + uploads dir
# Expose port 3000
# Entrypoint: run db push (if RUN_DB_PUSH=true) + seed (if SEED_DATABASE=true) + start
```

### Why multi-stage?

| Stage | Purpose | Image size |
|-------|---------|------------|
| deps | Install all dependencies (dev + prod) | ~500MB |
| builder | Compile Next.js, generate Prisma client | ~600MB |
| runner | Production runtime only (no dev deps, no source) | ~150MB |

The final runner image is **~150MB** because:
- `output: 'standalone'` in `next.config.ts` bundles only needed server code
- No `node_modules` in runner — only the standalone bundle
- Alpine Linux base (~50MB)

---

## Docker Compose Configuration

```yaml
# docker-compose.yml (simplified)
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: student-portal-app
    restart: unless-stopped
    ports:
      - '${APP_PORT:-3000}:3000'
    env_file:
      - .env.docker
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/studentportal
    healthcheck:
      test: ['CMD-SHELL', 'wget --no-verbose --tries=1 --spider http://localhost:3000/api/healthz || exit 1']
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 20s
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - uploads:/app/public/uploads        # ← persistent user uploads
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'

  postgres:
    image: postgres:17-alpine
    container_name: student-portal-db
    restart: unless-stopped
    ports:
      - '${DB_PORT:-5432}:5432'
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=studentportal
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  adminer:
    image: adminer:latest
    container_name: student-portal-adminer
    restart: unless-stopped
    ports:
      - '${ADMINER_PORT:-8080}:8080'
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  pgdata:
  uploads:
```

---

## Environment Variables (Docker)

### `.env.docker.example`

```env
# Application
APP_PORT=3000
API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_LOCAL_AUTH=true

# Security
JWT_SECRET=change-me-to-a-strong-secret-at-least-16-chars
# JWKS_URI=https://api.example.com/.well-known/jwks.json  (optional)
# JWT_ISSUER=                                               (optional)

# Cookies
MAIN_COOKIE_DOMAIN=localhost
ROOT_COOKIE_DOMAIN=localhost

# Database
DB_PORT=5432
POSTGRES_PASSWORD=portal_secret

# Database initialization
RUN_DB_PUSH=true           # Apply schema on start
SEED_DATABASE=false        # Seed demo data
ALLOW_DESTRUCTIVE_SEED=false

# Adminer
ADMINER_PORT=8080
```

---

## Container Startup Sequence

```
1. docker compose up
   │
   ├─ postgres starts
   │   → PostgreSQL initializes data directory
   │   → Health check: pg_isready (10s interval)
   │   → Healthy after ~3-5 seconds
   │
   ├─ app starts (waits for postgres healthy)
   │   → Entrypoint script runs:
   │     1. If RUN_DB_PUSH=true → prisma db push --config prisma-postgres.config.ts
   │        → Creates/updates tables in PostgreSQL
   │     2. If SEED_DATABASE=true && ALLOW_DESTRUCTIVE_SEED=true → npm run db:seed
   │        → Inserts demo data
   │     3. node server.js (Next.js standalone)
   │   → Health check: GET /api/healthz (15s interval, 20s start period)
   │   → Healthy after Next.js boots (~5-10 seconds)
   │
   └─ adminer starts (waits for postgres healthy)
       → Adminer web UI available at :8080
```

---

## Volume Persistence

| Volume | Mount point | Purpose | Data survives restart? |
|--------|-------------|---------|----------------------|
| `pgdata` | `/var/lib/postgresql/data` | PostgreSQL database files | ✅ |
| `uploads` | `/app/public/uploads` | User-uploaded avatars/files | ✅ |

### Without volumes (data loss scenario)

If volumes are not mounted:
- **PostgreSQL data** lives in the container's writable layer
- Container restart/rebuild → **all database data lost**
- **User uploads** live in the container's writable layer
- Container restart/rebuild → **all uploaded files lost**

### With volumes (current setup)

- Docker creates named volumes (`pgdata`, `uploads`) on first run
- Volumes persist across container restarts, rebuilds, and updates
- To wipe data: `docker compose down -v` (removes volumes)

---

## Health Checks

### Liveness probe (`/api/healthz`)

```typescript
// src/app/api/healthz/route.ts
export async function GET() {
  return Response.json({ status: 'ok' }, { status: 200 });
}
```

**Purpose:** "Is the process alive?" — Docker uses this to decide whether to restart the container.

### Readiness probe (`/api/ready`)

```typescript
// src/app/api/ready/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),      // prisma.$queryRaw('SELECT 1')
    api: await checkExternalApi(),        // circuit breaker state
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

**Purpose:** "Is the service ready to serve traffic?" — Load balancer uses this to route traffic.

### Docker health check configuration

```yaml
healthcheck:
  test: ['CMD-SHELL', 'wget --no-verbose --tries=1 --spider http://localhost:3000/api/healthz || exit 1']
  interval: 15s       # Check every 15 seconds
  timeout: 5s         # Max 5 seconds for response
  retries: 5          # 5 consecutive failures = unhealthy
  start_period: 20s   # Grace period during startup
```

---

## No-Docker Local Development

For local development without Docker:

### Windows
```bash
scripts\start-no-docker.bat
# Starts: npm run dev (with Turbopack)
```

### Unix
```bash
./scripts/start-no-docker.sh
# Starts: npm run dev (with Turbopack)
```

These scripts:
1. Check if `.env` exists (copy from `.env.example` if not)
2. Run `npm run db:push` (apply SQLite schema)
3. Optionally run `npm run db:seed` (if database is empty)
4. Start `npm run dev` with Turbopack

---

## Production Build

```bash
# Build for SQLite (local production test)
npm run build

# Build for PostgreSQL (production)
npm run build:postgres
# This runs: prisma generate --config prisma-postgres.config.ts && next build
```

### Next.js standalone output

```typescript
// next.config.ts
const nextConfig = {
  output: 'standalone',  // ← produces self-contained server bundle
};
```

Standalone output:
- Bundles all server code + needed `node_modules` into `.next/standalone/`
- No need to copy `node_modules` to production image
- Smaller production image (~150MB vs ~500MB)
- Must copy `public/` folder manually (not included in standalone)

---

## Deployment Checklist

- [ ] `.env.docker` configured with strong `JWT_SECRET`
- [ ] `POSTGRES_PASSWORD` set to a strong password
- [ ] `MAIN_COOKIE_DOMAIN` and `ROOT_COOKIE_DOMAIN` set to production domain
- [ ] `NEXT_PUBLIC_LOCAL_AUTH` set correctly (true for standalone, false for external API)
- [ ] `JWKS_URI` and `JWT_ISSUER` set if using external JWT verification
- [ ] `RUN_DB_PUSH=true` for first deploy (creates tables)
- [ ] `SEED_DATABASE=false` for production (no demo data)
- [ ] `ALLOW_DESTRUCTIVE_SEED=false` for production
- [ ] Docker volumes (`pgdata`, `uploads`) are mounted
- [ ] Health check endpoint accessible (`/api/healthz`)
- [ ] Port mapping correct (`APP_PORT:3000`)
- [ ] Adminer port not exposed to public internet (or protected)
