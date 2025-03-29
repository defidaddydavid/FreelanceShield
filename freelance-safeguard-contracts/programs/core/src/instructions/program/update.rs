use anchor_lang::prelude::*;
use crate::state::*;
use crate::FreelanceShieldError;

/// Accounts for updating program parameters
#[derive(Accounts)]
pub struct UpdateProgramParameters<'info> {
    /// Program authority
    #[account(
        constraint = program_state.authority == authority.key() @ FreelanceShieldError::Unauthorized
    )]
    pub authority: Signer<'info>,
    
    /// Program state PDA
    #[account(
        mut,
        seeds = [ProgramState::SEED_PREFIX],
        bump = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,
}

/// Update program parameters
pub fn handler(ctx: Context<UpdateProgramParameters>, params: UpdateProgramParamsParams) -> Result<()> {
    let clock = Clock::get()?;
    let program_state = &mut ctx.accounts.program_state;
    
    // Update insurance parameters if provided
    if let Some(base_reserve_ratio) = params.base_reserve_ratio {
        program_state.base_reserve_ratio = base_reserve_ratio;
    }
    
    if let Some(min_coverage_amount) = params.min_coverage_amount {
        program_state.min_coverage_amount = min_coverage_amount;
    }
    
    if let Some(max_coverage_amount) = params.max_coverage_amount {
        program_state.max_coverage_amount = max_coverage_amount;
    }
    
    if let Some(min_period_days) = params.min_period_days {
        program_state.min_period_days = min_period_days;
    }
    
    if let Some(max_period_days) = params.max_period_days {
        program_state.max_period_days = max_period_days;
    }
    
    if let Some(grace_period_days) = params.grace_period_days {
        program_state.grace_period_days = grace_period_days;
    }
    
    if let Some(claim_period_days) = params.claim_period_days {
        program_state.claim_period_days = claim_period_days;
    }
    
    // Update risk parameters if provided
    if let Some(target_reserve_ratio) = params.target_reserve_ratio {
        program_state.target_reserve_ratio = target_reserve_ratio;
    }
    
    if let Some(min_capital_requirement) = params.min_capital_requirement {
        program_state.min_capital_requirement = min_capital_requirement;
    }
    
    if let Some(risk_buffer_percentage) = params.risk_buffer_percentage {
        program_state.risk_buffer_percentage = risk_buffer_percentage;
    }
    
    if let Some(monte_carlo_iterations) = params.monte_carlo_iterations {
        program_state.monte_carlo_iterations = monte_carlo_iterations;
    }
    
    // Update claims parameters if provided
    if let Some(arbitration_threshold) = params.arbitration_threshold {
        program_state.arbitration_threshold = arbitration_threshold;
    }
    
    if let Some(auto_claim_limit) = params.auto_claim_limit {
        program_state.auto_claim_limit = auto_claim_limit;
    }
    
    if let Some(auto_process_threshold) = params.auto_process_threshold {
        program_state.auto_process_threshold = auto_process_threshold;
    }
    
    if let Some(min_votes_required) = params.min_votes_required {
        program_state.min_votes_required = min_votes_required;
    }
    
    if let Some(voting_period_days) = params.voting_period_days {
        program_state.voting_period_days = voting_period_days;
    }
    
    // Update premium calculation parameters if provided
    if let Some(base_premium_rate) = params.base_premium_rate {
        program_state.base_premium_rate = base_premium_rate;
    }
    
    if let Some(risk_curve_exponent) = params.risk_curve_exponent {
        program_state.risk_curve_exponent = risk_curve_exponent;
    }
    
    if let Some(reputation_impact_weight) = params.reputation_impact_weight {
        program_state.reputation_impact_weight = reputation_impact_weight;
    }
    
    if let Some(claims_history_impact_weight) = params.claims_history_impact_weight {
        program_state.claims_history_impact_weight = claims_history_impact_weight;
    }
    
    if let Some(market_volatility_weight) = params.market_volatility_weight {
        program_state.market_volatility_weight = market_volatility_weight;
    }
    
    if let Some(job_type_risk_weights) = params.job_type_risk_weights {
        program_state.job_type_risk_weights = job_type_risk_weights;
    }
    
    if let Some(industry_risk_weights) = params.industry_risk_weights {
        program_state.industry_risk_weights = industry_risk_weights;
    }
    
    // Update program status if provided
    if let Some(is_paused) = params.is_paused {
        program_state.is_paused = is_paused;
    }
    
    // Update timestamp
    program_state.last_update_timestamp = clock.unix_timestamp;
    
    msg!("FreelanceShield Core program parameters updated");
    Ok(())
}

