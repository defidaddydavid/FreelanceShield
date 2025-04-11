use anchor_lang::prelude::*;

// Identity Verification Structures
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum VerificationLevel {
    Basic = 0,     // Email verification only
    Intermediate,  // Basic + social verification
    Advanced,      // Intermediate + government ID
    Premium,       // Advanced + biometric verification
}

impl From<u8> for VerificationLevel {
    fn from(value: u8) -> Self {
        match value {
            0 => VerificationLevel::Basic,
            1 => VerificationLevel::Intermediate,
            2 => VerificationLevel::Advanced,
            3 => VerificationLevel::Premium,
            _ => VerificationLevel::Basic,
        }
    }
}

#[account]
pub struct IdentityAccount {
    pub user: Pubkey,                          // The owner of this identity account
    pub verification_level: VerificationLevel, // Current verification level
    pub kyc_verifications: Vec<Pubkey>,        // List of KYC verifier public keys that verified this identity
    pub social_verifications: Vec<SocialData>, // List of connected social accounts
    pub vouchers: Vec<VoucherInfo>,            // List of users that vouched for this identity
    pub created_at: i64,                       // When the identity was first created
    pub last_updated: i64,                     // Last time the identity was updated
    pub verification_expiry: i64,              // When the current verification expires (if applicable)
    pub is_active: bool,                       // Whether this identity is currently active
    pub bump: u8,                              // PDA bump
}

impl IdentityAccount {
    pub const MAX_SOCIAL_VERIFICATIONS: usize = 5;
    pub const MAX_VOUCHERS: usize = 10;
    pub const MAX_KYC_VERIFICATIONS: usize = 3;
    
