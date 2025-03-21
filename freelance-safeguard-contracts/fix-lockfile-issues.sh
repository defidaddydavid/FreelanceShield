#!/bin/bash
# Script to fix Cargo.lock version compatibility issues in WSL

set -e # Exit on error

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BOLD}${BLUE}FreelanceShield Lock File Fix Script${NC}"
echo -e "${YELLOW}This script will fix Cargo.lock version compatibility issues${NC}\n"

# Ensure we're in the project directory
cd /mnt/c/Projects/FreelanceShield/freelance-safeguard-contracts

# Load environment variables
source ~/.bashrc
source ~/.cargo/env

# Backup current Cargo.lock
echo -e "${BOLD}Backing up current Cargo.lock...${NC}"
if [ -f "Cargo.lock" ]; then
    cp Cargo.lock Cargo.lock.backup.$(date +%Y%m%d%H%M%S)
    echo -e "${GREEN}✓ Cargo.lock backed up${NC}"
fi

# Remove Cargo.lock
echo -e "${BOLD}Removing current Cargo.lock...${NC}"
rm -f Cargo.lock
echo -e "${GREEN}✓ Cargo.lock removed${NC}"

# Downgrade problematic dependencies
echo -e "${BOLD}Downgrading problematic dependencies...${NC}"
cargo update -p num_enum@0.7.3 --precise 0.5.7
cargo update -p num_enum_derive@0.7.3 --precise 0.5.7
echo -e "${GREEN}✓ Dependencies downgraded${NC}"

# Create a .cargo/config.toml file to force the use of the system Rust
echo -e "${BOLD}Creating .cargo/config.toml...${NC}"
mkdir -p .cargo
cat > .cargo/config.toml << EOF
[build]
rustc = "rustc"
rustdoc = "rustdoc"
EOF
echo -e "${GREEN}✓ .cargo/config.toml created${NC}"

# Create a rust-toolchain.toml file to force Rust 1.70.0
echo -e "${BOLD}Creating rust-toolchain.toml...${NC}"
cat > rust-toolchain.toml << EOF
[toolchain]
channel = "1.70.0"
components = ["rustfmt", "clippy"]
EOF
echo -e "${GREEN}✓ rust-toolchain.toml created${NC}"

# Regenerate Cargo.lock
echo -e "${BOLD}Regenerating Cargo.lock...${NC}"
cargo generate-lockfile
echo -e "${GREEN}✓ Cargo.lock regenerated${NC}"

echo -e "\n${GREEN}${BOLD}Lock file issues fixed!${NC}"
echo -e "${YELLOW}You can now try building your project with: anchor build${NC}"
