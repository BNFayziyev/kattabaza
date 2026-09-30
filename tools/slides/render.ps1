# Karusel slaydlarini PNG ga aylantiradi: tools\slides\slides.html -> public\slides\<id>.png
# Ishlatish:  npm run slides   (Google Chrome yoki Microsoft Edge kerak)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$html = Join-Path $PSScriptRoot 'slides.html'
$out = Join-Path $root 'public\slides'
New-Item -ItemType Directory -Force $out | Out-Null

$browser = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { throw "Chrome yoki Edge topilmadi" }

$userData = Join-Path $env:TEMP 'kattabaza-slides-profile'
$log = Join-Path $env:TEMP 'kattabaza-slides.log'
$ids = [regex]::Matches((Get-Content $html -Raw -Encoding UTF8), '<section class="slide" id="([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
$url = ([Uri]$html).AbsoluteUri

foreach ($id in $ids) {
  $png = Join-Path $out "$id.png"
  $chromeArgs = @('--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    "--user-data-dir=`"$userData`"", '--virtual-time-budget=6000', '--window-size=1280,720',
    "--screenshot=`"$png`"", "$url#$id")
  Start-Process -FilePath $browser -ArgumentList $chromeArgs -Wait -NoNewWindow -RedirectStandardError $log
  Write-Host ("{0,-12} {1,8:N0} KB" -f $id, ((Get-Item $png).Length / 1KB))
}
