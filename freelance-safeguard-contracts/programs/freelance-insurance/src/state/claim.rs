use anchor_lang::prelude::*;

#[account]
pub struct Claim {
    pub policy: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
    pub status: ClaimStatus,
    pub evidence_type: String,
    pub evidence_description: String,
    pub evidence_attachments: Vec<String>,
    pub submission_date: i64,
    pub verdict: Option<ClaimVerdict>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ClaimStatus {
    Pending,
    Approved,
    Rejected,
    Disputed,
    Resolved,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub struct ClaimVerdict {
    pub approved: bool,
    pub reason: String,
    pub processed_at: i64,
}

