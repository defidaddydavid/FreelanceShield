@echo off
echo ======= FreelanceShield Dependency Verification =======
echo Checking Solana program versions...

REM Clean any previous builds
echo Cleaning previous builds...
cargo clean

REM First check a specific program that requires mpl-token-metadata
echo Testing policy-nft program individually...
cd programs\policy-nft
cargo check > ..\..\policy_nft_log.txt 2>&1
cd ..\..

REM Run cargo check with verbose output for detailed dependency information
echo Running cargo check with verbose output on core program...
cd programs\core
cargo check -v > ..\..\core_log.txt 2>&1
cd ..\..

REM Check both logs for errors
findstr /C:"error" policy_nft_log.txt
findstr /C:"error" core_log.txt

if %ERRORLEVEL% neq 0 (
    echo Dependency or compilation errors detected.
    echo For complete logs, check policy_nft_log.txt and core_log.txt
    exit /b 1
)

echo All dependency checks passed successfully.
echo If you want to proceed with building individual programs, run build-programs.bat
