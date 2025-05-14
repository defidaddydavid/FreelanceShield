#!/bin/bash
set -e

# Default paths
CONTRACTS_DIR=$(pwd)
FRONTEND_DIR="../freelance-safeguard"
IDL_OUTPUT_DIR="$FRONTEND_DIR/src/lib/solana/idl"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --frontend-dir) FRONTEND_DIR="$2"; shift ;;
        --output-dir) IDL_OUTPUT_DIR="$2"; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo "Setting up FreelanceShield frontend integration with Privy and Ethos..."

# Ensure the IDL directory exists in the frontend project
mkdir -p "$IDL_OUTPUT_DIR"

# Step 1: Copy IDL files to the frontend
echo "Copying IDL files to frontend..."
cp -r "$CONTRACTS_DIR/idl/"* "$IDL_OUTPUT_DIR/"

# Step 2: Update the contract addresses in the frontend
echo "Updating contract addresses in the frontend..."
PROGRAM_IDS_FILE="$FRONTEND_DIR/src/lib/solana/contracts/types.ts"

# Extract program IDs from Anchor.toml
grep -A 20 "\[programs.devnet\]" "$CONTRACTS_DIR/Anchor.toml" | grep -v "\[programs.devnet\]" | grep -v "^\[" | grep "=" > /tmp/program_ids.txt

# Generate TypeScript code for program IDs
echo "// Auto-generated from Anchor.toml - DO NOT EDIT MANUALLY" > /tmp/program_ids.ts
echo "import { PublicKey } from '@solana/web3.js';" >> /tmp/program_ids.ts
echo "" >> /tmp/program_ids.ts
echo "export const PROGRAM_IDS = {" >> /tmp/program_ids.ts

while IFS='=' read -r program_name program_id; do
    program_name=$(echo $program_name | tr -d ' ' | tr '-' '_' | tr '[:lower:]' '[:upper:]')
    program_id=$(echo $program_id | tr -d ' "')
    echo "  $program_name: new PublicKey(\"$program_id\")," >> /tmp/program_ids.ts
done < /tmp/program_ids.txt

echo "};" >> /tmp/program_ids.ts

# Update the file
if [ -f "$PROGRAM_IDS_FILE" ]; then
    cp /tmp/program_ids.ts "$PROGRAM_IDS_FILE"
    echo "Updated program IDs in $PROGRAM_IDS_FILE"
else
    mkdir -p "$(dirname "$PROGRAM_IDS_FILE")"
    cp /tmp/program_ids.ts "$PROGRAM_IDS_FILE"
    echo "Created program IDs file at $PROGRAM_IDS_FILE"
fi

# Step 3: Check for Privy integration
PRIVY_CONFIG_FILE="$FRONTEND_DIR/.env.local"
if [ ! -f "$PRIVY_CONFIG_FILE" ] || ! grep -q "NEXT_PUBLIC_PRIVY_APP_ID" "$PRIVY_CONFIG_FILE"; then
    echo "Warning: Privy configuration not found in $PRIVY_CONFIG_FILE"
    echo "Please ensure you have set NEXT_PUBLIC_PRIVY_APP_ID in your environment variables"
    
    # Create example .env.local if it doesn't exist
    if [ ! -f "$PRIVY_CONFIG_FILE" ]; then
        echo "# Privy Authentication" > "$PRIVY_CONFIG_FILE"
        echo "NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id" >> "$PRIVY_CONFIG_FILE"
        echo "# Ethos Reputation" >> "$PRIVY_CONFIG_FILE"
        echo "NEXT_PUBLIC_USE_ETHOS_REPUTATION=true" >> "$PRIVY_CONFIG_FILE"
        echo "NEXT_PUBLIC_ETHOS_API_KEY=your-ethos-api-key" >> "$PRIVY_CONFIG_FILE"
        echo "Created example $PRIVY_CONFIG_FILE - please update with your actual keys"
    fi
fi

# Step 4: Check for Ethos integration
ETHOS_FEATURE_FLAG_FILE="$FRONTEND_DIR/src/lib/featureFlags.ts"
if [ -f "$ETHOS_FEATURE_FLAG_FILE" ]; then
    # Ensure Ethos reputation is enabled
    if ! grep -q "USE_ETHOS_REPUTATION" "$ETHOS_FEATURE_FLAG_FILE"; then
        echo "Warning: Ethos reputation feature flag not found in $ETHOS_FEATURE_FLAG_FILE"
    else
        echo "Ethos reputation feature flag found in $ETHOS_FEATURE_FLAG_FILE"
    fi
else
    echo "Warning: Feature flags file not found at $ETHOS_FEATURE_FLAG_FILE"
fi

# Step 5: Verify wallet adapter compatibility layer
WALLET_ADAPTER_DIR="$FRONTEND_DIR/src/lib/solana/wallet-adapter-compat"
if [ -d "$WALLET_ADAPTER_DIR" ]; then
    echo "Found wallet adapter compatibility layer at $WALLET_ADAPTER_DIR"
else
    echo "Warning: Wallet adapter compatibility layer not found at $WALLET_ADAPTER_DIR"
    echo "This is needed for Privy integration with Solana contracts"
fi

# Step 6: Check for TransactionContext
TRANSACTION_CONTEXT_FILE="$FRONTEND_DIR/src/contexts/TransactionContext.tsx"
if [ -f "$TRANSACTION_CONTEXT_FILE" ]; then
    echo "Found TransactionContext at $TRANSACTION_CONTEXT_FILE"
    # Check if it's using Privy
    if grep -q "usePrivy" "$TRANSACTION_CONTEXT_FILE"; then
        echo "TransactionContext is properly configured to use Privy"
    else
        echo "Warning: TransactionContext may not be properly configured to use Privy"
    fi
else
    echo "Warning: TransactionContext not found at $TRANSACTION_CONTEXT_FILE"
fi

echo "Frontend integration setup complete!"
echo ""
echo "Next steps:"
echo "1. Ensure your Privy App ID is correctly set in .env.local"
echo "2. Verify Ethos feature flag is enabled for reputation scoring"
echo "3. Run your frontend application to test the integration"
echo ""
echo "To test the integration, start your frontend with:"
echo "cd $FRONTEND_DIR && yarn dev"
