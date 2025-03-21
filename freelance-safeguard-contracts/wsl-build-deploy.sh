#!/bin/bash
# FreelanceShield Build and Deploy Script for WSL
# This script builds and deploys Anchor programs to Solana devnet

set -e # Exit on error

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BOLD}${BLUE}FreelanceShield Build and Deploy Script${NC}"
echo -e "${YELLOW}This script will build and deploy your Anchor programs to Solana devnet${NC}\n"

# Ensure we're in the project directory
cd /mnt/c/Projects/FreelanceShield/freelance-safeguard-contracts

# Load environment variables
source ~/.bashrc
source ~/.cargo/env
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify tools are available
echo -e "${BOLD}Verifying installed tools...${NC}"
rustc --version
cargo --version
solana --version
anchor --version

# Check Solana configuration
echo -e "\n${BOLD}Checking Solana configuration...${NC}"
solana config get
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

# Copy keypair to project directory if needed
if [ ! -f "./devnet-deploy.json" ]; then
    echo -e "\n${BOLD}Copying keypair to project directory...${NC}"
    cp $HOME/.config/solana/devnet-deploy.json ./devnet-deploy.json
    echo -e "${GREEN}✓ Keypair copied to project directory${NC}"
fi

# Build the project
echo -e "\n${BOLD}Building Anchor programs...${NC}"
anchor build

# Deploy to devnet
echo -e "\n${BOLD}Deploying to Solana devnet...${NC}"
anchor deploy --provider.cluster devnet

# Get program IDs
echo -e "\n${BOLD}Deployed program IDs:${NC}"
grep -A 10 "\[programs.devnet\]" Anchor.toml

echo -e "\n${GREEN}${BOLD}Deployment completed!${NC}"
echo -e "${YELLOW}Please update these program IDs in your frontend constants.ts file${NC}"

# Run test script if requested
echo -e "\n${BOLD}Would you like to run the deployment test script? (y/n)${NC}"
read -r run_test
if [[ "$run_test" =~ ^[Yy]$ ]]; then
    echo -e "\n${BOLD}Running deployment test...${NC}"
    npx ts-node test-deployment.ts
fi

echo -e "\n${BOLD}${GREEN}All done! Your FreelanceShield contracts are now deployed to Solana devnet.${NC}"
