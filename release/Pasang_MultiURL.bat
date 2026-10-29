@echo off
title MultiURL - Pemasangan Sekali Klik

cls
echo ==============================================================================
echo                 MultiURL Extension - Pemasangan Sekali Klik
echo ==============================================================================
echo.

:: 1. Cari folder ekstensi MultiURL
set "EXT_SOURCE="
if exist "%~dp0MultiURL\manifest.json" (
    set "EXT_SOURCE=%~dp0MultiURL"
) else if exist "%~dp0release\MultiURL\manifest.json" (
    set "EXT_SOURCE=%~dp0release\MultiURL"
) else if exist "%~dp0dist\chrome\manifest.json" (
    set "EXT_SOURCE=%~dp0dist\chrome"
)

if not defined EXT_SOURCE (
    echo [ERROR] Folder ekstensi MultiURL tidak ditemukan!
    echo Pastikan file manifest.json ada di dalam folder MultiURL.
    echo.
    pause
    exit /b 1
)

:: 2. Salin ke folder permanen (%LOCALAPPDATA%\MultiURL_Extension)
:: Ini mencegah ekstensi rusak jika folder unduhan/ekstraksi tidak sengaja terhapus.
set "INSTALL_DIR=%LOCALAPPDATA%\MultiURL_Extension"
echo [*] Mempersiapkan file ekstensi di folder permanen...
echo     Tujuan: %INSTALL_DIR%

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%" >nul 2>&1
xcopy /E /I /Y "%EXT_SOURCE%\*" "%INSTALL_DIR%\" >nul 2>&1

if errorlevel 1 (
    echo [!] Peringatan: Gagal menyalin ke AppData. Menggunakan folder asal.
    set "FINAL_DIR=%EXT_SOURCE%"
) else (
    set "FINAL_DIR=%INSTALL_DIR%"
)

:: 3. Salin path folder ekstensi ke Windows Clipboard
powershell -NoProfile -Command "Set-Clipboard -Value '%FINAL_DIR%'" >nul 2>&1

:: 4. Deteksi Browser
set "BROWSER_NAME=Google Chrome"
set "EXT_URL=chrome://extensions"
set "BROWSER_EXE="

:: Cek Google Chrome
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
    set "BROWSER_NAME=Google Chrome"
    set "EXT_URL=chrome://extensions"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
    set "BROWSER_NAME=Google Chrome"
    set "EXT_URL=chrome://extensions"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set "BROWSER_EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"
    set "BROWSER_NAME=Google Chrome"
    set "EXT_URL=chrome://extensions"
) else if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    :: Cek Microsoft Edge
    set "BROWSER_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
    set "BROWSER_NAME=Microsoft Edge"
    set "EXT_URL=edge://extensions"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set "BROWSER_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
    set "BROWSER_NAME=Microsoft Edge"
    set "EXT_URL=edge://extensions"
) else if exist "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe" (
    :: Cek Brave Browser
    set "BROWSER_EXE=%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe"
    set "BROWSER_NAME=Brave Browser"
    set "EXT_URL=brave://extensions"
)

:: 5. Buka Halaman Ekstensi Browser
echo [*] Membuka halaman ekstensi di %BROWSER_NAME%...
if defined BROWSER_EXE (
    start "" "%BROWSER_EXE%" "%EXT_URL%"
) else (
    start "" "%EXT_URL%"
)

:: 6. Buka Windows Explorer ke folder ekstensi
echo [*] Membuka folder ekstensi di Windows Explorer...
explorer.exe "%FINAL_DIR%"

echo.
echo ==============================================================================
echo                           PETUNJUK CEPAT (10 DETIK)
echo ==============================================================================
echo  1. [PASTIKAN AKTIF]
echo     Di browser yang terbuka, aktifkan saklar "Developer mode" (Mode Pengembang)
echo     di pojok kanan atas halaman ekstensi.
echo.
echo  2. [PASANG EKSTENSI - Pilih salah satu cara]:
echo     CARA A: Tarik (Drag and Drop) folder "MultiURL" langsung ke tengah browser.
echo     --- ATAU ---
echo     CARA B: Klik tombol "Muat yang belum dibongkar" (Load unpacked) di kiri atas.
echo             Path folder SUDAH OTOMATIS TERSALIN di clipboard Anda!
echo             Tekan Ctrl + V di kolom pencarian/alamat folder lalu tekan Enter.
echo.
echo  [SELESAI] Ekstensi MultiURL langsung terpasang dan siap digunakan!
echo  (Tips: Klik ikon puzzle di toolbar browser lalu pin MultiURL agar selalu muncul)
echo ==============================================================================
echo.
pause
