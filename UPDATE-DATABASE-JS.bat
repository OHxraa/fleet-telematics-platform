@echo off
REM Update database.js with SSL configuration

setlocal enabledelayedexpansion

echo.
echo ========================================
echo Updating database.js with SSL fix
echo ========================================
echo.

REM Check if file exists
if not exist "backend\src\config\database.js" (
    echo [ERROR] File not found: backend\src\config\database.js
    pause
    exit /b 1
)

echo Found database.js

REM Read the file and add SSL config
REM Create a temp file with the fix
(
    echo /**
    echo  * PostgreSQL Database Configuration
    echo  */
    echo.
    echo const { Pool } = require('pg');
    echo const logger = require('../utils/logger');
    echo.
    echo console.log('DATABASE_URL:', process.env.DATABASE_URL);
    echo.
    echo const pool = new Pool({
    echo   connectionString: process.env.DATABASE_URL,
    echo   ssl: { rejectUnauthorized: false },
    echo   max: 20,
    echo   idleTimeoutMillis: 30000,
    echo   connectionTimeoutMillis: 5000,
    echo });
    echo.
    echo pool.on('error', (err) =^> {
    echo   console.error('Pool error:', err.message);
    echo   logger.error('Pool error:', err.message);
    echo });
    echo.
    echo const initializeDatabase = async () =^> {
    echo   try {
    echo     logger.info('Attempting to connect to database...');
    echo     const client = await pool.connect();
    echo     const result = await client.query('SELECT NOW()');
    echo     logger.info(`Database connected at ${result.rows[0].now}`);
    echo     client.release();
    echo     return pool;
    echo   } catch (error) {
    echo     console.error('Database error:', error);
    echo     logger.error('Database connection failed:', error.message);
    echo     throw error;
    echo   }
    echo };
    echo.
    echo module.exports = {
    echo   pool,
    echo   initializeDatabase,
    echo };
) > "backend\src\config\database.js"

echo.
echo ✓ database.js updated successfully!
echo.
echo Verifying...
type "backend\src\config\database.js" | find "rejectUnauthorized"

echo.
echo ========================================
echo Done! Now run: npm run dev
echo ========================================
echo.
pause
