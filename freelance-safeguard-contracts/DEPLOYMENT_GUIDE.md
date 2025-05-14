# FreelanceShield Deployment Guide

This guide explains how to deploy the FreelanceShield smart contracts to Solana devnet (using Agave) and connect them to your frontend application with Privy authentication and Ethos reputation integration.

## Agave Compatibility

FreelanceShield is compatible with Agave v2.0, the new name for the Solana validator client software developed by Anza. The Docker setup in this repository ensures compatibility with the upcoming Agave v2.0 release to mainnet-beta.

Key considerations:
- Our Docker configuration uses the Agave validator client
- All RPC endpoints are compatible with Agave v2.0
- Dependencies are set up to work with renamed crates (from "solana-" to "agave-")

## Agave v2.0 Compatibility

The Solana ecosystem is transitioning from Solana Labs to Anza, with the validator client software being renamed from "Solana" to "Agave". This section provides guidance on ensuring your FreelanceShield deployment remains compatible during this transition.

### What is Agave?

Agave is the new name for the Solana validator client software being developed by Anza. As part of this transition:

1. Solana crates are being renamed from `solana-*` to `agave-*`
2. Some deprecated RPC endpoints are being removed
3. The GitHub repository is moving from Solana Labs to Anza

### Our Compatibility Approach

The FreelanceShield Docker setup has been designed to handle this transition smoothly:

1. **Compatibility Symlinks**: Our Docker image creates symlinks between `solana-*` and `agave-*` binaries
2. **Hybrid Mode**: Environment variables control whether to use Solana or Agave naming conventions
3. **Compatibility Checking**: A dedicated service checks your code for potential compatibility issues

### Using the Agave Compatibility Tools

#### Check for Compatibility Issues

```bash
docker-compose run check-agave-compatibility
```

This will scan your codebase for:
- Usage of deprecated RPC endpoints
- Dependencies on Solana crates that will be renamed
- Other potential compatibility issues

#### Test Agave Transition

```bash
docker-compose run test-agave-transition
```

This service tests your deployment with Agave compatibility settings to ensure everything works correctly.

### Compatibility Settings

In the docker-compose.yml file, you can configure Agave compatibility with these environment variables:

```yaml
environment:
  - AGAVE_COMPATIBILITY=true
  - AGAVE_TRANSITION_MODE=hybrid  # Options: solana, agave, hybrid
```

- **AGAVE_COMPATIBILITY**: Enable/disable Agave compatibility features
- **AGAVE_TRANSITION_MODE**:
  - `solana`: Use only Solana naming conventions
  - `agave`: Use only Agave naming conventions
  - `hybrid`: Support both naming conventions (recommended during transition)

### Common Compatibility Issues

1. **Renamed Crates**:
   - `solana-sdk` → `agave-sdk`
   - `solana-program` → `agave-program`
   - `solana-client` → `agave-client`
   - `solana-cli-config` → `agave-cli-config`

2. **Deprecated RPC Endpoints**:
   - `getStakeActivation`
   - `simulateTransaction` (with specific parameters)

3. **CLI Command Changes**:
   - Commands will eventually change from `solana-*` to `agave-*`

### Frontend Considerations

When integrating with Privy and Ethos, ensure that:

1. The connection URLs are updated to use the latest Agave-compatible endpoints
2. Any direct references to Solana-specific libraries are updated
3. The frontend code is tested with both naming conventions

### Monitoring the Transition

