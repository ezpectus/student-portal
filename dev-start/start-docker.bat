@echo off
chcp 65001 >nul 2>nul
setlocal
cd /d "%~dp0.."
set "ROOT=%cd%"

where docker >nul 2>nul
if errorlevel 1 (
  echo [error] Docker is not installed or not in PATH.
  echo Install Docker Desktop from https://docker.com
  pause
  exit /b 1
)

if not exist ".env.docker" (
  echo [warn] .env.docker not found. Copying from .env.docker.example...
  copy .env.docker.example .env.docker >nul
  echo [warn] Edit .env.docker to set JWT_SECRET before production use.
)

echo  Opening CLI windows...

:: [1] Docker Compose — main window
start "Student Portal — Docker" cmd /t:0A /k "cd /d ""%ROOT%"" && echo. && echo  DOCKER — Building and starting containers && echo  App: http://localhost:3000 && echo  DB:  localhost:5432 && echo. && docker compose up --build && echo. && echo  Stopping... && docker compose down && pause"

:: [2] Docker Logs — follow
start "Student Portal — Docker Logs" cmd /t:0B /k "cd /d ""%ROOT%"" && echo. && echo  DOCKER LOGS — live stream && echo. && docker compose logs -f"

:: [3] Postgres Logs
start "Student Portal — Postgres Logs" cmd /t:0D /k "cd /d ""%ROOT%"" && echo. && echo  POSTGRES LOGS — live stream && echo. && docker compose logs -f postgres"

:: [4] Info — dashboard
start "Student Portal — Info" cmd /t:2F /k "cd /d ""%ROOT%"" && echo. && echo  INFO — Docker Dashboard && echo. && echo  App:       http://localhost:3000 && echo  Postgres:  localhost:5432 && echo  Adminer:   http://localhost:8080 && echo  ^(Adminer: docker compose --profile dev up^) && echo. && echo  Accounts: admin / teacher / student — test12345 && echo. && echo  Stack: Next.js 15.5 / React 19.2 / Prisma 7.8 && echo  Docker: PostgreSQL 17 Alpine && echo. && pause"

echo.
echo  4 windows opened:
echo    [1] Docker       — docker compose up --build
echo    [2] Docker Logs  — live log stream
echo    [3] Postgres     — DB log stream
echo    [4] Info         — Dashboard
echo.
echo  Ctrl+C in Docker window to stop all containers.
pause
