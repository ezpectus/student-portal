# syntax=docker.io/docker/dockerfile:1

# ─── Base: minimal Alpine with Node.js ───────────────────────────────
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
ENV NEXT_TELEMETRY_DISABLED=1


# ─── Deps: install all dependencies (cached layer) ───────────────────
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* .npmrc* ./
RUN npm ci


# ─── Builder: compile Next.js + generate Prisma client ───────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time ARGs (public vars, safe to bake into image)
ARG NEXT_PUBLIC_ENV=production
ARG NEXT_PUBLIC_LOCAL_AUTH=true

ENV NEXT_PUBLIC_ENV=$NEXT_PUBLIC_ENV
ENV NEXT_PUBLIC_LOCAL_AUTH=$NEXT_PUBLIC_LOCAL_AUTH

# Generate Prisma PostgreSQL client
RUN npm run db:generate:postgres

# Build Next.js (standalone output)
RUN npm run build

# Prune dev dependencies — keep only production deps for runner
RUN npm ci --omit=dev


# ─── Runner: minimal production image ────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone Next.js output (includes minimal node_modules traced by build)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schemas + generated client for db push at startup
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma-postgres ./prisma-postgres
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Copy entrypoint script
COPY --chown=nextjs:nodejs scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Copy package.json (needed for db:seed script reference)
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/healthz || exit 1

ENTRYPOINT ["/bin/sh", "/app/docker-entrypoint.sh"]