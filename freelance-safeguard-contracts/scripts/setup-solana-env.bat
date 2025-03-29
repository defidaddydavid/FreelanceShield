@echo off
echo ======= FreelanceShield Solana Environment Setup =======

REM Set environment variables for Solana
echo Setting up Solana environment variables...
set SOLANA_VERSION=1.9.13
set ANCHOR_VERSION=0.24.2

REM Check if Solana CLI is installed
where solana >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Solana CLI not found. Please install Solana CLI first.
    echo Visit https://docs.solana.com/cli/install-solana-cli-tools for installation instructions.
    exit /b 1
)

REM Check if Anchor is installed
where anchor >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Anchor CLI not found. Please install Anchor CLI first.
    echo You can install it with: "cargo install --git https://github.com/project-serum/anchor avm --tag v0.24.2 --locked"
    echo Then: "avm install 0.24.2" and "avm use 0.24.2"
    exit /b 1
)

REM Update PATH to ensure build-bpf is available
set PATH=%USERPROFILE%\.cargo\bin;%PATH%
set PATH=%USERPROFILE%\.local\share\solana\install\active_release\bin;%PATH%

REM Set home directory explicitly (fixes the home directory error)
set HOME=%USERPROFILE%

echo Environment setup complete. 
echo Solana version: %SOLANA_VERSION%
echo Anchor version: %ANCHOR_VERSION%

REM Display current environment
echo Current environment:
solana --version
anchor --version

echo ✅ Solana environment setup complete.
