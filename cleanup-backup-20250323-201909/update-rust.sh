#!/bin/bash
# Script to update Rust toolchain in WSL

echo "===== Updating Rust toolchain ====="
rustup update

echo "===== Setting default toolchain to stable ====="
rustup default stable

echo "===== Checking Rust version ====="
rustc --version
cargo --version

echo "===== Installing Solana tools ====="
sh -c "$(curl -sSfL https://release.solana.com/v1.16.14/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

echo "===== Checking Solana version ====="
solana --version

echo "===== Pinning bytemuck_derive to a compatible version ====="
cd /mnt/c/Projects/FreelanceShield/freelance-safeguard-contracts
cargo update -p bytemuck_derive --precise 1.5.0

echo "===== Rust toolchain update complete ====="
