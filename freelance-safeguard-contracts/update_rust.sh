#!/bin/bash
# Display current Rust version
echo "Current Rust version:"
rustc --version

# Update Rust to the latest stable version
echo "Updating Rust to latest stable version..."
rustup update stable
rustup default stable

# Verify the new Rust version
echo "New Rust version:"
rustc --version

# Remove Cargo.lock and regenerate it
echo "Regenerating Cargo.lock file..."
rm -f Cargo.lock
cargo generate-lockfile

# Try building the project
echo "Attempting to build the project..."
anchor build
