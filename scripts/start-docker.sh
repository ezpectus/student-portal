#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo '[error] Docker is not installed or not available in PATH.' >&2
  exit 1
fi

echo '[docker] Building and starting Student Portal + PostgreSQL...'
docker compose up --build
