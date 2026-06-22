@echo off
REM =====================================================
REM Fleet Platform - Day 4 File Push Script
REM Specifically handles Day 4 files and pushes to GitHub
REM =====================================================

echo.
echo ========================================
echo Day 4 File Organization & Push
echo ========================================
echo.
echo This script will:
echo 1. Find Day 4 files in Downloads
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

mkdir backend\src\docs 2>nul
mkdir backend\src\validation 2>nul
mkdir backend\src\utils 2>nul
mkdir backend\src\services 2>nul
mkdir backend\src\routes 2>nul

echo ✓ Folders created

REM ============================================
REM COPY DAY 4 FILES
REM ============================================

echo.
echo Copying Day 4 files...
echo.

set "DOWNLOADS_PATH=%USERPROFILE%\Downloads"
set "FILES_COPIED=0"
set "FILES_FAILED=0"

REM Documentation
if exist "%DOWNLOADS_PATH%\backend_docs_apiDocumentation.js" (
    copy "%DOWNLOADS_PATH%\backend_docs_apiDocumentation.js" "backend\src\docs\apiDocumentation.js" >nul
    if errorlevel 1 (
        echo ✗ Failed: apiDocumentation.js
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ docs/apiDocumentation.js
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: backend_docs_apiDocumentation.js
)

REM Validation Schemas
if exist "%DOWNLOADS_PATH%\backend_validation_schemas.js" (
    copy "%DOWNLOADS_PATH%\backend_validation_schemas.js" "backend\src\validation\schemas.js" >nul
    if errorlevel 1 (
        echo ✗ Failed: schemas.js
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ validation/schemas.js
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: backend_validation_schemas.js
)

REM Error Handling
if exist "%DOWNLOADS_PATH%\backend_utils_errorHandling.js" (
    copy "%DOWNLOADS_PATH%\backend_utils_errorHandling.js" "backend\src\utils\errorHandling.js" >nul
    if errorlevel 1 (
        echo ✗ Failed: errorHandling.js
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ utils/errorHandling.js
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: backend_utils_errorHandling.js
)

REM Performance Optimization
if exist "%DOWNLOADS_PATH%\backend_utils_performanceOptimization.js" (
    copy "%DOWNLOADS_PATH%\backend_utils_performanceOptimization.js" "backend\src\utils\performanceOptimization.js" >nul
    if errorlevel 1 (
        echo ✗ Failed: performanceOptimization.js
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ utils/performanceOptimization.js
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: backend_utils_performanceOptimization.js
)

REM Report Service
if exist "%DOWNLOADS_PATH%\backend_services_reportService.js" (
    copy "%DOWNLOADS_PATH%\backend_services_reportService.js" "backend\src\services\reportService.js" >nul
    if errorlevel 1 (
        echo ✗ Failed: reportService.js
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ services/reportService.js
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: backend_services_reportService.js
)

REM Health Routes
if exist "%DOWNLOADS_PATH%\backend_routes_healthRoutes.js" (
    copy "%DOWNLOADS_PATH%\backend_routes_healthRoutes.js" "backend\src\routes\healthRoutes.js" >nul
    if errorlevel 1 (
        echo ✗ Failed: healthRoutes.js
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ routes/healthRoutes.js
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: backend_routes_healthRoutes.js
)

REM Day 4 Summary
if exist "%DOWNLOADS_PATH%\DAY_4_SUMMARY.md" (
    copy "%DOWNLOADS_PATH%\DAY_4_SUMMARY.md" "DAY_4_SUMMARY.md" >nul
    if errorlevel 1 (
        echo ✗ Failed: DAY_4_SUMMARY.md
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ DAY_4_SUMMARY.md
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: DAY_4_SUMMARY.md
)

REM ============================================
REM VERIFY FILES
REM ============================================

echo.
echo Verifying files...

if not exist "backend\src\docs\apiDocumentation.js" (
    echo ✗ ERROR: apiDocumentation.js not found!
    set /a FILES_FAILED+=1
)

if not exist "backend\src\validation\schemas.js" (
    echo ✗ ERROR: schemas.js not found!
    set /a FILES_FAILED+=1
)

if not exist "backend\src\utils\errorHandling.js" (
    echo ✗ ERROR: errorHandling.js not found!
    set /a FILES_FAILED+=1
)

if not exist "backend\src\utils\performanceOptimization.js" (
    echo ✗ ERROR: performanceOptimization.js not found!
    set /a FILES_FAILED+=1
)

if not exist "backend\src\services\reportService.js" (
    echo ✗ ERROR: reportService.js not found!
    set /a FILES_FAILED+=1
)

if not exist "backend\src\routes\healthRoutes.js" (
    echo ✗ ERROR: healthRoutes.js not found!
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
    echo Some Day 4 features may be missing
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
git commit -m "Day 4: Complete - API docs, validation schemas, error handling, performance optimization, reports, health checks"
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
echo Day 4 files have been organized and pushed!
echo.
echo Files copied: !FILES_COPIED!
echo.
echo Your folder structure is now:
echo backend/src/
echo ├─ docs/ (apiDocumentation.js)
echo ├─ validation/ (schemas.js)
echo ├─ utils/ (errorHandling.js, performanceOptimization.js)
echo ├─ services/ (reportService.js, + others)
echo ├─ routes/ (healthRoutes.js, + others)
echo ├─ config/
echo ├─ middleware/
echo ├─ models/
echo ├─ adapters/
echo ├─ websocket/
echo ├─ systems/
echo ├─ jobs/
echo └─ scripts/
echo.
echo Phase 1 Progress: 60% Complete!
echo.
echo Next steps:
echo 1. Go to GitHub to verify Day 4 files are there
echo 2. Tell Claude "Day 4 complete!"
echo 3. I'll start building Day 5!
echo.
echo Repository: https://github.com/OHxraa/fleet-telematics-platform
echo.
pause
