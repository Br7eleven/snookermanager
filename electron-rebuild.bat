@echo off
echo Setting up Visual Studio Build Tools environment...
call "F:\VS Build tools\Common7\Tools\VsDevCmd.bat"

echo.
echo Current directory: %CD%
echo Node version:
node --version
echo Electron version:
node -p "require('./package.json').dependencies.electron"

echo.
echo Running electron-rebuild for better-sqlite3...
cd /d E:\snookerpos\cue-club-manager
npx electron-rebuild -f -w better-sqlite3 -v 42.0.0

echo.
echo Checking if rebuild was successful...
dir node_modules\better-sqlite3\build\Release\

echo.
echo Done!
pause
