@echo off
chcp 65001 >nul 2>nul
setlocal
cd /d "%~dp0.."
set "ROOT=%cd%"

if not exist node_modules (
  echo [setup] Installing dependencies...
  call npm install || exit /b 1
)
if not exist prisma\dev.db (
  echo [setup] Creating SQLite database...
  call npm run db:generate || exit /b 1
  call npm run db:push || exit /b 1
  call npm run db:seed || exit /b 1
)
if not exist src\generated\prisma (
  call npm run db:generate || exit /b 1
)

echo  Opening 6 CLI windows...

:: [1] Frontend — Next.js dev server
start "Student Portal — Frontend" cmd /t:0A /k "cd /d ""%ROOT%"" && echo. && echo  FRONTEND — Next.js Dev Server (Turbopack) && echo  http://localhost:3000 && echo. && npm run dev"

:: [2] Backend — API health monitor
start "Student Portal — Backend" cmd /t:0B /k "cd /d ""%ROOT%"" && echo. && echo  BACKEND — API Health Monitor && echo. && node scripts\health-watch.cjs"

:: [3] TypeCheck — tsc --watch
start "Student Portal — TypeCheck" cmd /t:0E /k "cd /d ""%ROOT%"" && echo. && echo  TYPECHECK — TypeScript Watch && echo. && npx tsc --noEmit --watch"

:: [4] Database — Prisma Studio
start "Student Portal — Database" cmd /t:0D /k "cd /d ""%ROOT%"" && echo. && echo  DATABASE — Prisma Studio && echo  http://localhost:5555 && echo. && npm run db:studio"

:: [5] Tests — Vitest watch
start "Student Portal — Tests" cmd /t:1F /k "cd /d ""%ROOT%"" && echo. && echo  TESTS — Vitest Watch && echo  q=quit  a=all  f=filter && echo. && npm run test:watch"

:: [6] Info — dashboard
start "Student Portal — Info" cmd /t:2F /k "cd /d ""%ROOT%"" && echo. && echo  INFO — Student Portal Dashboard && echo. && echo  Frontend:      http://localhost:3000 && echo  Prisma Studio: http://localhost:5555 && echo. && echo  Accounts: admin / teacher / student — test12345 && echo. && echo  npm run test:quick  — tsc+lint+vitest && echo  npm run test:all    — full suite && echo  npm run db:push     — apply schema && echo  npm run db:seed     — seed data && echo  npm run build       — prod build && echo. && echo  Stack: Next.js 15.5 / React 19.2 / Prisma 7.8 && echo  Branch: && git branch --show-current 2^>nul && echo. && pause"

echo.
echo  6 windows opened:
echo    [1] Frontend    — http://localhost:3000
echo    [2] Backend     — API health monitor
echo    [3] TypeCheck   — tsc --watch
echo    [4] Database    — Prisma Studio http://localhost:5555
echo    [5] Tests       — Vitest watch
echo    [6] Info        — Dashboard
echo.
echo  Close each window or Ctrl+C to stop.
pause
