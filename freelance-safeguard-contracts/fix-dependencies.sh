#!/bin/bash

# Set consistent dependency versions
PROC_MACRO2_VERSION="1.0.89"  # Updated to meet solana-sdk-macro requirements
SYN_VERSION="2.0.86"
THISERROR_VERSION="1.0.66"
QUOTE_VERSION="1.0.35"
SOLANA_PROGRAM_VERSION="1.16.0"  # Using a specific version for all solana-program dependencies

# Update workspace Cargo.toml
echo "Updating workspace Cargo.toml..."
sed -i.bak -E "s/proc-macro2 = \"=.*\"/proc-macro2 = \"=${PROC_MACRO2_VERSION}\"/" Cargo.toml
sed -i.bak -E "s/syn = \{ version = \"=.*\", features/syn = \{ version = \"=${SYN_VERSION}\", features/" Cargo.toml
sed -i.bak -E "s/thiserror = \"=.*\"/thiserror = \"=${THISERROR_VERSION}\"/" Cargo.toml
sed -i.bak -E "s/quote = \"=.*\"/quote = \"=${QUOTE_VERSION}\"/" Cargo.toml
sed -i.bak -E "s/solana-program = \"=.*\"/solana-program = \"=${SOLANA_PROGRAM_VERSION}\"/" Cargo.toml

# Find all program Cargo.toml files
CARGO_FILES=$(find ./programs -name "Cargo.toml")

# Update each Cargo.toml file
for file in $CARGO_FILES; do
  echo "Updating $file..."
  
  # Check if the file contains direct dependencies (not workspace inheritance)
  if grep -q "proc-macro2 =" "$file"; then
    sed -i.bak -E "s/proc-macro2 = \".*\"/proc-macro2 = \"${PROC_MACRO2_VERSION}\"/" "$file"
  fi
  
  if grep -q "syn =" "$file" || grep -q "syn = {" "$file"; then
    sed -i.bak -E "s/syn = \".*\"/syn = \"${SYN_VERSION}\"/" "$file"
    sed -i.bak -E "s/syn = \{.*version = \".*\"/syn = \{version = \"${SYN_VERSION}\"/" "$file"
  fi
  
  if grep -q "thiserror =" "$file"; then
    sed -i.bak -E "s/thiserror = \".*\"/thiserror = \"${THISERROR_VERSION}\"/" "$file"
  fi
  
  if grep -q "quote =" "$file"; then
    sed -i.bak -E "s/quote = \".*\"/quote = \"${QUOTE_VERSION}\"/" "$file"
  fi
  
  if grep -q "solana-program =" "$file"; then
    sed -i.bak -E "s/solana-program = \".*\"/solana-program = \"${SOLANA_PROGRAM_VERSION}\"/" "$file"
  fi
done

# Update anchor-spl dependency to use a specific version of solana-program
echo "Updating anchor-spl dependency to use a specific version of solana-program..."
mkdir -p .cargo
cat > .cargo/config.toml << EOF
[patch.crates-io]
anchor-spl = { git = "https://github.com/coral-xyz/anchor.git", tag = "v0.31.0" }
solana-program = { version = "${SOLANA_PROGRAM_VERSION}" }
EOF

# Clean up backup files
find . -name "*.bak" -delete

echo "Dependency versions updated successfully!"
echo "proc-macro2: ${PROC_MACRO2_VERSION}"
echo "syn: ${SYN_VERSION}"
echo "thiserror: ${THISERROR_VERSION}"
echo "quote: ${QUOTE_VERSION}"
echo "solana-program: ${SOLANA_PROGRAM_VERSION}"
