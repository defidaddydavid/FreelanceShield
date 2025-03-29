use anchor_lang::prelude::*;
use crate::state::*;
use crate::FreelanceShieldError;

/// Accounts for updating risk metrics
#[derive(Accounts)]
pub struct UpdateRiskMetrics<'info> {
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
    
    /// Risk pool account PDA
    #[account(
        mut,
        seeds = [RiskPool::SEED_PREFIX],
        bump = risk_pool.bump
    )]
    pub risk_pool: Account<'info, RiskPool>,
}

/// Update risk metrics
pub fn handler(ctx: Context<UpdateRiskMetrics>) -> Result<()> {
    let clock = Clock::get()?;
    let risk_pool = &mut ctx.accounts.risk_pool;
    let program_state = &mut ctx.accounts.program_state;
    
    // Update last metrics update timestamp
    risk_pool.last_metrics_update = clock.unix_timestamp;
    
    // Recalculate reserve ratio
    if risk_pool.total_coverage_liability > 0 {
        risk_pool.current_reserve_ratio = ((risk_pool.total_capital * 100) / risk_pool.total_coverage_liability) as u8;
    } else {
        risk_pool.current_reserve_ratio = 100; // Default to 100% if no liability
    }
    
    // Calculate premium to claims ratio
    if risk_pool.total_claims_paid > 0 {
        risk_pool.premium_to_claims_ratio = 
            ((risk_pool.total_premiums_collected * 100) / risk_pool.total_claims_paid) as u16;
    } else {
        risk_pool.premium_to_claims_ratio = 100; // Default to 100% if no claims paid
    }
    
    // Update program state metrics
    program_state.current_reserve_ratio = risk_pool.current_reserve_ratio;
    
    if program_state.total_claims_paid > 0 {
        program_state.premium_to_claims_ratio = 
            ((program_state.total_premiums * 100) / program_state.total_claims_paid) as u16;
    } else {
        program_state.premium_to_claims_ratio = 100; // Default to 100% if no claims paid
    }
    
    // Update program statistics
    program_state.total_capital = risk_pool.total_capital;
    program_state.total_coverage_liability = risk_pool.total_coverage_liability;
    
    msg!("Risk metrics updated: Reserve ratio: {}%, Premium/Claims ratio: {}%", 
        risk_pool.current_reserve_ratio, risk_pool.premium_to_claims_ratio);
    Ok(())
}

