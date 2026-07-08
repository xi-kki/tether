@echo off
cd /d "%~dp0"
echo Tether Game Server
echo ==================
echo.
echo Starting server on http://localhost:3456
echo.
start "" http://localhost:3456
node serve.cjs
pause
