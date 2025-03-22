use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeProgram<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<RiskPool>(),
        seeds = [RISK_POOL_SEED.as_bytes()],
        bump
    )]
    pub risk_pool: Account<'info, RiskPool>,
    
    #[account(
        init,
        payer = authority,
        space = InsuranceState::space(),
        seeds = [b"insurance_state"],
        bump
    )]
    pub insurance_state: Account<'info, InsuranceState>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeProgram>) -> Result<()> {
    let risk_pool = &mut ctx.accounts.risk_pool;
    let insurance_state = &mut ctx.accounts.insurance_state;
    let authority = &ctx.accounts.authority;
    
    // Initialize risk pool
    risk_pool.authority = authority.key();
    risk_pool.total_staked = 0;
    risk_pool.total_coverage = 0;
    risk_pool.active_policies = 0;
    risk_pool.claims_paid = 0;
    risk_pool.reserve_ratio = 20; // 20% base reserve ratio
    risk_pool.bump = *ctx.bumps.get("risk_pool").unwrap();
    
    // Initialize insurance state with advanced risk model parameters
    insurance_state.authority = authority.key();
    insurance_state.risk_pool_authority = authority.key();
    insurance_state.base_reserve_ratio = 20; // 20% base reserve ratio
    
    // Set coverage limits (in lamports)
    insurance_state.min_coverage_amount = 100_000_000; // 0.1 SOL
    insurance_state.max_coverage_amount = 1_000_000_000_000; // 1,000 SOL
    
    // Set period limits
    insurance_state.min_period_days = 7;   // Minimum 1 week
    insurance_state.max_period_days = 365; // Maximum 1 year
    
    // Initialize counters
    insurance_state.total_policies = 0;
    insurance_state.active_policies = 0;
    insurance_state.total_coverage = 0;
    insurance_state.total_premiums = 0;
    insurance_state.total_claims_paid = 0;
    insurance_state.is_paused = false;
    
    // Set advanced risk model parameters
    insurance_state.base_premium_rate = 100_000_000; // 0.1 SOL base rate
    insurance_state.risk_curve_exponent = 2; // 0.2 when divided by 10
    insurance_state.reputation_impact_weight = 35; // 35% weight
    insurance_state.claims_history_impact_weight = 15; // 15% weight
    insurance_state.market_volatility_weight = 5; // 5% weight
    
    // Initialize risk weights for job types (divided by 10 for decimal values)
    insurance_state.job_type_risk_weights = [
        10, // SoftwareDevelopment: 1.0
        9,  // Design: 0.9
        9,  // Writing: 0.9
        11, // Marketing: 1.1
        12, // Consulting: 1.2
        12  // Other: 1.2
    ];
    
    // Initialize risk weights for industries (divided by 10 for decimal values)
    insurance_state.industry_risk_weights = [
        10, // Technology: 1.0
        12, // Healthcare: 1.2
        13, // Finance: 1.3
        9,  // Education: 0.9
        11, // Retail: 1.1
        11, // Entertainment: 1.1
        12  // Other: 1.2
    ];
    
    insurance_state.bump = *ctx.bumps.get("insurance_state").unwrap();
    
    Ok(())
}
