use anchor_lang::prelude::*;
use crate::state::*;
use crate::utils::math;
use crate::InsuranceError;

#[derive(Accounts)]
pub struct CollectPolicyData<'info> {
    #[account(
        constraint = policy.status == PolicyStatus::Active @ InsuranceError::InvalidPolicyStatus
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

/// Collects policy data for the Bayesian model
/// This instruction should be called whenever a new policy is created
/// to update the Bayesian model with new data
pub fn handler(ctx: Context<CollectPolicyData>) -> Result<()> {
    let policy = &ctx.accounts.policy;
    let insurance_state = &mut ctx.accounts.insurance_state;
    let clock = Clock::get()?;
    
    // Extract policy data
    let job_type = policy.job_type.to_u8();
    let industry = policy.industry.to_u8();
    let claims_history = policy.claims_count;
    
    // Update Bayesian parameters with the policy data
    // We pass false for has_claim because this is just a new policy
    math::update_bayesian_parameters(
        &mut insurance_state.bayesian_parameters,
        job_type,
        industry,
        claims_history,
        false, // This is a new policy, no claim yet
        clock.unix_timestamp
    );
    
    // Increment the total policies processed counter
    insurance_state.bayesian_parameters.total_policies_processed += 1;
    
    Ok(())
}

