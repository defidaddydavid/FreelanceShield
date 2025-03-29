@echo off
echo ======= Fixing Cargo.toml files =======
echo Removing deprecated cargo-features directives...

set PROGRAM_DIRS=programs\claims-processor programs\escrow-program programs\insurance-program programs\reputation-program programs\risk-pool-program programs\staking-program programs\freelance-insurance programs\enhanced-cover programs\enhanced-risk-pool programs\dao-governance

for %%d in (%PROGRAM_DIRS%) do (
    echo Processing %%d\Cargo.toml
    powershell -Command "(Get-Content -Path '%%d\Cargo.toml' -Raw) -replace 'cargo-features = \[\"workspace-inheritance\"\]\r?\n\r?\n', '' | Set-Content -Path '%%d\Cargo.toml'"
)

echo All Cargo.toml files have been updated
echo You may now run the verification script
