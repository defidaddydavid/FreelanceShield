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
        params.current_policies.try_into().unwrap(),
        params.avg_claim_severity,
        params.avg_claim_frequency,
        params.market_volatility,
        program_state.risk_buffer_percentage
    )?;
    
    simulation_result.min_required_capital = min_required_capital;
    
    // Enhanced capital adequacy calculation with adjustment factors
    let capital_adequacy_ratio = if min_required_capital > 0 {
        let base_ratio = ((risk_pool.total_capital * 100) / min_required_capital) as u16;
        
        // Apply adjustment factors
        
        // Volatility adjustment: higher market volatility reduces effective capital adequacy
        // Range: 50-100% (market_volatility of 100 reduces adequacy by 50%)
        let volatility_adjustment = 100 - (params.market_volatility / 2);
        
        // Frequency adjustment: higher claim frequency reduces effective capital adequacy
        // Range: 50-100% (avg_claim_frequency of 20 reduces adequacy by 50%)
        let frequency_adjustment = 100 - (params.avg_claim_frequency * 5).min(50);
        
        // Concentration adjustment: if a few policies represent a large portion of risk
        // This is a simplified proxy - in production this would use actual concentration metrics
        let concentration_adjustment = if params.current_policies > 10 {
            100 // Good diversification
        } else {
            // Fewer policies means higher concentration risk
            70 + (params.current_policies as u16 * 3) // 70% base + 3% per policy
        };
        
        // Apply all adjustments (multiplicative)
        // Divide by 1000000 because we're multiplying three percentages
        (base_ratio * volatility_adjustment * frequency_adjustment * concentration_adjustment) / 1000000
    } else {
        100 // Default to 100% if no required capital
    };
    
    simulation_result.capital_adequacy_ratio = capital_adequacy_ratio;
    
    // Log detailed capital adequacy factors for transparency
    msg!("Capital adequacy factors - Base: {}, Volatility adj: {}, Frequency adj: {}, Concentration adj: {}",
        ((risk_pool.total_capital * 100) / min_required_capital.max(1)) as u16,
        100 - (params.market_volatility / 2),
        100 - (params.avg_claim_frequency * 5).min(50),
        if params.current_policies > 10 { 100 } else { 70 + (params.current_policies as u16 * 3) }
    );
    
    // Calculate tail risk estimates (95th and 99th percentile losses)
    // Using a more sophisticated approach based on policy count, volatility, and claim frequency
    
    // Base multiplier for tail risk calculation
    let base_95th_multiplier = 120; // 120% of min capital as base
    let base_99th_multiplier = 150; // 150% of min capital as base
    
    // Adjust multipliers based on policy count (fewer policies = higher tail risk due to less diversification)
    let policy_count_factor = if params.current_policies < 5 {
        130 // +30% for very small policy pools
    } else if params.current_policies < 20 {
        115 // +15% for small policy pools
    } else if params.current_policies < 50 {
        105 // +5% for medium policy pools
    } else {
        100 // No adjustment for large policy pools
    };
    
    // Adjust multipliers based on market volatility
    let volatility_factor = 100 + params.market_volatility / 2; // +0-50% based on volatility
    
    // Adjust multipliers based on claim frequency
    let frequency_factor = 100 + params.avg_claim_frequency * 2; // +0-40% based on frequency
    
    // Calculate adjusted multipliers
    let adjusted_95th_multiplier = (base_95th_multiplier * policy_count_factor * volatility_factor * frequency_factor) / 1000000;
    let adjusted_99th_multiplier = (base_99th_multiplier * policy_count_factor * volatility_factor * frequency_factor) / 1000000;
    
    // Calculate tail risk values
    let tail_risk_95th = (min_required_capital * adjusted_95th_multiplier as u64) / 100;
    let tail_risk_99th = (min_required_capital * adjusted_99th_multiplier as u64) / 100;
    
    // Log the tail risk factors for transparency
    msg!("Tail risk factors - Policy count: {}, Volatility: {}, Frequency: {}", 
        policy_count_factor, 
        volatility_factor, 
        frequency_factor
    );
    
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
    
    simulation_result.recommended_premium_adjustment = recommended_premium_adjustment.into();
    
    simulation_result.bump = *ctx.bumps.get("simulation_result").unwrap();
    
    msg!("Risk simulation completed: Capital adequacy: {}%, Expected loss ratio: {}%", 
        capital_adequacy_ratio, expected_loss_ratio);
    Ok(())
}