Stay updated on the Agave transition:
- [Anza Documentation](https://docs.anza.xyz/)
- [Backward Compatibility Policy](https://docs.anza.xyz/backwards-compatibility)
- [Agave GitHub Repository](https://github.com/anza-xyz/agave)

## Prerequisites

- Docker and Docker Compose installed
- Git repository cloned
- Privy API key configured

## Quick Start

For a complete deployment and integration:

```bash
# Build the Docker image
docker-compose build

# Create a deployment keypair (if you don't have one)
docker-compose run create-keypair

# Request SOL from devnet faucet
docker-compose run airdrop

# Build and deploy all contracts to devnet
docker-compose run build-contracts
docker-compose run deploy-contracts

# Generate IDL files for frontend
docker-compose run generate-idl

# Sync with frontend
docker-compose run sync-frontend
```

## Detailed Deployment Steps

### 1. Building the Docker Image

```bash
docker-compose build
```

This builds the Docker image with all the necessary dependencies for Agave/Solana and Anchor development.

### 2. Setting Up a Deployment Keypair

```bash
docker-compose run create-keypair
```

This creates a new keypair for deployment if one doesn't exist. The keypair is stored in the `keypairs` volume, so it persists across container restarts.

### 3. Funding the Deployment Keypair

```bash
docker-compose run airdrop
```

This requests an airdrop of SOL from the devnet faucet to fund your deployment keypair.

### 4. Building the Smart Contracts

```bash
docker-compose run build-contracts
```

This builds all the Anchor programs in the project.

### 5. Deploying to Devnet

```bash
docker-compose run deploy-contracts
```

This deploys all the programs to Solana devnet using the program IDs from `Anchor.toml`.

### 6. Generating IDL Files

```bash
docker-compose run generate-idl
```

This generates Interface Description Language (IDL) files for frontend integration.

### 7. Syncing with Frontend

```bash
docker-compose run sync-frontend
```

This syncs the deployed contracts with your frontend application, ensuring proper integration with Privy authentication and Ethos reputation scoring.

## Testing with Local Validator

For local testing before deploying to devnet:

```bash
# Start a local validator (using Agave)
docker-compose up -d local-validator

# Deploy to local validator
docker-compose run test-local

# Run tests
docker-compose run test
```

## Complete Integration Flow

For a complete deployment and frontend integration:

```bash
# One-command deployment and integration
docker-compose -f docker-compose.integration.yml up deploy-and-integrate

# Start the frontend with Privy and Ethos integration
docker-compose -f docker-compose.integration.yml up test-frontend
```

## Environment Variables

Set these environment variables before running the integration:

```bash
# Privy API key
export NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
```

## Privy Authentication Integration

FreelanceShield uses Privy for authentication and wallet management:

1. **Authentication Flow**:
   - Users authenticate with Privy (social login, email, etc.)
   - Privy creates or connects to a Solana wallet
   - The wallet is used for smart contract interactions

2. **Key Components**:
   - `UnifiedWalletService.ts`: Connects Privy wallets to Solana
   - `TransactionContext.tsx`: Manages transaction signing with Privy
   - `wallet-adapter-compat`: Compatibility layer for Anchor

## Ethos Reputation Integration

FreelanceShield uses Ethos Network for reputation scoring, which works through Privy authentication:

1. **Reputation Flow**:
   - User wallet addresses are converted to Ethos userKey format
   - Reputation scores are fetched from Ethos API using Privy authentication
   - Scores are used for insurance premium calculations

2. **Key Components**:
   - `ethosService.ts`: API client for Ethos endpoints (uses Privy token)
   - `useEthosReputation.ts`: Compatibility layer
   - `featureFlags.ts`: Controls gradual rollout via NEXT_PUBLIC_USE_ETHOS_REPUTATION flag
   - `useReputationSystem.ts`: Unified hook for reputation

## Troubleshooting

### Docker Issues

- **Image Build Fails**: Try rebuilding with `docker-compose build --no-cache`
- **Container Crashes**: Check logs with `docker-compose logs`

### Deployment Issues

- **Insufficient Funds**: Run `docker-compose run airdrop` to get more SOL
- **Program ID Mismatch**: Ensure program IDs in `Anchor.toml` match your deployment

### Privy Integration Issues

- **Authentication Fails**: Verify your Privy App ID is correctly set
- **Wallet Connection Issues**: Check that the Privy embedded wallet is properly initialized
- **Transaction Signing Fails**: Ensure the TransactionContext is correctly implemented

### Ethos Integration Issues

- **No Reputation Score**: Verify NEXT_PUBLIC_USE_ETHOS_REPUTATION is set to true
- **API Errors**: Check that Privy authentication is working correctly
- **Wrong Score Format**: Ensure wallet addresses are correctly formatted for Ethos (address:0x...)

### Agave Compatibility Issues

- **RPC Errors**: If you encounter RPC errors after Agave v2.0 is released, check for deprecated endpoint usage
- **Dependency Issues**: If you see errors related to "solana-" crates, update to use "agave-" crates instead

## Next Steps

Once deployment and integration are complete:

1. Test the complete user flow with Privy authentication
2. Verify Ethos reputation scoring is working
3. Test smart contract interactions
4. Monitor for any issues in production
5. Stay updated on Agave v2.0 announcements from Anza
