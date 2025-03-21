#!/bin/bash
# FreelanceShield WSL Setup Script
# This script helps set up the environment for deploying FreelanceShield contracts

set -e # Exit on error

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BOLD}${BLUE}FreelanceShield WSL Setup Script${NC}"
echo -e "${YELLOW}This script will help you set up the environment for deploying FreelanceShield contracts${NC}\n"

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

# Install project dependencies
echo -e "\n${BOLD}Installing project dependencies...${NC}"
npm install

# Make deployment scripts executable
echo -e "\n${BOLD}Making deployment scripts executable...${NC}"
chmod +x wsl-deploy.sh
chmod +x deploy.sh

echo -e "\n${GREEN}${BOLD}Setup completed!${NC}"
echo -e "${YELLOW}You can now run ./wsl-deploy.sh to deploy your contracts${NC}"
