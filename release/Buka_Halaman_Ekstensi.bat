@echo off
title MultiURL - Installer Assistant
cls
echo =========================================================
echo             MultiURL - Installer Assistant
echo =========================================================
echo.
echo Sedang membuka halaman chrome://extensions di Google Chrome...
start chrome.exe "chrome://extensions"

echo Membuka folder MultiURL di Windows Explorer...
explorer.exe "%~dp0"

echo.
echo =========================================================
echo PETUNJUK:
echo 1. Pastikan "Developer mode" di pojok kanan atas Chrome AKTIF.
echo 2. DRAG (TARIK) folder "MultiURL" ke halaman Chrome.
echo 3. Selesai! Ekstensi langsung terpasang.
echo =========================================================
echo.
pause
