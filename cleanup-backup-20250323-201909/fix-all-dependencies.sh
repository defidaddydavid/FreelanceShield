#!/bin/bash
# Script to fix dependencies in all program Cargo.toml files

WORKSPACE_DIR="/mnt/c/Projects/FreelanceShield/freelance-safeguard-contracts"
cd "$WORKSPACE_DIR"

# List of all program directories
PROGRAMS=(
  "programs/claims-processor"
  "programs/dao-governance"
  "programs/escrow-program"
  "programs/insurance-program"
  "programs/reputation-program"
  "programs/risk-pool-program"
  "programs/staking-program"
  "programs/freelance-insurance"
)

echo "===== Fixing dependencies in all program Cargo.toml files ====="

for program in "${PROGRAMS[@]}"; do
  echo "Processing $program/Cargo.toml"
  
  # Check if the file exists
  if [ -f "$program/Cargo.toml" ]; then
    # Add the dependency overrides if they don't already exist
    if ! grep -q "solana-zk-token-sdk" "$program/Cargo.toml"; then
      echo -e "\n# Direct dependency overrides to resolve conflicts\nsolana-zk-token-sdk = { version = \"1.18.26\" }\nspl-token-2022 = { version = \"2.0.0\", features = [\"no-entrypoint\"] }" >> "$program/Cargo.toml"
      echo "  Added dependency overrides to $program/Cargo.toml"
    else
      echo "  Dependency overrides already exist in $program/Cargo.toml"
    fi
    
    # Update anchor-spl to include token-2022 feature if needed
    sed -i 's/anchor-spl = { workspace = true }/anchor-spl = { workspace = true, features = ["token-2022"] }/g' "$program/Cargo.toml"
    echo "  Updated anchor-spl to include token-2022 feature"
  else
    echo "  WARNING: $program/Cargo.toml does not exist"
  fi
done

echo "===== Cleaning cached Git repositories ====="
rm -rf ~/.cargo/git/db/solana-program-library-*
rm -rf ~/.cargo/git/checkouts/solana-program-library-*

echo "===== Cleaning build artifacts ====="
cargo clean
rm -f Cargo.lock

echo "===== Building with fixed dependencies ====="
anchor build

echo "===== Process complete ====="
