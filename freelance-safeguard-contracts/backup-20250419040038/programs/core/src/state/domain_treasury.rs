use anchor_lang::prelude::*;

/// Domain treasury state account that links the FreelanceShield.xyz domain
/// to protocol addresses for easier user interaction
#[account]
pub struct DomainTreasury {
    /// Authority that can update the domain mappings (protocol admin)
    pub authority: Pubkey,
    /// Protocol admin address - receives admin fees and can perform admin actions
    pub admin_wallet: Pubkey,
    /// Risk pool program address - for directing premium payments
    pub risk_pool: Pubkey,
    /// The domain name this treasury is associated with (freelanceshield.xyz)
    pub domain: String,
    /// Last time this account was updated
    pub last_updated: i64,
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl DomainTreasury {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // admin_wallet
        32 + // risk_pool
        4 + 64 + // domain (string with max length)
        8 + // last_updated
        1; // bump

    /// FreelanceShield protocol domain - used for payments and interactions
    pub const PROTOCOL_DOMAIN: &'static str = "freelanceshield.xyz";
    
    /// Treasury wallet address (deployer/admin wallet configured on freelanceshield.xyz)
    pub const ADMIN_WALLET_ADDRESS: &'static str = "5dDo2hJ2PKH1XhRzzCgZhX5SDKBypr3crrx3TfwjPosE";
    
    /// Seeds used to derive the domain treasury PDA
    pub const DOMAIN_TREASURY_SEED: &'static str = "domain-treasury";
    
    /// Maximum domain length to validate against
    pub const MAX_DOMAIN_LENGTH: usize = 64;
}
