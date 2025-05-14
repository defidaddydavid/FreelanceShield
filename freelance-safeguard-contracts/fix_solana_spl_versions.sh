#!/bin/bash
# Efficiently fix all program-level Cargo.toml files to use workspace versions for Solana/SPL crates
set -e

PROGRAMS_DIR="$(dirname "$0")/programs"

# List of crates to fix
CRATES=(
  "spl-associated-token-account"
  "spl-token"
  "solana-program"
  "solana-sdk"
  "solana-client"
  "anchor-spl"
  "anchor-lang"
)

find "$PROGRAMS_DIR" -maxdepth 2 -name Cargo.toml | while read -r file; do
  for crate in "${CRATES[@]}"; do
    # Remove any direct version for these crates
    sed -i.bak "/^$crate[[:space:]]*=.*$/d" "$file"
    # Remove commented out versions too
    sed -i.bak "/^#.*$crate[[:space:]]*=.*$/d" "$file"
    # Ensure the dependency is present as workspace = true if used anywhere in the file
    if grep -q "[[:space:]]$crate" "$file" || grep -q "[\"']$crate[\"']" "$file"; then
      if ! grep -q "^$crate[[:space:]]*=[[:space:]]*{[[:space:]]*workspace[[:space:]]*=[[:space:]]*true[[:space:]]*}" "$file"; then
        # Insert after [dependencies] if not already present
        awk -v c="$crate" 'BEGIN{added=0} /^\[dependencies\]/{print; if (!added) {print c " = { workspace = true }"; added=1; next}} {print}' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
      fi
    fi
    rm -f "$file.bak"
  done
  echo "Fixed $file"
done

echo "All Solana/SPL/Anchor dependencies now use workspace versions."
