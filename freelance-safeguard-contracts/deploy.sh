#!/bin/bash
# FreelanceShield - Solana Smart Contract Deployment Script for WSL
# This script helps deploy the FreelanceShield smart contracts to Solana devnet

set -e # Exit on error

echo "===== FreelanceShield Solana Contract Deployment ====="
echo "This script will help deploy your smart contracts to Solana devnet."

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "Error: Solana CLI not found. Please install it first."
    echo "Run: sh -c \"$(curl -sSfL https://release.solana.com/v1.16.14/install)\""
    exit 1
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "Error: Anchor CLI not found. Please install it first."
    echo "Run: npm install -g @project-serum/anchor-cli"
    exit 1
fi

# Create deployment wallet if it doesn't exist
WALLET_PATH="/mnt/c/Users/User/OneDrive - UvA/Documents/FreeLanceShield/freelance-safeguard-contracts/devnet-deploy.json"

if [ ! -f "$WALLET_PATH" ]; then
    echo "Creating new deployment wallet..."
    solana-keygen new --no-bip39-passphrase -o "$WALLET_PATH"
else
    echo "Using existing wallet at $WALLET_PATH"
fi

# Set Solana config to use devnet
echo "Configuring Solana CLI for devnet..."
solana config set --url devnet

# Set the keypair
solana config set --keypair "$WALLET_PATH"

# Check wallet balance
BALANCE=$(solana balance)
echo "Current wallet balance: $BALANCE"

# Airdrop SOL if needed
if (( $(echo "$BALANCE < 1" | bc -l) )); then
    echo "Balance too low. Requesting airdrop..."
    solana airdrop 2
    sleep 5
    NEW_BALANCE=$(solana balance)
    echo "New balance: $NEW_BALANCE"
    
    # Check if airdrop worked
    if (( $(echo "$NEW_BALANCE <= $BALANCE" | bc -l) )); then
        echo "Warning: Airdrop might have failed. Consider manually funding this wallet."
        echo "Wallet address: $(solana address)"
    fi
fi

# Build the programs
echo "Building programs..."
anchor build

# Deploy the programs
echo "Deploying programs to devnet..."
anchor deploy --provider.cluster devnet

# Display deployed program IDs
echo "Deployed program IDs:"
grep -A 5 "programs.devnet" Anchor.toml

echo "===== Deployment Complete ====="
echo "Next steps:"
echo "1. Ensure your frontend is configured to use these program IDs"
echo "2. Set USE_MOCK_DATA to false in your frontend files"
echo "3. Test your application with real blockchain interaction"
