use anchor_lang::prelude::*;
use crate::state::*;
use crate::utils::*;
use crate::FreelanceShieldError;

/// Accounts for submitting an insurance claim
#[derive(Accounts)]
pub struct SubmitClaim<'info> {
    /// Claim owner (must be the policy owner)
    #[account(
        mut,
        constraint = policy.owner == owner.key() @ FreelanceShieldError::Unauthorized
    )]
    pub owner: Signer<'info>,
    
    /// Program state PDA
    #[account(
        mut,
        seeds = [ProgramState::SEED_PREFIX],
        bump = program_state.bump,
        constraint = !program_state.is_paused @ FreelanceShieldError::ProgramPaused
    )]
    pub program_state: Account<'info, ProgramState>,
    
    /// Policy account PDA
    #[account(
        mut,
        seeds = [
            Policy::SEED_PREFIX, 
            policy.owner.as_ref(),
            policy.product_id.as_ref()
        ],
        bump = policy.bump,
        constraint = policy.status == PolicyStatus::Active @ FreelanceShieldError::PolicyNotActive,
        constraint = Clock::get()?.unix_timestamp <= policy.claim_period_end @ FreelanceShieldError::ClaimPeriodEnded
    )]
    pub policy: Account<'info, Policy>,
    
    /// Claim account PDA
    #[account(
        init,
        payer = owner,
        space = Claim::BASE_SIZE + 
                // Estimate space for evidence_hashes (assume max 5 hashes of 64 chars each)
                (4 + (MAX_EVIDENCE_ATTACHMENTS * (4 + MAX_EVIDENCE_HASH_LENGTH))) +
                // Estimate space for votes (assume max 10 votes)
                (4 + (10 * Vote::SIZE)),
        seeds = [
            Claim::SEED_PREFIX,
            policy.key().as_ref(),
            &[policy.claims_count]
        ],
        bump
    )]
    pub claim: Account<'info, Claim>,
    
    /// System program
    pub system_program: Program<'info, System>,
}

/// Submit an insurance claim
pub fn handler(ctx: Context<SubmitClaim>, params: SubmitClaimParams) -> Result<()> {
    let clock = Clock::get()?;
    let claim = &mut ctx.accounts.claim;
    let policy = &mut ctx.accounts.policy;
    let program_state = &mut ctx.accounts.program_state;
    
    // Validate claim parameters
    require!(
        params.amount <= policy.coverage_amount,
        FreelanceShieldError::InvalidClaimAmount
    );
    
    require!(
        params.evidence_type.len() <= 64,
        FreelanceShieldError::InvalidEvidenceType
    );
    
    require!(
        params.evidence_description.len() <= MAX_EVIDENCE_DESCRIPTION_LENGTH,
        FreelanceShieldError::InvalidEvidenceDescription
    );
    
    require!(
        params.evidence_hashes.len() <= MAX_EVIDENCE_ATTACHMENTS,
        FreelanceShieldError::TooManyEvidenceAttachments
    );
    
    for hash in &params.evidence_hashes {
        require!(
            hash.len() <= MAX_EVIDENCE_HASH_LENGTH,
            FreelanceShieldError::InvalidEvidenceHash
        );
    }
    
    // Initialize claim
    claim.policy = ctx.accounts.policy.key();
    claim.owner = ctx.accounts.owner.key();
    claim.amount = params.amount;
    claim.status = ClaimStatus::Pending;
    claim.evidence_type = params.evidence_type;
    claim.evidence_description = params.evidence_description;
    claim.evidence_hashes = params.evidence_hashes;
    claim.submission_date = clock.unix_timestamp;
    claim.category = params.claim_category;
    claim.verdict = None;
    claim.votes = Vec::new();
    
    // Set voting end date
    claim.voting_end_date = clock.unix_timestamp + (program_state.voting_period_days as i64 * 86400);
    
    claim.transaction_signature = None;
    
    // Calculate risk score for fraud detection (0-100)
    // This is a simplified version - in a real implementation, this would use more sophisticated fraud detection
    let risk_score = calculate_claim_risk_score(
        policy.risk_score,
        params.amount,
        policy.coverage_amount,
        policy.end_date - policy.start_date,
        clock.unix_timestamp - policy.start_date
    )?;
    
    claim.risk_score = risk_score;
    claim.creation_slot = clock.slot;
    claim.last_update_slot = clock.slot;
    claim.bump = *ctx.bumps.get("claim").unwrap();
    
    // Update policy
    policy.claims_count += 1;
    policy.status = PolicyStatus::ClaimPending;
    
    // Determine if claim can be auto-processed based on risk score and amount
    if risk_score <= program_state.auto_process_threshold && 
       params.amount <= program_state.auto_claim_limit {
        // Auto-approve the claim
        claim.status = ClaimStatus::Approved;
        claim.verdict = Some(Verdict {
            approved: true,
            reason: "Auto-approved based on low risk score and amount within auto-approval limit".to_string(),
            processed_at: clock.unix_timestamp,
            processor: ProcessorType::Automated,
        });
        
        // Update program statistics
        program_state.approved_claims += 1;
    } else {
        // Send to community voting
        claim.status = ClaimStatus::PendingVote;
    }
    
    msg!("Claim submitted: Amount: {}, Risk Score: {}", params.amount, risk_score);
    Ok(())
}

