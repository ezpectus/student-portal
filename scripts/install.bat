@echo off
setlocal
cd /d "%~dp0.."

echo [1/3] Installing npm dependencies...
call npm install || (echo [error] npm install failed & pause & exit /b 1)

echo [2/3] Generating Prisma client...
call npm run db:generate || (echo [error] Prisma generate failed & pause & exit /b 1)

echo [3/3] Installing Playwright browsers...
call npx playwright install chromium || (echo [warn] Playwright install skipped — run manually if needed)

echo.
echo Done. Dependencies installed, Prisma client generated, Playwright browsers ready.
pause
