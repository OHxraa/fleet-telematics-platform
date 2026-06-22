@echo off
REM =====================================================
REM Fleet Platform - Universal Smart File Push Script
REM Finds and organizes ANY files from Downloads folder
REM Then commits and pushes to GitHub
REM =====================================================

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Universal Smart File Organizer & Pusher
echo ========================================
echo.
echo This script will:
echo 1. Search Downloads folder for project files
echo 2. Automatically organize by type (backend, frontend, etc)
echo 3. Copy to correct project locations
echo 4. Commit and push to GitHub
echo.
pause

REM ============================================
REM CHECK IF WE'RE IN THE RIGHT DIRECTORY
REM ============================================

if not exist "README.md" (
    echo.
    echo ERROR: This script must be run from the "fleet platform" folder!
    echo.
    echo Current directory: %CD%
    echo.
    echo Please run from: Desktop/"fleet platform"/
    echo.
    pause
    exit /b 1
)

echo ✓ Correct directory detected: %CD%

REM ============================================
REM SEARCH DOWNLOADS FOR PROJECT FILES
REM ============================================

echo.
echo Searching Downloads folder for project files...
echo.

set "DOWNLOADS_PATH=%USERPROFILE%\Downloads"
set "FILES_FOUND=0"
set "FILES_COPIED=0"

if not exist "%DOWNLOADS_PATH%" (
    echo ERROR: Downloads folder not found
    pause
    exit /b 1
)

REM Create necessary directories
mkdir backend\src\config 2>nul
mkdir backend\src\middleware 2>nul
mkdir backend\src\utils 2>nul
mkdir backend\src\models 2>nul
mkdir backend\src\adapters 2>nul
mkdir backend\src\services 2>nul
mkdir backend\src\routes 2>nul
mkdir backend\scripts 2>nul
mkdir backend\jobs 2>nul
mkdir frontend\src 2>nul
mkdir frontend\public 2>nul
mkdir logs 2>nul

echo ✓ Directories created

REM ============================================
REM FIND AND ORGANIZE BACKEND FILES
REM ============================================

echo.
echo Searching for backend files...
echo.

REM Package.json
if exist "%DOWNLOADS_PATH%\backend_package.json" (
    copy "%DOWNLOADS_PATH%\backend_package.json" "backend\package.json" >nul
    set /a FILES_FOUND+=1
    set /a FILES_COPIED+=1
    echo ✓ Found: backend_package.json
)

REM Environment file
if exist "%DOWNLOADS_PATH%\backend_.env.local" (
    copy "%DOWNLOADS_PATH%\backend_.env.local" "backend\.env.local" >nul
    set /a FILES_FOUND+=1
    set /a FILES_COPIED+=1
    echo ✓ Found: backend_.env.local
)

REM Main index.js
if exist "%DOWNLOADS_PATH%\backend_index.js" (
    copy "%DOWNLOADS_PATH%\backend_index.js" "backend\src\index.js" >nul
    set /a FILES_FOUND+=1
    set /a FILES_COPIED+=1
    echo ✓ Found: backend_index.js
)

REM Config files
for %%F in (%DOWNLOADS_PATH%\backend_config_*.js) do (
    if exist "%%F" (
        for /f "tokens=* delims=" %%N in ('basename "%%F"') do (
            set "FNAME=%%N"
        )
        set "FNAME=!FNAME:backend_config_=!"
        copy "%%F" "backend\src\config\!FNAME!" >nul
        set /a FILES_FOUND+=1
        set /a FILES_COPIED+=1
        echo ✓ Found: %%N
    )
)

REM Middleware files
for %%F in (%DOWNLOADS_PATH%\backend_middleware_*.js) do (
    if exist "%%F" (
        for /f "tokens=* delims=" %%N in ('basename "%%F"') do (
            set "FNAME=%%N"
        )
        set "FNAME=!FNAME:backend_middleware_=!"
        copy "%%F" "backend\src\middleware\!FNAME!" >nul
        set /a FILES_FOUND+=1
        set /a FILES_COPIED+=1
        echo ✓ Found: %%N
    )
)

REM Utils files
for %%F in (%DOWNLOADS_PATH%\backend_utils_*.js) do (
    if exist "%%F" (
        for /f "tokens=* delims=" %%N in ('basename "%%F"') do (
            set "FNAME=%%N"
        )
        set "FNAME=!FNAME:backend_utils_=!"
        copy "%%F" "backend\src\utils\!FNAME!" >nul
        set /a FILES_FOUND+=1
        set /a FILES_COPIED+=1
        echo ✓ Found: %%N
    )
)

REM Models files
for %%F in (%DOWNLOADS_PATH%\backend_models_*.js) do (
    if exist "%%F" (
        for /f "tokens=* delims=" %%N in ('basename "%%F"') do (
            set "FNAME=%%N"
        )
        set "FNAME=!FNAME:backend_models_=!"
        copy "%%F" "backend\src\models\!FNAME!" >nul
        set /a FILES_FOUND+=1
        set /a FILES_COPIED+=1
        echo ✓ Found: %%N
    )
)

