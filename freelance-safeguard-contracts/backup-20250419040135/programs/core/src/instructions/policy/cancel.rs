use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::utils::*;
use crate::FreelanceShieldError;

/// Accounts for cancelling an insurance policy
#[derive(Accounts)]
pub struct CancelPolicy<'info> {
    /// Policy owner or program authority
    #[account(
        constraint = (policy.owner == owner.key() || 
                     program_state.authority == owner.key()) 
                     @ FreelanceShieldError::Unauthorized
    )]
    pub owner: Signer<'info>,
    
    /// Program state PDA
    #[account(
        mut,
        seeds = [ProgramState::SEED_PREFIX],
        bump = program_state.bump,
        constraint = !program_state.is_paused @ FreelanceShieldError::ProgramPaused
    )]
    pub program_state: Account<'info, ProgramState>,
    
    /// Product account PDA
    #[account(
        mut,
        seeds = [Product::SEED_PREFIX, &policy.product_id.to_bytes()],
        bump
    )]
    pub product: Account<'info, Product>,
    
    /// Policy account PDA
    #[account(
        mut,
        seeds = [
            Policy::SEED_PREFIX, 
            policy.owner.as_ref(),
            policy.product_id.as_ref()
        ],
        bump = policy.bump,
        constraint = policy.status == PolicyStatus::Active @ FreelanceShieldError::PolicyNotActive
    )]
    pub policy: Account<'info, Policy>,
    
    /// Risk pool account
    #[account(
        mut,
        seeds = [RiskPool::SEED_PREFIX],
        bump
    )]
    pub risk_pool: Account<'info, RiskPool>,
    
    /// Program's token account for refund
    #[account(mut)]
    pub program_token_account: Account<'info, TokenAccount>,
    
    /// Owner's token account for receiving refund
    #[account(
        mut,
        constraint = refund_token_account.owner == policy.owner @ FreelanceShieldError::InvalidTokenAccount
    )]
    pub refund_token_account: Account<'info, TokenAccount>,
    
    /// Token program
    pub token_program: Program<'info, Token>,
}

/// Cancel an insurance policy
pub fn handler(ctx: Context<CancelPolicy>) -> Result<()> {
    let clock = Clock::get()?;
    let policy = &mut ctx.accounts.policy;
    let product = &mut ctx.accounts.product;
    let program_state = &mut ctx.accounts.program_state;
    let risk_pool = &mut ctx.accounts.risk_pool;
    
    // Calculate refund amount based on time elapsed
    let elapsed_time = clock.unix_timestamp - policy.start_date;
    let total_policy_time = policy.end_date - policy.start_date;
    
    // Only refund if less than 50% of policy time has elapsed
    let refund_amount = if elapsed_time < (total_policy_time / 2) {
        // Calculate pro-rata refund
        let time_remaining_ratio = (total_policy_time - elapsed_time) as f64 / total_policy_time as f64;
        let refund_ratio = time_remaining_ratio * 0.8; // 80% of pro-rata to account for admin fees
        (policy.premium_amount as f64 * refund_ratio) as u64
    } else {
        0 // No refund if more than 50% of policy time has elapsed
    };
    
    // Process refund if applicable
    if refund_amount > 0 {
        let seeds = &[
            RiskPool::SEED_PREFIX,
            &[*ctx.bumps.get("risk_pool").unwrap()]
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.program_token_account.to_account_info(),
            to: ctx.accounts.refund_token_account.to_account_info(),
            authority: ctx.accounts.risk_pool.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::transfer(cpi_ctx, refund_amount)?;
    }
    
    // Update policy status
    policy.status = PolicyStatus::Cancelled;
    policy.last_update_slot = clock.slot;
    
    // Update product statistics
    product.total_coverage -= policy.coverage_amount;
    
    // Update program state statistics
    program_state.active_policies -= 1;
    program_state.total_coverage -= policy.coverage_amount;
    
    // Update risk pool
    risk_pool.total_coverage_liability -= policy.coverage_amount;
    
    // Recalculate reserve ratio
    if risk_pool.total_coverage_liability > 0 {
        risk_pool.current_reserve_ratio = ((risk_pool.total_capital * 100) / risk_pool.total_coverage_liability) as u8;
    } else {
        risk_pool.current_reserve_ratio = 100; // Default to 100% if no liability
    }
    
    msg!("Insurance policy cancelled: Refund amount: {}", refund_amount);
    Ok(())
}

