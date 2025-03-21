use anchor_lang::prelude::*;
use crate::state::*;
use crate::FreelanceShieldError;

/// Accounts for initializing the risk pool
#[derive(Accounts)]
pub struct InitializeRiskPool<'info> {
    /// Program authority
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// Program state PDA
    #[account(
        seeds = [ProgramState::SEED_PREFIX],
        bump = program_state.bump
    )]
    pub program_state: Account<'info, ProgramState>,
    
    /// Risk pool account PDA
    #[account(
        init,
        payer = authority,
        space = RiskPool::SIZE,
        seeds = [RiskPool::SEED_PREFIX],
        bump
    )]
    pub risk_pool: Account<'info, RiskPool>,
    
    /// System program
    pub system_program: Program<'info, System>,
}

/// Initialize the risk pool
pub fn handler(
    ctx: Context<InitializeRiskPool>, 
    max_auto_approve_amount: u64,
    staking_allocation_percentage: u8,
    treasury_allocation_percentage: u8,
    treasury_wallet: Pubkey
) -> Result<()> {
    let clock = Clock::get()?;
    let risk_pool = &mut ctx.accounts.risk_pool;
    
    // Validate parameters
    require!(
        staking_allocation_percentage + treasury_allocation_percentage <= 100,
        FreelanceShieldError::InvalidAllocationPercentages
    );
    
    // Initialize risk pool
    risk_pool.authority = ctx.accounts.authority.key();
    risk_pool.total_capital = 0;
    risk_pool.total_coverage_liability = 0;
    risk_pool.current_reserve_ratio = 0;
    risk_pool.total_premiums_collected = 0;
    risk_pool.total_claims_paid = 0;
    risk_pool.premium_to_claims_ratio = 100; // Default 100%
    risk_pool.last_metrics_update = clock.unix_timestamp;
    risk_pool.max_auto_approve_amount = max_auto_approve_amount;
    risk_pool.staking_allocation_percentage = staking_allocation_percentage;
    risk_pool.treasury_allocation_percentage = treasury_allocation_percentage;
    risk_pool.treasury_wallet = treasury_wallet;
    risk_pool.is_paused = false;
    risk_pool.bump = *ctx.bumps.get("risk_pool").unwrap();
    
    msg!("Risk pool initialized");
    Ok(())
}
