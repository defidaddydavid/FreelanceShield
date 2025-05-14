use anchor_lang::prelude::*;

#[account]
pub struct PaymentVerification {
    pub freelancer: Pubkey,
    pub client: Pubkey,
    pub expected_amount: u64,
    pub deadline: i64,
    pub status: PaymentStatus,
    pub created_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PaymentStatus {
    Pending,
    Confirmed,
    Disputed,
    Claimed,
}

