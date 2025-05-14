# FreelanceShield Smart Contract Architecture

## Overview

FreelanceShield is a Solana-based insurance platform designed to protect freelancers and clients in digital service transactions. This document outlines the architecture of the smart contract system, with a focus on the recent refactoring to support Privy authentication and Ethos Network reputation scoring.

## Core Components

### 1. Authentication System

FreelanceShield has transitioned to using Privy exclusively for authentication and wallet integration. The authentication system is designed with an abstraction layer to support this transition.

#### Authentication Provider Interface

The `AuthenticationProvider` trait in `interfaces/authentication.rs` defines the contract for authentication services:

```rust
pub trait AuthenticationProvider {
    fn verify_user(user: &Pubkey, auth_data: &AuthMetadata) -> Result<AuthorityLevel>;
    fn get_user_metadata(user: &Pubkey) -> Result<AuthMetadata>;
    fn update_user_metadata(user: &Pubkey, metadata: &AuthMetadata) -> Result<()>;
}
```

#### Privy Authentication Provider

The `PrivyAuthProvider` implements the `AuthenticationProvider` trait and handles Privy-specific authentication logic:

- Social login options with wallet creation
- Embedded wallet for new users
- Integration with Solana wallets

### 2. Reputation System

FreelanceShield has implemented an abstraction layer for reputation scoring to facilitate the transition from a Solana-based reputation system to Ethos Network.

#### Reputation Provider Interface

The `ReputationProvider` trait in `interfaces/reputation.rs` defines the contract for reputation services:

```rust
pub trait ReputationProvider {
    fn get_reputation_score(user: &Pubkey) -> Result<ReputationScore>;
    fn update_successful_transaction(user: &Pubkey, transaction_value: u64) -> Result<()>;
    fn update_dispute(user: &Pubkey, is_at_fault: bool) -> Result<()>;
    fn update_claim(user: &Pubkey, claim_approved: bool) -> Result<()>;
}
```

#### Ethos Reputation Provider

The `EthosReputationProvider` implements the `ReputationProvider` trait and integrates with Ethos Network:

- Comprehensive scoring based on vouches, reviews, and on-chain activity
- Compatible with Privy authentication
- Portable reputation across platforms

### 3. Feature Flag System

A feature flag system has been implemented to control the gradual rollout of new features:

```rust
pub struct FeatureFlags {
    pub use_ethos_reputation: bool,
    pub use_privy_auth: bool,
    pub use_enhanced_claims: bool,
    pub use_enhanced_risk_pool: bool,
    pub use_policy_nft: bool,
    pub use_dao_governance: bool,
}
```

The feature flags are stored in the program state and can be enabled/disabled by the program authority.

### 4. Instruction Handlers

The smart contract exposes various instruction handlers for interacting with the system:

#### Policy Management
- `purchase.rs`: Creates new insurance policies
- `cancel.rs`: Cancels existing policies
- `claim.rs`: Manages insurance claims

#### Reputation Management
- `fetch_ethos_score.rs`: Retrieves a user's Ethos reputation score
- `simulate_ethos_reputation.rs`: Simulates reputation changes for testing

#### Feature Management
- `enable_feature`: Enables a specific feature flag
- `disable_feature`: Disables a specific feature flag

## Data Structures

### Program State

The `ProgramState` struct maintains the global state of the program:

```rust
pub struct ProgramState {
    pub authority: Pubkey,
    pub bump: u8,
    pub feature_flags: FeatureFlags,
    // Other state fields...
}
```

### Reputation Score

The `ReputationScore` struct represents a user's reputation:

```rust
pub struct ReputationScore {
    pub score: u8,
    pub successful_transactions: u32,
    pub transaction_volume: u64,
    pub disputes: u32,
    pub disputes_at_fault: u32,
    pub claims_submitted: u32,
    pub claims_approved: u32,
    pub account_creation_time: i64,
    pub last_update_time: i64,
}
```

## Integration Points

### Frontend Integration

The smart contract system integrates with the frontend through:

1. **Privy Authentication**:
   - Custom hooks like `useWallet` and `useAnchorWallet` provide compatibility layers
   - Privy user IDs are passed to the smart contract for authentication

2. **Ethos Reputation**:
   - The `useEthosContractIntegration` hook interacts with the reputation instructions
   - The `useEthosReputation` hook provides a unified interface for reputation data

### External Services

1. **Privy**:
   - Handles user authentication and wallet management
   - Provides social login options and embedded wallets

2. **Ethos Network**:
   - Provides comprehensive reputation scoring
   - Aggregates reputation data from multiple sources

## Deployment and Migration

### Feature Flag-Based Migration

The transition to Privy authentication and Ethos reputation is managed through feature flags:

1. Deploy the updated contracts with new interfaces and providers
2. Keep legacy systems enabled initially
3. Enable new features for a subset of users
4. Monitor performance and gradually increase rollout
5. Disable legacy systems once migration is complete

### Backward Compatibility

The system maintains backward compatibility through:

1. Abstraction layers that support both old and new implementations
2. Feature flags to control which systems are active
3. Compatibility adapters for external services

## Security Considerations

1. **Authentication**:
   - Privy integration enhances security with social login options
   - Clear separation between authentication and business logic

2. **Feature Flags**:
   - Only the program authority can modify feature flags
   - Gradual rollout reduces risk of widespread issues

3. **Error Handling**:
   - Comprehensive error types for different failure scenarios
   - Graceful degradation when services are unavailable

## Future Enhancements

1. **Enhanced Claims Processing**:
   - Automated claim verification using Ethos reputation data
   - Risk-based claim approval workflows

2. **Policy NFTs**:
   - Represent insurance policies as NFTs for better tracking
   - Enable secondary markets for policy transfer

3. **DAO Governance**:
   - Community-driven decision making for risk parameters
   - Decentralized management of the insurance pool

## Conclusion

The FreelanceShield smart contract system has been refactored to support Privy authentication and Ethos Network reputation scoring. The new architecture provides a flexible framework for future enhancements while maintaining backward compatibility with existing systems.
