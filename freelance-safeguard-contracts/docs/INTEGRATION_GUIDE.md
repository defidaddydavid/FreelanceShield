# FreelanceShield Integration Guide

This guide provides instructions for integrating with the FreelanceShield smart contract system, with a focus on Privy authentication and Ethos Network reputation scoring.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Privy Authentication Integration](#privy-authentication-integration)
3. [Ethos Reputation Integration](#ethos-reputation-integration)
4. [Feature Flag Management](#feature-flag-management)
5. [Frontend Integration](#frontend-integration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before integrating with FreelanceShield, ensure you have:

- Solana development environment set up
- Anchor framework installed
- Privy developer account
- Access to the FreelanceShield smart contract codebase

## Privy Authentication Integration

FreelanceShield now exclusively uses Privy for authentication and wallet integration. This section explains how to integrate with the Privy authentication system.

### 1. Setting Up Privy

1. Register for a Privy developer account at [privy.io](https://privy.io)
2. Create a new project and obtain your API keys
3. Configure your Privy project to support Solana wallets

### 2. Using the PrivyAuthProvider

The `PrivyAuthProvider` implements the `AuthenticationProvider` trait and handles Privy-specific authentication:

```rust
// Example: Verifying a user with Privy authentication
use crate::adapters::privy_auth_provider::PrivyAuthProvider;
use crate::interfaces::authentication::AuthenticationProvider;

// Inside your instruction handler
let auth_metadata = AuthMetadata {
    external_user_id: Some(privy_user_id.to_string()),
    auth_level: AuthorityLevel::User,
    // other fields...
};

// Verify the user
let auth_level = PrivyAuthProvider::verify_user(&user.key(), &auth_metadata)?;

// Check if the user has sufficient permissions
require!(
    auth_level >= AuthorityLevel::User,
    FreelanceShieldError::Unauthorized
);
```

### 3. Passing Privy User IDs

When making calls to the smart contract, you need to pass the Privy user ID:

```typescript
// Frontend example
const privyUserId = user?.id?.toString();

// Prepare transaction to call the smart contract
const tx = await program.methods
  .purchasePolicy({
    // Policy parameters
    externalUserId: privyUserId,
  })
  .accounts({
    user: wallet.publicKey,
    // other accounts...
  })
  .transaction();
```

## Ethos Reputation Integration

FreelanceShield has implemented an abstraction layer for reputation scoring to facilitate the transition to Ethos Network.

### 1. Fetching Ethos Reputation Scores

Use the `fetch_ethos_score` instruction to retrieve a user's Ethos reputation:

```typescript
// Frontend example
const fetchEthosScore = async () => {
  const tx = await program.methods
    .fetchEthosScore({
      externalUserId: privyUserId,
    })
    .accounts({
      user: wallet.publicKey,
      programState: programStatePDA,
      systemProgram: web3.SystemProgram.programId,
    })
    .transaction();
    
  const signature = await sendTransaction(tx);
  await connection.confirmTransaction(signature);
  
  // The score is returned in the transaction logs
  // Parse the logs to extract the score
};
```

### 2. Simulating Reputation Changes

For testing purposes, you can simulate reputation changes using the `simulate_ethos_reputation` instruction:

```typescript
// Frontend example
const simulateReputation = async () => {
  const tx = await program.methods
    .simulateEthosReputation({
      successfulTransactions: 10,
      transactionVolume: new BN(1000000),
      disputes: 1,
      disputesAtFault: 0,
      claimsSubmitted: 2,
      claimsApproved: 2,
      privyUserId: privyUserId,
    })
    .accounts({
      user: wallet.publicKey,
      programState: programStatePDA,
      systemProgram: web3.SystemProgram.programId,
    })
    .transaction();
    
  const signature = await sendTransaction(tx);
  await connection.confirmTransaction(signature);
};
```

### 3. Using Reputation in Policy Pricing

The reputation score affects policy pricing:

```rust
// Example: Using reputation in policy pricing
use crate::adapters::ethos_reputation_provider::EthosReputationProvider;
use crate::interfaces::reputation::ReputationProvider;

// Inside your instruction handler
let reputation = EthosReputationProvider::get_reputation_score(&user.key())?;

// Calculate premium based on reputation
let base_premium = calculate_base_premium(&policy_params);
let reputation_factor = calculate_reputation_factor(reputation.score);
let final_premium = (base_premium as f64 * reputation_factor) as u64;
```

## Feature Flag Management

FreelanceShield uses feature flags to control the gradual rollout of new features.

### 1. Checking Feature Flags

Before using a feature, check if it's enabled:

```rust
// Example: Checking if Ethos reputation is enabled
require!(
    program_state.feature_flags.use_ethos_reputation,
    FreelanceShieldError::FeatureNotEnabled
);
```

### 2. Enabling/Disabling Features

Only the program authority can enable or disable features:

```typescript
// Frontend example for program authority
const enableFeature = async (feature) => {
  const tx = await program.methods
    .enableFeature(feature)
    .accounts({
      authority: wallet.publicKey,
      programState: programStatePDA,
    })
    .transaction();
    
  const signature = await sendTransaction(tx);
  await connection.confirmTransaction(signature);
};
```

## Frontend Integration

This section explains how to integrate the FreelanceShield smart contract with your frontend application.

### 1. Setting Up the Frontend

1. Install required dependencies:

```bash
npm install @privy-io/react-auth @solana/web3.js @project-serum/anchor react-toastify
```

2. Configure Privy in your application:

```tsx
// Example: Configuring Privy in your app
import { PrivyProvider } from '@privy-io/react-auth';

function App() {
  return (
    <PrivyProvider
      appId={process.env.PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#3182ce',
        },
        embeddedWallets: {
          createOnLogin: true,
          noPromptOnSignature: false,
        },
      }}
    >
      <YourApp />
    </PrivyProvider>
  );
}
```

### 2. Using Custom Hooks

Use the provided custom hooks to interact with the smart contract:

```tsx
// Example: Using custom hooks
import { useWallet } from '@/hooks/useWallet';
import { useEthosContractIntegration } from '@/lib/ethos/useEthosContractIntegration';

function ReputationComponent() {
  const { connected } = useWallet();
  const { 
    fetchEthosScore, 
    simulateEthosReputation, 
    reputationScore, 
    isLoading 
  } = useEthosContractIntegration();
  
  useEffect(() => {
    if (connected) {
      fetchEthosScore();
    }
  }, [connected, fetchEthosScore]);
  
  return (
    <div>
      {isLoading ? (
        <p>Loading reputation score...</p>
      ) : (
        <p>Your reputation score: {reputationScore || 'N/A'}</p>
      )}
      <button onClick={fetchEthosScore}>Refresh Score</button>
    </div>
  );
}
```

### 3. Handling Feature Flags in the UI

Conditionally render UI components based on feature flags:

```tsx
// Example: Conditional rendering based on feature flags
import { FEATURES } from '@/lib/featureFlags';

function ReputationSection() {
  return (
    <div>
      <h2>Reputation</h2>
      
      {FEATURES.USE_ETHOS_REPUTATION ? (
        <EthosReputationCard />
      ) : (
        <LegacyReputationCard />
      )}
    </div>
  );
}
```

## Testing

This section provides guidance on testing your integration with FreelanceShield.

### 1. Setting Up a Test Environment

1. Use a local Solana validator for testing:

```bash
solana-test-validator
```

2. Deploy the FreelanceShield program to your local validator:

```bash
anchor deploy
```

### 2. Testing Privy Authentication

1. Create a test Privy account
2. Connect your wallet through Privy
3. Verify that authentication works correctly

### 3. Testing Ethos Reputation

1. Enable the Ethos reputation feature flag
2. Use the simulation function to create test reputation data
3. Verify that reputation scores affect policy pricing correctly

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Ensure Privy is correctly configured
   - Check that the external user ID is being passed correctly
   - Verify that the feature flag is enabled

2. **Reputation Score Not Available**
   - Check if the Ethos reputation feature flag is enabled
   - Verify that the user has an Ethos reputation profile
   - Check for errors in the transaction logs

3. **Transaction Errors**
   - Ensure the user has sufficient SOL for transaction fees
   - Verify that all required accounts are included in the transaction
   - Check for program errors in the transaction logs

### Getting Help

If you encounter issues not covered in this guide, please:

1. Check the FreelanceShield documentation
2. Review the smart contract code for additional context
3. Contact the FreelanceShield development team for support

---

This integration guide is maintained by the FreelanceShield team. For updates and additional documentation, visit the [FreelanceShield GitHub repository](https://github.com/FreelanceShield).
