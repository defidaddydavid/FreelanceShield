#!/bin/bash
# FreelanceShield WSL Setup and Deploy Script
# This script helps set up the environment and deploy FreelanceShield contracts

set -e # Exit on error

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BOLD}${BLUE}FreelanceShield WSL Setup and Deploy Script${NC}"
echo -e "${YELLOW}This script will set up your environment and deploy the FreelanceShield contracts${NC}\n"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required tools
echo -e "${BOLD}Checking for required tools...${NC}"

# Check for Node.js
if ! command_exists node; then
  echo -e "${YELLOW}Node.js not found. Installing...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"
fi

# Check for npm
if ! command_exists npm; then
  echo -e "${YELLOW}npm not found. Installing...${NC}"
  sudo apt-get install -y npm
else
  echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"
fi

# Check for Solana CLI
if ! command_exists solana; then
  echo -e "${YELLOW}Solana CLI not found. Installing...${NC}"
  sh -c "$(curl -sSfL https://release.solana.com/v1.16.14/install)"
  export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
else
  echo -e "${GREEN}✓ Solana CLI found: $(solana --version)${NC}"
fi

# Check for Anchor
if ! command_exists anchor; then
  echo -e "${YELLOW}Anchor not found. Installing...${NC}"
  npm install -g @coral-xyz/anchor-cli
else
  echo -e "${GREEN}✓ Anchor found: $(anchor --version)${NC}"
fi

# Check for Rust
if ! command_exists rustc; then
  echo -e "${YELLOW}Rust not found. Installing...${NC}"
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  source "$HOME/.cargo/env"
else
  echo -e "${GREEN}✓ Rust found: $(rustc --version)${NC}"
fi

# Install project dependencies
echo -e "\n${BOLD}Installing project dependencies...${NC}"
npm install

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
  
  # If airdrop fails, suggest alternatives
  if (( $(echo "$NEW_BALANCE < 1" | bc -l) )); then
    echo -e "${YELLOW}Airdrop may have failed due to rate limiting. Consider these alternatives:${NC}"
    echo -e "1. Use a local validator: solana-test-validator"
    echo -e "2. Get SOL from a faucet: https://faucet.solana.com/"
    echo -e "3. Transfer SOL from another wallet"
    
    echo -e "\n${BOLD}Would you like to use a local validator instead? (y/n)${NC}"
    read -r use_local
    if [[ "$use_local" =~ ^[Yy]$ ]]; then
      echo -e "${YELLOW}Starting local validator...${NC}"
      # Start local validator in background
      solana-test-validator &
      VALIDATOR_PID=$!
      
      # Wait for validator to start
      sleep 5
      
      # Configure Solana to use local validator
      solana config set --url localhost
      echo -e "${GREEN}✓ Solana configured to use local validator${NC}"
    fi
  fi
fi

# Function to check and create Cargo.toml files for all programs
check_and_create_cargo_files() {
  echo -e "\n${BOLD}Checking and creating Cargo.toml files for all programs...${NC}"
  
  # List of program directories
  PROGRAMS=("claims-processor" "dao-governance" "escrow-program" "insurance-program" "reputation-program" "risk-pool-program" "staking-program")
  
  for program in "${PROGRAMS[@]}"; do
    CARGO_PATH="programs/$program/Cargo.toml"
    
    if [ ! -f "$CARGO_PATH" ]; then
      echo -e "${YELLOW}Creating Cargo.toml for $program...${NC}"
      
      # Convert program name to lib name format (replace hyphens with underscores)
      LIB_NAME=$(echo "$program" | tr '-' '_')
      
      # Create Cargo.toml file
      mkdir -p "programs/$program"
      cat > "$CARGO_PATH" << EOF
[package]
name = "$program"
version = "0.1.0"
description = "$(echo "$program" | sed -r 's/(^|-)(\w)/\U\2/g') program for FreelanceShield"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "$LIB_NAME"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.31.0"
EOF
      
      # Create src directory and lib.rs if they don't exist
      mkdir -p "programs/$program/src"
      if [ ! -f "programs/$program/src/lib.rs" ]; then
        cat > "programs/$program/src/lib.rs" << EOF
use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod $LIB_NAME {
    use super::*;
    
    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
EOF
      fi
      
      echo -e "${GREEN}✓ Created Cargo.toml and basic structure for $program${NC}"
    else
      echo -e "${GREEN}✓ Cargo.toml exists for $program${NC}"
      
      # Update existing Cargo.toml to remove solana-program dependency and update anchor-lang version
      sed -i '/solana-program/d' "$CARGO_PATH"
      sed -i 's/anchor-lang = "0.28.0"/anchor-lang = "0.31.0"/' "$CARGO_PATH"
      echo -e "${YELLOW}  - Updated to use anchor-lang 0.31.0 and removed solana-program dependency${NC}"
    fi
  done
  
  echo -e "${GREEN}✓ All program Cargo.toml files checked and created if needed${NC}"
}

# Check and create necessary Cargo.toml files
check_and_create_cargo_files

# Update program IDs in Cargo.toml files
echo -e "\n${BOLD}Updating program ids...${NC}"
anchor keys sync

# Build and deploy
echo -e "\n${BOLD}Building Anchor programs...${NC}"
anchor build

echo -e "\n${BOLD}Deploying to Solana...${NC}"
anchor deploy

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

echo -e "\n${BOLD}${GREEN}All done! Your FreelanceShield contracts are now deployed.${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Update program IDs in src/lib/solana/constants.ts"
echo -e "2. Set USE_MOCK_DATA = false in src/lib/solana/hooks/useRiskPoolData.ts"
echo -e "3. Test your frontend with the deployed contracts"
