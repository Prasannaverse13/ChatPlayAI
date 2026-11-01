@echo off
setlocal
cd /d "%~dp0"
if exist runtime\node.exe (
  echo ChatPlay AI: open http://127.0.0.1:4310 in your browser.
  "runtime\node.exe" dist-server\index.js
  if errorlevel 1 goto failed
  exit /b 0
)
where node >nul 2>nul
if errorlevel 1 (
  echo ChatPlay needs Node.js 22 or newer. Install it from https://nodejs.org then try again.
  pause
  exit /b 1
)
node -e "const v=process.versions.node.split('.').map(Number); process.exit(v[0]<22||(v[0]===22&&v[1]<12)?1:0)"
if errorlevel 1 (
  echo Please update Node.js to version 22.12 or newer before starting ChatPlay.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm ci
  if errorlevel 1 goto failed
)
if not exist dist\index.html (
  call npm run build
  if errorlevel 1 goto failed
)
if not exist dist-server\index.js (
  call npm run build
  if errorlevel 1 goto failed
)
echo.
echo ChatPlay AI: open http://127.0.0.1:4310 in your browser.
echo Keep this window open. Press Ctrl+C to stop the server.
echo.
call npm start
if errorlevel 1 goto failed
exit /b 0
:failed
echo.
echo ChatPlay could not start. See the error above. Your settings are preserved in data.
pause
exit /b 1
