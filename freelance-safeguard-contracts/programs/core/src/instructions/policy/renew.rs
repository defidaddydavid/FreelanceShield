use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::utils::*;
use crate::FreelanceShieldError;

/// Accounts for renewing an insurance policy
#[derive(Accounts)]
pub struct RenewPolicy<'info> {
    /// Policy owner
    #[account(
        constraint = policy.owner == owner.key() @ FreelanceShieldError::Unauthorized
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
        bump,
        constraint = product.active @ FreelanceShieldError::ProductInactive
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
        constraint = (policy.status == PolicyStatus::Active || 
                     policy.status == PolicyStatus::Expired || 
                     policy.status == PolicyStatus::GracePeriod) 
                     @ FreelanceShieldError::PolicyCannotBeRenewed
    )]
    pub policy: Account<'info, Policy>,
    
    /// Risk pool account
    #[account(
        mut,
        seeds = [RiskPool::SEED_PREFIX],
        bump
    )]
    pub risk_pool: Account<'info, RiskPool>,
    
    /// Owner's token account for payment
    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    /// Program's token account for receiving payment
    #[account(mut)]
    pub program_token_account: Account<'info, TokenAccount>,
    
    /// Token program
    pub token_program: Program<'info, Token>,
}

/// Renew an insurance policy
pub fn handler(ctx: Context<RenewPolicy>, period_days: u16) -> Result<()> {
    let clock = Clock::get()?;
    let policy = &mut ctx.accounts.policy;
    let product = &mut ctx.accounts.product;
    let program_state = &mut ctx.accounts.program_state;
    let risk_pool = &mut ctx.accounts.risk_pool;
    
    // Validate renewal period
    require!(
        period_days >= product.min_period_days && 
        period_days <= product.max_period_days,
        FreelanceShieldError::InvalidPeriod
    );
    
    // Calculate new policy dates
    let current_time = clock.unix_timestamp;
    
    // If policy is expired but within grace period, start from current time
    // Otherwise, start from the end of the current policy
    let start_date = if current_time > policy.end_date {
        current_time
    } else {
        policy.end_date
    };
    
    let end_date = start_date + (period_days as i64 * 86400); // days to seconds
    let claim_period_end = end_date + (program_state.claim_period_days as i64 * 86400);
    
    // Calculate premium with loyalty discount
    let base_premium = calculate_premium(
        policy.coverage_amount,
        period_days,
        product.base_premium_rate,
        product.risk_adjustment_factor,
        policy.job_type.risk_weight(&program_state.job_type_risk_weights),
        policy.industry.risk_weight(&program_state.industry_risk_weights),
        policy.reputation_score,
        policy.claims_count,
        program_state.risk_curve_exponent,
        program_state.reputation_impact_weight,
        program_state.claims_history_impact_weight
    )?;
    
    // Apply loyalty discount (5% discount for renewal)
    let premium_amount = (base_premium * 95) / 100;
    
    // Transfer premium payment
    let cpi_accounts = Transfer {
        from: ctx.accounts.owner_token_account.to_account_info(),
        to: ctx.accounts.program_token_account.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::transfer(cpi_ctx, premium_amount)?;
    
    // If policy was expired, we need to add the coverage back to the stats
    let was_expired = policy.status != PolicyStatus::Active;
    
    // Update policy
    policy.premium_amount = premium_amount;
    policy.start_date = start_date;
    policy.end_date = end_date;
    policy.claim_period_end = claim_period_end;
    policy.status = PolicyStatus::Active;
    policy.last_update_slot = clock.slot;
    
    // Update product statistics
    if was_expired {
        product.total_coverage += policy.coverage_amount;
    }
    product.total_premiums += premium_amount;
    
    // Update program state statistics
    if was_expired {
        program_state.active_policies += 1;
        program_state.total_coverage += policy.coverage_amount;
        program_state.total_coverage_liability += policy.coverage_amount;
    }
    program_state.total_premiums += premium_amount;
    
    // Update risk pool
    risk_pool.total_premiums_collected += premium_amount;
    if was_expired {
        risk_pool.total_coverage_liability += policy.coverage_amount;
    }
    
    // Recalculate reserve ratio
    if risk_pool.total_coverage_liability > 0 {
        risk_pool.current_reserve_ratio = ((risk_pool.total_capital * 100) / risk_pool.total_coverage_liability) as u8;
    }
    
    msg!("Insurance policy renewed: New end date: {}, Premium: {}", 
        end_date, premium_amount);
    Ok(())
}
