@echo off
REM ==========================================================================
REM  KattaBaza - ishga tushirish
REM  Server kutilmaganda to'xtasa, avtomatik qayta ko'tariladi.
REM ==========================================================================
title KattaBaza

cd /d "%~dp0.."

if not exist "node_modules" (
  echo [kattabaza] bogliqliklar ornatilmoqda...
  call npm install --no-audit --no-fund
)

if not exist "dist\index.html" (
  echo [kattabaza] sayt yigilmoqda...
  call npm run build
)

if not exist "data" mkdir data

:loop
echo [kattabaza] server ishga tushmoqda - %date% %time%
node server/index.js >> data\server.log 2>&1
set code=%errorlevel%
REM 2 - port band: server allaqachon boshqa oynada/fonda ishlayapti
if "%code%"=="2" (
  echo [kattabaza] server allaqachon ishlayapti - bu nusxa yopiladi.
  exit /b 2
)
echo [kattabaza] server toxtadi (kod: %code%). 10 soniyadan keyin qayta urinish...
REM timeout oynasiz (fon vazifasi) rejimda ishlamaydi - ping bilan kutamiz
ping -n 11 127.0.0.1 >nul
goto loop
