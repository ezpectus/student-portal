#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")/.."

if [[ ! -d node_modules ]]; then
  echo '[setup] Installing dependencies...'
  npm install
fi

if [[ ! -f prisma/dev.db ]]; then
  echo '[setup] Generating Prisma client and creating SQLite database...'
  npm run db:generate
  npm run db:push
  npm run db:seed
fi

run_log() {
  local title="$1"
  shift
  if command -v gnome-terminal >/dev/null 2>&1; then
    gnome-terminal -- bash -lc "$*; exec bash"
  elif command -v osascript >/dev/null 2>&1; then
    osascript -e "tell application \"Terminal\" to do script \"cd '$PWD' && $*\""
  else
    echo "[$title] Run in another terminal: $*"
  fi
}

run_log frontend 'npm run dev'
run_log database 'npm run db:studio'
run_log backend 'API_BASE_URL=https://api.campus.cloud.kpi.ua node scripts/health-watch.cjs'

cat <<'INFO'
Student Portal local stack started.
Frontend: http://localhost:3000
Prisma Studio: http://localhost:5555
Test users: admin, teacher, student / test12345
INFO
