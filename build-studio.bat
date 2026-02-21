@echo off
REM ─── LookKool Studio – Windows Installer Builder ──────────────
REM Builds the NSIS + MSI installers for distribution.
REM Usage: run from command prompt.

echo.
echo   ╔══════════════════════════════════════╗
echo   ║     LookKool Studio Build System     ║
echo   ║       Windows Installer Builder      ║
echo   ╚══════════════════════════════════════╝
echo.

REM Set up MSVC environment
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul 2>&1

REM Add Rust to PATH
set PATH=%USERPROFILE%\.cargo\bin;%PATH%

REM Navigate to project
cd /d "%~dp0"

echo Building LookKool Studio installer...
echo This may take several minutes on first build.
echo.

bun run tauri:build

echo.
echo Build complete! Check src-tauri\target\release\bundle\ for installers.
pause
