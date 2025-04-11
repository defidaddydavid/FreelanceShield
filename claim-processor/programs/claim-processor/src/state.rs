use anchor_lang::prelude::*;

/// Enum representing different types of insurance claims
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum ClaimType {
    NonPayment = 0,       // Client didn't pay for completed work
    IncompleteWork = 1,   // Freelancer didn't complete agreed work
    QualityDispute = 2,   // Dispute over quality of delivered work
    DeadlineMissed = 3,   // Freelancer missed agreed deadline
    ContractBreach = 4,   // General breach of contract terms
    Other = 5,            // Other types of claims
}

impl From<u8> for ClaimType {
    fn from(value: u8) -> Self {
        match value {
            0 => ClaimType::NonPayment,
            1 => ClaimType::IncompleteWork,
            2 => ClaimType::QualityDispute,
            3 => ClaimType::DeadlineMissed,
            4 => ClaimType::ContractBreach,
            _ => ClaimType::Other,
        }
    }
}

/// Enum representing the current status of a claim
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum ClaimStatus {
    Filed = 0,            // Claim has been filed but not yet processed
    PendingEvidence = 1,  // Waiting for required evidence to be submitted
    UnderReview = 2,      // Claim is being reviewed
    ApprovedPending = 3,  // Claim approved but not yet paid out
    Paid = 4,             // Claim has been paid out
    Rejected = 5,         // Claim has been rejected
    Disputed = 6,         // Claim decision has been disputed
    Arbitration = 7,      // Claim is in arbitration
    Closed = 8,           // Claim process is completed
}

impl From<u8> for ClaimStatus {
    fn from(value: u8) -> Self {
        match value {
            0 => ClaimStatus::Filed,
            1 => ClaimStatus::PendingEvidence,
            2 => ClaimStatus::UnderReview,
            3 => ClaimStatus::ApprovedPending,
            4 => ClaimStatus::Paid,
            5 => ClaimStatus::Rejected,
            6 => ClaimStatus::Disputed,
            7 => ClaimStatus::Arbitration,
            8 => ClaimStatus::Closed,
            _ => ClaimStatus::Filed,
        }
    }
}

/// Enum representing types of evidence that can be submitted
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum EvidenceType {
    Contract = 0,          // Contract between parties
    Communication = 1,     // Communication logs
    Deliverable = 2,       // Work deliverables
    Payment = 3,           // Payment proof
    Timeline = 4,          // Project timeline documentation
    QualityAssessment = 5, // Assessment of work quality
    ExpertOpinion = 6,     // Opinion from a domain expert
    Other = 7,             // Other types of evidence
}

impl From<u8> for EvidenceType {
    fn from(value: u8) -> Self {
        match value {
            0 => EvidenceType::Contract,
            1 => EvidenceType::Communication,
            2 => EvidenceType::Deliverable,
            3 => EvidenceType::Payment,
            4 => EvidenceType::Timeline,
            5 => EvidenceType::QualityAssessment,
            6 => EvidenceType::ExpertOpinion,
            _ => EvidenceType::Other,
        }
    }
}

/// Main account structure for an insurance claim
#[account]
pub struct ClaimAccount {
    pub claim_id: Pubkey,             // Unique identifier for this claim
    pub claimant: Pubkey,             // User filing the claim
    pub respondent: Pubkey,           // User the claim is against
    pub policy_id: Pubkey,            // The insurance policy this claim is filed under
    pub claim_type: ClaimType,        // Type of claim being filed
    pub status: ClaimStatus,          // Current status of the claim
    pub amount: u64,                  // Amount being claimed in tokens
    pub evidence_count: u8,           // Number of evidence items submitted
    pub approved_by: Option<Pubkey>,  // Who approved this claim (if applicable)
    pub rejected_by: Option<Pubkey>,  // Who rejected this claim (if applicable)
    pub rejection_reason: Option<String>, // Reason for rejection (if applicable)
    pub created_at: i64,              // When this claim was created
    pub updated_at: i64,              // When this claim was last updated
    pub paid_at: Option<i64>,         // When this claim was paid out (if applicable)
    pub fraud_flags: u8,              // Bitmask of fraud indicators
    pub fraud_score: u8,              // Automated fraud score (0-100)
    pub requires_manual_review: bool, // Whether this claim requires manual review
    pub bump: u8,                     // PDA bump seed
}

