use anchor_lang::prelude::*;
use crate::state::*;
use crate::FreelanceShieldError;

/// Accounts for updating a policy
#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    /// Policy owner
    #[account(
        constraint = policy.owner == owner.key() @ FreelanceShieldError::Unauthorized
    )]
    pub owner: Signer<'info>,
    
    /// Program state PDA
    #[account(
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
            owner.key().as_ref(),
            policy.product_id.as_ref()
        ],
        bump = policy.bump,
        constraint = policy.status == PolicyStatus::Active @ FreelanceShieldError::PolicyNotActive
    )]
    pub policy: Account<'info, Policy>,
    
    /// Product account PDA
    #[account(
        seeds = [Product::SEED_PREFIX, &policy.product_id.to_bytes()],
        bump,
        constraint = product.active @ FreelanceShieldError::ProductNotActive
    )]
    pub product: Account<'info, Product>,
}

/// Update a policy
pub fn handler(ctx: Context<UpdatePolicy>, params: UpdatePolicyParams) -> Result<()> {
    let clock = Clock::get()?;
    let policy = &mut ctx.accounts.policy;
    
    // Update policy details
    if let Some(coverage_amount) = params.coverage_amount {
        require!(
            coverage_amount >= ctx.accounts.product.min_coverage_amount &&
            coverage_amount <= ctx.accounts.product.max_coverage_amount,
            FreelanceShieldError::InvalidCoverageAmount
        );
        
        policy.coverage_amount = coverage_amount;
    }
    
    if let Some(coverage_period_days) = params.coverage_period_days {
        require!(
            coverage_period_days >= ctx.accounts.product.min_period_days &&
            coverage_period_days <= ctx.accounts.product.max_period_days,
            FreelanceShieldError::InvalidCoveragePeriod
        );
        
        // Update expiration date based on new coverage period
        policy.coverage_period_days = coverage_period_days;
        policy.expiration_date = policy.start_date + (coverage_period_days as i64 * 86400); // days to seconds
    }
    
    if let Some(beneficiary) = params.beneficiary {
        policy.beneficiary = beneficiary;
    }
    
    if let Some(project_details) = params.project_details {
        require!(
            project_details.len() <= MAX_PROJECT_DETAILS_LENGTH,
            FreelanceShieldError::InvalidProjectDetails
        );
        
        policy.project_details = project_details;
    }
    
    if let Some(client_details) = params.client_details {
        require!(
            client_details.len() <= MAX_CLIENT_DETAILS_LENGTH,
            FreelanceShieldError::InvalidClientDetails
        );
        
        policy.client_details = client_details;
    }
    
    policy.last_update_slot = clock.slot;
    
    msg!("Policy updated: {}", policy.key());
    Ok(())
}
