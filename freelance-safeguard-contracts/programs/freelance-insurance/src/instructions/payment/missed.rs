use anchor_lang::prelude::*;
use crate::state::*;
use crate::InsuranceError;

#[derive(Accounts)]
pub struct TriggerMissedPaymentClaim<'info> {
    #[account(mut)]
    pub freelancer: Signer<'info>,
    
    #[account(
        mut,
        constraint = payment_verification.freelancer == freelancer.key(),
        constraint = payment_verification.status == PaymentStatus::Pending @ InsuranceError::PaymentAlreadyClaimed,
        constraint = Clock::get()?.unix_timestamp > payment_verification.deadline @ InsuranceError::DeadlineNotPassed
    )]
    pub payment_verification: Account<'info, PaymentVerification>,
    
    #[account(
        mut,
        constraint = policy.owner == freelancer.key() @ InsuranceError::OnlyPolicyOwner,
        constraint = policy.status == PolicyStatus::Active @ InsuranceError::PolicyNotActive
    )]
    pub policy: Account<'info, Policy>,
    
    #[account(
        init,
        payer = freelancer,
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
    ctx: Context<TriggerMissedPaymentClaim>,
    amount: u64,
) -> Result<()> {
    let claim = &mut ctx.accounts.claim;
    let policy = &mut ctx.accounts.policy;
    let payment_verification = &mut ctx.accounts.payment_verification;
    let freelancer = &ctx.accounts.freelancer;
    let clock = Clock::get()?;
    
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
    claim.owner = freelancer.key();
    claim.amount = amount;
    claim.status = ClaimStatus::Pending;
    claim.evidence_type = "Missed Payment".to_string();
    claim.evidence_description = format!(
        "Client missed payment of {} by deadline {}",
        payment_verification.expected_amount,
        payment_verification.deadline
    );
    claim.evidence_attachments = vec![format!(
        "Payment verification: {}",
        payment_verification.key()
    )];
    claim.submission_date = clock.unix_timestamp;
    claim.verdict = None;
    claim.bump = *ctx.bumps.get("claim").unwrap();
    
    // Update policy claims count
    policy.claims_count += 1;
    
    // Update payment verification status
    payment_verification.status = PaymentStatus::Claimed;
    
    Ok(())
}
