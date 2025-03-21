pub mod submit;
pub mod vote;
pub mod process;
pub mod pay;
pub mod dispute;
pub mod arbitrate;

pub use submit::*;
pub use vote::*;
pub use process::*;
pub use pay::*;
pub use dispute::*;
pub use arbitrate::*;

// Parameter structs for claim instructions

/// Parameters for submitting a claim
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct SubmitClaimParams {
    /// Amount being claimed
    pub amount: u64,
    /// Description of the claim
    pub description: String,
    /// Optional evidence hashes (IPFS CIDs or other content identifiers)
    pub evidence_hashes: Vec<String>,
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
