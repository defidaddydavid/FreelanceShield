#!/bin/bash
# FreelanceShield WSL Environment Setup Script
# This script installs all necessary dependencies for Solana and Anchor development

set -e # Exit on error

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BOLD}${BLUE}FreelanceShield WSL Environment Setup Script${NC}"
echo -e "${YELLOW}This script will install all necessary dependencies for Solana and Anchor development${NC}\n"

# Update and install basic dependencies
echo -e "${BOLD}Updating package lists and installing basic dependencies...${NC}"
sudo apt-get update
sudo apt-get install -y curl build-essential pkg-config libssl-dev libudev-dev git

# Install Rust
echo -e "\n${BOLD}Installing Rust...${NC}"
if ! command -v rustc &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
    echo -e "${GREEN}✓ Rust installed: $(rustc --version)${NC}"
else
    echo -e "${GREEN}✓ Rust already installed: $(rustc --version)${NC}"
    # Update Rust to ensure compatibility
    rustup update
fi

# Install Solana CLI
echo -e "\n${BOLD}Installing Solana CLI...${NC}"
if ! command -v solana &> /dev/null; then
    sh -c "$(curl -sSfL https://release.solana.com/v1.16.14/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
    echo -e "${GREEN}✓ Solana CLI installed: $(solana --version)${NC}"
else
    echo -e "${GREEN}✓ Solana CLI already installed: $(solana --version)${NC}"
fi

# Install Node.js and npm
echo -e "\n${BOLD}Installing Node.js and npm...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js installed: $(node --version)${NC}"
else
    echo -e "${GREEN}✓ Node.js already installed: $(node --version)${NC}"
fi

# Install Yarn
echo -e "\n${BOLD}Installing Yarn...${NC}"
if ! command -v yarn &> /dev/null; then
    npm install -g yarn
    echo -e "${GREEN}✓ Yarn installed: $(yarn --version)${NC}"
else
    echo -e "${GREEN}✓ Yarn already installed: $(yarn --version)${NC}"
fi

# Install Anchor CLI
echo -e "\n${BOLD}Installing Anchor CLI...${NC}"
if ! command -v anchor &> /dev/null; then
    cargo install --git https://github.com/coral-xyz/anchor avm --locked
    avm install 0.28.0
    avm use 0.28.0
    echo -e "${GREEN}✓ Anchor CLI installed: $(anchor --version)${NC}"
else
    current_version=$(anchor --version | cut -d' ' -f2)
    if [ "$current_version" != "0.28.0" ]; then
        echo -e "${YELLOW}Updating Anchor to version 0.28.0...${NC}"
        cargo install --git https://github.com/coral-xyz/anchor avm --locked
        avm install 0.28.0
        avm use 0.28.0
    fi
    echo -e "${GREEN}✓ Anchor CLI already installed: $(anchor --version)${NC}"
fi

# Configure Solana for devnet
echo -e "\n${BOLD}Configuring Solana for devnet...${NC}"
solana config set --url devnet
echo -e "${GREEN}✓ Solana configured to use devnet${NC}"

# Check for existing keypair
KEYPAIR_PATH="$HOME/.config/solana/devnet-deploy.json"
if [ ! -f "$KEYPAIR_PATH" ]; then
    echo -e "\n${BOLD}Creating new deployment keypair...${NC}"
    solana-keygen new --no-bip39-passphrase -o "$KEYPAIR_PATH"
    echo -e "${GREEN}✓ New keypair created at $KEYPAIR_PATH${NC}"
else
    echo -e "${GREEN}✓ Using existing keypair at $KEYPAIR_PATH${NC}"
fi

# Set keypair
solana config set --keypair "$KEYPAIR_PATH"

# Check balance
echo -e "\n${BOLD}Checking wallet balance...${NC}"
WALLET_ADDRESS=$(solana address)
BALANCE=$(solana balance)
echo -e "Wallet address: $WALLET_ADDRESS"
echo -e "Current balance: $BALANCE SOL"

# Airdrop if balance is low
if (( $(echo "$BALANCE < 1" | bc -l) )); then
    echo -e "${YELLOW}Balance is low. Attempting to airdrop SOL...${NC}"
    solana airdrop 2
    NEW_BALANCE=$(solana balance)
    echo -e "${GREEN}New balance: $NEW_BALANCE SOL${NC}"
fi

# Create a rust-toolchain.toml file to ensure compatibility
echo -e "\n${BOLD}Creating rust-toolchain.toml file...${NC}"
cat > rust-toolchain.toml << EOF
[toolchain]
channel = "1.70.0"
components = ["rustfmt", "clippy"]
EOF
echo -e "${GREEN}✓ rust-toolchain.toml created${NC}"

echo -e "\n${GREEN}${BOLD}Setup completed!${NC}"
echo -e "${YELLOW}You can now build and deploy your Anchor programs.${NC}"
echo -e "${YELLOW}To build your project, run: anchor build${NC}"
echo -e "${YELLOW}To deploy to devnet, run: anchor deploy --provider.cluster devnet${NC}"
