# ==========================================================================
#  KattaBaza saytini Windows bilan birga avtomatik ishga tushirish.
#
#  Ishlatish (Administrator sifatida PowerShell oching):
#     powershell -ExecutionPolicy Bypass -File scripts\install-autostart.ps1
#
#  Natija: kompyuter yoqilishi bilan server ko'tariladi, tizimga kirmasangiz
#  ham ishlaydi (24/7) va to'xtab qolsa qayta urinadi.
# ==========================================================================

$ErrorActionPreference = 'Stop'

$taskName = 'KattaBaza'
$root = Split-Path -Parent $PSScriptRoot
$startCmd = Join-Path $root 'scripts\start.cmd'

if (-not (Test-Path $startCmd)) {
  throw "start.cmd topilmadi: $startCmd"
}

Write-Host "Loyiha papkasi: $root"

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Eski vazifa o'chirilmoqda..."
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c `"$startCmd`"" -WorkingDirectory $root

$triggerBoot = New-ScheduledTaskTrigger -AtStartup
$triggerBoot.Delay = 'PT1M'
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"

$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Limited

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

$busy = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($busy) {
  Write-Host "3000-port band - avval qo'lda ochilgan serverni yoping, keyin:" -ForegroundColor Yellow
  Write-Host "  Start-ScheduledTask -TaskName $taskName"
} else {
  Start-ScheduledTask -TaskName $taskName
  Write-Host "Server fonda ishga tushirildi." -ForegroundColor Green
}
Write-Host ""
Write-Host "Log:                   data\server.log"
Write-Host "Qayta ishga tushirish: Stop-ScheduledTask -TaskName $taskName; Start-ScheduledTask -TaskName $taskName"
Write-Host "O'chirish:             scripts\uninstall-autostart.ps1"
Write-Host ""
Write-Host "Sayt: http://localhost:3000"
