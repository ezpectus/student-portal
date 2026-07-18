#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")/.."
npm install
npm run db:generate
npm run db:push
npm run db:seed
echo 'Local SQLite setup complete.'
