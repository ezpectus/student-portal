#!/bin/sh
set -eu

echo "[entrypoint] Starting Student Portal container..."

# Apply database schema (idempotent — safe to run on every start)
if [ "${RUN_DB_PUSH:-true}" = "true" ]; then
  echo "[database] Applying PostgreSQL schema..."
  npx prisma db push --schema prisma-postgres/schema.prisma --accept-data-loss
  echo "[database] Schema applied."
fi

# Seed demo data (opt-in via SEED_DATABASE env var)
if [ "${SEED_DATABASE:-false}" = "true" ]; then
  if [ "${ALLOW_DESTRUCTIVE_SEED:-false}" = "true" ]; then
    echo "[database] Seeding demo data (destructive mode)..."
    node prisma/seed.js
    echo "[database] Seed complete."
  else
    echo "[database] SEED_DATABASE=true but ALLOW_DESTRUCTIVE_SEED=false — skipping seed."
  fi
fi

echo "[frontend] Starting Next.js standalone server..."
exec node server.js
