#!/bin/bash

# Set environment variables
export PATH="/Users/davidknezevic/.local/share/solana/install/active_release/bin:$PATH"

echo "Building core program only..."

# Navigate to the core program directory
cd programs/core

# Clean any previous build artifacts
cargo clean

# Build the core program using Solana BPF toolchain
RUST_BACKTRACE=1 cargo build-bpf

# Check if the build was successful
if [ $? -eq 0 ]; then
  echo "Core program built successfully!"
  
  # Copy the compiled program to the target/deploy directory
  mkdir -p ../../target/deploy
  cp ../../target/deploy/core.so ../../target/deploy/
  
  echo "Core program binary copied to target/deploy directory."
else
  echo "Core program build failed!"
  exit 1
fi