impl ClaimAccount {
    pub const MAX_REJECTION_REASON_LEN: usize = 200;
    
    pub fn space() -> usize {
        8 +                                       // Discriminator
        32 +                                      // claim_id: Pubkey
        32 +                                      // claimant: Pubkey
        32 +                                      // respondent: Pubkey
        32 +                                      // policy_id: Pubkey
        1 +                                       // claim_type: ClaimType
        1 +                                       // status: ClaimStatus
        8 +                                       // amount: u64
        1 +                                       // evidence_count: u8
        1 + 32 +                                  // approved_by: Option<Pubkey>
        1 + 32 +                                  // rejected_by: Option<Pubkey>
        1 + 4 + Self::MAX_REJECTION_REASON_LEN +  // rejection_reason: Option<String>
        8 +                                       // created_at: i64
        8 +                                       // updated_at: i64
        1 + 8 +                                   // paid_at: Option<i64>
        1 +                                       // fraud_flags: u8
        1 +                                       // fraud_score: u8
        1 +                                       // requires_manual_review: bool
        1                                         // bump: u8
    }
}

/// Evidence structure submitted as part of a claim
#[account]
pub struct EvidenceItem {
    pub claim_id: Pubkey,             // Claim this evidence is for
    pub submitter: Pubkey,            // User who submitted this evidence
    pub evidence_hash: [u8; 32],      // Hash of the evidence content
    pub evidence_type: EvidenceType,  // Type of evidence
    pub uri: String,                  // URI where the evidence is stored (IPFS/Arweave)
    pub timestamp: i64,               // When this evidence was submitted
    pub verified: bool,               // Whether this evidence has been verified
    pub verifier: Option<Pubkey>,     // Who verified this evidence (if applicable)
    pub verification_timestamp: Option<i64>, // When this evidence was verified
    pub bump: u8,                     // PDA bump seed
}

impl EvidenceItem {
    pub const MAX_URI_LEN: usize = 100;
    
    pub fn space() -> usize {
        8 +                          // Discriminator
        32 +                         // claim_id: Pubkey
        32 +                         // submitter: Pubkey
        32 +                         // evidence_hash: [u8; 32]
        1 +                          // evidence_type: EvidenceType
        4 + Self::MAX_URI_LEN +      // uri: String
        8 +                          // timestamp: i64
        1 +                          // verified: bool
        1 + 32 +                     // verifier: Option<Pubkey>
        1 + 8 +                      // verification_timestamp: Option<i64>
        1                            // bump: u8
    }
}

/// Policy account structure
#[account]
pub struct PolicyAccount {
    pub policy_id: Pubkey,            // Unique identifier for this policy
    pub owner: Pubkey,                // The freelancer covered by this policy
    pub premium_paid: u64,            // Amount of premium paid for this policy
    pub coverage_amount: u64,         // Maximum coverage amount
    pub average_project_value: Option<u64>, // Average value of projects by this freelancer
    pub created_at: i64,              // When this policy was created
    pub expiry_time: i64,             // When this policy expires
    pub is_active: bool,              // Whether this policy is currently active
    pub claim_count: u8,              // Number of claims filed under this policy
    pub paid_claim_count: u8,         // Number of paid claims under this policy
    pub total_paid_amount: u64,       // Total amount paid out under this policy
    pub risk_score: u8,               // Risk score for this policy (0-100)
    pub waiting_period_end: i64,      // When the waiting period ends
    pub bump: u8,                     // PDA bump seed
}

