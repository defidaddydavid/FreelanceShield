# FreelanceShield Integration Guide

This guide explains how to deploy the FreelanceShield smart contracts and integrate them with your frontend application, focusing on Privy authentication and Ethos reputation scoring.

## Overview

FreelanceShield uses:
- **Solana** for blockchain infrastructure
- **Privy** for authentication and wallet management
- **Ethos Network** for reputation scoring

## Quick Start

For a complete deployment and integration:

```bash
# Make scripts executable
chmod +x scripts/setup-frontend-integration.sh
chmod +x docker-entrypoint.sh

# Deploy contracts and set up frontend integration
docker-compose -f docker-compose.integration.yml up deploy-and-integrate

# Run the frontend with proper environment variables
docker-compose -f docker-compose.integration.yml up test-frontend
```

## Step-by-Step Integration

### 1. Deploy Smart Contracts

```bash
# Build all contracts
docker-compose run build-contracts

# Deploy to Solana devnet
docker-compose run deploy-contracts

# Generate IDL files
docker-compose run generate-idl
```

### 2. Set Up Frontend Integration

```bash
# Run the integration script
./scripts/setup-frontend-integration.sh --frontend-dir ../freelance-safeguard
```

This script:
- Copies IDL files to your frontend
- Updates contract addresses
- Checks Privy and Ethos configuration
- Verifies wallet adapter compatibility

### 3. Configure Environment Variables

In your frontend's `.env.local` file:

```
# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id

# Ethos Reputation
NEXT_PUBLIC_USE_ETHOS_REPUTATION=true
NEXT_PUBLIC_ETHOS_API_KEY=your-ethos-api-key

# Solana Network
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

### 4. Run Your Frontend

```bash
cd ../freelance-safeguard
yarn dev
```

## Integration Components

### Privy Integration

FreelanceShield uses Privy for authentication and wallet management:

1. **Authentication Flow**:
   - Users authenticate with Privy (social login, email, etc.)
   - Privy creates or connects to a Solana wallet
   - The wallet is used for smart contract interactions

2. **Key Components**:
   - `UnifiedWalletService.ts`: Connects Privy wallets to Solana
   - `TransactionContext.tsx`: Manages transaction signing with Privy
   - `wallet-adapter-compat`: Compatibility layer for Anchor

### Ethos Reputation Integration

FreelanceShield uses Ethos Network for reputation scoring:

1. **Reputation Flow**:
   - User wallet addresses are converted to Ethos userKey format
   - Reputation scores are fetched from Ethos API
   - Scores are used for insurance premium calculations

2. **Key Components**:
   - `ethosService.ts`: API client for Ethos endpoints
   - `useEthosReputation.ts`: Compatibility layer
   - `featureFlags.ts`: Controls gradual rollout
   - `useReputationSystem.ts`: Unified hook for reputation

## Testing the Integration

To verify the integration is working:

1. **Authentication Test**:
   - Open the frontend application
   - Sign in with Privy
   - Verify wallet connection in the UI

2. **Smart Contract Interaction Test**:
   - Try staking tokens or creating a policy
   - Check transaction confirmation
   - Verify state changes on-chain

3. **Reputation Test**:
   - Navigate to the reputation page
   - Check if Ethos reputation score is displayed
   - Verify score components and history

## Troubleshooting

### Privy Issues

- **Wallet Not Connected**: Ensure Privy App ID is correct and the user has completed authentication
- **Transaction Signing Fails**: Check TransactionContext implementation
- **Missing Wallet Methods**: Verify wallet-adapter-compat is properly imported

### Ethos Issues

- **No Reputation Score**: Check NEXT_PUBLIC_USE_ETHOS_REPUTATION is true
- **API Errors**: Verify NEXT_PUBLIC_ETHOS_API_KEY is correct
- **Wrong Score Format**: Ensure wallet addresses are correctly formatted for Ethos

### Smart Contract Issues

- **Contract Not Found**: Verify program IDs in types.ts match Anchor.toml
- **IDL Missing**: Check that IDL files are correctly copied to frontend
- **Transaction Errors**: Ensure contract accounts are correctly structured

## Next Steps

Once integration is complete:

1. **User Testing**: Have team members test the complete flow
2. **Performance Optimization**: Monitor and optimize API calls
3. **Error Handling**: Improve error messages and recovery
4. **Documentation**: Update user documentation with new features

For more detailed information, see the [Docker Deployment Guide](./DOCKER_DEPLOYMENT.md).
