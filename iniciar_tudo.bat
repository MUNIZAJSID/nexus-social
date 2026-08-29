@echo off
title NEXUS Social - Servidor
color 0b
echo ============================================================
echo        INICIANDO O NEXUS SOCIAL NO SEU COMPUTADOR...
echo ============================================================
echo.
echo 1. Abrindo Servidor Local...
start "NEXUS Social - Servidor" cmd /k "npm.cmd run dev"

echo 2. Aguardando inicializacao...
timeout /t 4 /nobreak >nul

echo 3. Abrindo Tunel da Internet (Cloudflare)...
start "NEXUS Social - Tunel da Internet" cmd /k "npm.cmd run tunnel"

echo.
echo ============================================================
echo   TUDO PRONTO! 
echo   - Local:  http://localhost:5000
echo   - Copie o link 'https://...trycloudflare.com' que abriu
echo     na janela do tunel para enviar aos seus amigos!
echo ============================================================
echo.
pause
