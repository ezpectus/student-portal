@echo off
setlocal
cd /d "%~dp0.."
if "%DATABASE_URL%"=="" (
  echo [error] Set DATABASE_URL to your Neon PostgreSQL connection string first.
  pause
  exit /b 1
)
call npm run db:generate:postgres || exit /b 1
call npm run db:push:postgres || exit /b 1
call npm run db:seed || exit /b 1
echo Neon PostgreSQL setup complete.
pause
