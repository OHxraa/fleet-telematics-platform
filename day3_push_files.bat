@echo off
REM =====================================================
REM Fleet Platform - Day 3 File Push Script
REM Specifically handles Day 3 files and pushes to GitHub
REM =====================================================

echo.
echo ========================================
echo Day 3 File Organization & Push
echo ========================================
echo.
echo This script will:
echo 1. Find Day 3 files in Downloads
echo 2. Create necessary folders
echo 3. Copy to correct locations
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
    echo Please run from: Desktop/"fleet platform"/
    echo.
    pause
    exit /b 1
)

echo ✓ Correct directory detected

REM ============================================
REM CREATE FOLDER STRUCTURE
REM ============================================

echo.
echo Creating folder structure...

mkdir backend\src\routes 2>nul
mkdir backend\src\websocket 2>nul
mkdir backend\src\systems 2>nul
mkdir backend\src\adapters 2>nul

echo ✓ Folders created

REM ============================================
REM COPY DAY 3 FILES
REM ============================================

echo.
echo Copying Day 3 files...
echo.

set "DOWNLOADS_PATH=%USERPROFILE%\Downloads"
set "FILES_COPIED=0"
set "FILES_FAILED=0"

REM Routes - Telematics
if exist "%DOWNLOADS_PATH%\backend_routes_telematicsRoutes.js" (
    copy "%DOWNLOADS_PATH%\backend_routes_telematicsRoutes.js" "backend\src\routes\telematicsRoutes.js" >nul
    if errorlevel 1 (
        echo ✗ Failed: telematicsRoutes.js
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ telematicsRoutes.js
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: backend_routes_telematicsRoutes.js
)

REM Routes - Trailers
if exist "%DOWNLOADS_PATH%\backend_routes_trailerRoutes.js" (
    copy "%DOWNLOADS_PATH%\backend_routes_trailerRoutes.js" "backend\src\routes\trailerRoutes.js" >nul
    if errorlevel 1 (
        echo ✗ Failed: trailerRoutes.js
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ trailerRoutes.js
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: backend_routes_trailerRoutes.js
)

REM Routes - Drivers
if exist "%DOWNLOADS_PATH%\backend_routes_driverRoutes.js" (
    copy "%DOWNLOADS_PATH%\backend_routes_driverRoutes.js" "backend\src\routes\driverRoutes.js" >nul
    if errorlevel 1 (
        echo ✗ Failed: driverRoutes.js
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ driverRoutes.js
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: backend_routes_driverRoutes.js
)

REM WebSocket
if exist "%DOWNLOADS_PATH%\backend_websocket_handlers.js" (
    copy "%DOWNLOADS_PATH%\backend_websocket_handlers.js" "backend\src\websocket\handlers.js" >nul
    if errorlevel 1 (
        echo ✗ Failed: websocket/handlers.js
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ websocket/handlers.js
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: backend_websocket_handlers.js
)

REM Alert System
if exist "%DOWNLOADS_PATH%\backend_systems_alertSystem.js" (
    copy "%DOWNLOADS_PATH%\backend_systems_alertSystem.js" "backend\src\systems\alertSystem.js" >nul
    if errorlevel 1 (
        echo ✗ Failed: systems/alertSystem.js
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ systems/alertSystem.js
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: backend_systems_alertSystem.js
)

REM Idem Adapter
if exist "%DOWNLOADS_PATH%\backend_adapters_idemAdapter.js" (
    copy "%DOWNLOADS_PATH%\backend_adapters_idemAdapter.js" "backend\src\adapters\idemAdapter.js" >nul
    if errorlevel 1 (
        echo ✗ Failed: adapters/idemAdapter.js
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ adapters/idemAdapter.js
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: backend_adapters_idemAdapter.js
)

REM Day 3 Summary
if exist "%DOWNLOADS_PATH%\DAY_3_SUMMARY.md" (
    copy "%DOWNLOADS_PATH%\DAY_3_SUMMARY.md" "DAY_3_SUMMARY.md" >nul
    if errorlevel 1 (
        echo ✗ Failed: DAY_3_SUMMARY.md
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ DAY_3_SUMMARY.md
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: DAY_3_SUMMARY.md
)

REM ============================================
REM VERIFY FILES
REM ============================================

echo.
echo Verifying files...

if not exist "backend\src\routes\telematicsRoutes.js" (
    echo ✗ ERROR: telematicsRoutes.js not found!
    set /a FILES_FAILED+=1
)

if not exist "backend\src\routes\trailerRoutes.js" (
    echo ✗ ERROR: trailerRoutes.js not found!
    set /a FILES_FAILED+=1
)

if not exist "backend\src\routes\driverRoutes.js" (
    echo ✗ ERROR: driverRoutes.js not found!
    set /a FILES_FAILED+=1
)

if not exist "backend\src\websocket\handlers.js" (
    echo ✗ ERROR: websocket/handlers.js not found!
    set /a FILES_FAILED+=1
)

if not exist "backend\src\systems\alertSystem.js" (
    echo ✗ ERROR: systems/alertSystem.js not found!
    set /a FILES_FAILED+=1
)

if not exist "backend\src\adapters\idemAdapter.js" (
    echo ✗ ERROR: adapters/idemAdapter.js not found!
    set /a FILES_FAILED+=1
)

REM ============================================
REM GIT OPERATIONS
REM ============================================

echo.
echo ========================================
echo Git Operations
echo ========================================
echo.

if !FILES_FAILED! gtr 0 (
    echo WARNING: %FILES_FAILED% files failed to copy
    echo Some Day 3 features may be missing
    echo.
)

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
git commit -m "Day 3: Complete - Telematics, trailers, drivers, WebSocket, alerts, Idem adapter"
if errorlevel 1 (
    echo WARNING: Commit may have failed or nothing changed
)
echo ✓ Commit created

echo.
echo Pushing to GitHub...
git push
if errorlevel 1 (
    echo ERROR: Failed to push to GitHub
    echo.
    echo Make sure:
    echo 1. You have internet connection
    echo 2. GitHub repository exists
    echo 3. You have push permissions
    echo.
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
echo Day 3 files have been organized and pushed!
echo.
echo Files copied: !FILES_COPIED!
echo.
echo Your folder structure is now:
echo backend/src/
echo ├─ routes/ (5 files: auth, vehicle, telematics, trailer, driver)
echo ├─ adapters/ (2 files: geotab, idem)
echo ├─ websocket/ (handlers.js)
echo ├─ systems/ (alertSystem.js)
echo ├─ services/ (3 files)
echo ├─ models/ (4 files)
echo ├─ middleware/ (2 files)
echo ├─ utils/ (2 files)
echo ├─ config/ (2 files)
echo ├─ jobs/ (1 file)
echo └─ scripts/ (1 file)
echo.
echo Next steps:
echo 1. Go to GitHub to verify Day 3 files are there
echo 2. Tell Claude "Day 3 complete!"
echo 3. I'll start building Day 4!
echo.
echo Repository: https://github.com/OHxraa/fleet-telematics-platform
echo.
pause
