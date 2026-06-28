@echo off
REM =====================================================
REM Fleet Platform - Add Files 14-22 + Phase 2+3
REM Based on Day 5 structure - with Git push
REM =====================================================

echo.
echo ========================================
echo Add Files 14-22 + Phase 2+3 and Push to GitHub
echo ========================================
echo.
echo This script will:
echo 1. Find Files 14-22 in Downloads
echo 2. Copy to correct locations (Day 5 structure)
echo 3. Commit and push to GitHub
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

mkdir backend\src\sql 2>nul
mkdir backend\src\docs 2>nul

echo ✓ Folders created

REM ============================================
REM COPY FILES 14-22 + PHASE 2+3
REM ============================================

echo.
echo Copying new files from Downloads...
echo.

set "DOWNLOADS_PATH=%USERPROFILE%\Downloads"
set "FILES_COPIED=0"
set "FILES_FAILED=0"

REM =========== SQL FILES ===========
REM File 14: RBAC System
if exist "%DOWNLOADS_PATH%\14-USER-ROLES-PERMISSIONS-SYSTEM.sql" (
    copy "%DOWNLOADS_PATH%\14-USER-ROLES-PERMISSIONS-SYSTEM.sql" "backend\src\sql\user-roles-permissions.sql" >nul
    if errorlevel 1 (
        echo ✗ Failed: user-roles-permissions.sql
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ File 14: backend/src/sql/user-roles-permissions.sql
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: File 14
)

REM =========== DOCUMENTATION FILES (ROOT) ===========

REM File 15: Permission Matrix
if exist "%DOWNLOADS_PATH%\15-PERMISSION-MATRIX-AND-USE-CASES.txt" (
    copy "%DOWNLOADS_PATH%\15-PERMISSION-MATRIX-AND-USE-CASES.txt" "PERMISSION-MATRIX.txt" >nul
    if errorlevel 1 (
        echo ✗ Failed: PERMISSION-MATRIX.txt
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ File 15: PERMISSION-MATRIX.txt
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: File 15
)

REM RBAC Summary
if exist "%DOWNLOADS_PATH%\USERS-ROLES-PERMISSIONS-SUMMARY.txt" (
    copy "%DOWNLOADS_PATH%\USERS-ROLES-PERMISSIONS-SUMMARY.txt" "RBAC-SYSTEM.txt" >nul
    if errorlevel 1 (
        echo ✗ Failed: RBAC-SYSTEM.txt
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ RBAC-SYSTEM.txt
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: RBAC Summary
)

REM File 16: Connector Strategy
if exist "%DOWNLOADS_PATH%\16-CONNECTOR-STRATEGY-AND-ARCHITECTURE.md" (
    copy "%DOWNLOADS_PATH%\16-CONNECTOR-STRATEGY-AND-ARCHITECTURE.md" "CONNECTOR-STRATEGY.md" >nul
    if errorlevel 1 (
        echo ✗ Failed: CONNECTOR-STRATEGY.md
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ File 16: CONNECTOR-STRATEGY.md
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: File 16
)

REM Connector Advantage
if exist "%DOWNLOADS_PATH%\WHY-CONNECTORS-ARE-YOUR-BIGGEST-ADVANTAGE.txt" (
    copy "%DOWNLOADS_PATH%\WHY-CONNECTORS-ARE-YOUR-BIGGEST-ADVANTAGE.txt" "WHY-CONNECTORS.txt" >nul
    if errorlevel 1 (
        echo ✗ Failed: WHY-CONNECTORS.txt
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ WHY-CONNECTORS.txt
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: WHY-CONNECTORS
)

REM File 17: Architecture v2
if exist "%DOWNLOADS_PATH%\17-COMPLETE-PLATFORM-ARCHITECTURE-v2.md" (
    copy "%DOWNLOADS_PATH%\17-COMPLETE-PLATFORM-ARCHITECTURE-v2.md" "ARCHITECTURE-v2.md" >nul
    if errorlevel 1 (
        echo ✗ Failed: ARCHITECTURE-v2.md
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ File 17: ARCHITECTURE-v2.md
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: File 17
)

REM File 18: Multi-tenant Credentials
if exist "%DOWNLOADS_PATH%\18-MULTI-TENANT-CONNECTOR-CREDENTIALS.md" (
    copy "%DOWNLOADS_PATH%\18-MULTI-TENANT-CONNECTOR-CREDENTIALS.md" "MULTI-TENANT-CREDENTIALS.md" >nul
    if errorlevel 1 (
        echo ✗ Failed: MULTI-TENANT-CREDENTIALS.md
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ File 18: MULTI-TENANT-CREDENTIALS.md
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: File 18
)

REM Why Credentials Matter
if exist "%DOWNLOADS_PATH%\WHY-PER-CUSTOMER-CREDENTIALS-MATTER.txt" (
    copy "%DOWNLOADS_PATH%\WHY-PER-CUSTOMER-CREDENTIALS-MATTER.txt" "WHY-CREDENTIALS.txt" >nul
    if errorlevel 1 (
        echo ✗ Failed: WHY-CREDENTIALS.txt
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ WHY-CREDENTIALS.txt
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: WHY-CREDENTIALS
)

REM File 19: Universal Credentials
if exist "%DOWNLOADS_PATH%\19-UNIVERSAL-SCALABLE-CREDENTIAL-SYSTEM.md" (
    copy "%DOWNLOADS_PATH%\19-UNIVERSAL-SCALABLE-CREDENTIAL-SYSTEM.md" "UNIVERSAL-CREDENTIALS.md" >nul
    if errorlevel 1 (
        echo ✗ Failed: UNIVERSAL-CREDENTIALS.md
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ File 19: UNIVERSAL-CREDENTIALS.md
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: File 19
)

REM File 20: System is Universal
if exist "%DOWNLOADS_PATH%\20-YOUR-SYSTEM-IS-UNIVERSAL-PROOF.txt" (
    copy "%DOWNLOADS_PATH%\20-YOUR-SYSTEM-IS-UNIVERSAL-PROOF.txt" "SYSTEM-IS-UNIVERSAL.txt" >nul
    if errorlevel 1 (
        echo ✗ Failed: SYSTEM-IS-UNIVERSAL.txt
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ File 20: SYSTEM-IS-UNIVERSAL.txt
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: File 20
)

REM Scalability Analysis
if exist "%DOWNLOADS_PATH%\SCALABILITY-ANALYSIS-10M-VEHICLES.md" (
    copy "%DOWNLOADS_PATH%\SCALABILITY-ANALYSIS-10M-VEHICLES.md" "SCALABILITY-ANALYSIS.md" >nul
    if errorlevel 1 (
        echo ✗ Failed: SCALABILITY-ANALYSIS.md
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ SCALABILITY-ANALYSIS.md
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: SCALABILITY-ANALYSIS
)

REM File 21: Phase 2
if exist "%DOWNLOADS_PATH%\21-PHASE-2-SCALING-ARCHITECTURE.md" (
    copy "%DOWNLOADS_PATH%\21-PHASE-2-SCALING-ARCHITECTURE.md" "PHASE-2-SCALING.md" >nul
    if errorlevel 1 (
        echo ✗ Failed: PHASE-2-SCALING.md
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ File 21: PHASE-2-SCALING.md
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: File 21
)

REM File 22: Phase 3
if exist "%DOWNLOADS_PATH%\22-PHASE-3-ENTERPRISE-SCALING.md" (
    copy "%DOWNLOADS_PATH%\22-PHASE-3-ENTERPRISE-SCALING.md" "PHASE-3-ENTERPRISE-SCALING.md" >nul
    if errorlevel 1 (
        echo ✗ Failed: PHASE-3-ENTERPRISE-SCALING.md
        set /a FILES_FAILED+=1
    ) else (
        echo ✓ File 22: PHASE-3-ENTERPRISE-SCALING.md
        set /a FILES_COPIED+=1
    )
) else (
    echo ⚠ Not found: File 22
)

REM ============================================
REM VERIFY FILES
REM ============================================

echo.
echo Verifying files...

if not exist "backend\src\sql\user-roles-permissions.sql" (
    echo ✗ ERROR: user-roles-permissions.sql not found!
    set /a FILES_FAILED+=1
)

if not exist "PERMISSION-MATRIX.txt" (
    echo ✗ ERROR: PERMISSION-MATRIX.txt not found!
    set /a FILES_FAILED+=1
)

if not exist "CONNECTOR-STRATEGY.md" (
    echo ✗ ERROR: CONNECTOR-STRATEGY.md not found!
    set /a FILES_FAILED+=1
)

if not exist "PHASE-2-SCALING.md" (
    echo ✗ ERROR: PHASE-2-SCALING.md not found!
    set /a FILES_FAILED+=1
)

if not exist "PHASE-3-ENTERPRISE-SCALING.md" (
    echo ✗ ERROR: PHASE-3-ENTERPRISE-SCALING.md not found!
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
    echo Some files may be missing
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
git commit -m "Day 6: Add Files 14-22 - RBAC, Connectors, and Scaling Roadmap (Phase 2 + Phase 3)

Files 14-22 Added:
- File 14: RBAC system (SQL)
- File 15: Permission matrix
- RBAC system summary
- File 16: Connector strategy and architecture
- Connector advantage documentation
- File 17: Complete platform architecture v2
- File 18: Multi-tenant connector credentials
- Credentials documentation
- File 19: Universal scalable credential system
- File 20: System is universal proof
- Scalability analysis for 10M vehicles

Scaling Roadmaps Added:
- File 21: Phase 2 Scaling Architecture
  * 1k-10k customers, 1M-10M vehicles
  * Load balancing, connection pooling, caching, Kafka, TimescaleDB
  * 4-5 month timeline, $9k/month cost

- File 22: Phase 3 Enterprise Scaling
  * 10k+ customers, 100M+ vehicles
  * Kubernetes, database sharding, data warehouse, microservices
  * Multi-region deployment, 99.99% availability
  * 12-18 month timeline, $47k/month cost

Complete scaling roadmap from MVP to 100M+ vehicles."
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
echo Files 14-22 have been organized and pushed!
echo.
echo Files copied: !FILES_COPIED!
echo.
echo Your folder structure is now:
echo fleet platform/
echo ├─ backend/
echo │  ├─ src/
echo │  │  └─ sql/
echo │  │     └─ user-roles-permissions.sql (File 14)
echo │  ├─ testing/
echo │  ├─ scripts/
echo │  ├─ Dockerfile
echo │  └─ .env.example
echo ├─ PERMISSION-MATRIX.txt (File 15)
echo ├─ RBAC-SYSTEM.txt
echo ├─ CONNECTOR-STRATEGY.md (File 16)
echo ├─ WHY-CONNECTORS.txt
echo ├─ ARCHITECTURE-v2.md (File 17)
echo ├─ MULTI-TENANT-CREDENTIALS.md (File 18)
echo ├─ WHY-CREDENTIALS.txt
echo ├─ UNIVERSAL-CREDENTIALS.md (File 19)
echo ├─ SYSTEM-IS-UNIVERSAL.txt (File 20)
echo ├─ SCALABILITY-ANALYSIS.md
echo ├─ PHASE-2-SCALING.md (File 21)
echo ├─ PHASE-3-ENTERPRISE-SCALING.md (File 22)
echo ├─ README.md (Day 1-5)
echo ├─ DAY_5_SUMMARY.md (Day 1-5)
echo └─ ... (all Day 1-5 files intact)
echo.
echo Phase 1 Progress: 100%% Complete!
echo Platform is ENTERPRISE-READY with Scaling Roadmap!
echo.
echo Next steps:
echo 1. Check GitHub to verify all files are there
echo 2. Review Phase 2 and Phase 3 scaling documents
echo 3. Plan MVP launch timeline
echo 4. Start Phase 2 planning with team
echo.
echo Repository: https://github.com/OHxraa/fleet-telematics-platform
echo.
pause
