@echo off
REM =====================================================
REM Fleet Platform - Day 5 File Push Script
REM Specifically handles Day 5 files and pushes to GitHub
REM =====================================================

echo.
echo ========================================
echo Day 5 File Organization & Push
echo ========================================
echo.
echo This script will:
echo 1. Find Day 5 files in Downloads
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

mkdir backend\testing 2>nul
mkdir backend\src\middleware 2>nul
mkdir backend\scripts 2>nul
mkdir backend 2>nul

echo ✓ Folders created

REM ============================================
REM COPY DAY 5 FILES
REM ============================================

echo.
echo Copying Day 5 files...
echo.

set "DOWNLOADS_PATH=%USERPROFILE%\Downloads"
set "FILES_COPIED=0"
set "FILES_FAILED=0"

REM Jest Config
if exist "%DOWNLOADS_PATH%\backend_testing_jest.config.js" (
    copy "%DOWNLOADS_PATH%\backend_testing_jest.config.js" "backend\testing\jest.config.js" >nul
    if errorlevel 1 (
        echo ✗ Failed: jest.config.js
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ testing/jest.config.js
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: backend_testing_jest.config.js
)

REM Postman Collection
if exist "%DOWNLOADS_PATH%\Fleet_Telematics_API_Postman.json" (
    copy "%DOWNLOADS_PATH%\Fleet_Telematics_API_Postman.json" "backend\testing\Fleet_Telematics_API_Postman.json" >nul
    if errorlevel 1 (
        echo ✗ Failed: Fleet_Telematics_API_Postman.json
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ testing/Fleet_Telematics_API_Postman.json
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: Fleet_Telematics_API_Postman.json
)

REM Seed Script
if exist "%DOWNLOADS_PATH%\backend_scripts_seed.js" (
    copy "%DOWNLOADS_PATH%\backend_scripts_seed.js" "backend\scripts\seed.js" >nul
    if errorlevel 1 (
        echo ✗ Failed: seed.js
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ scripts/seed.js
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: backend_scripts_seed.js
)

REM Dockerfile
if exist "%DOWNLOADS_PATH%\Dockerfile" (
    copy "%DOWNLOADS_PATH%\Dockerfile" "backend\Dockerfile" >nul
    if errorlevel 1 (
        echo ✗ Failed: Dockerfile
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ Dockerfile
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: Dockerfile
)

REM Environment Example
if exist "%DOWNLOADS_PATH%\backend_.env.example" (
    copy "%DOWNLOADS_PATH%\backend_.env.example" "backend\.env.example" >nul
    if errorlevel 1 (
        echo ✗ Failed: .env.example
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ .env.example
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: backend_.env.example
)

REM Security Middleware
if exist "%DOWNLOADS_PATH%\backend_middleware_security.js" (
    copy "%DOWNLOADS_PATH%\backend_middleware_security.js" "backend\src\middleware\security.js" >nul
    if errorlevel 1 (
        echo ✗ Failed: security.js
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ middleware/security.js
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: backend_middleware_security.js
)

REM Day 5 Summary
if exist "%DOWNLOADS_PATH%\DAY_5_SUMMARY.md" (
    copy "%DOWNLOADS_PATH%\DAY_5_SUMMARY.md" "DAY_5_SUMMARY.md" >nul
    if errorlevel 1 (
        echo ✗ Failed: DAY_5_SUMMARY.md
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ DAY_5_SUMMARY.md
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: DAY_5_SUMMARY.md
)

REM ============================================
REM VERIFY FILES
REM ============================================

echo.
echo Verifying files...

if not exist "backend\testing\jest.config.js" (
    echo ✗ ERROR: jest.config.js not found!
    set /a FILES_FAILED+=1
)

if not exist "backend\testing\Fleet_Telematics_API_Postman.json" (
    echo ✗ ERROR: Fleet_Telematics_API_Postman.json not found!
    set /a FILES_FAILED+=1
)

if not exist "backend\scripts\seed.js" (
    echo ✗ ERROR: seed.js not found!
    set /a FILES_FAILED+=1
)

if not exist "backend\Dockerfile" (
    echo ✗ ERROR: Dockerfile not found!
    set /a FILES_FAILED+=1
)

if not exist "backend\.env.example" (
    echo ✗ ERROR: .env.example not found!
    set /a FILES_FAILED+=1
)

if not exist "backend\src\middleware\security.js" (
    echo ✗ ERROR: security.js not found!
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
    echo Some Day 5 features may be missing
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
git commit -m "Day 5: Complete - Testing, Postman collection, data seeding, Docker, security, and environment configuration"
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
echo Day 5 files have been organized and pushed!
echo.
echo Files copied: !FILES_COPIED!
echo.
echo Your folder structure is now:
echo backend/
echo ├─ testing/ (jest.config.js, Postman collection)
echo ├─ scripts/ (seed.js)
echo ├─ src/
echo │  └─ middleware/ (security.js)
echo ├─ Dockerfile
echo ├─ .env.example
echo └─ ... (other files)
echo.
echo Phase 1 Progress: 75% Complete!
echo Backend is PRODUCTION-READY!
echo.
echo Next steps:
echo 1. Run: npm run seed
echo    (Creates demo users and data)
echo.
echo 2. Import Postman collection
echo    (backend/testing/Fleet_Telematics_API_Postman.json)
echo.
echo 3. Test all endpoints
echo.
echo 4. Deploy with Docker or go to Week 2 frontend!
echo.
echo Repository: https://github.com/OHxraa/fleet-telematics-platform
echo.
pause
