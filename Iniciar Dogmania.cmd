@echo off
setlocal
title Iniciar Dogmania
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0iniciar-local.ps1"
if errorlevel 1 (
    echo.
    echo Nao foi possivel iniciar o sistema. Confira a mensagem acima.
    pause
    exit /b 1
)
endlocal
