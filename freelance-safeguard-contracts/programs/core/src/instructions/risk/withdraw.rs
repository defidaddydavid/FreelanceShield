use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::FreelanceShieldError;

/// Accounts for withdrawing capital from the risk pool
#[derive(Accounts)]
pub struct WithdrawCapital<'info> {
    /// Capital provider
    #[account(mut)]
    pub provider: Signer<'info>,
    
    /// Program state PDA
    #[account(
        mut,
        seeds = [ProgramState::SEED_PREFIX],
        bump = program_state.bump,
        constraint = !program_state.is_paused @ FreelanceShieldError::ProgramPaused
    )]
    pub program_state: Account<'info, ProgramState>,
    
    /// Risk pool account PDA
    #[account(
        mut,
        seeds = [RiskPool::SEED_PREFIX],
        bump = risk_pool.bump,
        constraint = !risk_pool.is_paused @ FreelanceShieldError::RiskPoolPaused
    )]
    pub risk_pool: Account<'info, RiskPool>,
    
    /// Capital provider account PDA
    #[account(
        mut,
        seeds = [
            CapitalProvider::SEED_PREFIX,
            provider.key().as_ref()
        ],
        bump = capital_provider.bump,
        constraint = capital_provider.provider == provider.key() @ FreelanceShieldError::Unauthorized
    )]
    pub capital_provider: Account<'info, CapitalProvider>,
    
    /// Program's token account for capital
    #[account(mut)]
    pub program_token_account: Account<'info, TokenAccount>,
    
    /// Provider's token account for receiving withdrawal
    #[account(
        mut,
        constraint = provider_token_account.owner == provider.key() @ FreelanceShieldError::InvalidTokenAccount
    )]
    pub provider_token_account: Account<'info, TokenAccount>,
    
    /// Token program
    pub token_program: Program<'info, Token>,
}

/// Withdraw capital from the risk pool
pub fn handler(ctx: Context<WithdrawCapital>, params: WithdrawCapitalParams) -> Result<()> {
    let clock = Clock::get()?;
    let risk_pool = &mut ctx.accounts.risk_pool;
    let capital_provider = &mut ctx.accounts.capital_provider;
    let program_state = &mut ctx.accounts.program_state;
    
    // Validate withdrawal amount
    require!(
        params.amount > 0,
        FreelanceShieldError::InvalidWithdrawalAmount
    );
    
    require!(
        params.amount <= capital_provider.deposited_amount,
        FreelanceShieldError::InsufficientBalance
    );
    
    // Calculate the minimum capital required based on coverage liability
    let min_required_capital = (risk_pool.total_coverage_liability * program_state.target_reserve_ratio as u64) / 100;
    
    // Ensure withdrawal doesn't drop below minimum capital requirement
    require!(
        risk_pool.total_capital - params.amount >= min_required_capital,
        FreelanceShieldError::WithdrawalExceedsAvailableCapital
    );
    
    // Transfer capital
    let seeds = &[
        RiskPool::SEED_PREFIX,
        &[risk_pool.bump]
    ];
    let signer = &[&seeds[..]];
    
    let cpi_accounts = Transfer {
        from: ctx.accounts.program_token_account.to_account_info(),
        to: ctx.accounts.provider_token_account.to_account_info(),
        authority: ctx.accounts.risk_pool.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
    token::transfer(cpi_ctx, params.amount)?;
    
    // Update capital provider
    capital_provider.deposited_amount -= params.amount;
    
    // Update risk pool
    risk_pool.total_capital -= params.amount;
    
    // Recalculate reserve ratio
    if risk_pool.total_coverage_liability > 0 {
        risk_pool.current_reserve_ratio = ((risk_pool.total_capital * 100) / risk_pool.total_coverage_liability) as u8;
    } else {
        risk_pool.current_reserve_ratio = 100; // Default to 100% if no liability
    }
    
    // Update program state
    program_state.total_capital -= params.amount;
    program_state.current_reserve_ratio = risk_pool.current_reserve_ratio;
    
    msg!("Capital withdrawn: Amount: {}", params.amount);
    Ok(())
}
