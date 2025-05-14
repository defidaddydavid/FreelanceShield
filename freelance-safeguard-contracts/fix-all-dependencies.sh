#!/bin/bash

# This script fixes dependency conflicts by explicitly specifying all transitive dependencies
# with compatible versions across all Cargo.toml files in the project.

echo "Fixing all dependency conflicts in FreelanceShield smart contracts..."

# Step 1: Create a backup of the current state
echo "Creating backup..."
mkdir -p ./backup-$(date +%Y%m%d%H%M%S)
cp -r ./programs ./backup-$(date +%Y%m%d%H%M%S)/
cp Cargo.toml ./backup-$(date +%Y%m%d%H%M%S)/

# Step 2: Update the root Cargo.toml with specific versions for all dependencies
echo "Updating root Cargo.toml with specific versions for all dependencies..."

cat > Cargo.toml << 'EOF'
[workspace]
members = [
    "programs/*",
]
resolver = "2"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1

[workspace.dependencies]
# Core dependencies with specific versions
anchor-lang = "=0.31.0"
anchor-spl = { version = "=0.31.0", features = ["token", "associated_token"], default-features = false }
solana-program = "=1.17.0"
spl-token = { version = "=4.0.0", features = ["no-entrypoint"] }
spl-associated-token-account = "=2.2.0"

# Explicitly specify transitive dependencies with compatible versions
thiserror = "=1.0.66"  # Updated to be compatible with spl-token-confidential-transfer-proof-generation
zeroize = "=1.3.0"  # Downgraded to be compatible with curve25519-dalek
proc-macro2 = "=1.0.67"
quote = "=1.0.33"
syn = { version = "=2.0.37", features = ["full", "extra-traits"] }
subtle = "=2.5.0"
borsh = "=0.10.3"
borsh-derive = "=0.10.3"
solana-sdk = "=1.17.0"
solana-client = "=1.17.0"
solana-zk-token-sdk = "=1.17.0"
solana-logger = "=1.17.0"
solana-program-test = "=1.17.0"
solana-account-decoder = "=1.17.0"
solana-banks-client = "=1.17.0"
solana-banks-server = "=1.17.0"
solana-cli-config = "=1.17.0"
solana-cli-output = "=1.17.0"
solana-vote-program = "=1.17.0"
solana-stake-program = "=1.17.0"
solana-transaction-status = "=1.17.0"
solana-version = "=1.17.0"
solana-address-lookup-table-program = "=1.17.0"
bytemuck = "=1.14.0"
bytemuck_derive = "=1.5.0"
arrayref = "=0.3.7"
num-derive = "=0.4.1"
num-traits = "=0.2.17"
num_enum = "=0.7.1"
serde = { version = "=1.0.193", features = ["derive"] }
serde_json = "=1.0.108"
serde_bytes = "=0.11.12"
toml = "=0.8.8"
sha2 = "=0.10.8"
sha3 = "=0.10.8"
base64 = "=0.21.5"
rand = "=0.8.5"
getrandom = { version = "=0.2.11", features = ["js"] }
bs58 = "=0.5.0"
bincode = "=1.3.3"
curve25519-dalek = "=3.2.1"  # Using a version compatible with zeroize 1.3.0
lazy_static = "=1.4.0"
log = "=0.4.20"
regex = "=1.10.2"
rustversion = "=1.0.14"
static_assertions = "=1.1.0"
tokio = { version = "=1.34.0", features = ["full"] }
wasm-bindgen = "=0.2.89"
ed25519-dalek = "=1.0.1"  # Using a version compatible with curve25519-dalek 3.2.1
chrono = { version = "=0.4.31", default-features = false, features = ["alloc"] }
EOF

# Step 3: Update each program's Cargo.toml to use workspace dependencies
echo "Updating program Cargo.toml files to use workspace dependencies..."

find ./programs -name "Cargo.toml" | while read -r file; do
  echo "Processing $file..."
  
  # Extract package name and version
  pkg_name=$(grep -m 1 'name =' "$file" | cut -d '"' -f 2)
  pkg_version=$(grep -m 1 'version =' "$file" | cut -d '"' -f 2)
  
  # Create a new Cargo.toml with workspace dependencies
  {
    echo "[package]"
    echo "name = \"$pkg_name\""
    echo "version = \"$pkg_version\""
    echo "description = \"FreelanceShield smart contract\""
    echo "edition = \"2021\""
    echo ""
    echo "[lib]"
    echo "crate-type = [\"cdylib\", \"lib\"]"
    echo ""
    echo "[features]"
    echo "no-entrypoint = []"
    echo "no-idl = []"
    echo "no-log-ix-name = []"
    echo "cpi = [\"no-entrypoint\"]"
    echo "default = []"
    echo ""
    echo "[dependencies]"
    echo "anchor-lang = { workspace = true }"
    echo "anchor-spl = { workspace = true }"
    echo "solana-program = { workspace = true }"
    echo "spl-token = { workspace = true }"
    echo "spl-associated-token-account = { workspace = true }"
    echo "thiserror = { workspace = true }"
    echo "zeroize = { workspace = true }"
    echo "borsh = { workspace = true }"
  } > "$file.new"
  
  # Replace the original file with the new one
  mv "$file.new" "$file"
done

echo "Dependency conflicts fixed! Try building the core program now."
