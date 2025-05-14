#!/bin/bash

# Set environment variables
export ANCHOR_VERSION=0.31.0

# Navigate to the core program directory
cd programs/core

# Build the program using cargo directly
echo "Building core program..."
cargo build-bpf --manifest-path Cargo.toml

# Copy the built program to the deployment directory
mkdir -p ../../target/deploy
cp ../../target/deploy/core.so ../../target/deploy/

echo "Core program built successfully!"