impl PolicyAccount {
    pub fn space() -> usize {
        8 +                          // Discriminator
        32 +                         // policy_id: Pubkey
        32 +                         // owner: Pubkey
        8 +                          // premium_paid: u64
        8 +                          // coverage_amount: u64
        1 + 8 +                      // average_project_value: Option<u64>
        8 +                          // created_at: i64
        8 +                          // expiry_time: i64
        1 +                          // is_active: bool
        1 +                          // claim_count: u8
        1 +                          // paid_claim_count: u8
        8 +                          // total_paid_amount: u64
        1 +                          // risk_score: u8
        8 +                          // waiting_period_end: i64
        1                            // bump: u8
    }
}

/// Claim history for a user
#[account]
pub struct ClaimantHistory {
    pub user: Pubkey,                       // User this history is for
    pub total_claims: u16,                  // Total number of claims filed
    pub approved_claims: u16,               // Number of approved claims
    pub rejected_claims: u16,               // Number of rejected claims
    pub fraud_rejected_claims: u16,         // Number of claims rejected for fraud
    pub total_claimed_amount: u64,          // Total amount claimed across all claims
    pub total_paid_amount: u64,             // Total amount paid across all claims
    pub claims_last_30_days: u8,            // Number of claims in last 30 days
    pub claims_last_90_days: u8,            // Number of claims in last 90 days
    pub claims_last_365_days: u16,          // Number of claims in last 365 days
    pub total_projects: u16,                // Total number of projects (for context)
    pub repeated_respondent_count: u8,      // How many times claims filed against same respondent
    pub claims_against_current_respondent: u8, // Claims against current respondent
    pub transaction_count_with_respondent: u16, // Number of transactions with respondent
    pub successful_projects_with_respondent: u16, // Successful projects with respondent
    pub same_type_claims_last_90_days: u8,  // Claims of same type in last 90 days
    pub last_updated: i64,                  // When this history was last updated
    pub bump: u8,                           // PDA bump seed
}

impl ClaimantHistory {
    pub fn space() -> usize {
        8 +                          // Discriminator
        32 +                         // user: Pubkey
        2 +                          // total_claims: u16
        2 +                          // approved_claims: u16
        2 +                          // rejected_claims: u16
        2 +                          // fraud_rejected_claims: u16
        8 +                          // total_claimed_amount: u64
        8 +                          // total_paid_amount: u64
        1 +                          // claims_last_30_days: u8
        1 +                          // claims_last_90_days: u8
        2 +                          // claims_last_365_days: u16
        2 +                          // total_projects: u16
        1 +                          // repeated_respondent_count: u8
        1 +                          // claims_against_current_respondent: u8
        2 +                          // transaction_count_with_respondent: u16
        2 +                          // successful_projects_with_respondent: u16
        1 +                          // same_type_claims_last_90_days: u8
        8 +                          // last_updated: i64
        1                            // bump: u8
    }
}

/// Structure for claim verification by validators/arbitrators
#[account]
pub struct ClaimVerification {
    pub claim_id: Pubkey,             // The claim being verified
    pub verifier: Pubkey,             // Who performed the verification
    pub verdict: bool,                // Approve (true) or reject (false)
    pub comments: String,             // Verifier's comments
    pub verified_at: i64,             // When this verification was performed
    pub evidence_reviewed: Vec<Pubkey>, // List of evidence reviewed
    pub fraud_detected: bool,         // Whether fraud was detected
    pub fraud_type: Option<u8>,       // Type of fraud detected (if any)
    pub bump: u8,                     // PDA bump seed
}

impl ClaimVerification {
    pub const MAX_COMMENTS_LEN: usize = 200;
    pub const MAX_EVIDENCE_REVIEWED: usize = 10;
    
    pub fn space() -> usize {
        8 +                                     // Discriminator
        32 +                                    // claim_id: Pubkey
        32 +                                    // verifier: Pubkey
        1 +                                     // verdict: bool
        4 + Self::MAX_COMMENTS_LEN +            // comments: String
        8 +                                     // verified_at: i64
        4 + (32 * Self::MAX_EVIDENCE_REVIEWED) + // evidence_reviewed: Vec<Pubkey>
        1 +                                     // fraud_detected: bool
        1 + 1 +                                 // fraud_type: Option<u8>
        1                                       // bump: u8
    }
}
