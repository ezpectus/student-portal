@echo off
setlocal
cd /d "%~dp0.."
set "ROOT=%cd%"

if not exist node_modules (
  echo [setup] Installing dependencies...
  call npm install || exit /b 1
)

if not exist prisma\dev.db (
  echo [setup] Generating Prisma client and creating SQLite database...
  call npm run db:generate || exit /b 1
  call npm run db:push || exit /b 1
  call npm run db:seed || exit /b 1
)

if not exist node_modules\playwright-core (
  echo [setup] Installing Playwright browsers...
  call npx playwright install chromium || echo [warn] Playwright install skipped
)

start "Student Portal - Frontend" cmd /k "cd /d ""%ROOT%"" && echo [frontend] Starting Next.js... && npm run dev"
start "Student Portal - Database" cmd /k "cd /d ""%ROOT%"" && echo [database] Starting Prisma Studio... && npm run db:studio"
start "Student Portal - Backend API Health" cmd /k "cd /d ""%ROOT%"" && set API_BASE_URL=https://api.campus.cloud.kpi.ua && node scripts\health-watch.cjs"
start "Student Portal - Info" cmd /k "cd /d ""%ROOT%"" && echo Student Portal local stack && echo. && echo Frontend: http://localhost:3000 && echo Prisma Studio: http://localhost:5555 && echo Test users: admin, teacher, student / test12345 && echo. && echo Run scripts\test.bat to run all tests && echo. && echo Close this window or press Ctrl+C in each log window to stop services && pause"

echo Started frontend, database, backend health, and info windows.
