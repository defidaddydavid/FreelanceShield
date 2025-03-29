@echo off
echo ======= FreelanceShield Program Build Script =======

REM Set terminal colors for better visibility
color 0A

REM Build each program individually to isolate any issues
echo Building each program individually...

REM Create a directory for build logs
if not exist build_logs mkdir build_logs

REM Core program
echo Building core program...
cd programs\core && cargo build-bpf > ..\..\build_logs\core.log 2>&1
if %ERRORLEVEL% neq 0 (
    echo [FAILED] Core program build failed. See build_logs\core.log for details.
    exit /b 1
) else (
    echo [SUCCESS] Core program built successfully.
)
cd ..\..\

REM Policy NFT program
echo Building policy-nft program...
cd programs\policy-nft && cargo build-bpf > ..\..\build_logs\policy-nft.log 2>&1
if %ERRORLEVEL% neq 0 (
    echo [FAILED] Policy NFT program build failed. See build_logs\policy-nft.log for details.
    exit /b 1
) else (
    echo [SUCCESS] Policy NFT program built successfully.
)
cd ..\..\

REM Claims processor
echo Building claims-processor program...
cd programs\claims-processor && cargo build-bpf > ..\..\build_logs\claims-processor.log 2>&1
if %ERRORLEVEL% neq 0 (
    echo [FAILED] Claims processor build failed. See build_logs\claims-processor.log for details.
    exit /b 1
) else (
    echo [SUCCESS] Claims processor built successfully.
)
cd ..\..\

REM Risk pool program
echo Building risk-pool-program...
cd programs\risk-pool-program && cargo build-bpf > ..\..\build_logs\risk-pool.log 2>&1
if %ERRORLEVEL% neq 0 (
    echo [FAILED] Risk pool program build failed. See build_logs\risk-pool.log for details.
    exit /b 1
) else (
    echo [SUCCESS] Risk pool program built successfully.
)
cd ..\..\

echo ✅ All targeted programs built successfully!
echo To run tests, use the run-tests.bat script.
