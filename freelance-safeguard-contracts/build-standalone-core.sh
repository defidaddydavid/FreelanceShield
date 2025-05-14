#!/bin/bash

echo "Building standalone core program for FreelanceShield with Privy and Ethos integration..."

# Create a temporary directory for standalone core program
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

# Copy the core program to the temporary directory
mkdir -p $TEMP_DIR/src
cp -r programs/core/src/* $TEMP_DIR/src/

# Create a standalone Cargo.toml for the core program
cat > $TEMP_DIR/Cargo.toml << EOF
[package]
name = "freelance-shield-core"
version = "0.1.0"
description = "Core insurance functionality for FreelanceShield"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "freelance_shield_core"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.28.0"
anchor-spl = { version = "0.28.0", features = ["token", "associated_token"], default-features = false }
solana-program = "=1.16.0"
spl-token = { version = "=3.5.0", features = ["no-entrypoint"] }
spl-associated-token-account = "=1.1.3"
thiserror = "=1.0.40"
zeroize = "=1.3.0"
borsh = "=0.10.3"
EOF

# Navigate to the temporary directory
cd $TEMP_DIR

# Build the standalone core program
echo "Building standalone core program..."
cargo build-sbf

# Check if the build was successful
if [ $? -eq 0 ]; then
  echo "Core program built successfully!"
  
  # Copy the compiled program back to the original project
  mkdir -p /Users/davidknezevic/Projects/FreelanceShield/freelance-safeguard-contracts/target/deploy
  cp target/deploy/freelance_shield_core.so /Users/davidknezevic/Projects/FreelanceShield/freelance-safeguard-contracts/target/deploy/core.so
  
  echo "Core program binary copied to target/deploy directory."
  
  # Generate IDL
  echo "Generating IDL..."
  anchor build --idl-out /Users/davidknezevic/Projects/FreelanceShield/freelance-safeguard-contracts/target/idl/core.json
  
  echo "Standalone core program build complete!"
else
  echo "Core program build failed!"
  exit 1
fi

# Clean up
echo "Cleaning up temporary directory..."
rm -rf $TEMP_DIR

echo "Done!"
