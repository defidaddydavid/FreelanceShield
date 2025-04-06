# FreelanceShield Core Workspace

This is a minimal workspace containing the core components of FreelanceShield for initial devnet deployment. This approach resolves dependency conflicts by focusing on essential programs first.

## Programs Included

1. **Core Program** - Central coordinator and main entry point
2. **Risk Pool Program** - Manages capital reserves and risk calculations
3. **Reputation Program** - Tracks user reputation scores using Bayesian methods

## Building Instructions

Make sure you have Rust 1.81.0 and Solana CLI tools installed.

```bash
# Build all programs
cargo build

# Build individual programs
cargo build -p freelance-shield-core
cargo build -p risk-pool-program
cargo build -p reputation-program

# Build and generate IDL files with Anchor
anchor build
```

## Deployment Instructions

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet

# Verify deployment
solana program show --programs --url devnet
```

## Dependency Management

This workspace uses carefully selected dependency versions to avoid conflicts:

- Anchor 0.31.0
- Solana Program 1.17.0
- Compatible proc-macro2, quote, and syn versions

All programs use workspace dependencies to ensure consistency across the codebase.

## Next Steps

After successful devnet deployment of these core components, additional programs can be gradually added to the workspace, resolving any dependency issues one at a time.
