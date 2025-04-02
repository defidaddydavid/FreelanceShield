#!/bin/bash
# EC2 Solana Setup Script for FreelanceShield
# This script sets up a Solana development environment on AWS EC2

set -e

echo "-----------------------------------------------------"
echo "Setting up Solana development environment for FreelanceShield"
echo "-----------------------------------------------------"

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install dependencies
echo "Installing system dependencies..."
sudo apt install -y git build-essential pkg-config libudev-dev libssl-dev \
    clang cmake make jq unzip curl ntp python3-pip nodejs npm

# Install Rust
echo "Installing Rust..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env
rustup component add rustfmt clippy
rustup update

# Install specific Solana CLI version (compatible with project requirements)
echo "Installing Solana CLI..."
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc

# Install Anchor (specific version to avoid dependency conflicts)
echo "Installing Anchor framework..."
npm install -g @coral-xyz/anchor-cli@0.28.0

# Setup Solana configuration
echo "Configuring Solana CLI for devnet..."
solana config set --url https://api.devnet.solana.com

# Generate a local wallet for development if it doesn't exist
if [ ! -f "$HOME/.config/solana/id.json" ]; then
    echo "Generating local Solana wallet..."
    solana-keygen new --no-bip39-passphrase -o $HOME/.config/solana/id.json
    
    # Fund the wallet from devnet (for testing)
    echo "Requesting airdrop from devnet (2 SOL)..."
    solana airdrop 2
fi

# Setup for dependency conflict resolution
echo "Setting up patch for Solana dependency conflicts..."
mkdir -p ~/freelance-shield-patches
cat > ~/freelance-shield-patches/apply-patches.sh << 'EOF'
#!/bin/bash
# Apply patches to fix dependency conflicts in Cargo.toml files

find . -name "Cargo.toml" -exec grep -l "anchor-spl" {} \; | while read -r file; do
    # Check if patch section already exists
    if ! grep -q "\[patch.crates-io\]" "$file"; then
        echo "Adding patch section to $file"
        cat >> "$file" << 'PATCH'

[patch.crates-io]
solana-program = { version = "=2.1.0" }
PATCH
    fi
done
EOF

chmod +x ~/freelance-shield-patches/apply-patches.sh

# Setup complete
echo "-----------------------------------------------------"
echo "Solana development environment setup complete"
echo "Run the following commands to verify your installation:"
echo "solana --version"
echo "anchor --version"
echo "-----------------------------------------------------"
echo "Your Solana public key: $(solana address)"
echo "Current balance: $(solana balance) SOL"
echo "-----------------------------------------------------"
