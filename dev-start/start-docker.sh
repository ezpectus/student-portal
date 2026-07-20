#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo '[error] Docker is not installed or not in PATH.'
  echo 'Install Docker from https://docker.com'
  exit 1
fi

if [[ ! -f .env.docker ]]; then
  echo '[warn] .env.docker not found. Copying from .env.docker.example...'
  cp .env.docker.example .env.docker
  echo '[warn] Edit .env.docker to set JWT_SECRET before production use.'
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

echo " Opening CLI terminals..."

open_terminal "Docker"        "echo '\n DOCKER — Building and starting containers\n App: http://localhost:3000\n DB:  localhost:5432\n' && docker compose up --build && echo '\n Stopping...' && docker compose down"
open_terminal "Docker Logs"   "echo '\n DOCKER LOGS — live stream\n' && docker compose logs -f"
open_terminal "Postgres Logs" "echo '\n POSTGRES LOGS — live stream\n' && docker compose logs -f postgres"
open_terminal "Info"          "echo '\n INFO — Docker Dashboard\n App:       http://localhost:3000\n Postgres:  localhost:5432\n Adminer:   http://localhost:8080\n Accounts: admin / teacher / student — test12345\n Stack: Next.js 15.5 / React 19.2 / Prisma 7.8\n Docker: PostgreSQL 17 Alpine\n' && read -r"

cat <<'INFO'

 4 terminals opened:
   [1] Docker       — docker compose up --build
   [2] Docker Logs  — live log stream
   [3] Postgres     — DB log stream
   [4] Info         — Dashboard

 Ctrl+C in Docker window to stop all containers.
INFO
