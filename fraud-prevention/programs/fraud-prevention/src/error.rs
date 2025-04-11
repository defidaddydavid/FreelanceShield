use anchor_lang::prelude::*;

#[error_code]
pub enum FraudPreventionError {
    #[msg("Operation not allowed")]
    Unauthorized,
    
    #[msg("Invalid verification level")]
    InvalidVerificationLevel,
    
    #[msg("Invalid KYC data")]
    InvalidKycData,
    
    #[msg("Max verifications reached")]
    MaxVerificationsReached,
    
    #[msg("Max vouchers reached")]
    MaxVouchersReached,
    
    #[msg("Invalid social data")]
    InvalidSocialData,
    
    #[msg("Voucher reputation too low")]
    VoucherReputationTooLow,
    
    #[msg("Same voucher cannot vouch twice")]
    DuplicateVoucher,
    
    #[msg("Invalid risk factor")]
    InvalidRiskFactor,
    
    #[msg("Risk factor already exists")]
    RiskFactorAlreadyExists,
    
    #[msg("Invalid claim type")]
    InvalidClaimType,
    
    #[msg("Invalid claim status")]
    InvalidClaimStatus,
    
    #[msg("Invalid verification tier")]
    InvalidVerificationTier,
    
    #[msg("Invalid evidence type")]
    InvalidEvidenceType,
    
    #[msg("Evidence already exists")]
    EvidenceAlreadyExists,
    
    #[msg("Max evidence reached")]
    MaxEvidenceReached,
    
    #[msg("Claim verification deadline passed")]
    VerificationDeadlinePassed,
    
    #[msg("Insufficient verifications")]
    InsufficientVerifications,
    
    #[msg("Not a verifier")]
    NotVerifier,
    
    #[msg("Verifier not active")]
    VerifierNotActive,
    
    #[msg("Invalid expertise area")]
    InvalidExpertiseArea,
    
    #[msg("Max expertise areas reached")]
    MaxExpertiseAreasReached,
    
    #[msg("Insufficient stake")]
    InsufficientStake,
    
    #[msg("Invalid fraud type")]
    InvalidFraudType,
    
    #[msg("Invalid fraud report status")]
    InvalidFraudReportStatus,
    
    #[msg("Max investigators reached")]
    MaxInvestigatorsReached,
    
    #[msg("Bounty already claimed")]
    BountyAlreadyClaimed,
    
    #[msg("Fraud report not confirmed")]
    FraudReportNotConfirmed,
    
    #[msg("Invalid bounty details")]
    InvalidBountyDetails,
    
    #[msg("Bounty expired")]
    BountyExpired,
    
    #[msg("Self-vouching not allowed")]
    SelfVouchingNotAllowed,
    
    #[msg("Self-reporting not allowed")]
    SelfReportingNotAllowed,
    
    #[msg("Invalid oracle signature")]
    InvalidOracleSignature,
    
    #[msg("Unauthorized program")]
    UnauthorizedProgram,
}
