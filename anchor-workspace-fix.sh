#!/bin/bash
# FreelanceShield Anchor Workspace Fix Script

echo "===== Fixing Anchor Workspace for FreelanceShield ====="

# Navigate to the contracts directory
cd /mnt/c/Users/User/OneDrive\ -\ UvA/Documents/FreeLanceShield/freelance-safeguard-contracts

# Check if Anchor.toml exists
if [ -f "Anchor.toml" ]; then
    echo "Anchor.toml exists, making a backup..."
    cp Anchor.toml Anchor.toml.backup
fi

# Create a proper Anchor.toml file
echo "Creating a proper Anchor.toml file..."
cat > Anchor.toml << 'EOL'
[features]
seeds = false
skip-lint = false

[programs.devnet]
claims_processor = "G68SRT1pHmagT9xiM6oFe4pqZE2SmKuLGVY8WZX29NW4"
dao_governance = "EGfjaXd2EtVwUk92tFRGhZJammxM7sJ3vyrmZ4eafHFY"
escrow_program = "DxrfCm3YYBdAkeUBz64yvYKGANZhvhRqpxCa8ghpHe3z"
insurance_program = "2vFoxWTSRERwtcfwEb6Zgm2iWS3ewU1Y94K224Gw7CJm"
risk_pool_program = "HC1TQHR6kVqtq48UbTYGwHwHTUYom9W3ovNVgjPgNcFg"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "./devnet-deploy.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
EOL

# Check if we have a wallet file
if [ ! -f "devnet-deploy.json" ]; then
    echo "Creating a new deployment wallet..."
    solana-keygen new --no-bip39-passphrase -o devnet-deploy.json
    
    # Set the wallet as default
    echo "Setting the wallet as default..."
    solana config set --keypair ./devnet-deploy.json
    
    # Get wallet address
    WALLET_ADDRESS=$(solana address)
    echo "Your wallet address is: $WALLET_ADDRESS"
    echo "Please fund this wallet at https://solfaucet.com/"
else
    echo "Using existing wallet file: devnet-deploy.json"
    solana config set --keypair ./devnet-deploy.json
fi

# Configure Solana for devnet
echo "Configuring Solana for devnet..."
solana config set --url devnet

# Check wallet balance
BALANCE=$(solana balance)
echo "Current wallet balance: $BALANCE"

echo "===== Workspace Fix Complete ====="
echo "You can now run the following commands:"
echo "1. anchor build"
echo "2. anchor deploy --provider.cluster devnet"
echo ""
echo "Make sure you have enough SOL in your wallet for deployment!"
