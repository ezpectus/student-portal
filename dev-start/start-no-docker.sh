#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")/.."

if [[ ! -d node_modules ]]; then
  echo '[setup] Installing dependencies...'
  npm install
fi
if [[ ! -f prisma/dev.db ]]; then
  echo '[setup] Creating SQLite database...'
  npm run db:generate
  npm run db:push
  npm run db:seed
fi
if [[ ! -d src/generated/prisma ]]; then
  npm run db:generate
fi

open_terminal() {
  local title="$1"
  shift
  if command -v gnome-terminal >/dev/null 2>&1; then
    gnome-terminal --title="$title" -- bash -lc "$*; exec bash"
  elif command -v osascript >/dev/null 2>&1; then
    osascript -e "tell application \"Terminal\" to do script \"cd '$PWD' && $*\""
  else
    echo "[$title] Run in another terminal: $*"
  fi
}

echo " Opening 6 CLI terminals..."

open_terminal "Frontend"   "echo '\n FRONTEND — Next.js Dev Server (Turbopack)\n http://localhost:3000\n' && npm run dev"
open_terminal "Backend"    "echo '\n BACKEND — API Health Monitor\n' && node scripts/health-watch.cjs"
open_terminal "TypeCheck"  "echo '\n TYPECHECK — TypeScript Watch\n' && npx tsc --noEmit --watch"
open_terminal "Database"   "echo '\n DATABASE — Prisma Studio\n http://localhost:5555\n' && npm run db:studio"
open_terminal "Tests"      "echo '\n TESTS — Vitest Watch\n q=quit a=all f=filter\n' && npm run test:watch"
open_terminal "Info"       "echo '\n INFO — Student Portal Dashboard\n Frontend:      http://localhost:3000\n Prisma Studio: http://localhost:5555\n Accounts: admin / teacher / student — test12345\n Stack: Next.js 15.5 / React 19.2 / Prisma 7.8\n' && read -r"

cat <<'INFO'

 6 terminals opened:
   [1] Frontend    — http://localhost:3000
   [2] Backend     — API health monitor
   [3] TypeCheck   — tsc --watch
   [4] Database    — Prisma Studio http://localhost:5555
   [5] Tests       — Vitest watch
   [6] Info        — Dashboard

 Close each terminal or Ctrl+C to stop.
INFO
