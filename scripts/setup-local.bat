@echo off
setlocal
cd /d "%~dp0.."
call npm install || exit /b 1
call npm run db:generate || exit /b 1
call npm run db:push || exit /b 1
call npm run db:seed || exit /b 1
echo Local SQLite setup complete.
pause
