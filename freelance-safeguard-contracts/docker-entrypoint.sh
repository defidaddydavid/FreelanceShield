#!/bin/bash
set -e

# Function to check if a command exists and create compatibility symlinks if needed
ensure_command() {
  local cmd=$1
  local agave_cmd=$(echo $cmd | sed 's/solana/agave/')
  
  # Check if the command exists
  if ! command -v $cmd &> /dev/null; then
    if command -v $agave_cmd &> /dev/null; then
      echo "Creating compatibility symlink for $agave_cmd -> $cmd"
      ln -sf $(which $agave_cmd) /usr/local/bin/$cmd
    else
      echo "Warning: Neither $cmd nor $agave_cmd found"
    fi
  fi
}

# Ensure backward compatibility with renamed commands
ensure_command "solana"
ensure_command "solana-keygen"
ensure_command "solana-validator"
ensure_command "solana-test-validator"

# Function to check if a keypair exists and create it if it doesn't
setup_keypair() {
  if [ ! -f "/app/keypairs/deploy-keypair.json" ]; then
    echo "Creating new deploy keypair..."
    solana-keygen new --no-bip39-passphrase -o /app/keypairs/deploy-keypair.json
    
    # Fund the keypair on devnet
    PUBKEY=$(solana-keygen pubkey /app/keypairs/deploy-keypair.json)
    echo "Requesting airdrop for new keypair: $PUBKEY"
    solana airdrop 2 $PUBKEY --url devnet
    sleep 2
    solana airdrop 2 $PUBKEY --url devnet
  else
    echo "Using existing deploy keypair"
  fi
  
  # Copy keypair to the expected location
  cp /app/keypairs/deploy-keypair.json /app/deploy-keypair.json
}

# Function to build all programs
build_all_programs() {
  echo "Building all Anchor programs..."
  anchor build
}

# Function to build a specific program
build_program() {
  local program_name=$1
  echo "Building program: $program_name"
  cd /app/programs/$program_name
  cargo build-bpf --manifest-path Cargo.toml
  mkdir -p /app/target/deploy
  cp /app/target/deploy/$program_name.so /app/target/deploy/
}

# Function to deploy a specific program
deploy_program() {
  local program_name=$1
  local program_id=$2
  
  echo "Deploying program: $program_name with ID: $program_id"
  solana program deploy /app/target/deploy/$program_name.so \
    --keypair /app/deploy-keypair.json \
    --url ${SOLANA_URL:-https://api.devnet.solana.com} \
    --program-id $program_id
    
  echo "Updating IDL for $program_name..."
  anchor idl init \
    --filepath /app/target/idl/$program_name.json \
    $program_id \
    --provider.cluster ${SOLANA_URL:-devnet} \
    --provider.wallet /app/deploy-keypair.json
}

# Function to extract program IDs from Anchor.toml
extract_program_ids() {
  echo "Extracting program IDs from Anchor.toml..."
  grep -A 20 "\[programs.devnet\]" /app/Anchor.toml | grep -v "\[programs.devnet\]" | grep -v "^\[" | grep "=" | sed 's/ *= */=/' > /tmp/program_ids.txt
}

# Function to generate IDL files for frontend
generate_idl_files() {
  echo "Generating IDL files for frontend integration..."
  mkdir -p /app/idl
  
  # Copy all IDL files to a directory that can be mounted to the frontend
  cp /app/target/idl/*.json /app/idl/
  
  # Generate TypeScript types from IDL
  for idl_file in /app/idl/*.json; do
    program_name=$(basename "$idl_file" .json)
    echo "Generating TypeScript types for $program_name..."
    anchor client typescript --target web --idl /app/idl/$program_name.json --out /app/idl/$program_name.ts
  done
}

# Function to check for Agave compatibility issues
check_agave_compatibility() {
  echo "Checking for Agave compatibility issues..."
  
  # Check for deprecated RPC endpoints in code
  echo "Checking for deprecated RPC endpoints..."
  DEPRECATED_ENDPOINTS=("getStakeActivation" "simulateTransaction")
  
  for endpoint in "${DEPRECATED_ENDPOINTS[@]}"; do
    if grep -r "$endpoint" --include="*.ts" --include="*.js" /app; then
      echo "WARNING: Found usage of deprecated RPC endpoint: $endpoint"
      echo "This endpoint will be removed in Agave v2.0. Please update your code."
    fi
  done
  
  # Check for solana- crates that will be renamed (without trying to install them)
  echo "Checking for solana- crates that will be renamed in Agave v2.0..."
  RENAMED_CRATES=("solana-sdk" "solana-program" "solana-client" "solana-cli-config")
  
  for crate in "${RENAMED_CRATES[@]}"; do
    if grep -r "^$crate =" --include="Cargo.toml" /app; then
      echo "WARNING: Found usage of $crate which will be renamed to agave-${crate#solana-} in Agave v2.0."
      echo "Consider updating your dependencies or using compatibility layers."
    fi
  done
}

# Main execution logic
case "$1" in
  build)
    setup_keypair
    if [ "$2" = "all" ]; then
      build_all_programs
    else
      build_program "$2"
    fi
    ;;
    
  deploy)
    setup_keypair
    if [ "$2" = "all" ]; then
      extract_program_ids
      while IFS='=' read -r program_name program_id; do
        program_name=$(echo $program_name | tr -d ' ')
        program_id=$(echo $program_id | tr -d ' "')
        deploy_program "$program_name" "$program_id"
      done < /tmp/program_ids.txt
    else
      program_id=$(grep "$2" /app/Anchor.toml | grep "=" | sed 's/.*= *"\(.*\)".*/\1/')
      deploy_program "$2" "$program_id"
    fi
    ;;
    
  generate-idl)
    generate_idl_files
    ;;
    
  check-compatibility)
    check_agave_compatibility
    ;;
    
  bash)
    exec bash
    ;;
    
  *)
    setup_keypair
    exec "$@"
    ;;
esac
