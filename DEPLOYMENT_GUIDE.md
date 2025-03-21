# FreelanceShield Smart Contract Deployment Guide

This guide outlines the steps required to deploy the FreelanceShield smart contracts to Solana devnet and connect your frontend application to them.

## Prerequisites

- Solana CLI
- Anchor Framework
- Node.js and npm/yarn
- A funded Solana devnet wallet

## Setup Steps

### 1. Prepare Your Development Environment

```bash
# Install Solana CLI (if not already installed)
sh -c "$(curl -sSfL https://release.solana.com/v1.16.14/install)"

# Install Anchor (if not already installed)
npm install -g @coral-xyz/anchor-cli
```

### 2. Deploy Using Linux/WSL Environment (Recommended)

Since Windows deployment has some challenges, it's recommended to use WSL or a Linux environment:

```bash
# Navigate to your project directory in WSL
cd /mnt/c/Users/User/OneDrive\ -\ UvA/Documents/FreeLanceShield/freelance-safeguard-contracts

# Make the deployment script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

The script will:
1. Check for required tools
2. Create a deployment wallet if needed
3. Configure Solana for devnet
4. Airdrop SOL if the balance is low
5. Build and deploy the programs

### 3. Manual Deployment Steps (Alternative)

If you prefer to deploy manually or the script encounters issues:

```bash
# Set Solana to use devnet
solana config set --url devnet

# Create a new keypair if you don't have one
solana-keygen new --no-bip39-passphrase -o devnet-deploy.json

# Configure Solana to use your keypair
solana config set --keypair devnet-deploy.json

# Check your balance
solana balance

# Airdrop SOL if needed
solana airdrop 2

# Build the programs
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### 4. Update Frontend Configuration

After successful deployment, you need to update your frontend:

1. Note the deployed program IDs from the Anchor.toml file
2. Update the program IDs in `src/lib/solana/constants.ts`
3. Set `USE_MOCK_DATA = false` in `src/lib/solana/hooks/useRiskPoolData.ts`
4. Implement the account data deserialization in the `fetchRiskPoolData` function

```typescript
// Example of updating program IDs in constants.ts
export const INSURANCE_PROGRAM_ID = new PublicKey('your_new_program_id_here');
export const RISK_POOL_PROGRAM_ID = new PublicKey('your_new_program_id_here');
export const CLAIMS_PROCESSOR_PROGRAM_ID = new PublicKey('your_new_program_id_here');
```

## Troubleshooting

### Airdrop Rate Limiting

If you encounter airdrop rate limiting on devnet:
1. Use a different wallet
2. Wait 24 hours before trying again
3. Consider using a local validator for testing:

```bash
# Start a local validator
solana-test-validator

# Configure Solana to use localhost
solana config set --url localhost
```

### Anchor Build Issues

If Anchor build fails:
1. Ensure Rust is properly installed
2. Check for syntax errors in your Rust code
3. Make sure your Anchor.toml is correctly configured

## Testing After Deployment

1. Run the frontend with real blockchain integration:
```bash
cd ../freelance-safeguard
npm run dev
```

2. Connect your wallet and test:
   - Policy creation
   - Premium payments
   - Risk pool metrics display
   - Claim submission

## Monitoring

Monitor your deployed programs using Solana Explorer:
https://explorer.solana.com/?cluster=devnet

Enter your program ID to view all transactions and account data.
