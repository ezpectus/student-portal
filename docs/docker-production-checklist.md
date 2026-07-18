# Docker Production Checklist

Pre-deployment verification for Docker-based production environments.

## Image Security

- [ ] **Non-root user**: Dockerfile uses `nextjs:nodejs` (UID 1001), no root execution
- [ ] **Minimal base**: `node:22-alpine` — smallest attack surface
- [ ] **No dev deps in runner**: `npm ci --omit=dev` in builder, standalone output traced
- [ ] **No .env in image**: Environment variables injected at runtime via `docker-compose.yml` or orchestration platform
- [ ] **No secrets baked**: `NEXT_PUBLIC_*` vars only; `JWT_SECRET`, `DATABASE_URL` injected at runtime

## Network Security

- [ ] **CSP headers**: Configured in `next.config.mjs` (X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy)
- [ ] **Health check**: Docker `HEALTHCHECK` polls `/api/healthz` every 30s
- [ ] **Readiness check**: `/api/ready` endpoint verifies database + external API + circuit breaker
- [ ] **Port exposure**: Only port 3000 exposed, no internal ports leaked

## Database

- [ ] **Connection string**: `DATABASE_URL` points to PostgreSQL (Neon or containerized)
- [ ] **Prisma client**: Generated for PostgreSQL (`npm run db:generate:postgres`)
- [ ] **Schema applied**: `npm run db:push:postgres` run as part of entrypoint or CI
- [ ] **Seed**: `npm run db:seed` run once (not on every restart in production)
- [ ] **Backups**: Neon automated backups enabled, or pg_dump cron configured

## Environment Variables

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | Yes | `postgresql://...` | Neon or local Postgres |
| `JWT_SECRET` | Yes | 32+ random chars | Used for JWT signing |
| `NEXT_PUBLIC_LOCAL_AUTH` | Yes | `false` | Set `true` for standalone demo |
| `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS` | No | `false` | Set `true` for portfolio demo |
| `API_BASE_URL` | Yes | `https://api.example.com` | External API URL |
| `NEXT_PUBLIC_ENV` | No | `production` | Used for feature gating |
| `NEXT_PUBLIC_FEATURE_*` | No | `true`/`false` | Feature toggles, default ON |

## Docker Compose

- [ ] **Volume persistence**: `pgdata` volume for PostgreSQL data
- [ ] **Restart policy**: `restart: unless-stopped` on all services
- [ ] **Network isolation**: Services on dedicated network, not bridge
- [ ] **Resource limits**: Memory and CPU limits set in compose
- [ ] **Logging**: JSON-file driver with size limits (`max-size: 10m`, `max-file: 3`)

## Pre-Deploy Steps

1. Run `npm run tsc && npm run lint && npm test` — all must pass
2. Run `npm audit --audit-level=high` — no high/critical vulnerabilities
3. Build image: `docker build -t student-portal .`
4. Test image locally: `docker compose up --build`
5. Verify `/api/healthz` returns 200
6. Verify `/api/ready` returns 200 with all checks healthy
7. Test login with production credentials
8. Test critical user flows: grades, messages, certificates

## Post-Deploy Verification

- [ ] Application responds on production URL
- [ ] HTTPS certificate valid (via reverse proxy or Vercel)
- [ ] All locales work (`/uk`, `/en`, `/pl`, `/de`)
- [ ] WebSocket/polling notifications functional
- [ ] Error boundaries render correctly on 500s
- [ ] CSP headers present in response (check via `curl -I`)
- [ ] No sensitive data in client-side bundles (check page source)