REM Adapters files
for %%F in (%DOWNLOADS_PATH%\backend_adapters_*.js) do (
    if exist "%%F" (
        for /f "tokens=* delims=" %%N in ('basename "%%F"') do (
            set "FNAME=%%N"
        )
        set "FNAME=!FNAME:backend_adapters_=!"
        copy "%%F" "backend\src\adapters\!FNAME!" >nul
        set /a FILES_FOUND+=1
        set /a FILES_COPIED+=1
        echo ✓ Found: %%N
    )
)

REM Services files
for %%F in (%DOWNLOADS_PATH%\backend_services_*.js) do (
    if exist "%%F" (
        for /f "tokens=* delims=" %%N in ('basename "%%F"') do (
            set "FNAME=%%N"
        )
        set "FNAME=!FNAME:backend_services_=!"
        copy "%%F" "backend\src\services\!FNAME!" >nul
        set /a FILES_FOUND+=1
        set /a FILES_COPIED+=1
        echo ✓ Found: %%N
    )
)

REM Routes files
for %%F in (%DOWNLOADS_PATH%\backend_routes_*.js) do (
    if exist "%%F" (
        for /f "tokens=* delims=" %%N in ('basename "%%F"') do (
            set "FNAME=%%N"
        )
        set "FNAME=!FNAME:backend_routes_=!"
        copy "%%F" "backend\src\routes\!FNAME!" >nul
        set /a FILES_FOUND+=1
        set /a FILES_COPIED+=1
        echo ✓ Found: %%N
    )
)

REM Scripts files
for %%F in (%DOWNLOADS_PATH%\backend_scripts_*.js) do (
    if exist "%%F" (
        for /f "tokens=* delims=" %%N in ('basename "%%F"') do (
            set "FNAME=%%N"
        )
        set "FNAME=!FNAME:backend_scripts_=!"
        copy "%%F" "backend\scripts\!FNAME!" >nul
        set /a FILES_FOUND+=1
        set /a FILES_COPIED+=1
        echo ✓ Found: %%N
    )
)

REM Jobs files
for %%F in (%DOWNLOADS_PATH%\backend_jobs_*.js) do (
    if exist "%%F" (
        for /f "tokens=* delims=" %%N in ('basename "%%F"') do (
            set "FNAME=%%N"
        )
        set "FNAME=!FNAME:backend_jobs_=!"
        copy "%%F" "backend\jobs\!FNAME!" >nul
        set /a FILES_FOUND+=1
        set /a FILES_COPIED+=1
        echo ✓ Found: %%N
    )
)

REM ============================================
REM FIND AND ORGANIZE FRONTEND FILES
REM ============================================

echo.
echo Searching for frontend files...
echo.

for %%F in (%DOWNLOADS_PATH%\frontend_*.js %DOWNLOADS_PATH%\frontend_*.jsx %DOWNLOADS_PATH%\frontend_*.css) do (
    if exist "%%F" (
        for /f "tokens=* delims=" %%N in ('basename "%%F"') do (
            set "FNAME=%%N"
        )
        set "FNAME=!FNAME:frontend_=!"
        copy "%%F" "frontend\src\!FNAME!" >nul
        set /a FILES_FOUND+=1
        set /a FILES_COPIED+=1
        echo ✓ Found: %%N
    )
)

REM ============================================
REM GIT OPERATIONS
REM ============================================

echo.
echo ========================================
echo Git Operations
echo ========================================
echo.

if !FILES_FOUND! equ 0 (
    echo WARNING: No project files found in Downloads
    echo Please download files from Claude outputs first
    echo.
    pause
    exit /b 1
)

echo Files found: !FILES_FOUND!
echo Files copied: !FILES_COPIED!
echo.

REM Check if git is initialized
if not exist ".git" (
    echo ERROR: Git repository not initialized!
    echo Please run setup.bat first
    echo.
    pause
    exit /b 1
)

echo Adding files to git...
git add .
if errorlevel 1 (
    echo ERROR: Failed to add files to git
    pause
    exit /b 1
)
echo ✓ Files added

echo.
echo Creating commit...
git commit -m "Day 2: Phase 1 backend - services, routes, migrations, and sync jobs"
if errorlevel 1 (
    echo WARNING: Commit may have failed or nothing changed
)
echo ✓ Commit created

echo.
echo Pushing to GitHub...
git push
if errorlevel 1 (
    echo ERROR: Failed to push to GitHub
    pause
    exit /b 1
)
echo ✓ Files pushed

REM ============================================
REM SUCCESS!
REM ============================================

echo.
echo ========================================
echo ✓ SUCCESS!
echo ========================================
echo.
echo Files found and organized: !FILES_FOUND!
echo.
echo All files have been:
echo ✓ Found in Downloads folder
echo ✓ Automatically organized
echo ✓ Copied to correct locations
echo ✓ Committed to git
echo ✓ Pushed to GitHub
echo.
echo Folder structure created:
echo backend/src/
echo ├─ config/
echo ├─ middleware/
echo ├─ utils/
echo ├─ models/
echo ├─ adapters/
echo ├─ services/
echo ├─ routes/
echo ├─ scripts/
echo └─ jobs/
echo.
echo Repository: https://github.com/OHxraa/fleet-telematics-platform
echo.
pause
