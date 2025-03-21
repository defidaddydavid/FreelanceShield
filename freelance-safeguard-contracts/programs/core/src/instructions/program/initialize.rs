use anchor_lang::prelude::*;
use crate::state::*;

/// Accounts for program initialization
#[derive(Accounts)]
pub struct Initialize<'info> {
    /// Program authority
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// Program state PDA
    #[account(
        init,
        payer = authority,
        space = ProgramState::SIZE,
        seeds = [ProgramState::SEED_PREFIX],
        bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    /// System program
    pub system_program: Program<'info, System>,
}

/// Initialize the core program
pub fn handler(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
    let clock = Clock::get()?;
    let program_state = &mut ctx.accounts.program_state;
    
    // Set authority
    program_state.authority = ctx.accounts.authority.key();
    
    // Set insurance parameters
    program_state.base_reserve_ratio = params.base_reserve_ratio;
    program_state.min_coverage_amount = params.min_coverage_amount;
    program_state.max_coverage_amount = params.max_coverage_amount;
    program_state.min_period_days = params.min_period_days;
    program_state.max_period_days = params.max_period_days;
    program_state.grace_period_days = params.grace_period_days;
    program_state.claim_period_days = params.claim_period_days;
    
    // Set risk parameters
    program_state.target_reserve_ratio = params.target_reserve_ratio;
    program_state.min_capital_requirement = params.min_capital_requirement;
    program_state.risk_buffer_percentage = params.risk_buffer_percentage;
    program_state.monte_carlo_iterations = params.monte_carlo_iterations;
    
    // Set claims parameters
    program_state.arbitration_threshold = params.arbitration_threshold;
    program_state.auto_claim_limit = params.auto_claim_limit;
    program_state.auto_process_threshold = params.auto_process_threshold;
    program_state.min_votes_required = params.min_votes_required;
    program_state.voting_period_days = params.voting_period_days;
    
    // Set premium calculation parameters
    program_state.base_premium_rate = params.base_premium_rate;
    program_state.risk_curve_exponent = 2; // Default value
    program_state.reputation_impact_weight = 3; // Default value
    program_state.claims_history_impact_weight = 4; // Default value
    program_state.market_volatility_weight = 2; // Default value
    
    // Set default risk weights
    program_state.job_type_risk_weights = [10, 12, 9, 10, 11, 14]; // Default weights (x10)
    program_state.industry_risk_weights = [9, 13, 11, 10, 12, 9, 14]; // Default weights (x10)
    
    // Initialize statistics
    program_state.total_products = 0;
    program_state.total_policies = 0;
    program_state.active_policies = 0;
    program_state.total_coverage = 0;
    program_state.total_premiums = 0;
    program_state.total_claims_paid = 0;
    program_state.approved_claims = 0;
    program_state.rejected_claims = 0;
    program_state.arbitrated_claims = 0;
    program_state.premium_to_claims_ratio = 100; // Default 100%
    
    // Initialize risk pool stats
    program_state.total_capital = 0;
    program_state.total_coverage_liability = 0;
    program_state.current_reserve_ratio = 0;
    
    // Set program status
    program_state.is_paused = false;
    program_state.last_update_timestamp = clock.unix_timestamp;
    program_state.bump = *ctx.bumps.get("program_state").unwrap();
    
    msg!("FreelanceShield Core program initialized");
    Ok(())
}
