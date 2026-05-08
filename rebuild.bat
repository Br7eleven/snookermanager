@echo off
call "F:\VS Build tools\Common7\Tools\VsDevCmd.bat"
cd /d E:\snookerpos\cue-club-manager
npx @electron/rebuild
