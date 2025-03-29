use anchor_lang::prelude::*;

#[account]
pub struct RiskPool {
    pub authority: Pubkey,
    pub total_staked: u64,
    pub total_coverage: u64,
    pub active_policies: u64,
    pub claims_paid: u64,
    pub reserve_ratio: u8,
    pub bump: u8,
}

