@echo off
title Aviator Pro - Phone Server + QR
cd /d "%~dp0"

echo.
echo  Aviator Pro - Starting server + QR code...
echo.

where python >nul 2>&1
if %errorlevel%==0 (
  python "%~dp0server.py"
  goto :done
)

where py >nul 2>&1
if %errorlevel%==0 (
  py -3 "%~dp0server.py"
  goto :done
)

where node >nul 2>&1
if %errorlevel%==0 (
  node "%~dp0server.js"
  goto :done
)

echo  Python not found - using PowerShell fallback.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\write-lan-url.ps1"

set PYEXE=
where python >nul 2>&1 && set PYEXE=python
if not defined PYEXE where py >nul 2>&1 && set PYEXE=py -3

if not defined PYEXE goto :nopy

start "Aviator Server" %PYEXE% -m http.server 8080
timeout /t 2 /nobreak >nul
echo  QR page opening - scan with your phone (same Wi-Fi).
start "" "http://localhost:8080/scan.html"
echo.
echo  Server runs in the other window. Close it to stop.
pause
goto :done

:nopy
echo  ERROR: Install Python from https://www.python.org/downloads/
echo  Then double-click this file again.
pause

:done
