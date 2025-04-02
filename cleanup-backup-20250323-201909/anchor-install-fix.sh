#!/bin/bash
# FreelanceShield Anchor Installation Script

echo "===== Installing Anchor CLI for FreelanceShield ====="

# Install Solana CLI if needed
if ! command -v solana &> /dev/null; then
    echo "Installing Solana CLI..."
    sh -c "$(curl -sSfL https://release.solana.com/v1.16.14/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
    echo "Solana CLI installed successfully!"
else
    echo "Solana CLI already installed."
fi

# Install Anchor CLI using cargo (Rust package manager)
echo "Installing Anchor CLI using cargo..."
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked

echo "Configuring Solana for devnet..."
solana config set --url devnet

# Create a new wallet for deployment
echo "Creating a new deployment wallet..."
solana-keygen new --no-bip39-passphrase -o devnet-deploy.json

# Set the wallet as default
echo "Setting the wallet as default..."
solana config set --keypair devnet-deploy.json

# Get wallet address
WALLET_ADDRESS=$(solana address)
echo "Your wallet address is: $WALLET_ADDRESS"
echo "Please fund this wallet at https://solfaucet.com/"

echo "===== Installation Complete ====="
echo "Next steps:"
echo "1. Fund your wallet at https://solfaucet.com/"
echo "2. Navigate to your project directory"
echo "3. Run 'anchor build'"
echo "4. Run 'anchor deploy --provider.cluster devnet'"
