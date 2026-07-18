@echo off
setlocal
cd /d "%~dp0.."

echo [1/4] Type-checking (tsc)...
call npm run tsc || (echo [error] Type-check failed & pause & exit /b 1)

echo [2/4] Linting...
call npm run lint || (echo [error] Lint failed & pause & exit /b 1)

echo [3/4] Unit tests (Vitest)...
call npm test || (echo [error] Unit tests failed & pause & exit /b 1)

echo [4/4] E2E tests (Playwright)...
call npm run test:e2e || (echo [warn] E2E tests failed — make sure dev server is running or playwright.config.ts will auto-start one)

echo.
echo All checks complete.
pause
