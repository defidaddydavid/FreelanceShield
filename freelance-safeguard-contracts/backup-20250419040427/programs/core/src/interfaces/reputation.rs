use anchor_lang::prelude::*;

/// ReputationProvider trait defines the interface for reputation scoring systems
/// This abstraction allows switching between different reputation implementations
/// (e.g., on-chain Solana-based system or Ethos Network)
pub trait ReputationProvider {
    /// Get the reputation score for a user
    fn get_reputation_score(user: &Pubkey) -> Result<u8>;
    
    /// Update reputation metrics after a successful transaction
    fn update_successful_transaction(user: &Pubkey, transaction_value: u64) -> Result<()>;
    
    /// Update reputation metrics after a dispute
    fn update_dispute(user: &Pubkey, is_at_fault: bool) -> Result<()>;
    
    /// Update reputation metrics after a claim
    fn update_claim(user: &Pubkey, claim_approved: bool) -> Result<()>;
}

/// Reputation factor weights used in calculations
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct ReputationFactors {
    /// Weight for successful transactions
    pub successful_transactions_weight: u8,
    /// Weight for transaction volume
    pub transaction_volume_weight: u8,
    /// Weight for disputes (negative factor)
    pub disputes_weight: u8,
    /// Weight for claims history
    pub claims_history_weight: u8,
    /// Weight for account age
    pub account_age_weight: u8,
}

impl Default for ReputationFactors {
    fn default() -> Self {
        Self {
            successful_transactions_weight: 30,
            transaction_volume_weight: 20,
            disputes_weight: 25,
            claims_history_weight: 15,
            account_age_weight: 10,
        }
    }
}

/// ReputationScore encapsulates a user's reputation data
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ReputationScore {
    /// Overall reputation score (0-100)
    pub score: u8,
    /// Number of successful transactions
    pub successful_transactions: u32,
    /// Total transaction volume (in lamports)
    pub transaction_volume: u64,
    /// Number of disputes
    pub disputes: u32,
    /// Number of disputes where user was at fault
    pub disputes_at_fault: u32,
    /// Number of claims submitted
    pub claims_submitted: u32,
    /// Number of claims approved
    pub claims_approved: u32,
    /// Timestamp when account was created
    pub account_creation_time: i64,
    /// Timestamp of last update
    pub last_update_time: i64,
}

impl Default for ReputationScore {
    fn default() -> Self {
        Self {
            score: 50, // Default starting score
            successful_transactions: 0,
            transaction_volume: 0,
            disputes: 0,
            disputes_at_fault: 0,
            claims_submitted: 0,
            claims_approved: 0,
            account_creation_time: 0,
            last_update_time: 0,
        }
    }
}
