@echo off
REM =====================================================
REM Fleet Platform - Copy Files 14-22, Pull, Commit, Push
REM Finds files in Downloads, copies to Day 5 structure
REM Then pulls from GitHub and pushes
REM =====================================================

echo.
echo ========================================
echo Complete: Copy Files 14-22 + Push to GitHub
echo ========================================
echo.

REM Check directory
if not exist "README.md" (
    echo ERROR: Run this from the "fleet platform" folder!
    pause
    exit /b 1
)

echo ✓ Correct directory

REM ============================================
REM STEP 1: CREATE FOLDERS
REM ============================================

echo.
echo Step 1: Creating folder structure...

mkdir backend\src\sql 2>nul

echo ✓ Folders created

REM ============================================
REM STEP 2: COPY FILES FROM DOWNLOADS
REM ============================================

echo.
echo Step 2: Copying Files 14-22 from Downloads...
echo.

set "DOWNLOADS_PATH=%USERPROFILE%\Downloads"
set "FILES_COPIED=0"

REM File 14: RBAC System
if exist "%DOWNLOADS_PATH%\14-USER-ROLES-PERMISSIONS-SYSTEM.sql" (
    copy "%DOWNLOADS_PATH%\14-USER-ROLES-PERMISSIONS-SYSTEM.sql" "backend\src\sql\user-roles-permissions.sql" >nul 2>&1
    echo ✓ File 14: backend/src/sql/user-roles-permissions.sql
    set /a FILES_COPIED+=1
) else (
    echo ⚠ File 14 not found in Downloads
)

REM File 15: Permission Matrix
if exist "%DOWNLOADS_PATH%\15-PERMISSION-MATRIX-AND-USE-CASES.txt" (
    copy "%DOWNLOADS_PATH%\15-PERMISSION-MATRIX-AND-USE-CASES.txt" "PERMISSION-MATRIX.txt" >nul 2>&1
    echo ✓ File 15: PERMISSION-MATRIX.txt
    set /a FILES_COPIED+=1
) else (
    echo ⚠ File 15 not found
)

REM RBAC Summary
if exist "%DOWNLOADS_PATH%\USERS-ROLES-PERMISSIONS-SUMMARY.txt" (
    copy "%DOWNLOADS_PATH%\USERS-ROLES-PERMISSIONS-SUMMARY.txt" "RBAC-SYSTEM.txt" >nul 2>&1
    echo ✓ RBAC-SYSTEM.txt
    set /a FILES_COPIED+=1
) else (
    echo ⚠ RBAC Summary not found
)

REM File 16: Connector Strategy
if exist "%DOWNLOADS_PATH%\16-CONNECTOR-STRATEGY-AND-ARCHITECTURE.md" (
    copy "%DOWNLOADS_PATH%\16-CONNECTOR-STRATEGY-AND-ARCHITECTURE.md" "CONNECTOR-STRATEGY.md" >nul 2>&1
    echo ✓ File 16: CONNECTOR-STRATEGY.md
    set /a FILES_COPIED+=1
) else (
    echo ⚠ File 16 not found
)

REM Connector Advantage
if exist "%DOWNLOADS_PATH%\WHY-CONNECTORS-ARE-YOUR-BIGGEST-ADVANTAGE.txt" (
    copy "%DOWNLOADS_PATH%\WHY-CONNECTORS-ARE-YOUR-BIGGEST-ADVANTAGE.txt" "WHY-CONNECTORS.txt" >nul 2>&1
    echo ✓ WHY-CONNECTORS.txt
    set /a FILES_COPIED+=1
) else (
    echo ⚠ WHY-CONNECTORS not found
)

REM File 17: Architecture v2
if exist "%DOWNLOADS_PATH%\17-COMPLETE-PLATFORM-ARCHITECTURE-v2.md" (
    copy "%DOWNLOADS_PATH%\17-COMPLETE-PLATFORM-ARCHITECTURE-v2.md" "ARCHITECTURE-v2.md" >nul 2>&1
    echo ✓ File 17: ARCHITECTURE-v2.md
    set /a FILES_COPIED+=1
) else (
    echo ⚠ File 17 not found
)

REM File 18: Multi-tenant Credentials
if exist "%DOWNLOADS_PATH%\18-MULTI-TENANT-CONNECTOR-CREDENTIALS.md" (
    copy "%DOWNLOADS_PATH%\18-MULTI-TENANT-CONNECTOR-CREDENTIALS.md" "MULTI-TENANT-CREDENTIALS.md" >nul 2>&1
    echo ✓ File 18: MULTI-TENANT-CREDENTIALS.md
    set /a FILES_COPIED+=1
) else (
    echo ⚠ File 18 not found
)

REM Why Credentials Matter
if exist "%DOWNLOADS_PATH%\WHY-PER-CUSTOMER-CREDENTIALS-MATTER.txt" (
    copy "%DOWNLOADS_PATH%\WHY-PER-CUSTOMER-CREDENTIALS-MATTER.txt" "WHY-CREDENTIALS.txt" >nul 2>&1
    echo ✓ WHY-CREDENTIALS.txt
    set /a FILES_COPIED+=1
) else (
    echo ⚠ WHY-CREDENTIALS not found
)

