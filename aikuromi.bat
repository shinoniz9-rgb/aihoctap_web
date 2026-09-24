@echo off
chcp 65001 >nul
title KUROMI VA BE BAO HAN - KET NOI TU XA
color 0D

echo =====================================================================
echo    KUROMI VA BE BAO HAN - VAO THANG TRUC TIEP KHONG CAN NHAP IP
echo =====================================================================
echo.
echo [1/2] Dang kiem tra may chu web noi bo...
start /b python -m http.server 5173 --directory "%~dp0" >nul 2>&1
timeout /t 2 >nul

echo [2/2] Dang kiem tra cong cu ket noi...
if not exist "%~dp0cloudflared.exe" (
    echo Dang tai cong cu Cloudflare, vui long cho giay lat...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%~dp0cloudflared.exe'"
)

echo.
echo ---------------------------------------------------------------------
echo  DUONG DAN TRUY CAP (BAM LA VAO NGAY, KHONG HOI IP):
echo ---------------------------------------------------------------------
echo.

"%~dp0cloudflared.exe" tunnel --url http://127.0.0.1:5173

pause
