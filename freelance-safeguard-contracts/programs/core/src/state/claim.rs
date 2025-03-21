use anchor_lang::prelude::*;
use crate::state::common::*;

/// Maximum length for evidence description
pub const MAX_EVIDENCE_DESCRIPTION_LENGTH: usize = 512;
/// Maximum length for evidence hash
pub const MAX_EVIDENCE_HASH_LENGTH: usize = 64;
/// Maximum number of evidence attachments
pub const MAX_EVIDENCE_ATTACHMENTS: usize = 5;
/// Maximum length for reason
pub const MAX_REASON_LENGTH: usize = 256;

/// Insurance claim account
#[account]
#[derive(Default)]
pub struct Claim {
    /// Associated policy
    pub policy: Pubkey,
    /// Claim owner
    pub owner: Pubkey,
    /// Claim amount in lamports
    pub amount: u64,
    /// Claim status
    pub status: ClaimStatus,
    /// Type of evidence provided
    pub evidence_type: String,
    /// Description of the evidence
    pub evidence_description: String,
    /// Hashes/identifiers of evidence attachments
    pub evidence_hashes: Vec<String>,
    /// Submission date (Unix timestamp)
    pub submission_date: i64,
    /// Claim category
    pub category: ClaimCategory,
    /// Final verdict (null until processed)
    pub verdict: Option<Verdict>,
    /// Votes from community members
    pub votes: Vec<Vote>,
    /// Voting end date (Unix timestamp)
    pub voting_end_date: i64,
    /// Blockchain transaction signature
    pub transaction_signature: Option<String>,
    /// Risk score (0-100) for fraud detection
    pub risk_score: u8,
    /// Creation slot
    pub creation_slot: u64,
    /// Last update slot
    pub last_update_slot: u64,
    /// PDA bump seed
    pub bump: u8,
}

impl Claim {
    pub const SEED_PREFIX: &'static [u8] = b"claim";
    
    pub const BASE_SIZE: usize = 8 + // discriminator
        32 + // policy
        32 + // owner
        8 +  // amount
        1 +  // status
        (4 + 64) + // evidence_type (assuming max 64 chars)
        (4 + MAX_EVIDENCE_DESCRIPTION_LENGTH) + // evidence_description
        8 +  // submission_date
        1 +  // category
        (1 + Verdict::SIZE) + // Option<Verdict>
        8 +  // voting_end_date
        (1 + (4 + 64)) + // Option<String> for transaction_signature (assuming max 64 chars)
        1 +  // risk_score
        8 +  // creation_slot
        8 +  // last_update_slot
        1;   // bump
        
    // Note: Vec sizes are dynamic and allocated separately
    // evidence_hashes and votes will be allocated dynamically
}

/// Claim verdict structure
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Verdict {
    /// Whether the claim was approved
    pub approved: bool,
    /// Reason for the decision
    pub reason: String,
    /// Processing timestamp
    pub processed_at: i64,
    /// Processor type
    pub processor: ProcessorType,
}

impl Verdict {
    pub const SIZE: usize = 1 + // approved
        (4 + MAX_REASON_LENGTH) + // reason
        8 + // processed_at
        1;  // processor
}

/// Claim vote structure
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Vote {
    /// Voter public key
    pub voter: Pubkey,
    /// Whether the voter approves the claim
    pub approve: bool,
    /// Reason for the vote
    pub reason: String,
    /// Timestamp of the vote
    pub timestamp: i64,
}

impl Vote {
    pub const SIZE: usize = 32 + // voter
        1 +  // approve
        (4 + MAX_REASON_LENGTH) + // reason
        8;   // timestamp
}

/// Parameters for submitting a claim
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct SubmitClaimParams {
    /// Claim amount
    pub amount: u64,
    /// Type of evidence
    pub evidence_type: String,
    /// Description of evidence
    pub evidence_description: String,
    /// Evidence attachment hashes
    pub evidence_hashes: Vec<String>,
    /// Claim category
    pub claim_category: ClaimCategory,
}

/// Parameters for voting on a claim
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VoteOnClaimParams {
    /// Whether to approve the claim
    pub approve: bool,
    /// Reason for the vote
    pub reason: String,
}

/// Parameters for arbitrating a claim
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ArbitrateClaimParams {
    /// Whether to approve the claim
    pub approved: bool,
    /// Reason for the decision
    pub reason: String,
}
