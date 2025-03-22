use anchor_lang::prelude::*;
use crate::state::*;
use crate::utils::math;
use crate::InsuranceError;

#[derive(Accounts)]
pub struct ProcessClaimData<'info> {
    #[account(
        mut,
        constraint = policy.status == PolicyStatus::Claimed @ InsuranceError::InvalidPolicyStatus
    )]
    pub policy: Account<'info, Policy>,
    
    #[account(mut)]
    pub insurance_state: Account<'info, InsuranceState>,
    
    #[account(
        constraint = authority.key() == insurance_state.authority @ InsuranceError::Unauthorized
    )]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

/// Processes claim data for the Bayesian model
/// This instruction should be called whenever a claim is processed
/// to update the Bayesian model with new data
pub fn handler(ctx: Context<ProcessClaimData>) -> Result<()> {
    let policy = &ctx.accounts.policy;
    let insurance_state = &mut ctx.accounts.insurance_state;
    let clock = Clock::get()?;
    
    // Extract policy data
    let job_type = policy.job_type.to_u8();
    let industry = policy.industry.to_u8();
    let claims_history = policy.claims_count;
    
    // Update Bayesian parameters with the claim data
    // We pass true for has_claim because this policy has been claimed
    math::update_bayesian_parameters(
        &mut insurance_state.bayesian_parameters,
        job_type,
        industry,
        claims_history,
        true, // This policy has a claim
        clock.unix_timestamp
    );
    
    // Increment the total claims processed counter
    insurance_state.bayesian_parameters.total_claims_processed += 1;
    
    Ok(())
}
