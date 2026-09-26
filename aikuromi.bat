@echo off
chcp 65001 >nul
title KUROMI VA BE BAO HAN - KET NOI TU XA
color 0D

cd /d "%~dp0"

echo =====================================================================
echo    KUROMI VA BE BAO HAN - VAO THANG TRUC TIEP KHONG CAN NHAP IP
echo =====================================================================
echo.
echo [1/2] Dang kiem tra may chu web noi bo...
:: Giai phong cong 5173 neu co tien trinh cu dang chiem giu
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 } | Stop-Process -Force -ErrorAction SilentlyContinue" >nul 2>&1

:: Chay Python http.server ngay tai thu muc hien tai
start /b python -m http.server 5173 >nul 2>&1
ping 127.0.0.1 -n 2 >nul

echo [2/2] Dang kiem tra cong cu ket noi...
if not exist "cloudflared.exe" (
    echo Dang tai cong cu Cloudflare, vui long cho giay lat...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"
)

echo.
echo ---------------------------------------------------------------------
echo  DUONG DAN TRUY CAP (BAM LA VAO NGAY, KHONG HOI IP):
echo ---------------------------------------------------------------------
echo.

"cloudflared.exe" tunnel --url http://127.0.0.1:5173

pause