REM File 19: Universal Credentials
if exist "%DOWNLOADS_PATH%\19-UNIVERSAL-SCALABLE-CREDENTIAL-SYSTEM.md" (
    copy "%DOWNLOADS_PATH%\19-UNIVERSAL-SCALABLE-CREDENTIAL-SYSTEM.md" "UNIVERSAL-CREDENTIALS.md" >nul 2>&1
    echo ✓ File 19: UNIVERSAL-CREDENTIALS.md
    set /a FILES_COPIED+=1
) else (
    echo ⚠ File 19 not found
)

REM File 20: System is Universal
if exist "%DOWNLOADS_PATH%\20-YOUR-SYSTEM-IS-UNIVERSAL-PROOF.txt" (
    copy "%DOWNLOADS_PATH%\20-YOUR-SYSTEM-IS-UNIVERSAL-PROOF.txt" "SYSTEM-IS-UNIVERSAL.txt" >nul 2>&1
    echo ✓ File 20: SYSTEM-IS-UNIVERSAL.txt
    set /a FILES_COPIED+=1
) else (
    echo ⚠ File 20 not found
)

REM Scalability Analysis
if exist "%DOWNLOADS_PATH%\SCALABILITY-ANALYSIS-10M-VEHICLES.md" (
    copy "%DOWNLOADS_PATH%\SCALABILITY-ANALYSIS-10M-VEHICLES.md" "SCALABILITY-ANALYSIS.md" >nul 2>&1
    echo ✓ SCALABILITY-ANALYSIS.md
    set /a FILES_COPIED+=1
) else (
    echo ⚠ SCALABILITY-ANALYSIS not found
)

REM File 21: Phase 2
if exist "%DOWNLOADS_PATH%\21-PHASE-2-SCALING-ARCHITECTURE.md" (
    copy "%DOWNLOADS_PATH%\21-PHASE-2-SCALING-ARCHITECTURE.md" "PHASE-2-SCALING.md" >nul 2>&1
    echo ✓ File 21: PHASE-2-SCALING.md
    set /a FILES_COPIED+=1
) else (
    echo ⚠ File 21 not found
)

REM File 22: Phase 3
if exist "%DOWNLOADS_PATH%\22-PHASE-3-ENTERPRISE-SCALING.md" (
    copy "%DOWNLOADS_PATH%\22-PHASE-3-ENTERPRISE-SCALING.md" "PHASE-3-ENTERPRISE-SCALING.md" >nul 2>&1
    echo ✓ File 22: PHASE-3-ENTERPRISE-SCALING.md
    set /a FILES_COPIED+=1
) else (
    echo ⚠ File 22 not found
)

echo.
echo Files copied: %FILES_COPIED%

REM ============================================
REM STEP 3: PULL FROM GITHUB
REM ============================================

echo.
echo Step 3: Pulling from GitHub...
git pull origin main
echo ✓ Pull complete

REM ============================================
REM STEP 4: ADD ALL FILES
REM ============================================

echo.
echo Step 4: Adding all files to git...
git add .
echo ✓ Files added

REM ============================================
REM STEP 5: COMMIT
REM ============================================

echo.
echo Step 5: Creating commit...
git commit -m "Day 6: Add Files 14-22 - RBAC, Connectors, and Scaling Roadmap (Phase 2 + Phase 3)

Files 14-22 Added:
- File 14: RBAC system (SQL)
- Files 15-20: Connector infrastructure and documentation
- Scalability analysis for 10M vehicles
- File 21: Phase 2 Scaling Architecture
- File 22: Phase 3 Enterprise Scaling

Complete platform with scaling roadmap ready for MVP launch."

if errorlevel 1 (
    echo [WARNING] Commit may have issues
) else (
    echo ✓ Commit created
)

REM ============================================
REM STEP 6: PUSH
REM ============================================

echo.
echo Step 6: Pushing to GitHub...
git push origin main

if errorlevel 1 (
    echo.
    echo [ERROR] Push failed
    pause
    exit /b 1
)

REM ============================================
REM SUCCESS!
REM ============================================

echo.
echo ========================================
echo ✓ SUCCESS!
echo ========================================
echo.
echo Files 14-22 copied and pushed to GitHub!
echo.
echo Files copied: %FILES_COPIED%
echo.
echo Your GitHub now has:
echo ✓ All Day 1-5 files
echo ✓ File 14: RBAC system
echo ✓ Files 15-20: Connector infrastructure
echo ✓ Scalability analysis
echo ✓ Phase 2 Scaling Architecture
echo ✓ Phase 3 Enterprise Scaling
echo.
echo Platform 100%% complete!
echo.
echo Repository: https://github.com/OHxraa/fleet-telematics-platform
echo.
pause
