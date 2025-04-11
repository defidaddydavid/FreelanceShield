use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;
use crate::utils::*;

// Initialize a new claim verification process
pub fn initialize_claim_verification(
    ctx: Context<InitializeClaimVerification>,
    claim_data: ClaimData,
) -> Result<()> {
    let claim_verification = &mut ctx.accounts.claim_verification;
    let claimant = &ctx.accounts.claimant;
    let clock = Clock::get()?;
    
    // Determine verification tier based on claim amount and type
    let verification_tier = match claim_data.claim_amount {
        amount if amount < 100_000 => VerificationTier::Automated,
        amount if amount < 1_000_000 => VerificationTier::Specialized,
        _ => VerificationTier::Comprehensive,
    };
    
    // Set up the claim verification account
    claim_verification.claim_data = claim_data;
    claim_verification.status = ClaimStatus::Initiated;
    claim_verification.verification_tier = verification_tier;
    claim_verification.evidence = Vec::new();
    claim_verification.validations = Vec::new();
    claim_verification.created_at = clock.unix_timestamp;
    claim_verification.last_updated = clock.unix_timestamp;
    claim_verification.auto_verification_result = None;
    
    // Set deadline based on verification tier
    claim_verification.verification_deadline = match verification_tier {
        VerificationTier::Automated => clock.unix_timestamp + 86_400,      // 1 day
        VerificationTier::Specialized => clock.unix_timestamp + 259_200,   // 3 days
        VerificationTier::Comprehensive => clock.unix_timestamp + 604_800, // 7 days
    };
    
    claim_verification.fraud_flags = 0;
    claim_verification.bump = *ctx.bumps.get("claim_verification").unwrap();
    
    // Update claim status to evidence gathering
    claim_verification.status = ClaimStatus::EvidenceGathering;
    
    msg!("Claim verification initialized for claim amount: {}", claim_data.claim_amount);
    msg!("Verification tier: {:?}", verification_tier);
    Ok(())
}

// Add evidence to a claim verification process
pub fn add_claim_evidence(
    ctx: Context<AddClaimEvidence>,
    evidence_hash: [u8; 32],
    evidence_type: EvidenceType,
    uri: String,
) -> Result<()> {
    let claim_verification = &mut ctx.accounts.claim_verification;
    let submitter = &ctx.accounts.submitter;
    let clock = Clock::get()?;
    
    // Check if the evidence hash already exists
    if claim_verification.evidence.iter().any(|e| e.evidence_hash == evidence_hash) {
        return Err(error!(FraudPreventionError::EvidenceAlreadyExists));
    }
    
    // Check if we've reached the maximum number of evidence items
    if claim_verification.evidence.len() >= ClaimVerification::MAX_EVIDENCE {
        return Err(error!(FraudPreventionError::MaxEvidenceReached));
    }
    
    // Check if the submitter is either the claimant or respondent
    let is_claimant = submitter.key() == claim_verification.claim_data.claimant;
    let is_respondent = submitter.key() == claim_verification.claim_data.respondent;
    
    if !is_claimant && !is_respondent {
        // The submitter must be a verified verifier to submit evidence if not involved
        // This would need to check against the verifier account, simplified here
        // In a real implementation, you would check that the submitter is a verifier
        // TODO: Implement verifier check
    }
    
    // Create the evidence item
    let evidence = ClaimEvidence {
        evidence_hash,
        evidence_type,
        submitted_by: submitter.key(),
        timestamp: clock.unix_timestamp,
        uri,
        verified: false,
        verifier: None,
    };
    
    // Add the evidence
    claim_verification.evidence.push(evidence);
    
    // Update the last updated timestamp
    claim_verification.last_updated = clock.unix_timestamp;
    
    // If this is the first evidence submitted, check if the evidence type matches required types
    if claim_verification.evidence.len() == 1 {
        let is_required = claim_verification.claim_data.required_evidence_types
            .contains(&evidence_type);
        
        if !is_required {
            // Flag potential issue - first evidence not of required type
            claim_verification.fraud_flags |= 1; // Set first bit
        }
    }
    
    // Check if all required evidence types have been submitted
    let mut required_types_submitted = true;
    for required_type in &claim_verification.claim_data.required_evidence_types {
        let has_type = claim_verification.evidence.iter()
            .any(|e| e.evidence_type as u8 == *required_type as u8);
        
        if !has_type {
            required_types_submitted = false;
            break;
        }
    }
    
    // If all required evidence is submitted and status is still in evidence gathering,
    // move to under review
    if required_types_submitted && 
       claim_verification.status == ClaimStatus::EvidenceGathering {
        claim_verification.status = ClaimStatus::UnderReview;
    }
    
    msg!("Evidence added to claim verification: {:?}", evidence_type);
    Ok(())
}

