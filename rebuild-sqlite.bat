@echo off
echo Setting up Visual Studio Build Tools environment...
call "F:\VS Build tools\Common7\Tools\VsDevCmd.bat"

echo.
echo Removing existing better-sqlite3...
cd /d E:\snookerpos\cue-club-manager
rmdir /s /q node_modules\better-sqlite3 2>nul

echo.
echo Reinstalling better-sqlite3...
npm install better-sqlite3@12.9.0 --build-from-source

echo.
echo Build complete!
pause
