use anchor_lang::prelude::*;
use crate::state::*;
use crate::utils::*;
use crate::FreelanceShieldError;

/// Accounts for running a risk simulation
#[derive(Accounts)]
pub struct SimulateRisk<'info> {
    /// Program authority
    #[account(
        constraint = program_state.authority == authority.key() @ FreelanceShieldError::Unauthorized
    )]
    pub authority: Signer<'info>,
    
    /// Program state PDA
    #[account(
        seeds = [ProgramState::SEED_PREFIX],
        bump = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    /// Risk pool account PDA
    #[account(
        seeds = [RiskPool::SEED_PREFIX],
        bump = risk_pool.bump
    )]
    pub risk_pool: Account<'info, RiskPool>,
    
    /// Simulation result account PDA
    #[account(
        init_if_needed,
        payer = authority,
        space = SimulationResult::SIZE,
        seeds = [
            SimulationResult::SEED_PREFIX,
            &Clock::get()?.slot.to_le_bytes()
        ],
        bump
    )]
    pub simulation_result: Account<'info, SimulationResult>,
    
    /// System program
    pub system_program: Program<'info, System>,
}

/// Run a risk simulation
pub fn handler(ctx: Context<SimulateRisk>, params: RiskSimulationParams) -> Result<()> {
    let clock = Clock::get()?;
    let simulation_result = &mut ctx.accounts.simulation_result;
    let program_state = &ctx.accounts.program_state;
    let risk_pool = &ctx.accounts.risk_pool;
    
    // Run Monte Carlo simulation
    // This is a simplified version - in a real implementation, this would be more sophisticated
    
    // Store simulation parameters
    simulation_result.run_timestamp = clock.unix_timestamp;
    simulation_result.current_policies = params.current_policies;
    simulation_result.avg_claim_frequency = params.avg_claim_frequency;
    simulation_result.avg_claim_severity = params.avg_claim_severity;
    simulation_result.market_volatility = params.market_volatility;
    
    // Calculate expected loss ratio (claims / premiums) * 100
    let expected_loss_ratio = if risk_pool.total_premiums_collected > 0 {
        ((params.avg_claim_frequency as u64 * params.avg_claim_severity * 100) / 
         (risk_pool.total_premiums_collected / params.current_policies)) as u16
    } else {
        50 // Default to 50% if no premium data
    };
    
    simulation_result.expected_loss_ratio = expected_loss_ratio;
    
    // Calculate capital adequacy ratio (capital / required capital) * 100
    let min_required_capital = calculate_min_capital_requirement(
        params.current_policies,
        params.avg_claim_severity,
        params.avg_claim_frequency,
        params.market_volatility,
        program_state.risk_buffer_percentage
    )?;
    
    simulation_result.min_required_capital = min_required_capital;
    
    let capital_adequacy_ratio = if min_required_capital > 0 {
        ((risk_pool.total_capital * 100) / min_required_capital) as u16
    } else {
        100 // Default to 100% if no required capital
    };
    
    simulation_result.capital_adequacy_ratio = capital_adequacy_ratio;
    
    // Calculate tail risk estimates (95th and 99th percentile losses)
    // These would normally be calculated using a more sophisticated statistical model
    let tail_risk_95th = (min_required_capital * 120) / 100; // Simplified: 120% of min capital
    let tail_risk_99th = (min_required_capital * 150) / 100; // Simplified: 150% of min capital
    
    simulation_result.tail_risk_95th = tail_risk_95th;
    simulation_result.tail_risk_99th = tail_risk_99th;
    
    // Calculate recommended premium adjustment
    // If capital adequacy is low or expected loss ratio is high, recommend increase
    // If capital adequacy is high and expected loss ratio is low, recommend decrease
    let recommended_premium_adjustment = calculate_premium_adjustment(
        capital_adequacy_ratio,
        expected_loss_ratio,
        params.market_volatility
    )?;
    
    simulation_result.recommended_premium_adjustment = recommended_premium_adjustment;
    
    simulation_result.bump = *ctx.bumps.get("simulation_result").unwrap();
    
    msg!("Risk simulation completed: Capital adequacy: {}%, Expected loss ratio: {}%", 
        capital_adequacy_ratio, expected_loss_ratio);
    Ok(())
}
