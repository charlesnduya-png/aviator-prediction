$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function New-AviatorIcon([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(255, 10, 12, 16))
  $brushGreen = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 34, 197, 94))
  $brushGold = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 245, 158, 11))
  $s = $size / 512.0
  $pts = @(
    [System.Drawing.Point]::new([int](96 * $s), [int](320 * $s)),
    [System.Drawing.Point]::new([int](256 * $s), [int](128 * $s)),
    [System.Drawing.Point]::new([int](416 * $s), [int](320 * $s)),
    [System.Drawing.Point]::new([int](352 * $s), [int](320 * $s)),
    [System.Drawing.Point]::new([int](352 * $s), [int](400 * $s)),
    [System.Drawing.Point]::new([int](160 * $s), [int](400 * $s)),
    [System.Drawing.Point]::new([int](160 * $s), [int](320 * $s))
  )
  $g.FillPolygon($brushGreen, $pts)
  $r = [int](48 * $s)
  $g.FillEllipse($brushGold, [int](256 * $s - $r), [int](220 * $s - $r), $r * 2, $r * 2)
  $g.Dispose()
  return $bmp
}

$dir = Join-Path $PSScriptRoot "..\icons"
(New-AviatorIcon 192).Save((Join-Path $dir "icon-192.png"), [System.Drawing.Imaging.ImageFormat]::Png)
(New-AviatorIcon 512).Save((Join-Path $dir "icon-512.png"), [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Icons saved to $dir"
