#!/bin/bash
# Downgrade the specific packages causing issues
cargo update -p num_enum@0.7.3 --precise 0.5.7
cargo update -p num_enum_derive@0.7.3 --precise 0.5.7

# Create a .cargo/config.toml file to force the use of the system Rust
mkdir -p .cargo
cat > .cargo/config.toml << EOF
[build]
rustc = "rustc"
rustdoc = "rustdoc"
EOF

# Create a rust-toolchain.toml file to force Rust 1.70.0
cat > rust-toolchain.toml << EOF
[toolchain]
channel = "1.70.0"
components = ["rustfmt", "clippy"]
EOF

# Remove Cargo.lock and regenerate it
rm -f Cargo.lock
cargo generate-lockfile

# Try building the project
echo "Attempting to build the project..."
anchor build
