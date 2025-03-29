use anchor_lang::prelude::*;
use crate::state::*;
use crate::InsuranceError;

#[derive(Accounts)]
pub struct SubmitClaim<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        constraint = policy.owner == owner.key() @ InsuranceError::OnlyPolicyOwner,
        constraint = policy.status == PolicyStatus::Active @ InsuranceError::PolicyNotActive
    )]
    pub policy: Account<'info, Policy>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + std::mem::size_of::<Claim>() + 
                MAX_EVIDENCE_TYPE_LENGTH + 
                MAX_EVIDENCE_DESC_LENGTH + 
                (MAX_EVIDENCE_ATTACHMENTS * MAX_ATTACHMENT_LENGTH),
        seeds = [CLAIM_SEED.as_bytes(), policy.key().as_ref(), &[policy.claims_count]],
        bump
    )]
    pub claim: Account<'info, Claim>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<SubmitClaim>,
    amount: u64,
    evidence_type: String,
    evidence_description: String,
    evidence_attachments: Vec<String>,
) -> Result<()> {
    let claim = &mut ctx.accounts.claim;
    let policy = &mut ctx.accounts.policy;
    let owner = &ctx.accounts.owner;
    let clock = Clock::get()?;
    
    // Validate policy is active (constraint already checked)
    
    // Validate claim amount
    require!(
        amount <= policy.coverage_amount,
        InsuranceError::ClaimExceedsCoverage
    );
    
    // Validate policy hasn't expired
    require!(
        clock.unix_timestamp <= policy.end_date,
        InsuranceError::PolicyExpired
    );
    
    // Set claim details
    claim.policy = policy.key();
    claim.owner = owner.key();
    claim.amount = amount;
    claim.status = ClaimStatus::Pending;
    claim.evidence_type = evidence_type;
    claim.evidence_description = evidence_description;
    claim.evidence_attachments = evidence_attachments;
    claim.submission_date = clock.unix_timestamp;
    claim.verdict = None;
    claim.bump = *ctx.bumps.get("claim").unwrap();
    
    // Update policy claims count
    policy.claims_count += 1;
    
    Ok(())
}

