# Copy static frontend into vercel-deploy/, then: cd vercel-deploy; npx vercel --prod --yes

$root = Split-Path $PSScriptRoot -Parent

$dest = Join-Path $root "vercel-deploy"

New-Item -ItemType Directory -Force -Path $dest, "$dest\icons" | Out-Null

Copy-Item "$root\index.html", "$root\app.js", "$root\styles.css", "$root\sw.js", "$root\manifest.webmanifest", "$root\scan.html", "$root\lan-url.json", "$root\.nojekyll" -Destination $dest -Force

Copy-Item "$root\icons\*" "$dest\icons\" -Force

Write-Host "Synced to $dest - run: cd vercel-deploy; npx vercel --prod --yes"

