@echo off
title Disable Aviator Pro Auto-Run

set "TASK_NAME=AviatorProAlwaysOn"

echo.
echo Removing auto-run task: %TASK_NAME%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$t = Get-ScheduledTask -TaskName '%TASK_NAME%' -ErrorAction SilentlyContinue; if ($t) { Unregister-ScheduledTask -TaskName '%TASK_NAME%' -Confirm:$false }"
set "STARTUP_FILE=%USERPROFILE%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\AviatorProAlwaysOn.cmd"
if exist "%STARTUP_FILE%" del /f /q "%STARTUP_FILE%" >nul 2>&1

echo Auto-run disabled.
pause
