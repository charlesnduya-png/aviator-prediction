$port = 8080
$ip = $null
try {
  $udp = New-Object System.Net.Sockets.UdpClient
  $udp.Connect("8.8.8.8", 80)
  $ip = ($udp.Client.LocalEndPoint).Address.ToString()
  $udp.Close()
} catch {}

if (-not $ip) {
  $ip = (
    Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -notmatch '^127\.' -and
      $_.IPAddress -notmatch '^169\.254\.' -and
      $_.PrefixOrigin -ne 'WellKnown'
    } |
    Select-Object -First 1
  ).IPAddress
}

if (-not $ip) { $ip = "127.0.0.1" }

$root = Split-Path $PSScriptRoot -Parent
$obj = @{ url = "http://${ip}:${port}"; ip = $ip; port = $port }
$obj | ConvertTo-Json | Set-Content -Path (Join-Path $root "lan-url.json") -Encoding UTF8
Write-Output $obj.url
