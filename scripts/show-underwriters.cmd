@echo off
setlocal
set SCRIPT_DIR=%~dp0
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%show-underwriters.ps1" %*
exit /b %ERRORLEVEL%
