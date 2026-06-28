@echo off
REM ================================================
REM FLEET TELEMATICS - FAST GITHUB SETUP (WINDOWS)
REM ================================================
REM Optimized version:
REM - Skips git setup (assumes already configured)
REM - Just copies files and pushes
REM - Much faster!
REM ================================================

setlocal enabledelayedexpansion

cls
echo.
echo ================================================
echo FLEET TELEMATICS - GITHUB SETUP (OPTIMIZED)
echo ================================================
echo.

REM ================================================
REM 1. GET MINIMAL USER INPUT
REM ================================================

echo This script will:
echo 1. Create project folder structure
echo 2. Copy all backend files
echo 3. Initialize git and push to GitHub
echo.

set /p REPO_NAME="Enter GitHub repo name (e.g., fleet-telematics-platform): "
set /p PROJECT_PATH="Enter local project path (e.g., C:\Projects\fleet-telematics): "
set /p GITHUB_URL="Enter GitHub repo URL (e.g., https://github.com/OHxraa/fleet-telematics-platform.git): "

echo.
echo Configuration:
echo Repository name: %REPO_NAME%
echo Project Path: %PROJECT_PATH%
echo GitHub URL: %GITHUB_URL%
echo.
set /p CONTINUE="Continue? (y/n): "
if /i not "%CONTINUE%"=="y" (
    echo Cancelled.
    exit /b 1
)

REM ================================================
REM 2. CREATE PROJECT STRUCTURE
REM ================================================

echo.
echo Creating project structure...

if not exist "%PROJECT_PATH%" mkdir "%PROJECT_PATH%"
cd /d "%PROJECT_PATH%"

mkdir src\config 2>nul
mkdir src\middleware 2>nul
mkdir src\controllers 2>nul
mkdir src\services 2>nul
mkdir src\routes 2>nul
mkdir src\utils 2>nul
mkdir sql 2>nul
mkdir scripts 2>nul
mkdir logs 2>nul
mkdir .github\workflows 2>nul

echo [OK] Project structure created

REM ================================================
REM 3. COPY FILES FROM DOWNLOADS
REM ================================================

echo.
echo Copying files from Downloads...

set DOWNLOADS_DIR=%USERPROFILE%\Downloads

if exist "%DOWNLOADS_DIR%\01-multi-tenant-schema.sql" (
    copy "%DOWNLOADS_DIR%\01-multi-tenant-schema.sql" "%PROJECT_PATH%\sql\master-schema.sql" >nul 2>&1
    echo [OK] multi-tenant-schema.sql
)

if exist "%DOWNLOADS_DIR%\02-package.json" (
    copy "%DOWNLOADS_DIR%\02-package.json" "%PROJECT_PATH%\package.json" >nul 2>&1
    echo [OK] package.json
)

if exist "%DOWNLOADS_DIR%\03-tenant-middleware.js" (
    copy "%DOWNLOADS_DIR%\03-tenant-middleware.js" "%PROJECT_PATH%\src\middleware\tenant.middleware.js" >nul 2>&1
    echo [OK] tenant-middleware.js
)

if exist "%DOWNLOADS_DIR%\04-database-service.js" (
    copy "%DOWNLOADS_DIR%\04-database-service.js" "%PROJECT_PATH%\src\services\database.service.js" >nul 2>&1
    echo [OK] database-service.js
)

if exist "%DOWNLOADS_DIR%\05-admin-controller.js" (
    copy "%DOWNLOADS_DIR%\05-admin-controller.js" "%PROJECT_PATH%\src\controllers\admin.controller.js" >nul 2>&1
    echo [OK] admin-controller.js
)

if exist "%DOWNLOADS_DIR%\06-index.js" (
    copy "%DOWNLOADS_DIR%\06-index.js" "%PROJECT_PATH%\src\index.js" >nul 2>&1
    echo [OK] index.js
)

if exist "%DOWNLOADS_DIR%\07-database-config.js" (
    copy "%DOWNLOADS_DIR%\07-database-config.js" "%PROJECT_PATH%\src\config\database.js" >nul 2>&1
    echo [OK] database-config.js
)

if exist "%DOWNLOADS_DIR%\08-logger-config.js" (
    copy "%DOWNLOADS_DIR%\08-logger-config.js" "%PROJECT_PATH%\src\config\logger.js" >nul 2>&1
    echo [OK] logger-config.js
)

if exist "%DOWNLOADS_DIR%\09-admin-routes.js" (
    copy "%DOWNLOADS_DIR%\09-admin-routes.js" "%PROJECT_PATH%\src\routes\admin.routes.js" >nul 2>&1
    echo [OK] admin-routes.js
)

