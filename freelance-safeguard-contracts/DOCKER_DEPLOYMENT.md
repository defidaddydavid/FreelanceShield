# FreelanceShield Smart Contract Deployment Guide

This guide explains how to build, deploy, and connect the FreelanceShield smart contracts to your frontend application using Docker, with proper integration for Privy authentication and Ethos reputation scoring.

## Prerequisites

- Docker and Docker Compose installed
- Solana CLI (for local testing)
- Node.js and Yarn (for frontend integration)
- Privy API keys configured in your frontend environment
- Ethos Network API access configured

## Getting Started

The Docker setup provides a consistent environment for building and deploying Solana smart contracts without worrying about dependencies or version conflicts.

### 1. Building the Smart Contracts

To build all the smart contracts:

```bash
docker-compose run build-contracts
```

This will:
- Set up a deployment keypair if one doesn't exist
- Build all Anchor programs in the project
- Output the compiled programs to the `target/deploy` directory

### 2. Deploying to Devnet

To deploy all contracts to Solana devnet:

```bash
docker-compose run deploy-contracts
```

This will:
- Deploy each program to Solana devnet using the program IDs from `Anchor.toml`
- Initialize the IDL (Interface Description Language) for each program
- Make the programs available for frontend integration

### 3. Generating IDL Files for Frontend

To generate and export the IDL files for frontend integration:

```bash
docker-compose run generate-idl
```

This creates TypeScript-compatible IDL files in the `idl` directory.

### 4. Syncing with Frontend

To sync the deployed contracts with your frontend application:

```bash
chmod +x scripts/sync-idl-to-frontend.sh
./scripts/sync-idl-to-frontend.sh --frontend-dir ../freelance-safeguard
```

This will:
- Copy all IDL files to your frontend project
- Update the contract addresses in your frontend code

## Privy Integration

FreelanceShield uses Privy for authentication and wallet management. Ensure your frontend has the following environment variables set:

```
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
```

The Privy integration works with the deployed smart contracts through:

1. **Wallet Authentication**: Privy handles wallet creation and authentication
2. **Transaction Signing**: The `TransactionContext` component uses Privy for transaction signing
3. **Wallet Service**: The `UnifiedWalletService` connects Privy wallets to Solana

## Ethos Integration for Reputation

FreelanceShield uses Ethos Network for reputation scoring. Ensure your frontend has the following environment variables set:

```
NEXT_PUBLIC_USE_ETHOS_REPUTATION=true
NEXT_PUBLIC_ETHOS_API_KEY=your-ethos-api-key
```

The Ethos integration works alongside the reputation program through:

1. **Compatibility Layer**: `useEthosReputation.ts` maintains the same interface as the original system
2. **Feature Flags**: `featureFlags.ts` controls the gradual rollout
3. **Unified Hook**: `useReputationSystem.ts` switches between systems based on feature flags

## Connecting to Frontend

The FreelanceShield frontend connects to the deployed contracts through:

1. **Contract Interfaces**: Located in `src/lib/solana/contracts/`
2. **Wallet Integration**: Using Privy through `src/lib/solana/UnifiedWalletService.ts`
3. **Transaction Handling**: Managed by `src/contexts/TransactionContext.tsx`
4. **Reputation Scoring**: Managed by Ethos Network integration

## Deploying Individual Programs

To build and deploy a specific program:

```bash
# Build a specific program
docker-compose run solana-contracts build core

# Deploy a specific program
docker-compose run solana-contracts deploy core
```

## Troubleshooting

### Keypair Issues

If you encounter issues with the keypair:

```bash
# Generate a new keypair
docker-compose run solana-contracts solana-keygen new --no-bip39-passphrase -o /app/keypairs/deploy-keypair.json

# Fund the keypair
docker-compose run solana-contracts solana airdrop 2 $(solana-keygen pubkey /app/keypairs/deploy-keypair.json) --url devnet
```

### Privy Integration Issues

If you encounter issues with Privy:

1. Verify your Privy App ID is correctly set in your environment variables
2. Check that the Privy embedded wallet is properly initialized
3. Ensure the `useWallet` hook is correctly imported from your custom hooks, not from @solana/wallet-adapter-react

### Ethos Integration Issues

If you encounter issues with Ethos:

1. Verify your Ethos API key is correctly set
2. Check that the feature flag for Ethos reputation is enabled
3. Ensure the wallet addresses are correctly formatted for Ethos (address:0x...)

## Demonstrating the Product

Once the contracts are deployed and connected to the frontend, you can demonstrate the product by:

1. Running the frontend application
2. Connecting with Privy authentication
3. Interacting with the smart contracts through the UI
4. Testing the core functionality like staking, insurance policies, and reputation scoring with Ethos

The integration with Ethos Network for reputation scoring works seamlessly with the deployed Solana contracts, while Privy provides the authentication and wallet management layer.
