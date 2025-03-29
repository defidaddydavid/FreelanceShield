#!/bin/bash
# Script to validate and verify dependency compatibility

echo "======= FreelanceShield Dependency Verification ======="
echo "Checking Solana program versions..."

# Clean any previous builds
echo "Cleaning previous builds..."
cargo clean

# Run cargo check first to validate dependencies without full build
echo "Running cargo check to validate dependencies..."
cargo check --all-targets

if [ $? -ne 0 ]; then
    echo "Dependency check failed. Please review the error messages above."
    exit 1
fi

# Run cargo build-bpf for one program at a time to isolate any issues
echo "Building each program individually to isolate potential issues..."

# Core program
echo "Building core program..."
cd programs/core && cargo build-bpf && cd ../../

# Risk pool program
echo "Building risk-pool-program..."
cd programs/risk-pool-program && cargo build-bpf && cd ../../

# Policy NFT program (potentially problematic due to mpl-token-metadata)
echo "Building policy-nft program..."
cd programs/policy-nft && cargo build-bpf && cd ../../

# Claims processor
echo "Building claims-processor..."
cd programs/claims-processor && cargo build-bpf && cd ../../

# Staking program
echo "Building staking-program..."
cd programs/staking-program && cargo build-bpf && cd ../../

# Build all programs together
echo "Building all programs together..."
cargo build-bpf

if [ $? -eq 0 ]; then
    echo "✅ All builds completed successfully!"
else
    echo "❌ Build failed. Please review the error messages above."
    exit 1
fi

echo "Dependency verification complete."
echo "If you encounter any issues, verify the patches in the workspace Cargo.toml file."
