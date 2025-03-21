#!/bin/bash
# Install essential components for Solana/Anchor development

# Update package lists
sudo apt-get update

# Install basic dependencies
sudo apt-get install -y curl build-essential pkg-config libssl-dev libudev-dev git

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.16.14/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc

# Configure Solana for devnet
solana config set --url devnet

# Create keypair if it doesn't exist
if [ ! -f "$HOME/.config/solana/devnet-deploy.json" ]; then
    solana-keygen new --no-bip39-passphrase -o "$HOME/.config/solana/devnet-deploy.json"
fi

# Set keypair
solana config set --keypair "$HOME/.config/solana/devnet-deploy.json"

# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install 0.28.0
avm use 0.28.0

# Create rust-toolchain.toml
cat > rust-toolchain.toml << EOF
[toolchain]
channel = "1.70.0"
components = ["rustfmt", "clippy"]
EOF

echo "Installation complete!"
