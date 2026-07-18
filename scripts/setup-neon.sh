#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")/.."
: "${DATABASE_URL:?Set DATABASE_URL to your Neon PostgreSQL connection string first.}"
npm run db:generate:postgres
npm run db:push:postgres
npm run db:seed
echo 'Neon PostgreSQL setup complete.'