// Submit validation for a claim by a verifier
pub fn validate_claim(
    ctx: Context<ValidateClaim>,
    validation_result: ValidationResult,
    comments: String,
) -> Result<()> {
    let claim_verification = &mut ctx.accounts.claim_verification;
    let verifier = &ctx.accounts.verifier;
    let verifier_account = &ctx.accounts.verifier_account;
    let clock = Clock::get()?;
    
    // Check if the verification deadline has passed
    if clock.unix_timestamp > claim_verification.verification_deadline {
        return Err(error!(FraudPreventionError::VerificationDeadlinePassed));
    }
    
    // Check if the verifier is active
    if !verifier_account.is_active {
        return Err(error!(FraudPreventionError::VerifierNotActive));
    }
    
    // Check if claim status allows validation
    if claim_verification.status != ClaimStatus::UnderReview &&
       claim_verification.status != ClaimStatus::AdditionalEvidenceRequested {
        return Err(error!(FraudPreventionError::InvalidClaimStatus));
    }
    
    // Check if verifier has already submitted a validation
    if claim_verification.validations.iter().any(|v| v.verifier == verifier.key()) {
        // Instead of error, we could update the existing validation
        // For simplicity, we'll just return an error
        return Err(error!(FraudPreventionError::DuplicateVoucher));
    }
    
    // Check if the maximum number of validations has been reached
    if claim_verification.validations.len() >= ClaimVerification::MAX_VALIDATIONS {
        return Err(error!(FraudPreventionError::MaxVerificationsReached));
    }
    
    // Create the validation
    let validation = ClaimValidation {
        verifier: verifier.key(),
        timestamp: clock.unix_timestamp,
        result: validation_result,
        comments,
        evidence_references: Vec::new(), // Not used in this basic implementation
    };
    
    // Add the validation
    claim_verification.validations.push(validation);
    
    // Update the last updated timestamp
    claim_verification.last_updated = clock.unix_timestamp;
    
    // Determine the new status based on the validation result
    match validation_result {
        ValidationResult::Valid => {
            // If there are enough validations, mark the claim as validated
            if claim_verification.validations.len() >= 2 {
                claim_verification.status = ClaimStatus::Validated;
            }
        },
        ValidationResult::Invalid => {
            // If there are enough validations, mark the claim as rejected
            if claim_verification.validations.len() >= 2 {
                claim_verification.status = ClaimStatus::Rejected;
            }
        },
        ValidationResult::PartiallyValid => {
            // Keep the claim under review
        },
        ValidationResult::NeedsMoreEvidence => {
            // Request additional evidence
            claim_verification.status = ClaimStatus::AdditionalEvidenceRequested;
        },
        ValidationResult::Fraudulent => {
            // Mark the claim as potentially fraudulent and reject it
            claim_verification.fraud_flags |= 2; // Set second bit
            claim_verification.status = ClaimStatus::Rejected;
        },
    }
    
    msg!("Claim validation submitted: {:?}", validation_result);
    Ok(())
}

