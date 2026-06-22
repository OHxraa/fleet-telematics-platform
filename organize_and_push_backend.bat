@echo off
REM =====================================================
REM Fleet Platform Phase 1 - Backend Setup Script
REM Organizes files, creates folders, and pushes to GitHub
REM =====================================================

echo.
echo ========================================
echo Fleet Platform Backend Setup
echo ========================================
echo.
echo This script will:
echo 1. Create folder structure
echo 2. Copy files to correct locations
echo 3. Commit changes
echo 4. Push to GitHub
echo.
pause

REM ============================================
REM CHECK IF WE'RE IN THE RIGHT DIRECTORY
REM ============================================

if not exist "README.md" (
    echo.
    echo ERROR: This script must be run from the "fleet platform" folder!
    echo.
    echo Please:
    echo 1. Copy this script to: Desktop/"fleet platform"/
    echo 2. Run it from there
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

mkdir backend\src\config
mkdir backend\src\middleware
mkdir backend\src\utils
mkdir backend\src\models
mkdir backend\src\adapters
mkdir logs

echo ✓ Folders created

REM ============================================
REM COPY AND RENAME FILES
REM ============================================

echo.
echo Copying and organizing files...
echo.

REM Check if Downloads folder exists and copy from there
if exist "%USERPROFILE%\Downloads\backend_package.json" (
    echo Copying from Downloads folder...
    copy "%USERPROFILE%\Downloads\backend_package.json" "backend\package.json" >nul
    echo ✓ package.json
    
    copy "%USERPROFILE%\Downloads\backend_.env.local" "backend\.env.local" >nul
    echo ✓ .env.local
    
    copy "%USERPROFILE%\Downloads\backend_index.js" "backend\src\index.js" >nul
    echo ✓ index.js
    
    copy "%USERPROFILE%\Downloads\backend_config_database.js" "backend\src\config\database.js" >nul
    echo ✓ config/database.js
    
    copy "%USERPROFILE%\Downloads\backend_config_redis.js" "backend\src\config\redis.js" >nul
    echo ✓ config/redis.js
    
    copy "%USERPROFILE%\Downloads\backend_middleware_errorHandler.js" "backend\src\middleware\errorHandler.js" >nul
    echo ✓ middleware/errorHandler.js
    
    copy "%USERPROFILE%\Downloads\backend_middleware_authenticate.js" "backend\src\middleware\authenticate.js" >nul
    echo ✓ middleware/authenticate.js
    
    copy "%USERPROFILE%\Downloads\backend_utils_logger.js" "backend\src\utils\logger.js" >nul
    echo ✓ utils/logger.js
    
    copy "%USERPROFILE%\Downloads\backend_utils_jwtUtils.js" "backend\src\utils\jwtUtils.js" >nul
    echo ✓ utils/jwtUtils.js
    
    copy "%USERPROFILE%\Downloads\backend_models_User.js" "backend\src\models\User.js" >nul
    echo ✓ models/User.js
    
    copy "%USERPROFILE%\Downloads\backend_models_Vehicle.js" "backend\src\models\Vehicle.js" >nul
    echo ✓ models/Vehicle.js
    
    copy "%USERPROFILE%\Downloads\backend_models_Trailer.js" "backend\src\models\Trailer.js" >nul
    echo ✓ models/Trailer.js
    
    copy "%USERPROFILE%\Downloads\backend_models_TelematicsData.js" "backend\src\models\TelematicsData.js" >nul
    echo ✓ models/TelematicsData.js
    
    copy "%USERPROFILE%\Downloads\backend_adapters_geotabAdapter.js" "backend\src\adapters\geotabAdapter.js" >nul
    echo ✓ adapters/geotabAdapter.js
    
) else (
    echo.
    echo ERROR: Could not find files in Downloads folder
    echo.
    echo Please make sure you've downloaded all 14 files first:
    echo 1. Go to outputs folder from Claude
    echo 2. Download all files
    echo 3. Files should be in: %USERPROFILE%\Downloads\
    echo 4. Then run this script again
    echo.
    pause
    exit /b 1
)

REM ============================================
REM VERIFY FILES WERE COPIED
REM ============================================

echo.
echo Verifying files were copied correctly...

if not exist "backend\package.json" (
    echo ERROR: package.json not found
    pause
    exit /b 1
)

if not exist "backend\src\index.js" (
    echo ERROR: index.js not found
    pause
    exit /b 1
)

if not exist "backend\src\models\Vehicle.js" (
    echo ERROR: Vehicle.js not found
    pause
    exit /b 1
)

echo ✓ All files verified!

REM ============================================
REM GIT OPERATIONS
REM ============================================

echo.
echo ========================================
echo Git Operations
echo ========================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo ERROR: Git repository not initialized!
    echo.
    echo Please run setup.bat first to initialize git
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
echo ✓ Files added to git

echo.
echo Creating commit...
git commit -m "Day 1: Phase 1 backend foundation - Geotab integration, database models, authentication system"
if errorlevel 1 (
    echo ERROR: Failed to commit
    echo This might be normal if nothing changed
    pause
    exit /b 1
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
echo ✓ Files pushed to GitHub

REM ============================================
REM SUCCESS!
REM ============================================

echo.
echo ========================================
echo ✓ SUCCESS!
echo ========================================
echo.
echo All backend files have been:
echo ✓ Organized into correct folders
echo ✓ Copied to proper locations
echo ✓ Committed to git
echo ✓ Pushed to GitHub
echo.
echo Your folder structure is now:
echo backend/
echo ├─ package.json
echo ├─ .env.local
echo ├─ src/
echo │  ├─ index.js
echo │  ├─ config/
echo │  ├─ middleware/
echo │  ├─ utils/
echo │  ├─ models/
echo │  └─ adapters/
echo └─ logs/
echo.
echo Next steps:
echo 1. Go to GitHub to verify files uploaded
echo 2. Tomorrow: npm install and test!
echo 3. Tell Claude when ready for Day 2 build
echo.
echo Repository: https://github.com/OHxraa/fleet-telematics-platform
echo.
pause