if exist "%DOWNLOADS_DIR%\10-auth-routes-and-controller.js" (
    copy "%DOWNLOADS_DIR%\10-auth-routes-and-controller.js" "%PROJECT_PATH%\src\routes\auth.routes.js" >nul 2>&1
    echo [OK] auth-routes.js
)

if exist "%DOWNLOADS_DIR%\11-route-stubs.js" (
    copy "%DOWNLOADS_DIR%\11-route-stubs.js" "%PROJECT_PATH%\src\routes\route-stubs.js" >nul 2>&1
    echo [OK] route-stubs.js
)

if exist "%DOWNLOADS_DIR%\14-USER-ROLES-PERMISSIONS-SYSTEM.sql" (
    copy "%DOWNLOADS_DIR%\14-USER-ROLES-PERMISSIONS-SYSTEM.sql" "%PROJECT_PATH%\sql\user-roles-permissions.sql" >nul 2>&1
    echo [OK] user-roles-permissions.sql
)

if exist "%DOWNLOADS_DIR%\15-PERMISSION-MATRIX-AND-USE-CASES.txt" (
    copy "%DOWNLOADS_DIR%\15-PERMISSION-MATRIX-AND-USE-CASES.txt" "%PROJECT_PATH%\PERMISSION-MATRIX.txt" >nul 2>&1
    echo [OK] PERMISSION-MATRIX.txt
)

if exist "%DOWNLOADS_DIR%\USERS-ROLES-PERMISSIONS-SUMMARY.txt" (
    copy "%DOWNLOADS_DIR%\USERS-ROLES-PERMISSIONS-SUMMARY.txt" "%PROJECT_PATH%\RBAC-SYSTEM.txt" >nul 2>&1
    echo [OK] RBAC-SYSTEM.txt
)

if exist "%DOWNLOADS_DIR%\16-CONNECTOR-STRATEGY-AND-ARCHITECTURE.md" (
    copy "%DOWNLOADS_DIR%\16-CONNECTOR-STRATEGY-AND-ARCHITECTURE.md" "%PROJECT_PATH%\CONNECTOR-STRATEGY.md" >nul 2>&1
    echo [OK] connector-strategy.md
)

if exist "%DOWNLOADS_DIR%\WHY-CONNECTORS-ARE-YOUR-BIGGEST-ADVANTAGE.txt" (
    copy "%DOWNLOADS_DIR%\WHY-CONNECTORS-ARE-YOUR-BIGGEST-ADVANTAGE.txt" "%PROJECT_PATH%\WHY-CONNECTORS.txt" >nul 2>&1
    echo [OK] WHY-CONNECTORS.txt
)

if exist "%DOWNLOADS_DIR%\17-COMPLETE-PLATFORM-ARCHITECTURE-v2.md" (
    copy "%DOWNLOADS_DIR%\17-COMPLETE-PLATFORM-ARCHITECTURE-v2.md" "%PROJECT_PATH%\ARCHITECTURE-v2.md" >nul 2>&1
    echo [OK] ARCHITECTURE-v2.md
)

if exist "%DOWNLOADS_DIR%\18-MULTI-TENANT-CONNECTOR-CREDENTIALS.md" (
    copy "%DOWNLOADS_DIR%\18-MULTI-TENANT-CONNECTOR-CREDENTIALS.md" "%PROJECT_PATH%\MULTI-TENANT-CREDENTIALS.md" >nul 2>&1
    echo [OK] multi-tenant-credentials.md
)

if exist "%DOWNLOADS_DIR%\WHY-PER-CUSTOMER-CREDENTIALS-MATTER.txt" (
    copy "%DOWNLOADS_DIR%\WHY-PER-CUSTOMER-CREDENTIALS-MATTER.txt" "%PROJECT_PATH%\WHY-CREDENTIALS.txt" >nul 2>&1
    echo [OK] WHY-CREDENTIALS.txt
)

if exist "%DOWNLOADS_DIR%\19-UNIVERSAL-SCALABLE-CREDENTIAL-SYSTEM.md" (
    copy "%DOWNLOADS_DIR%\19-UNIVERSAL-SCALABLE-CREDENTIAL-SYSTEM.md" "%PROJECT_PATH%\UNIVERSAL-CREDENTIALS.md" >nul 2>&1
    echo [OK] universal-credentials.md
)

if exist "%DOWNLOADS_DIR%\20-YOUR-SYSTEM-IS-UNIVERSAL-PROOF.txt" (
    copy "%DOWNLOADS_DIR%\20-YOUR-SYSTEM-IS-UNIVERSAL-PROOF.txt" "%PROJECT_PATH%\SYSTEM-IS-UNIVERSAL.txt" >nul 2>&1
    echo [OK] SYSTEM-IS-UNIVERSAL.txt
)

