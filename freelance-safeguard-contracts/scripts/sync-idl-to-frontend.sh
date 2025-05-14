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

# Ensure the IDL directory exists in the frontend project
mkdir -p "$IDL_OUTPUT_DIR"

# Copy IDL files to the frontend
echo "Copying IDL files to frontend..."
cp -r "$CONTRACTS_DIR/idl/"* "$IDL_OUTPUT_DIR/"

# Update the contract addresses in the frontend
echo "Updating contract addresses in the frontend..."
PROGRAM_IDS_FILE="$FRONTEND_DIR/src/lib/solana/contracts/types.ts"

# Extract program IDs from Anchor.toml
grep -A 20 "\[programs.devnet\]" "$CONTRACTS_DIR/Anchor.toml" | grep -v "\[programs.devnet\]" | grep -v "^\[" | grep "=" > /tmp/program_ids.txt

# Generate TypeScript code for program IDs
echo "// Auto-generated from Anchor.toml - DO NOT EDIT MANUALLY" > /tmp/program_ids.ts
echo "export const PROGRAM_IDS = {" >> /tmp/program_ids.ts

while IFS='=' read -r program_name program_id; do
    program_name=$(echo $program_name | tr -d ' ' | tr '-' '_' | tr '[:lower:]' '[:upper:]')
    program_id=$(echo $program_id | tr -d ' "')
    echo "  $program_name: new PublicKey(\"$program_id\")," >> /tmp/program_ids.ts
done < /tmp/program_ids.txt

echo "};" >> /tmp/program_ids.ts

# Check if the file exists and update it
if [ -f "$PROGRAM_IDS_FILE" ]; then
    # Add import statement if needed
    if ! grep -q "import { PublicKey } from '@solana/web3.js';" /tmp/program_ids.ts; then
        sed -i '1i import { PublicKey } from "@solana/web3.js";' /tmp/program_ids.ts
    fi
    
    # Update the file
    cp /tmp/program_ids.ts "$PROGRAM_IDS_FILE"
    echo "Updated program IDs in $PROGRAM_IDS_FILE"
else
    # Create the file with import
    echo 'import { PublicKey } from "@solana/web3.js";' > "$PROGRAM_IDS_FILE"
    cat /tmp/program_ids.ts >> "$PROGRAM_IDS_FILE"
    echo "Created program IDs file at $PROGRAM_IDS_FILE"
fi

echo "IDL synchronization complete!"
