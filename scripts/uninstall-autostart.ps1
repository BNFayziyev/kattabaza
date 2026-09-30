# KattaBaza avtomatik ishga tushirish vazifasini olib tashlaydi (Administrator sifatida).
$taskName = 'KattaBaza'
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
  Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  Write-Host "'$taskName' vazifasi olib tashlandi." -ForegroundColor Green
} else {
  Write-Host "'$taskName' vazifasi topilmadi."
}
