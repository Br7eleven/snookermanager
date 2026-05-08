@echo off
echo ========================================
echo Rebuilding better-sqlite3 for Electron 33
echo ========================================
echo.

call "F:\VS Build tools\Common7\Tools\VsDevCmd.bat"

echo.
echo Running rebuild...
cd /d E:\snookerpos\cue-club-manager\node_modules\better-sqlite3
npm run install --target=33.4.11 --runtime=electron --dist-url=https://electronjs.org/headers

echo.
echo Checking build output...
if exist "build\Release\better_sqlite3.node" (
    echo SUCCESS: Native module built successfully!
    dir build\Release\better_sqlite3.node
) else (
    echo FAILED: Native module not found
)

echo.
pause
