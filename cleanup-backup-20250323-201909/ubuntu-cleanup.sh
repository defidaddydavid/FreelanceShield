#!/bin/bash
# Simple Ubuntu cleanup script for FreelanceShield development
# Focuses on freeing disk space for Solana development environments

set -e
echo "=== FreelanceShield Ubuntu Cleanup Script ==="
echo "Current disk usage:"
df -h /

# Clean APT cache (safe)
echo "Cleaning APT cache..."
sudo apt clean
sudo apt autoremove --purge -y

# Clean Rust cache (safe for Solana development)
echo "Cleaning Rust cache..."
rustup self update
rm -rf ~/.cargo/registry/cache/*
rm -rf ~/.cargo/registry/index/*
rm -rf ~/.cargo/git/checkouts/*
rm -rf ~/.cargo/git/db/*

# Clean Solana cache
echo "Cleaning Solana cache..."
rm -rf ~/.cache/solana
rm -rf ~/.local/share/solana/install/releases/*/solana-release/bin/sdk/bpf/dependencies

# Clean NPM cache
echo "Cleaning NPM cache..."
npm cache clean --force

# Clean old logs
echo "Cleaning logs..."
sudo find /var/log -type f -name "*.log" -size +10M -exec truncate -s 0 {} \;
sudo find /var/log -type f -name "*.gz" -delete

# Remove old kernels (keeps the current one)
echo "Removing old kernels..."
if ! command -v purge-old-kernels &> /dev/null; then
  sudo apt install -y byobu
fi
sudo purge-old-kernels --keep 1 -y

# Clean temporary files
echo "Cleaning temporary files..."
rm -rf ~/.cache/*
sudo rm -rf /tmp/*

# Results
echo "=== Cleanup Complete ==="
echo "Current disk usage:"
df -h /

echo "Largest directories in your home folder:"
du -h --max-depth=1 ~ | sort -hr | head -n 10
