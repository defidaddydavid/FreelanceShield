
#!/bin/bash
# Auto-fix Cargo.toml [dependencies] for Anchor/Solana workspace alignment
set -e

PROGRAMS_DIR="$(dirname "$0")/programs"

cat <<'EODEPS' > /tmp/deps_block.tmp
anchor-lang = { workspace = true }
anchor-spl = { workspace = true }
thiserror = { workspace = true }
zeroize = { workspace = true }
borsh = { workspace = true }
EODEPS

find "$PROGRAMS_DIR" -maxdepth 2 -name Cargo.toml | while read -r file; do
  # Remove old anchor/solana/spl/zeroize/thiserror/borh deps from [dependencies] section
  awk '
    BEGIN {in_dep=0}
    /^\[dependencies\]/ {print; in_dep=1; next}
    /^\[.*\]/ {in_dep=0}
    in_dep && /^(anchor-lang|anchor-spl|solana-|spl-|zeroize|thiserror|borsh)[[:space:]]*=|^zeroize|^thiserror|^borsh/ {next}
    {print}
  ' "$file" > "$file.tmp"

  # Insert the canonical deps block after [dependencies]
  awk 'BEGIN{added=0} /^\[dependencies\]/{print; if (!added) {while ((getline line < "/tmp/deps_block.tmp") > 0) print line; added=1; next}} {print}' "$file.tmp" > "$file"
  rm "$file.tmp"
  echo "Fixed $file"
done
rm /tmp/deps_block.tmp

echo "All relevant Cargo.toml files have been updated."
