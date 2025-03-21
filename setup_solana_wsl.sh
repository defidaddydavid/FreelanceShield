#!/bin/bash
set -e

echo "====== FreelanceShield Solana Setup and Deployment Script ======"
echo "This script will install all required dependencies and deploy contracts to Solana devnet"

# Install basic dependencies
echo "===== Step 1: Installing basic dependencies ====="
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl build-essential git pkg-config libudev-dev libssl-dev

# Install Rust
echo "===== Step 2: Installing Rust ====="
if ! command -v rustc &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    echo "Rust installed successfully"
else
    echo "Rust is already installed"
fi
rustc --version

# Install Solana CLI
echo "===== Step 3: Installing Solana CLI ====="
if ! command -v solana &> /dev/null; then
    sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
    
    # Add Solana to PATH
    if [[ -z $(grep "export PATH=\"\$HOME/.local/share/solana/install/active_release/bin:\$PATH\"" ~/.bashrc) ]]; then
        echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
    fi
    
    source ~/.bashrc
    echo "Solana CLI installed successfully"
else
    echo "Solana CLI is already installed"
fi
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version

# Install Anchor CLI via AVM
echo "===== Step 4: Installing Anchor CLI ====="
if ! command -v anchor &> /dev/null; then
    cargo install --git https://github.com/coral-xyz/anchor avm --force
    avm install latest
    avm use latest
    echo "Anchor CLI installed successfully"
else
    echo "Anchor CLI is already installed"
fi
anchor --version

# Install Node.js and Yarn if not already installed
echo "===== Step 5: Installing Node.js and Yarn ====="
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "Node.js installed successfully"
else
    echo "Node.js is already installed"
fi
node --version

if ! command -v yarn &> /dev/null; then
    sudo npm install -g yarn
    echo "Yarn installed successfully"
else
    echo "Yarn is already installed"
fi
yarn --version

# Configure Solana for Devnet
echo "===== Step 6: Configuring Solana for Devnet ====="
solana config set --url https://api.devnet.solana.com
echo "Solana configured for devnet"

# Create a new keypair for deployment if not exists
echo "===== Step 7: Creating deployment keypair ====="
if [ ! -f ~/devnet-deploy.json ]; then
    solana-keygen new --no-bip39-passphrase -o ~/devnet-deploy.json
    echo "New keypair created at ~/devnet-deploy.json"
fi
WALLET_ADDRESS=$(solana-keygen pubkey ~/devnet-deploy.json)
echo "Wallet address: $WALLET_ADDRESS"

# Fund the wallet
echo "===== Step 8: Funding your wallet ====="
echo "Attempting to airdrop 2 SOL to your wallet"
solana airdrop 2 --keypair ~/devnet-deploy.json || true
echo "If airdrop fails due to rate limits, please use the faucet at https://faucet.anza.xyz/"
BALANCE=$(solana balance --keypair ~/devnet-deploy.json)
echo "Current balance: $BALANCE"

# Navigate to project directory
echo "===== Step 9: Preparing for deployment ====="
PROJECT_DIR="/mnt/c/Users/User/OneDrive - UvA/Documents/FreeLanceShield/freelance-safeguard-contracts"
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    
    # Update Anchor.toml
    echo "Updating Anchor.toml..."
    sed -i 's/cluster = "localnet"/cluster = "devnet"/' Anchor.toml
    sed -i 's|wallet = ".*"|wallet = "~/devnet-deploy.json"|' Anchor.toml
    
    # Build and deploy contracts
    echo "===== Step 10: Building contracts ====="
    anchor build
    
    echo "===== Step 11: Deploying contracts to devnet ====="
    echo "Note: This step requires your wallet to have sufficient SOL"
    anchor deploy
    
    echo "===== Step 12: Getting program IDs ====="
    echo "Please update your frontend configuration with these program IDs:"
    grep -A 7 '\[programs.devnet\]' Anchor.toml
    
    echo "===== Step 13: Remember to update your frontend ====="
    echo "1. Update program IDs in your frontend constants file"
    echo "2. Set USE_MOCK_DATA = false in useRiskPoolData.ts"
else
    echo "ERROR: Project directory not found at $PROJECT_DIR"
    echo "Please check the path and try again"
fi

echo "====== Setup and deployment complete! ======"
