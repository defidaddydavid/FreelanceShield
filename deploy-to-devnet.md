# FreelanceShield Deployment Guide

This guide will help you deploy the FreelanceShield smart contracts to Solana devnet and update your frontend to use real Solana connections.

## Prerequisites

1. Windows Subsystem for Linux (WSL) installed
2. Solana CLI tools installed in WSL
3. Anchor framework installed in WSL
4. Rust toolchain installed in WSL

## Deployment Steps

### 1. Open WSL Terminal

Open a WSL terminal by running:
```
wsl
```

### 2. Navigate to the Contracts Directory

```bash
cd /mnt/c/Users/User/OneDrive\ -\ UvA/Documents/FreeLanceShield/freelance-safeguard-contracts
```

### 3. Run the Deployment Script

```bash
bash wsl-deploy.sh
```

This script will:
- Configure Solana to use devnet
- Create a deployment wallet if needed
- Airdrop SOL for deployment fees
- Build and deploy all programs
- Display the deployed program IDs

### 4. Update Frontend Constants

After deployment, copy the program IDs from the output and update the constants file:

```typescript
// src/lib/solana/constants.ts
export const INSURANCE_PROGRAM_ID = new PublicKey('new-program-id-here');
export const RISK_POOL_PROGRAM_ID = new PublicKey('new-program-id-here');
export const CLAIMS_PROCESSOR_PROGRAM_ID = new PublicKey('new-program-id-here');
// Update other program IDs as well
```

### 5. Test the Deployment

The deployment script offers to run a test script. Select 'y' when prompted to verify that your contracts are working correctly on devnet.

## Troubleshooting

### Insufficient SOL for Deployment

If the airdrop fails, you can manually fund your deployment wallet:

1. Get your wallet address: `solana address`
2. Use a Solana faucet: https://solfaucet.com/
3. Request devnet SOL to your wallet address

### Build Errors

If you encounter build errors:

1. Make sure Rust is up to date: `rustup update`
2. Clean the build: `anchor clean`
3. Try building again: `anchor build`

## Next Steps

After successful deployment:

1. Test the frontend with real blockchain connections
2. Verify policy creation and claim submission work correctly
3. Test the risk pool metrics calculations

Remember to always use devnet for testing before moving to mainnet.
