use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::utils::math;
use crate::InsuranceError;

#[derive(Accounts)]
pub struct CreatePolicy<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + std::mem::size_of::<Policy>(),
        seeds = [POLICY_SEED.as_bytes(), owner.key().as_ref(), &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub policy: Account<'info, Policy>,
    
    #[account(
        mut,
        constraint = !insurance_state.is_paused @ InsuranceError::ProgramPaused,
        constraint = coverage_amount >= insurance_state.min_coverage_amount @ InsuranceError::CoverageTooLow,
        constraint = coverage_amount <= insurance_state.max_coverage_amount @ InsuranceError::CoverageTooHigh,
    )]
    pub insurance_state: Account<'info, InsuranceState>,
    
    #[account(
        mut,
        seeds = [RISK_POOL_SEED.as_bytes()],
        bump = risk_pool.bump
    )]
    pub risk_pool: Account<'info, RiskPool>,
    
    #[account(mut)]
    pub premium_source: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub premium_destination: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreatePolicy>,
    coverage_amount: u64,
    period_days: u16,
    job_type_value: u8,
    industry_value: u8,
    reputation_score: u8,
    claims_history: u8,
) -> Result<()> {
    let policy = &mut ctx.accounts.policy;
    let owner = &ctx.accounts.owner;
    let insurance_state = &mut ctx.accounts.insurance_state;
    let clock = Clock::get()?;
    
    // Validate period
    require!(
        period_days >= insurance_state.min_period_days,
        InsuranceError::PeriodTooShort
    );
    require!(
        period_days <= insurance_state.max_period_days,
        InsuranceError::PeriodTooLong
    );
    
    // Convert job type and industry from u8 to enum
    let job_type = JobType::from_u8(job_type_value)?;
    let industry = Industry::from_u8(industry_value)?;
    
    // Calculate premium using advanced risk model with detailed components
    let market_conditions = 10; // Default market conditions
    let (premium_amount, premium_components) = math::calculate_premium_with_components(
        coverage_amount,
        period_days,
        job_type_value,
        industry_value,
        reputation_score,
        claims_history,
        market_conditions,
        insurance_state.base_premium_rate,
        insurance_state.risk_curve_exponent,
        &insurance_state.job_type_risk_weights,
        &insurance_state.industry_risk_weights,
        insurance_state.claims_history_impact_weight,
        insurance_state.market_volatility_weight
    );
    
    // Calculate risk score
    let risk_score = math::calculate_risk_score(
        coverage_amount,
        job_type_value,
        industry_value,
        reputation_score,
        claims_history,
        &insurance_state.job_type_risk_weights,
        &insurance_state.industry_risk_weights
    );
    
    // Set policy details
    policy.owner = owner.key();
    policy.coverage_amount = coverage_amount;
    policy.premium_amount = premium_amount;
    policy.start_date = clock.unix_timestamp;
    policy.end_date = clock.unix_timestamp + (period_days as i64 * 86400); // Convert days to seconds
    policy.status = PolicyStatus::Active;
    policy.job_type = job_type;
    policy.industry = industry;
    policy.claims_count = 0;
    policy.risk_score = risk_score;
    
    // Store premium breakdown components for transparency and auditability
    policy.premium_breakdown = PremiumBreakdown {
        base_rate: premium_components.base_rate,
        coverage_factor: premium_components.coverage_factor,
        period_factor: premium_components.period_factor,
        risk_weight: premium_components.risk_weight,
        reputation_multiplier: premium_components.reputation_multiplier,
        market_adjustment: premium_components.market_adjustment,
    };
    
    policy.bump = *ctx.bumps.get("policy").unwrap();
    
    // Transfer premium payment
    let cpi_accounts = Transfer {
        from: ctx.accounts.premium_source.to_account_info(),
        to: ctx.accounts.premium_destination.to_account_info(),
        authority: owner.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::transfer(cpi_ctx, premium_amount)?;
    
    // Update risk pool
    let risk_pool = &mut ctx.accounts.risk_pool;
    risk_pool.total_coverage += coverage_amount;
    risk_pool.active_policies += 1;
    risk_pool.total_premiums_collected += premium_amount;
    
    // Update insurance state
    insurance_state.total_policies += 1;
    insurance_state.active_policies += 1;
    insurance_state.total_coverage += coverage_amount;
    insurance_state.total_premiums += premium_amount;
    
    Ok(())
}