REM ================================================
REM 4. CREATE .ENV FILE
REM ================================================

echo.
echo Creating .env file...

(
echo # ===== Database (Master) =====
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_USER=postgres
echo DB_PASSWORD=YOUR_DATABASE_PASSWORD_HERE
echo DB_NAME=FleetPlatform
echo.
echo # ===== Server =====
echo NODE_ENV=development
echo PORT=5000
echo LOG_LEVEL=debug
echo.
echo # ===== JWT =====
echo JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_here_change_this
echo JWT_REFRESH_SECRET=your_super_secret_refresh_key_minimum_32_chars_here_change_this
echo.
echo # ===== Frontend =====
echo FRONTEND_URL=http://localhost:3000
) > "%PROJECT_PATH%\.env"

echo [OK] .env file created

REM ================================================
REM 5. CREATE .GITIGNORE
REM ================================================

echo Creating .gitignore...

(
echo node_modules/
echo package-lock.json
echo yarn.lock
echo .env
echo .env.local
echo logs/
echo *.log
echo npm-debug.log*
echo .DS_Store
echo .vscode/
echo .idea/
echo dist/
echo build/
) > "%PROJECT_PATH%\.gitignore"

echo [OK] .gitignore created

REM ================================================
REM 6. CREATE README.md
REM ================================================

echo Creating README.md...

(
echo # Fleet Telematics Multi-Tenant Backend
echo.
echo Enterprise-grade multi-tenant SaaS platform for fleet management.
echo.
echo ## Quick Start
echo.
echo Prerequisites: Node.js 18+, PostgreSQL 13+
echo.
echo Installation:
echo ```bash
echo npm install
echo npm run migrate
echo npm run dev
echo ```
echo.
echo Server: http://localhost:5000
) > "%PROJECT_PATH%\README.md"

echo [OK] README.md created

REM ================================================
REM 7. INITIALIZE GIT & PUSH
REM ================================================

echo.
echo Initializing git...

cd /d "%PROJECT_PATH%"

REM Check if git is already initialized
if exist ".git" (
    echo Git already initialized, skipping init
) else (
    git init
)

REM Add all files
git add .

REM Commit
git commit -m "Initial commit: Fleet telematics multi-tenant backend

- Multi-tenant database architecture
- MyAdmin control panel API
- Database provisioning service
- JWT authentication
- Real-time WebSocket support
- Audit logging and compliance
- Production-ready configuration" 2>nul

if errorlevel 1 (
    echo [WARNING] Git commit failed (maybe nothing to commit)
) else (
    echo [OK] Files committed
)

REM ================================================
REM 8. ADD REMOTE & PUSH
REM ================================================

echo.
echo Pushing to GitHub...

REM Check if remote already exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Adding remote...
    git remote add origin "%GITHUB_URL%"
) else (
    echo Updating remote URL...
    git remote set-url origin "%GITHUB_URL%"
)

REM Ensure we're on main branch
git branch -M main 2>nul

REM Push to GitHub
git push -u origin main

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to push to GitHub
    echo.
    echo Troubleshoot:
    echo 1. Check internet connection
    echo 2. Verify GitHub URL is correct
    echo 3. Make sure you have push access to the repository
    echo.
    echo Try manually:
    echo cd %PROJECT_PATH%
    echo git push -u origin main
    echo.
    pause
    exit /b 1
) else (
    echo [OK] Pushed to GitHub
)

REM ================================================
REM 9. PRINT SUMMARY
REM ================================================

echo.
echo ================================================
echo SETUP COMPLETE!
echo ================================================
echo.

echo Project Location:
echo %PROJECT_PATH%
echo.

echo GitHub Repository:
echo %GITHUB_URL%
echo.

echo Files copied:
echo - 14 backend files
echo - RBAC system files
echo - .env configuration
echo - .gitignore
echo - README.md
echo.

echo Next Steps:
echo 1. Navigate to project:
echo    cd %PROJECT_PATH%
echo.
echo 2. Edit .env with your values:
echo    - Set DB_PASSWORD
echo    - Generate strong JWT_SECRET
echo.
echo 3. Install dependencies:
echo    npm install
echo.
echo 4. Create PostgreSQL database:
echo    CREATE DATABASE "FleetPlatform";
echo.
echo 5. Run migrations:
echo    npm run migrate
echo.
echo 6. Start server:
echo    npm run dev
echo.
echo 7. Test:
echo    curl http://localhost:5000/health
echo.

echo Verify on GitHub:
echo %GITHUB_URL%
echo.

pause
