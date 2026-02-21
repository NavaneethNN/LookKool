@echo off
REM ─── LookKool Studio – Desktop App Launcher ───────────────────
REM Sets up MSVC environment and starts the Tauri dev server.
REM Usage: double-click this file or run from command prompt.

echo.
echo   ╔══════════════════════════════════════╗
echo   ║        LookKool Studio Desktop       ║
echo   ║     Professional Billing Software    ║
echo   ╚══════════════════════════════════════╝
echo.

REM Set up MSVC environment
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1

REM Add Rust to PATH
set PATH=%USERPROFILE%\.cargo\bin;%PATH%

REM Navigate to project
cd /d "%~dp0"

echo Starting LookKool Studio...
echo (This will start the Next.js dev server + Tauri window)
echo.

bun run tauri:dev

pause
