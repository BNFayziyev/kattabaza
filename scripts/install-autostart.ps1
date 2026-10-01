# ==========================================================================
#  KattaBaza saytini Windows bilan birga avtomatik ishga tushirish.
#
#  Ishlatish (oddiy PowerShell'dan ham bo'ladi - kerak bo'lsa o'zi
#  Administrator huquqini so'raydi, UAC oynasida "Ha" ni bosing):
#     powershell -ExecutionPolicy Bypass -File scripts\install-autostart.ps1
#
#  Natija: kompyuter yoqilishi bilan server ko'tariladi, tizimga kirmasangiz
#  ham ishlaydi (24/7) va to'xtab qolsa qayta urinadi.
# ==========================================================================

# Vazifa kimning nomidan ishlashi. Administrator oynasi boshqa akkauntda
# ochilsa ham, server skriptni ishga tushirgan foydalanuvchi nomidan ishlaydi.
param([string]$User = "$env:USERDOMAIN\$env:USERNAME")

$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Host "Administrator huquqi kerak - ochilgan UAC oynasida 'Ha' ni bosing..." -ForegroundColor Yellow
  Start-Process powershell -Verb RunAs -ArgumentList @(
    '-NoExit', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"", '-User', "`"$User`"")
  exit
}

$taskName = 'KattaBaza'
$port = 8090
$root = Split-Path -Parent $PSScriptRoot
$startCmd = Join-Path $root 'scripts\start.cmd'

if (-not (Test-Path $startCmd)) {
  throw "start.cmd topilmadi: $startCmd"
}

Write-Host "Loyiha papkasi: $root"
Write-Host "Foydalanuvchi:  $User"

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Eski vazifa o'chirilmoqda..."
  Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c `"$startCmd`"" -WorkingDirectory $root

$triggerBoot = New-ScheduledTaskTrigger -AtStartup
$triggerBoot.Delay = 'PT1M'
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn -User $User

$principal = New-ScheduledTaskPrincipal -UserId $User -LogonType S4U -RunLevel Limited

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -RestartCount 999 `
  -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -MultipleInstances IgnoreNew

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger @($triggerBoot, $triggerLogon) `
  -Principal $principal `
  -Settings $settings `
  -Description 'KattaBaza sayti - avtomatik ishga tushirish' | Out-Null

Write-Host ""
Write-Host "Tayyor. '$taskName' vazifasi ro'yxatdan o'tdi." -ForegroundColor Green

# Portni qo'lda ochilgan nusxa band qilgan bo'lsa - aynan shu sayt
# serveri ekanini tekshirib, to'xtatamiz (aks holda vazifa ishga tusha olmaydi)
$busy = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($busy) {
  $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($busy.OwningProcess)"
  if ($proc -and $proc.Name -eq 'node.exe' -and $proc.CommandLine -match 'server[\\/]index\.js') {
    Write-Host "$port-portdagi qo'lda ochilgan server to'xtatilmoqda (PID $($proc.ProcessId))..."
    Stop-Process -Id $proc.ProcessId -Force
    Start-Sleep -Seconds 2
  } else {
    Write-Host "$port-portni boshqa dastur band qilgan: $($proc.Name) (PID $($busy.OwningProcess))." -ForegroundColor Red
    Write-Host "Uni yoping, keyin: Start-ScheduledTask -TaskName $taskName"
    return
  }
}

Start-ScheduledTask -TaskName $taskName
Write-Host "Server fonda ishga tushirilmoqda..."

$ok = $false
foreach ($i in 1..15) {
  Start-Sleep -Seconds 2
  try {
    $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 "http://127.0.0.1:$port/api/health"
    if ($r.StatusCode -eq 200) { $ok = $true; break }
  } catch {}
}
if ($ok) {
  Write-Host "Server ishlayapti: http://localhost:$port" -ForegroundColor Green
} else {
  Write-Host "Server hali javob bermadi - data\server.log ni tekshiring." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Log:                   data\server.log"
Write-Host "Qayta ishga tushirish: Stop-ScheduledTask -TaskName $taskName; Start-ScheduledTask -TaskName $taskName"
Write-Host "O'chirish:             scripts\uninstall-autostart.ps1"