// Process automated verification of a claim using on-chain data
pub fn auto_verify_claim(
    ctx: Context<AutoVerifyClaim>,
) -> Result<()> {
    let claim_verification = &mut ctx.accounts.claim_verification;
    let claimant_identity = &ctx.accounts.claimant_identity;
    let claimant_risk = &ctx.accounts.claimant_risk;
    let clock = Clock::get()?;
    
    // Only automated tier claims can use auto-verification
    if claim_verification.verification_tier != VerificationTier::Automated {
        return Err(error!(FraudPreventionError::InvalidVerificationTier));
    }
    
    // Calculate the auto-verification result
    let verification_result = auto_verify_claim(
        claim_verification,
        claimant_identity,
        claimant_risk,
    );
    
    // Store the auto-verification result
    claim_verification.auto_verification_result = Some(verification_result);
    
    // Update claim status based on result
    match verification_result {
        ValidationResult::Valid => {
            claim_verification.status = ClaimStatus::Validated;
        },
        ValidationResult::Invalid | ValidationResult::Fraudulent => {
            claim_verification.status = ClaimStatus::Rejected;
            
            if verification_result == ValidationResult::Fraudulent {
                claim_verification.fraud_flags |= 4; // Set third bit
            }
        },
        ValidationResult::PartiallyValid => {
            // For partially valid claims, keep under review but add a human verifier
            claim_verification.status = ClaimStatus::UnderReview;
        },
        ValidationResult::NeedsMoreEvidence => {
            claim_verification.status = ClaimStatus::AdditionalEvidenceRequested;
        },
    }
    
    // Update the last updated timestamp
    claim_verification.last_updated = clock.unix_timestamp;
    
    msg!("Auto-verification result: {:?}", verification_result);
    Ok(())
}

// Context for initializing a claim verification
#[derive(Accounts)]
pub struct InitializeClaimVerification<'info> {
    #[account(mut)]
    pub claimant: Signer<'info>,
    
    /// CHECK: The other party in the claim (only checked in the instruction)
    pub respondent: AccountInfo<'info>,
    
    #[account(
        init,
        payer = claimant,
        space = ClaimVerification::space(),
        seeds = [
            b"claim",
            claimant.key().as_ref(),
            &Clock::get()?.unix_timestamp.to_le_bytes()
        ],
        bump,
    )]
    pub claim_verification: Account<'info, ClaimVerification>,
    
    pub system_program: Program<'info, System>,
}

// Context for adding claim evidence
#[derive(Accounts)]
pub struct AddClaimEvidence<'info> {
    #[account(mut)]
    pub submitter: Signer<'info>,
    
    #[account(
        mut,
        seeds = [
            b"claim",
            claim_verification.claim_data.claimant.as_ref(),
            &claim_verification.created_at.to_le_bytes()
        ],
        bump = claim_verification.bump,
    )]
    pub claim_verification: Account<'info, ClaimVerification>,
}

// Context for validating a claim
#[derive(Accounts)]
pub struct ValidateClaim<'info> {
    #[account(mut)]
    pub verifier: Signer<'info>,
    
    #[account(
        seeds = [b"verifier", verifier.key().as_ref()],
        bump = verifier_account.bump,
        constraint = verifier_account.user == verifier.key()
    )]
    pub verifier_account: Account<'info, Verifier>,
    
    #[account(
        mut,
        seeds = [
            b"claim",
            claim_verification.claim_data.claimant.as_ref(),
            &claim_verification.created_at.to_le_bytes()
        ],
        bump = claim_verification.bump,
    )]
    pub claim_verification: Account<'info, ClaimVerification>,
}

// Context for auto-verifying a claim
#[derive(Accounts)]
pub struct AutoVerifyClaim<'info> {
    #[account(mut)]
    pub auth_program: Signer<'info>,
    
    #[account(
        mut,
        seeds = [
            b"claim",
            claim_verification.claim_data.claimant.as_ref(),
            &claim_verification.created_at.to_le_bytes()
        ],
        bump = claim_verification.bump,
    )]
    pub claim_verification: Account<'info, ClaimVerification>,
    
    #[account(
        seeds = [b"identity", claim_verification.claim_data.claimant.as_ref()],
        bump,
    )]
    pub claimant_identity: Account<'info, IdentityAccount>,
    
    #[account(
        seeds = [b"risk", claim_verification.claim_data.claimant.as_ref()],
        bump,
    )]
    pub claimant_risk: Account<'info, RiskAssessment>,
}
