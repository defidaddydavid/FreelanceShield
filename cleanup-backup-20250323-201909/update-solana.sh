#!/bin/bash
# Script to update Solana toolchain

echo "===== Updating Solana toolchain ====="
sh -c "$(curl -sSfL https://release.solana.com/v1.18.26/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

echo "===== Checking Solana version ====="
solana --version

echo "===== Setting default Rust toolchain ====="
rustup default stable

echo "===== Checking Rust version ====="
rustc --version
cargo --version

echo "===== Cleaning build artifacts ====="
cd /mnt/c/Projects/FreelanceShield/freelance-safeguard-contracts
cargo clean
anchor clean

echo "===== Building with Anchor ====="
anchor build
