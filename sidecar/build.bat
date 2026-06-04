@echo off
REM Build the Python sidecar as a self-contained binary for Windows.
REM Run from the project root: sidecar\build.bat
setlocal EnableDelayedExpansion

REM ── Detect Rust target triple ────────────────────────────────────────────────
set TARGET=
for /f "tokens=2" %%i in ('rustc -vV 2^>nul ^| findstr /C:"host:"') do set TARGET=%%i
if "!TARGET!"=="" set TARGET=x86_64-pc-windows-msvc
echo Target triple: !TARGET!

REM ── Check venv ───────────────────────────────────────────────────────────────
set PYTHON=sidecar\.venv\Scripts\python.exe
if not exist "!PYTHON!" (
  echo Error: sidecar\.venv not found.
  echo Run: python -m venv sidecar\.venv ^&^& !PYTHON! -m pip install -e "sidecar[dev]"
  exit /b 1
)

REM ── Install build dependencies ───────────────────────────────────────────────
!PYTHON! -m pip install pyinstaller --quiet

REM ── Build ────────────────────────────────────────────────────────────────────
if not exist src-tauri\binaries mkdir src-tauri\binaries
!PYTHON! -m PyInstaller ^
  --onefile ^
  --name "sidecar-!TARGET!" ^
  --distpath src-tauri\binaries ^
  --specpath %TEMP%\privacy-first-spec ^
  --collect-all sidecar ^
  --hidden-import fitz ^
  --clean ^
  --noconfirm ^
  sidecar_main.py

echo Done: src-tauri\binaries\sidecar-!TARGET!.exe
endlocal
