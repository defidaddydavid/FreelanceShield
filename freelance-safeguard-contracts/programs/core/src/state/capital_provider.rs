use anchor_lang::prelude::*;

/// Capital provider account
#[account]
#[derive(Default)]
pub struct CapitalProvider {
    /// Provider's public key
    pub provider: Pubkey,
    /// Total amount deposited (in lamports)
    pub deposited_amount: u64,
    /// Last deposit timestamp
    pub last_deposit_timestamp: i64,
    /// Rewards earned (in lamports)
    pub rewards_earned: u64,
    /// Last rewards claim timestamp
    pub last_rewards_timestamp: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl CapitalProvider {
    pub const SEED_PREFIX: &'static [u8] = b"capital_provider";
    
    pub const SIZE: usize = 8 + // discriminator
        32 + // provider
        8 +  // deposited_amount
        8 +  // last_deposit_timestamp
        8 +  // rewards_earned
        8 +  // last_rewards_timestamp
        1;   // bump
}
