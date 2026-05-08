@echo off
echo Attempting to clean and reinstall...
echo.

cd /d E:\snookerpos\cue-club-manager

echo Stopping any background processes...
timeout /t 3 /nobreak >nul

echo Attempting cleanup...
rd /s /q node_modules\electron 2>nul
if exist node_modules\electron (
    echo Electron folder still locked. Please close all applications and try again.
    echo You may need to restart your computer.
    pause
    exit /b 1
)

echo Electron folder removed successfully!
echo.
echo Running npm install...
npm install

echo.
echo Done!
pause
