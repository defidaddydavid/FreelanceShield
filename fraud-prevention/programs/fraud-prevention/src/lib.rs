use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Token};

declare_id!("FrDpveRvsGksRPUeehKQYJkXKMRh64pNaEMgnV9yW8S");

mod state;
mod instructions;
mod error;
mod utils;

use state::*;
use instructions::*;
use error::*;
use utils::*;

#[program]
pub mod fraud_prevention {
    use super::*;

    /// Initialize a new identity verification account for a user
    pub fn initialize_identity(
        ctx: Context<InitializeIdentity>,
        verification_level: u8,
        user_info: UserInfo,
    ) -> Result<()> {
        instructions::identity::initialize_identity(ctx, verification_level, user_info)
    }

    /// Update a user's identity verification level
    pub fn update_verification_level(
        ctx: Context<UpdateVerificationLevel>,
        new_level: u8,
        verification_data: VerificationData,
    ) -> Result<()> {
        instructions::identity::update_verification_level(ctx, new_level, verification_data)
    }

    /// Add verification from an authorized KYC provider
    pub fn add_kyc_verification(
        ctx: Context<AddVerification>,
        verification_data: VerificationData,
    ) -> Result<()> {
        instructions::identity::add_kyc_verification(ctx, verification_data)
    }

    /// Add social verification (linking social accounts for credibility)
    pub fn add_social_verification(
        ctx: Context<AddVerification>,
        social_data: SocialData,
    ) -> Result<()> {
        instructions::identity::add_social_verification(ctx, social_data)
    }

    /// Add a trusted voucher to increase a user's credibility
    pub fn add_social_vouching(
        ctx: Context<AddSocialVouching>,
        vouching_statement: String,
    ) -> Result<()> {
        instructions::identity::add_social_vouching(ctx, vouching_statement)
    }

    /// Initialize a new risk assessment account for a user
    pub fn initialize_risk_assessment(
        ctx: Context<InitializeRiskAssessment>,
    ) -> Result<()> {
        instructions::risk::initialize_risk_assessment(ctx)
    }

    /// Update a user's risk score based on new data
    pub fn update_risk_score(
        ctx: Context<UpdateRiskScore>,
        risk_factor: RiskFactor,
        value: i32,
    ) -> Result<()> {
        instructions::risk::update_risk_score(ctx, risk_factor, value)
    }

    /// Initialize a new claim verification process
    pub fn initialize_claim_verification(
        ctx: Context<InitializeClaimVerification>,
        claim_data: ClaimData,
    ) -> Result<()> {
        instructions::claim::initialize_claim_verification(ctx, claim_data)
    }

    /// Add evidence to a claim verification process
    pub fn add_claim_evidence(
        ctx: Context<AddClaimEvidence>,
        evidence_hash: [u8; 32],
        evidence_type: EvidenceType,
        uri: String,
    ) -> Result<()> {
        instructions::claim::add_claim_evidence(ctx, evidence_hash, evidence_type, uri)
    }

    /// Submit validation for a claim by a verifier
    pub fn validate_claim(
        ctx: Context<ValidateClaim>,
        validation_result: ValidationResult,
        comments: String,
    ) -> Result<()> {
        instructions::claim::validate_claim(ctx, validation_result, comments)
    }

    /// Process automated verification of a claim using on-chain data
    pub fn auto_verify_claim(
        ctx: Context<AutoVerifyClaim>,
    ) -> Result<()> {
        instructions::claim::auto_verify_claim(ctx)
    }

    /// Initialize a new verifier for the system
    pub fn initialize_verifier(
        ctx: Context<InitializeVerifier>,
        verifier_type: VerifierType,
        expertise_areas: Vec<ExpertiseArea>,
    ) -> Result<()> {
        instructions::verifiers::initialize_verifier(ctx, verifier_type, expertise_areas)
    }

    /// Stake tokens to become a verifier
    pub fn stake_for_verification(
        ctx: Context<StakeForVerification>,
        amount: u64,
    ) -> Result<()> {
        instructions::verifiers::stake_for_verification(ctx, amount)
    }

    /// Report fraudulent behavior
    pub fn report_fraud(
        ctx: Context<ReportFraud>,
        fraud_type: FraudType,
        evidence_hash: [u8; 32],
        description: String,
        uri: String,
    ) -> Result<()> {
        instructions::fraud::report_fraud(ctx, fraud_type, evidence_hash, description, uri)
    }

    /// Initialize a new fraud detection bounty
    pub fn create_fraud_bounty(
        ctx: Context<CreateFraudBounty>,
        bounty_details: BountyDetails,
        reward_amount: u64,
    ) -> Result<()> {
        instructions::fraud::create_fraud_bounty(ctx, bounty_details, reward_amount)
    }

    /// Claim a bounty for detecting fraud
    pub fn claim_fraud_bounty(
        ctx: Context<ClaimFraudBounty>,
        fraud_report_id: Pubkey,
        evidence_hash: [u8; 32],
    ) -> Result<()> {
        instructions::fraud::claim_fraud_bounty(ctx, fraud_report_id, evidence_hash)
    }
}
