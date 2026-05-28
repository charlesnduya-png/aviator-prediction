@echo off
title Deploy Aviator Pro to Netlify
cd /d "%~dp0"

echo.
echo  Deploying to Netlify hosting...
echo.

powershell -NoProfile -Command ^
  "$drop = '%CD%\netlify-publish';" ^
  "if (Test-Path $drop) { Remove-Item $drop -Recurse -Force };" ^
  "New-Item -ItemType Directory -Path $drop | Out-Null;" ^
  "Copy-Item '%CD%\index.html','%CD%\styles.css','%CD%\app.js','%CD%\sw.js','%CD%\manifest.webmanifest','%CD%\scan.html','%CD%\netlify.toml' -Destination $drop;" ^
  "Copy-Item '%CD%\icons' $drop -Recurse;"

cd netlify-publish
call npx netlify-cli deploy --prod --dir . --allow-anonymous

echo.
echo  Save your link from above.
echo  App unlock now uses generated session code.
echo  Also check PUBLIC-LINK.txt
echo.
pause
