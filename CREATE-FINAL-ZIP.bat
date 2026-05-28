@echo off
title Create Aviator Pro Final ZIP
cd /d "%~dp0"

set "ZIP=%~dp0AVIATOR-PRO-FINAL.zip"
set "DESKTOP=%USERPROFILE%\Desktop\AVIATOR-PRO-FINAL.zip"

echo.
echo  Creating final ZIP package...
echo.

powershell -NoProfile -Command ^
  "$root = '%CD%';" ^
  "$zip = '%ZIP%';" ^
  "if (Test-Path $zip) { Remove-Item $zip -Force };" ^
  "$exclude = @('*.zip','CREATE-FINAL-ZIP.bat');" ^
  "$files = Get-ChildItem -Path $root -Recurse | Where-Object { -not $_.PSIsContainer -and $_.Extension -ne '.zip' -and $_.Name -ne 'CREATE-FINAL-ZIP.bat' };" ^
  "Compress-Archive -Path ($files | ForEach-Object { $_.FullName }) -DestinationPath $zip -CompressionLevel Optimal;"

if exist "%ZIP%" (
  copy /Y "%ZIP%" "%DESKTOP%" >nul 2>&1
  echo  DONE!
  echo.
  echo  Saved to:
  echo    %ZIP%
  echo    %DESKTOP%
  echo.
  explorer.exe /select,"%ZIP%"
) else (
  echo  Failed to create ZIP.
)

pause
