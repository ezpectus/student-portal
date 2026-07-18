@echo off
setlocal
cd /d "%~dp0.."

where docker >nul 2>nul
if errorlevel 1 (
  echo [error] Docker is not installed or not available in PATH.
  pause
  exit /b 1
)

if not exist ".env.docker" (
  echo [warn] .env.docker not found. Copying from .env.docker.example...
  copy .env.docker.example .env.docker >nul
  echo [warn] Edit .env.docker to set JWT_SECRET and other secrets before production use.
)

echo [docker] Building and starting Student Portal + PostgreSQL...
docker compose up --build
