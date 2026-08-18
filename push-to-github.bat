@echo off
REM ============================================================
REM  KattaBaza -> GitHub
REM  Mavjud 79 ta commit tarixini SAQLAB, yangi fayllarni qo'shadi.
REM  Hech narsa o'chirilmaydi, force push ISHLATILMAYDI.
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"
chcp 65001 >nul
set REPO=https://github.com/BNFayziyev/kattabaza.git

echo.
echo === 1/6  Git bormi? ===
git --version || (
  echo. & echo [X] Git o'rnatilmagan: https://git-scm.com/download/win
  pause & exit /b 1
)

echo.
echo === 2/6  Repozitoriy ===
if not exist ".git" (
  git init -b main
  git remote add origin %REPO%
) else (
  git remote get-url origin >nul 2>&1 || git remote add origin %REPO%
)
git remote -v

echo.
echo === 3/6  GitHub'dagi tarixni olish ===
git fetch origin main || (
  echo. & echo [X] GitHub'ga ulanib bo'lmadi. Internet va login tekshiring.
  pause & exit /b 1
)
REM --mixed: HEAD ni GitHub'dagi oxirgi commitga qo'yadi,
REM          MAHALLIY FAYLLARGA TEGMAYDI. Shu tufayli tarix saqlanadi.
git reset --mixed FETCH_HEAD
echo [OK] Tarix ulandi - eski commitlar joyida qoladi.

echo.
echo === 4/6  XAVFSIZLIK TEKSHIRUVI ===
if not exist ".gitignore" (
  echo [X] .gitignore yo'q! To'xtatildi - sirlar chiqib ketishi mumkin.
  pause & exit /b 1
)
git add -A
set LEAK=0
git diff --cached --name-only | findstr /X /C:".env" >nul && (echo [X] XAVF: .env yuklanmoqchi! & set LEAK=1)
git diff --cached --name-only | findstr /R /C:"\.session$" >nul && (echo [X] XAVF: .session fayli! & set LEAK=1)
git diff --cached --name-only | findstr /R /C:"^\.env\." >nul && (echo [X] XAVF: .env.* fayli! & set LEAK=1)
if "!LEAK!"=="1" (
  echo. & echo To'xtatildi. Tuzatish:  git rm --cached .env
  pause & exit /b 1
)
echo [OK] .env va .session fayllari yuklanmaydi.

echo.
echo === 5/6  O'zgarishlar ===
git diff --cached --name-status
echo.
for /f %%C in ('git diff --cached --name-only ^| find /c /v ""') do set CNT=%%C
echo Jami: !CNT! ta fayl
if "!CNT!"=="0" (echo. & echo Yangi o'zgarish yo'q. & pause & exit /b 0)

echo.
set /p MSG="Commit izohi (Enter = standart): "
if "!MSG!"=="" set MSG=Baza, userbot va xavfsizlik tekshiruvi qo'shildi
git -c user.name="BNFayziyev" -c user.email="synapsemchj@gmail.com" commit -m "!MSG!"

echo.
echo === 6/6  GitHub'ga yuborish ===
echo DIQQAT: push qilinsa Vercel avtomatik yangi versiyani chiqaradi.
set /p GO="Yuboramizmi? (ha/yo'q): "
if /I not "!GO!"=="ha" (echo Bekor qilindi. Commit mahalliy saqlandi. & pause & exit /b 0)

git push origin main || (
  echo.
  echo [X] Push bo'lmadi. Ehtimol GitHub'da yangi commit paydo bo'lgan.
  echo     Quyidagini bajaring va skriptni qayta ishga tushiring:
  echo         git pull --rebase origin main
  pause & exit /b 1
)

echo.
echo === TAYYOR ===
echo https://github.com/BNFayziyev/kattabaza
echo Vercel: https://kattabaza.vercel.app
pause
