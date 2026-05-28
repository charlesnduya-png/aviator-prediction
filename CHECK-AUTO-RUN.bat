@echo off
title Check Aviator Pro Auto-Run

set "TASK_NAME=AviatorProAlwaysOn"

echo.
echo Checking task: %TASK_NAME%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ScheduledTask -TaskName '%TASK_NAME%' | Format-List TaskName,State,Actions,Triggers"
echo.
pause
