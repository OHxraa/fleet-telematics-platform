@echo off
REM =====================================================
REM Fleet Platform - Git Setup & Configuration
REM Fix: 'origin' does not appear to be a git repository
REM =====================================================

echo.
echo ========================================
echo Git Setup for Fleet Platform
echo ========================================
echo.

set "GITHUB_URL=https://github.com/OHxraa/fleet-telematics-platform.git"
set "GITHUB_USER=OHxraa"

REM ============================================
REM CHECK IF WE'RE IN THE RIGHT DIRECTORY
REM ============================================

if not exist "README.md" (
    echo.
    echo ERROR: This script must be run from the "fleet platform" folder!
    echo.
    pause
    exit /b 1
)

echo ✓ Correct directory detected

REM ============================================
REM CHECK GIT STATUS
REM ============================================

echo.
echo Checking git status...
echo.

if not exist ".git" (
    echo [INIT] Git not initialized. Initializing...
    git init
    echo ✓ Git initialized
) else (
    echo ✓ Git already initialized
)

REM ============================================
REM CHECK IF REMOTE IS SET
REM ============================================

echo.
echo Checking GitHub remote...
echo.

git remote get-url origin >nul 2>&1

if errorlevel 1 (
    echo [SETUP] Remote 'origin' not found. Adding...
    git remote add origin "%GITHUB_URL%"
    echo ✓ Remote 'origin' added
) else (
    echo [UPDATE] Remote 'origin' exists. Updating URL...
    git remote set-url origin "%GITHUB_URL%"
    echo ✓ Remote 'origin' updated
)

REM ============================================
REM VERIFY CONFIGURATION
REM ============================================

echo.
echo Verifying git configuration...
echo.

echo Git config:
git config --local user.name >nul 2>&1
if errorlevel 1 (
    echo [CONFIG] Setting git user name...
    git config --local user.name "%GITHUB_USER%"
    git config --local user.email "%GITHUB_USER%@users.noreply.github.com"
)

echo ✓ Git user configured
echo ✓ Remote origin: %GITHUB_URL%

REM ============================================
REM DISPLAY STATUS
REM ============================================

echo.
echo Git configuration complete!
echo.
echo Current status:
git status

echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo.
echo Now you can:
echo.
echo Option 1: Run ADD-AND-PUSH-FILES-14-22.bat
echo   (to push Files 14-22)
echo.
echo Option 2: Manual git commands
echo   git add .
echo   git commit -m "Your message"
echo   git push -u origin main
echo.
pause