    pub fn space() -> usize {
        8 +                                                      // Discriminator
        32 +                                                     // user: Pubkey
        1 +                                                      // verification_level: VerificationLevel
        4 + (32 * Self::MAX_KYC_VERIFICATIONS) +                // kyc_verifications: Vec<Pubkey>
        4 + (SocialData::space() * Self::MAX_SOCIAL_VERIFICATIONS) + // social_verifications: Vec<SocialData>
        4 + (VoucherInfo::space() * Self::MAX_VOUCHERS) +       // vouchers: Vec<VoucherInfo>
        8 +                                                      // created_at: i64
        8 +                                                      // last_updated: i64
        8 +                                                      // verification_expiry: i64
        1 +                                                      // is_active: bool
        1                                                        // bump: u8
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct UserInfo {
    pub name: String,             // User's name (can be pseudonymous)
    pub email_hash: [u8; 32],     // Hash of the verified email address
    pub public_username: String,  // Public username on FreelanceShield
}

impl UserInfo {
    pub fn space() -> usize {
        4 + 100 +    // name: String (max 100 chars)
        32 +         // email_hash: [u8; 32]
        4 + 50       // public_username: String (max 50 chars)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct VerificationData {
    pub verifier: Pubkey,                // The entity that performed the verification
    pub timestamp: i64,                  // When the verification occurred
    pub verification_type: String,       // Type of verification (e.g., "government_id", "biometric")
    pub verification_hash: [u8; 32],     // Hash of the verification data
    pub expiry: Option<i64>,             // When this verification expires (if applicable)
}

impl VerificationData {
    pub fn space() -> usize {
        32 +         // verifier: Pubkey
        8 +          // timestamp: i64
        4 + 50 +     // verification_type: String (max 50 chars)
        32 +         // verification_hash: [u8; 32]
        1 + 8        // expiry: Option<i64>
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct SocialData {
    pub platform: String,             // Name of the social platform
    pub account_hash: [u8; 32],       // Hash of the account ID
    pub verification_timestamp: i64,  // When the social account was verified
    pub verification_hash: [u8; 32],  // Verification proof hash
}

impl SocialData {
    pub fn space() -> usize {
        4 + 30 +     // platform: String (max 30 chars)
        32 +         // account_hash: [u8; 32]
        8 +          // verification_timestamp: i64
        32           // verification_hash: [u8; 32]
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct VoucherInfo {
    pub voucher: Pubkey,              // Public key of the user who provided the vouching
    pub timestamp: i64,               // When the vouching was provided
    pub statement_hash: [u8; 32],     // Hash of the vouching statement
    pub voucher_reputation: u64,      // Reputation score of the voucher at the time
}

impl VoucherInfo {
    pub fn space() -> usize {
        32 +         // voucher: Pubkey
        8 +          // timestamp: i64
        32 +         // statement_hash: [u8; 32]
        8            // voucher_reputation: u64
    }
}

// Risk Assessment Structures
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum RiskFactor {
    TransactionHistory = 0,
    ClaimHistory,
    DisputeHistory,
    ProjectComplexity,
    ClientReputation,
    ContractValue,
    AccountAge,
    IdentityStrength,
    NetworkConnections,
    UserActivity,
}

impl From<u8> for RiskFactor {
    fn from(value: u8) -> Self {
        match value {
            0 => RiskFactor::TransactionHistory,
            1 => RiskFactor::ClaimHistory,
            2 => RiskFactor::DisputeHistory,
            3 => RiskFactor::ProjectComplexity,
            4 => RiskFactor::ClientReputation,
            5 => RiskFactor::ContractValue,
            6 => RiskFactor::AccountAge,
            7 => RiskFactor::IdentityStrength,
            8 => RiskFactor::NetworkConnections,
            9 => RiskFactor::UserActivity,
            _ => RiskFactor::UserActivity,
        }
    }
}

#[account]
pub struct RiskAssessment {
    pub user: Pubkey,                          // The user this risk assessment is for
    pub overall_risk_score: i32,               // Overall risk score (lower is better, can be negative)
    pub risk_factors: Vec<RiskFactorScore>,    // Individual risk factor scores
    pub last_updated: i64,                     // When this risk assessment was last updated
    pub coverage_limit: u64,                   // Maximum coverage based on risk assessment
    pub waiting_period_days: u8,               // Required waiting period before claims can be filed
    pub created_at: i64,                       // When this risk assessment was created
    pub bump: u8,                              // PDA bump
}

impl RiskAssessment {
    pub const MAX_RISK_FACTORS: usize = 10;
    
    pub fn space() -> usize {
        8 +                                                      // Discriminator
        32 +                                                     // user: Pubkey
        4 +                                                      // overall_risk_score: i32
        4 + (RiskFactorScore::space() * Self::MAX_RISK_FACTORS) + // risk_factors: Vec<RiskFactorScore>
        8 +                                                      // last_updated: i64
        8 +                                                      // coverage_limit: u64
        1 +                                                      // waiting_period_days: u8
        8 +                                                      // created_at: i64
        1                                                        // bump: u8
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct RiskFactorScore {
    pub factor: RiskFactor,       // The risk factor being assessed
    pub score: i32,               // Score for this factor (lower is better, can be negative)
    pub last_updated: i64,        // When this factor was last updated
}

impl RiskFactorScore {
    pub fn space() -> usize {
        1 +          // factor: RiskFactor
        4 +          // score: i32
        8            // last_updated: i64
    }
}

// Claim Verification Structures
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum ClaimType {
    NonPayment = 0,
    IncompleteWork,
    QualityDispute,
    DeadlineMissed,
    ContractBreach,
    Other,
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum ClaimStatus {
    Initiated = 0,
    EvidenceGathering,
    UnderReview,
    AdditionalEvidenceRequested,
    Validated,
    Rejected,
    Paid,
    Disputed,
    Arbitration,
    Closed,
}

impl From<u8> for ClaimStatus {
    fn from(value: u8) -> Self {
        match value {
            0 => ClaimStatus::Initiated,
            1 => ClaimStatus::EvidenceGathering,
            2 => ClaimStatus::UnderReview,
            3 => ClaimStatus::AdditionalEvidenceRequested,
            4 => ClaimStatus::Validated,
            5 => ClaimStatus::Rejected,
            6 => ClaimStatus::Paid,
            7 => ClaimStatus::Disputed,
            8 => ClaimStatus::Arbitration,
            9 => ClaimStatus::Closed,
            _ => ClaimStatus::Initiated,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum VerificationTier {
    Automated = 0,   // Simple algorithm-based checks
    Specialized,     // Domain expert review required
    Comprehensive,   // Multiple experts and detailed analysis
}

impl From<u8> for VerificationTier {
    fn from(value: u8) -> Self {
        match value {
            0 => VerificationTier::Automated,
            1 => VerificationTier::Specialized,
            2 => VerificationTier::Comprehensive,
            _ => VerificationTier::Automated,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum EvidenceType {
    Contract = 0,
    Communication,
    Deliverable,
    Payment,
    Timeline,
    QualityAssessment,
    ExpertOpinion,
    Other,
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ClaimData {
    pub claim_type: ClaimType,            // Type of claim being filed
    pub claimant: Pubkey,                 // User filing the claim
    pub respondent: Pubkey,               // User the claim is against
    pub policy_id: Pubkey,                // Associated insurance policy
    pub contract_id: Option<Pubkey>,      // Associated smart contract (if applicable)
    pub claim_amount: u64,                // Amount being claimed
    pub description: String,              // Description of the claim
    pub required_evidence_types: Vec<EvidenceType>, // Types of evidence required for this claim
}

impl ClaimData {
    pub const MAX_EVIDENCE_TYPES: usize = 10;
    
    pub fn space() -> usize {
        1 +          // claim_type: ClaimType
        32 +         // claimant: Pubkey
        32 +         // respondent: Pubkey
        32 +         // policy_id: Pubkey
        1 + 32 +     // contract_id: Option<Pubkey>
        8 +          // claim_amount: u64
        4 + 500 +    // description: String (max 500 chars)
        4 + Self::MAX_EVIDENCE_TYPES // required_evidence_types: Vec<EvidenceType>
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ClaimEvidence {
    pub evidence_hash: [u8; 32],      // Hash of the evidence
    pub evidence_type: EvidenceType,  // Type of evidence
    pub submitted_by: Pubkey,         // User who submitted this evidence
    pub timestamp: i64,               // When the evidence was submitted
    pub uri: String,                  // URI to the evidence (typically IPFS or Arweave)
    pub verified: bool,               // Whether this evidence has been verified
    pub verifier: Option<Pubkey>,     // Who verified this evidence (if applicable)
}

impl ClaimEvidence {
    pub fn space() -> usize {
        32 +         // evidence_hash: [u8; 32]
        1 +          // evidence_type: EvidenceType
        32 +         // submitted_by: Pubkey
        8 +          // timestamp: i64
        4 + 100 +    // uri: String (max 100 chars)
        1 +          // verified: bool
        1 + 32       // verifier: Option<Pubkey>
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum ValidationResult {
    Valid = 0,
    Invalid,
    PartiallyValid,
    NeedsMoreEvidence,
    Fraudulent,
}

impl From<u8> for ValidationResult {
    fn from(value: u8) -> Self {
        match value {
            0 => ValidationResult::Valid,
            1 => ValidationResult::Invalid,
            2 => ValidationResult::PartiallyValid,
            3 => ValidationResult::NeedsMoreEvidence,
            4 => ValidationResult::Fraudulent,
            _ => ValidationResult::NeedsMoreEvidence,
        }
    }
}

#[account]
pub struct ClaimVerification {
    pub claim_data: ClaimData,                // Data about the claim
    pub status: ClaimStatus,                  // Current status of the claim
    pub verification_tier: VerificationTier,  // Level of verification required
    pub evidence: Vec<ClaimEvidence>,         // Evidence submitted for this claim
    pub validations: Vec<ClaimValidation>,    // Validations from verifiers
    pub created_at: i64,                      // When this claim was created
    pub last_updated: i64,                    // When this claim was last updated
    pub auto_verification_result: Option<ValidationResult>, // Result of automated verification
    pub verification_deadline: i64,           // Deadline for verification
    pub fraud_flags: u8,                      // Bitmask of potential fraud indicators
    pub bump: u8,                             // PDA bump
}

impl ClaimVerification {
    pub const MAX_EVIDENCE: usize = 20;
    pub const MAX_VALIDATIONS: usize = 5;
    
    pub fn space() -> usize {
        8 +                                                      // Discriminator
        ClaimData::space() +                                     // claim_data: ClaimData
        1 +                                                      // status: ClaimStatus
        1 +                                                      // verification_tier: VerificationTier
        4 + (ClaimEvidence::space() * Self::MAX_EVIDENCE) +     // evidence: Vec<ClaimEvidence>
        4 + (ClaimValidation::space() * Self::MAX_VALIDATIONS) + // validations: Vec<ClaimValidation>
        8 +                                                      // created_at: i64
        8 +                                                      // last_updated: i64
        1 + 1 +                                                  // auto_verification_result: Option<ValidationResult>
        8 +                                                      // verification_deadline: i64
        1 +                                                      // fraud_flags: u8
        1                                                        // bump: u8
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ClaimValidation {
    pub verifier: Pubkey,                // User who validated this claim
    pub timestamp: i64,                  // When the validation occurred
    pub result: ValidationResult,        // Result of the validation
    pub comments: String,                // Comments from the verifier
    pub evidence_references: Vec<u8>,    // Indices of evidence items referenced in this validation
}

impl ClaimValidation {
    pub const MAX_EVIDENCE_REFS: usize = 10;
    
    pub fn space() -> usize {
        32 +                                  // verifier: Pubkey
        8 +                                   // timestamp: i64
        1 +                                   // result: ValidationResult
        4 + 200 +                            // comments: String (max 200 chars)
        4 + Self::MAX_EVIDENCE_REFS          // evidence_references: Vec<u8>
    }
}

// Verifier Structures
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum VerifierType {
    General = 0,
    Expert,
    Automated,
    Oracle,
    Arbitrator,
}

impl From<u8> for VerifierType {
    fn from(value: u8) -> Self {
        match value {
            0 => VerifierType::General,
            1 => VerifierType::Expert,
            2 => VerifierType::Automated,
            3 => VerifierType::Oracle,
            4 => VerifierType::Arbitrator,
            _ => VerifierType::General,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum ExpertiseArea {
    Software = 0,
    Design,
    Writing,
    Translation,
    Marketing,
    Legal,
    Financial,
    Administrative,
    CustomerSupport,
    Engineering,
    Other,
}

impl From<u8> for ExpertiseArea {
    fn from(value: u8) -> Self {
        match value {
            0 => ExpertiseArea::Software,
            1 => ExpertiseArea::Design,
            2 => ExpertiseArea::Writing,
            3 => ExpertiseArea::Translation,
            4 => ExpertiseArea::Marketing,
            5 => ExpertiseArea::Legal,
            6 => ExpertiseArea::Financial,
            7 => ExpertiseArea::Administrative,
            8 => ExpertiseArea::CustomerSupport,
            9 => ExpertiseArea::Engineering,
            _ => ExpertiseArea::Other,
        }
    }
}

#[account]
pub struct Verifier {
    pub user: Pubkey,                      // The user who is a verifier
    pub verifier_type: VerifierType,       // Type of verifier
    pub expertise: Vec<ExpertiseArea>,     // Areas of expertise
    pub reputation_score: u64,             // Reputation score as a verifier
    pub successful_verifications: u32,     // Number of successful verifications
    pub stake_amount: u64,                 // Amount staked to become a verifier
    pub is_active: bool,                   // Whether this verifier is currently active
    pub created_at: i64,                   // When this verifier was created
    pub last_updated: i64,                 // When this verifier was last updated
    pub bump: u8,                          // PDA bump
}

impl Verifier {
    pub const MAX_EXPERTISE_AREAS: usize = 5;
    
    pub fn space() -> usize {
        8 +                                                      // Discriminator
        32 +                                                     // user: Pubkey
        1 +                                                      // verifier_type: VerifierType
        4 + Self::MAX_EXPERTISE_AREAS +                         // expertise: Vec<ExpertiseArea>
        8 +                                                      // reputation_score: u64
        4 +                                                      // successful_verifications: u32
        8 +                                                      // stake_amount: u64
        1 +                                                      // is_active: bool
        8 +                                                      // created_at: i64
        8 +                                                      // last_updated: i64
        1                                                        // bump: u8
    }
}

// Fraud Reporting Structures
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum FraudType {
    FakeIdentity = 0,
    CollaborativeFraud,
    IdentityTheft,
    FalseClaim,
    InflatedClaim,
    ContractManipulation,
    EvidenceFalsification,
    SystemExploitation,
    Other,
}

impl From<u8> for FraudType {
    fn from(value: u8) -> Self {
        match value {
            0 => FraudType::FakeIdentity,
            1 => FraudType::CollaborativeFraud,
            2 => FraudType::IdentityTheft,
            3 => FraudType::FalseClaim,
            4 => FraudType::InflatedClaim,
            5 => FraudType::ContractManipulation,
            6 => FraudType::EvidenceFalsification,
            7 => FraudType::SystemExploitation,
            _ => FraudType::Other,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum FraudReportStatus {
    Reported = 0,
    UnderInvestigation,
    Confirmed,
    Dismissed,
    ActionTaken,
    BountyAwarded,
    Closed,
}

impl From<u8> for FraudReportStatus {
    fn from(value: u8) -> Self {
        match value {
            0 => FraudReportStatus::Reported,
            1 => FraudReportStatus::UnderInvestigation,
            2 => FraudReportStatus::Confirmed,
            3 => FraudReportStatus::Dismissed,
            4 => FraudReportStatus::ActionTaken,
            5 => FraudReportStatus::BountyAwarded,
            6 => FraudReportStatus::Closed,
            _ => FraudReportStatus::Reported,
        }
    }
}

#[account]
pub struct FraudReport {
    pub reporter: Pubkey,                  // User reporting the fraud
    pub reported_user: Pubkey,             // User being reported for fraud
    pub fraud_type: FraudType,             // Type of fraud being reported
    pub related_claim: Option<Pubkey>,     // Related claim (if applicable)
    pub evidence_hash: [u8; 32],           // Hash of the evidence
    pub description: String,               // Description of the fraud
    pub uri: String,                       // URI to the evidence (typically IPFS or Arweave)
    pub status: FraudReportStatus,         // Current status of the report
    pub investigators: Vec<Pubkey>,        // Users investigating this report
    pub created_at: i64,                   // When this report was created
    pub last_updated: i64,                 // When this report was last updated
    pub is_bounty_claimed: bool,           // Whether a bounty has been claimed for this report
    pub bounty_claimer: Option<Pubkey>,    // User who claimed the bounty (if applicable)
    pub actions_taken: String,             // Description of actions taken
    pub bump: u8,                          // PDA bump
}

impl FraudReport {
    pub const MAX_INVESTIGATORS: usize = 3;
    
    pub fn space() -> usize {
        8 +                                                      // Discriminator
        32 +                                                     // reporter: Pubkey
        32 +                                                     // reported_user: Pubkey
        1 +                                                      // fraud_type: FraudType
        1 + 32 +                                                 // related_claim: Option<Pubkey>
        32 +                                                     // evidence_hash: [u8; 32]
        4 + 500 +                                                // description: String (max 500 chars)
        4 + 100 +                                                // uri: String (max 100 chars)
        1 +                                                      // status: FraudReportStatus
        4 + (32 * Self::MAX_INVESTIGATORS) +                     // investigators: Vec<Pubkey>
        8 +                                                      // created_at: i64
        8 +                                                      // last_updated: i64
        1 +                                                      // is_bounty_claimed: bool
        1 + 32 +                                                 // bounty_claimer: Option<Pubkey>
        4 + 200 +                                                // actions_taken: String (max 200 chars)
        1                                                        // bump: u8
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct BountyDetails {
    pub title: String,                     // Title of the bounty
    pub description: String,               // Description of what constitutes valid detection
    pub criteria: String,                  // Criteria for successful bounty claim
    pub expiry: Option<i64>,               // When this bounty expires (if applicable)
}

impl BountyDetails {
    pub fn space() -> usize {
        4 + 100 +    // title: String (max 100 chars)
        4 + 500 +    // description: String (max 500 chars)
        4 + 300 +    // criteria: String (max 300 chars)
        1 + 8        // expiry: Option<i64>
    }
}

#[account]
pub struct FraudBounty {
    pub creator: Pubkey,                   // User who created the bounty
    pub details: BountyDetails,            // Details of the bounty
    pub reward_amount: u64,                // Amount of reward for successful detection
    pub is_claimed: bool,                  // Whether this bounty has been claimed
    pub claimer: Option<Pubkey>,           // User who claimed the bounty (if applicable)
    pub related_fraud_report: Option<Pubkey>, // Fraud report that resulted in this bounty being claimed
    pub created_at: i64,                   // When this bounty was created
    pub claimed_at: Option<i64>,           // When this bounty was claimed (if applicable)
    pub bump: u8,                          // PDA bump
}

impl FraudBounty {
    pub fn space() -> usize {
        8 +                                 // Discriminator
        32 +                                // creator: Pubkey
        BountyDetails::space() +            // details: BountyDetails
        8 +                                 // reward_amount: u64
        1 +                                 // is_claimed: bool
        1 + 32 +                            // claimer: Option<Pubkey>
        1 + 32 +                            // related_fraud_report: Option<Pubkey>
        8 +                                 // created_at: i64
        1 + 8 +                             // claimed_at: Option<i64>
        1                                   // bump: u8
    }
}
