@echo off
title Enable Aviator Pro Auto-Run
cd /d "%~dp0"

set "TASK_NAME=AviatorProAlwaysOn"

echo.
echo Enabling auto-run task: %TASK_NAME%
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH.
  echo Install Node.js, then run this script again.
  pause
  exit /b 1
)

set "PS_CMD=$ErrorActionPreference = 'Stop'; $node = (Get-Command node).Source; $app = '%~dp0server.js'; $action = New-ScheduledTaskAction -Execute $node -Argument ('\"' + $app + '\" --no-browser'); $trigger = New-ScheduledTaskTrigger -AtLogOn; $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries; Register-ScheduledTask -TaskName '%TASK_NAME%' -Action $action -Trigger $trigger -Settings $settings -Description 'Aviator Pro always-on server' -Force | Out-Null"
powershell -NoProfile -ExecutionPolicy Bypass -Command "%PS_CMD%"

if errorlevel 1 (
  echo Task Scheduler creation failed. Using Startup folder fallback...
  set "STARTUP_FILE=%USERPROFILE%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\AviatorProAlwaysOn.cmd"
  > "%STARTUP_FILE%" echo @echo off
  >>"%STARTUP_FILE%" echo cd /d "%~dp0"
  >>"%STARTUP_FILE%" echo start "Aviator Pro Always On" cmd /c "cd /d ""%~dp0"" ^&^& node ""%~dp0server.js"" --no-browser"
  if errorlevel 1 (
    echo Failed to create Startup auto-run file.
    pause
    exit /b 1
  )
  echo Startup fallback enabled.
)

echo Auto-run enabled.
echo It will start at every login.
echo.
echo Starting server now...
start "Aviator Pro Always On" cmd /c "cd /d ""%~dp0"" && node ""%~dp0server.js"" --no-browser"
echo.
echo Done.
pause
