#!/bin/bash
# Script to clean and rebuild with latest dependencies

# Navigate to the correct project directory
cd /mnt/c/Projects/FreelanceShield/freelance-safeguard-contracts
echo "===== Working in $(pwd) ====="

echo "===== Cleaning Cargo cache ====="
cargo clean
rm -f Cargo.lock
rm -rf target/

echo "===== Cleaning Anchor artifacts ====="
anchor clean

echo "===== Updating Solana to latest version ====="
sh -c "$(curl -sSfL https://release.solana.com/v1.18.26/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

echo "===== Verifying versions ====="
solana --version
rustc --version
cargo --version

echo "===== Building with latest dependencies ====="
anchor build

echo "===== Build complete ====="
