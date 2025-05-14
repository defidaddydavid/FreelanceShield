use anchor_lang::prelude::*;

/// Feature flags to control system behavior
/// This allows for gradual rollout of new features and integrations
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, Debug)]
pub struct FeatureFlags {
    /// Use Ethos Network for reputation scoring instead of on-chain system
    pub use_ethos_reputation: bool,
    
    /// Use Privy for authentication instead of standard Solana wallet auth
    pub use_privy_auth: bool,
    
    /// Enable enhanced claims processing
    pub use_enhanced_claims: bool,
    
    /// Enable enhanced risk pool
    pub use_enhanced_risk_pool: bool,
    
    /// Enable policy NFT tokenization
    pub use_policy_nft: bool,
    
    /// Enable DAO governance
    pub use_dao_governance: bool,
}

impl FeatureFlags {
    /// Create new feature flags with default settings
    pub fn new() -> Self {
        Self {
            use_ethos_reputation: false,
            use_privy_auth: false,
            use_enhanced_claims: false,
            use_enhanced_risk_pool: false,
            use_policy_nft: false,
            use_dao_governance: false,
        }
    }
    
    /// Create feature flags for development environment with all features enabled
    pub fn dev_mode() -> Self {
        Self {
            use_ethos_reputation: true,
            use_privy_auth: true,
            use_enhanced_claims: true,
            use_enhanced_risk_pool: true,
            use_policy_nft: true,
            use_dao_governance: true,
        }
    }
}
