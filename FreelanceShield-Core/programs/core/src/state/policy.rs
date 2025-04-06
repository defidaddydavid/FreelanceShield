use anchor_lang::prelude::*;
use crate::state::common::*;

/// Insurance policy account
#[account]
#[derive(Default)]
pub struct Policy {
    /// Policy owner
    pub owner: Pubkey,
    /// Product ID that this policy is based on
    pub product_id: Pubkey,
    /// Coverage amount in lamports
    pub coverage_amount: u64,
    /// Premium amount paid in lamports
    pub premium_amount: u64,
    /// Policy start date (Unix timestamp)
    pub start_date: i64,
    /// Policy end date (Unix timestamp)
    pub end_date: i64,
    /// Claim period end date (Unix timestamp)
    pub claim_period_end: i64,
    /// Current policy status
    pub status: PolicyStatus,
    /// Job type (for risk calculation)
    pub job_type: JobType,
    /// Industry (for risk calculation)
    pub industry: Industry,
    /// Number of claims submitted for this policy
    pub claims_count: u8,
    /// Reputation score of the insured (0-100)
    pub reputation_score: u8,
    /// Risk score for this policy (0-100)
    pub risk_score: u8,
    /// Additional policy details/metadata
    pub policy_details: String,
    /// Creation block number
    pub creation_block: u64,
    /// Last update block number
    pub last_update_slot: u64,
    /// NFT mint address (if tokenized)
    pub nft_mint: Option<Pubkey>,
    /// PDA bump seed
    pub bump: u8,
}

impl Policy {
    pub const SEED_PREFIX: &'static [u8] = b"policy";
    pub const MAX_POLICY_DETAILS_LENGTH: usize = 256;
    
    pub const SIZE: usize = 8 + // discriminator
        32 + // owner
        32 + // product_id
        8 +  // coverage_amount
        8 +  // premium_amount
        8 +  // start_date
        8 +  // end_date
        8 +  // claim_period_end
        1 +  // status
        1 +  // job_type
        1 +  // industry
        1 +  // claims_count
        1 +  // reputation_score
        1 +  // risk_score
        (4 + Self::MAX_POLICY_DETAILS_LENGTH) + // policy_details
        8 +  // creation_block
        8 +  // last_update_slot
        (1 + 32) + // Option<Pubkey> for nft_mint
        1;   // bump
}

/// Parameters for purchasing a policy
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PurchasePolicyParams {
    /// Product ID to purchase
    pub product_id: Pubkey,
    /// Coverage amount
    pub coverage_amount: u64,
    /// Policy period in days
    pub period_days: u16,
    /// Job type
    pub job_type: JobType,
    /// Industry
    pub industry: Industry,
    /// Optional reputation score
    pub reputation_score: Option<u8>,
    /// Optional claims history 
    pub claims_history: Option<u8>,
    /// Optional additional details/metadata
    pub policy_details: Option<String>,
    /// Whether to mint a policy NFT
    pub mint_nft: bool,
}

