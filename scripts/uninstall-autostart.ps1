# KattaBaza avtomatik ishga tushirish vazifasini olib tashlaydi.
# Kerak bo'lsa o'zi Administrator huquqini so'raydi.
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Host "Administrator huquqi kerak - ochilgan UAC oynasida 'Ha' ni bosing..." -ForegroundColor Yellow
  Start-Process powershell -Verb RunAs -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"")
  exit
}

$taskName = 'KattaBaza'
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
  Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  Write-Host "'$taskName' vazifasi olib tashlandi." -ForegroundColor Green
} else {
  Write-Host "'$taskName' vazifasi topilmadi."
}
