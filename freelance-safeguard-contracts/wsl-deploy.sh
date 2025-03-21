#!/bin/bash
# FreelanceShield WSL Deployment Script
# This script helps deploy FreelanceShield contracts from Windows using WSL

set -e # Exit on error

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BOLD}${BLUE}FreelanceShield WSL Deployment Script${NC}"
echo -e "${YELLOW}This script will help you deploy the FreelanceShield contracts to Solana devnet using WSL${NC}\n"

# Check if running in WSL - Removed this check as it's causing issues
# if ! grep -q Microsoft /proc/version; then
#   echo -e "${RED}This script should be run in WSL. Please open WSL and try again.${NC}"
#   exit 1
# fi

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required tools
echo -e "${BOLD}Checking for required tools...${NC}"

# Check for Solana CLI
if ! command_exists solana; then
  echo -e "${YELLOW}Solana CLI not found. Installing...${NC}"
  sh -c "$(curl -sSfL https://release.solana.com/v1.16.14/install)"
  export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
else
  echo -e "${GREEN}✓ Solana CLI found${NC}"
fi

# Check for Anchor
if ! command_exists anchor; then
  echo -e "${YELLOW}Anchor not found. Installing...${NC}"
  npm install -g @coral-xyz/anchor-cli
else
  echo -e "${GREEN}✓ Anchor found${NC}"
fi

# Check for Rust
if ! command_exists rustc; then
  echo -e "${YELLOW}Rust not found. Installing...${NC}"
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
else
  echo -e "${GREEN}✓ Rust found${NC}"
fi

# Navigate to the project directory
WINDOWS_PATH=$(pwd)
echo -e "\n${BOLD}Current directory: ${WINDOWS_PATH}${NC}"
echo -e "${YELLOW}Make sure you are in the freelance-safeguard-contracts directory${NC}"

# Set up Solana configuration
echo -e "\n${BOLD}Setting up Solana configuration...${NC}"
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
echo -e "Current balance: $BALANCE"

# Airdrop if balance is low
if (( $(echo "$BALANCE < 1" | bc -l) )); then
  echo -e "${YELLOW}Balance is low. Attempting to airdrop SOL...${NC}"
  solana airdrop 2
  NEW_BALANCE=$(solana balance)
  echo -e "${GREEN}New balance: $NEW_BALANCE${NC}"
fi

# Build and deploy
echo -e "\n${BOLD}Building Anchor programs...${NC}"
anchor build

echo -e "\n${BOLD}Deploying to devnet...${NC}"
anchor deploy --provider.cluster devnet

# Get program IDs
echo -e "\n${BOLD}Deployed program IDs:${NC}"
grep -A 10 "\[programs.devnet\]" Anchor.toml

echo -e "\n${GREEN}${BOLD}Deployment completed!${NC}"
echo -e "${YELLOW}Please update these program IDs in your frontend constants.ts file${NC}"
echo -e "${YELLOW}and set USE_MOCK_DATA = false in useRiskPoolData.ts${NC}"

# Run test script
echo -e "\n${BOLD}Would you like to run the deployment test script? (y/n)${NC}"
read -r run_test
if [[ "$run_test" =~ ^[Yy]$ ]]; then
  echo -e "\n${BOLD}Running deployment test...${NC}"
  npx ts-node test-deployment.ts
fi

echo -e "\n${BOLD}${GREEN}All done! Your FreelanceShield contracts are now deployed to Solana devnet.${NC}"
