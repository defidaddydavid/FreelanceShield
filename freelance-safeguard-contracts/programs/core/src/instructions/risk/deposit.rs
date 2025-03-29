use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::FreelanceShieldError;

/// Accounts for depositing capital to the risk pool
#[derive(Accounts)]
pub struct DepositCapital<'info> {
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
        init_if_needed,
        payer = provider,
        space = CapitalProvider::SIZE,
        seeds = [
            CapitalProvider::SEED_PREFIX,
            provider.key().as_ref()
        ],
        bump
    )]
    pub capital_provider: Account<'info, CapitalProvider>,
    
    /// Provider's token account for payment
    #[account(mut)]
    pub provider_token_account: Account<'info, TokenAccount>,
    
    /// Program's token account for receiving capital
    #[account(mut)]
    pub program_token_account: Account<'info, TokenAccount>,
    
    /// Token program
    pub token_program: Program<'info, Token>,
    
    /// System program
    pub system_program: Program<'info, System>,
}

/// Deposit capital to the risk pool
pub fn handler(ctx: Context<DepositCapital>, params: DepositCapitalParams) -> Result<()> {
    let clock = Clock::get()?;
    let risk_pool = &mut ctx.accounts.risk_pool;
    let capital_provider = &mut ctx.accounts.capital_provider;
    let program_state = &mut ctx.accounts.program_state;
    
    // Validate deposit amount
    require!(
        params.amount > 0,
        FreelanceShieldError::InvalidDepositAmount
    );
    
    // Transfer capital
    let cpi_accounts = Transfer {
        from: ctx.accounts.provider_token_account.to_account_info(),
        to: ctx.accounts.program_token_account.to_account_info(),
        authority: ctx.accounts.provider.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::transfer(cpi_ctx, params.amount)?;
    
    // Initialize capital provider if new
    if capital_provider.provider == Pubkey::default() {
        capital_provider.provider = ctx.accounts.provider.key();
        capital_provider.deposited_amount = 0;
        capital_provider.rewards_earned = 0;
        capital_provider.bump = *ctx.bumps.get("capital_provider").unwrap();
    }
    
    // Update capital provider
    capital_provider.deposited_amount += params.amount;
    capital_provider.last_deposit_timestamp = clock.unix_timestamp;
    
    // Update risk pool
    risk_pool.total_capital += params.amount;
    
    // Recalculate reserve ratio
    if risk_pool.total_coverage_liability > 0 {
        risk_pool.current_reserve_ratio = ((risk_pool.total_capital * 100) / risk_pool.total_coverage_liability) as u8;
    } else {
        risk_pool.current_reserve_ratio = 100; // Default to 100% if no liability
    }
    
    // Update program state
    program_state.total_capital += params.amount;
    program_state.current_reserve_ratio = risk_pool.current_reserve_ratio;
    
    msg!("Capital deposited: Amount: {}", params.amount);
    Ok(())
}

