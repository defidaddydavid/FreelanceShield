#!/bin/bash

# Set environment variables
export PATH="/Users/davidknezevic/.local/share/solana/install/active_release/bin:$PATH"

# Deploy the core program
echo "Deploying core program to Solana devnet..."
solana program deploy ./target/deploy/core.so \
  --keypair ./deploy-keypair.json \
  --url devnet \
  --program-id BWop9ejaeHDK9ktZivqzqwgZMN8kituGYM7cKqrpNiaE

echo "Core program deployed successfully!"

# Update the IDL
echo "Updating IDL..."
anchor idl init \
  --filepath ./target/idl/core.json \
  BWop9ejaeHDK9ktZivqzqwgZMN8kituGYM7cKqrpNiaE \
  --provider.cluster devnet \
  --provider.wallet ./deploy-keypair.json

echo "IDL updated successfully!"
