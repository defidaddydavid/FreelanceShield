use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};
use crate::state::*;
use crate::utils::*;
use crate::FreelanceShieldError;

/// Accounts for purchasing an insurance policy
#[derive(Accounts)]
pub struct PurchasePolicy<'info> {
    /// Policy owner
    #[account(mut)]
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
        seeds = [Product::SEED_PREFIX, &product.product_id.to_bytes()],
        bump = product.bump,
        constraint = product.active @ FreelanceShieldError::ProductInactive
    )]
    pub product: Account<'info, Product>,
    
    /// Policy account PDA
    #[account(
        init,
        payer = owner,
        space = Policy::SIZE,
        seeds = [
            Policy::SEED_PREFIX, 
            owner.key().as_ref(),
            product.product_id.as_ref()
        ],
        bump
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
    
    /// Token mint
    pub token_mint: Account<'info, Mint>,
    
    /// Token program
    pub token_program: Program<'info, Token>,
    
    /// System program
    pub system_program: Program<'info, System>,
}

/// Purchase an insurance policy
pub fn handler(ctx: Context<PurchasePolicy>, params: PurchasePolicyParams) -> Result<()> {
    let clock = Clock::get()?;
    let policy = &mut ctx.accounts.policy;
    let product = &mut ctx.accounts.product;
    let program_state = &mut ctx.accounts.program_state;
    let risk_pool = &mut ctx.accounts.risk_pool;
    
    // Validate policy parameters
    require!(
        params.coverage_amount >= product.min_coverage_amount && 
        params.coverage_amount <= product.max_coverage_amount,
        FreelanceShieldError::InvalidCoverageAmount
    );
    
    require!(
        params.period_days >= product.min_period_days && 
        params.period_days <= product.max_period_days,
        FreelanceShieldError::InvalidPeriod
    );
    
    // Calculate policy dates
    let start_date = clock.unix_timestamp;
    let end_date = start_date + (params.period_days as i64 * 86400); // days to seconds
    let claim_period_end = end_date + (program_state.claim_period_days as i64 * 86400);
    
    // Calculate premium
    let reputation_score = params.reputation_score.unwrap_or(50); // Default to 50 if not provided
    let claims_history = params.claims_history.unwrap_or(0);
    
    let premium_amount = calculate_premium(
        params.coverage_amount,
        params.period_days,
        product.base_premium_rate,
        product.risk_adjustment_factor,
        params.job_type.risk_weight(&program_state.job_type_risk_weights),
        params.industry.risk_weight(&program_state.industry_risk_weights),
        reputation_score,
        claims_history,
        program_state.risk_curve_exponent,
        program_state.reputation_impact_weight,
        program_state.claims_history_impact_weight
    )?;
    
    // Transfer premium payment
    let cpi_accounts = Transfer {
        from: ctx.accounts.owner_token_account.to_account_info(),
        to: ctx.accounts.program_token_account.to_account_info(),
        authority: ctx.accounts.owner.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::transfer(cpi_ctx, premium_amount)?;
    
    // Initialize policy
    policy.owner = ctx.accounts.owner.key();
    policy.product_id = product.product_id;
    policy.coverage_amount = params.coverage_amount;
    policy.premium_amount = premium_amount;
    policy.start_date = start_date;
    policy.end_date = end_date;
    policy.claim_period_end = claim_period_end;
    policy.status = PolicyStatus::Active;
    policy.job_type = params.job_type;
    policy.industry = params.industry;
    policy.claims_count = 0;
    policy.reputation_score = reputation_score;
    
    // Calculate risk score (0-100)
    let risk_score = calculate_risk_score(
        params.job_type.risk_weight(&program_state.job_type_risk_weights),
        params.industry.risk_weight(&program_state.industry_risk_weights),
        reputation_score,
        claims_history
    )?;
    
    policy.risk_score = risk_score;
    
    // Set policy details if provided
    if let Some(details) = params.policy_details {
        require!(
            details.len() <= Policy::MAX_POLICY_DETAILS_LENGTH,
            FreelanceShieldError::InvalidPolicyDetails
        );
        policy.policy_details = details;
    } else {
        policy.policy_details = String::new();
    }
    
    policy.creation_block = clock.slot;
    policy.last_update_slot = clock.slot;
    policy.nft_mint = None; // Will be set if tokenized
    policy.bump = *ctx.bumps.get("policy").unwrap();
    
    // Update product statistics
    product.policies_issued += 1;
    product.total_coverage += params.coverage_amount;
    product.total_premiums += premium_amount;
    
    // Update program state statistics
    program_state.total_policies += 1;
    program_state.active_policies += 1;
    program_state.total_coverage += params.coverage_amount;
    program_state.total_premiums += premium_amount;
    program_state.total_coverage_liability += params.coverage_amount;
    
    // Update risk pool
    risk_pool.total_premiums_collected += premium_amount;
    risk_pool.total_coverage_liability += params.coverage_amount;
    
    // Recalculate reserve ratio
    if risk_pool.total_coverage_liability > 0 {
        risk_pool.current_reserve_ratio = ((risk_pool.total_capital * 100) / risk_pool.total_coverage_liability) as u8;
    }
    
    msg!("Insurance policy purchased: Coverage: {}, Premium: {}", 
        params.coverage_amount, premium_amount);
    Ok(())
}
