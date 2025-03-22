use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use std::convert::TryFrom;

declare_id!("DKmNWT36RZTkN1ggdLUvze1JvB3RFZ4HHYGh6zLK3rbc");

// Constants for premium calculation
pub const BASE_PREMIUM_RATE: u64 = 100_000; // 0.1 SOL in lamports
pub const MAX_COVERAGE_RATIO: f64 = 5.0;
pub const MIN_REPUTATION_FACTOR: f64 = 0.7;
pub const MAX_REPUTATION_FACTOR: f64 = 1.0;
pub const CLAIM_HISTORY_IMPACT_FACTOR: f64 = 1.5;
pub const MARKET_CONDITION_DEFAULT: f64 = 1.0;

// Risk pool program ID
pub const RISK_POOL_PROGRAM_ID: Pubkey = anchor_lang::solana_program::pubkey!("HC1TQHR6kVqtq48UbTYGwHwHTUYom9W3ovNVgjPgNcFg");

#[program]
pub mod insurance_program {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        risk_pool_authority: Pubkey,
        base_reserve_ratio: u8,
        min_coverage_amount: u64,
        max_coverage_amount: u64,
        min_period_days: u16,
        max_period_days: u16,
    ) -> Result<()> {
        let insurance_state = &mut ctx.accounts.insurance_state;
        insurance_state.authority = ctx.accounts.authority.key();
        insurance_state.risk_pool_authority = risk_pool_authority;
        insurance_state.base_reserve_ratio = base_reserve_ratio;
        insurance_state.min_coverage_amount = min_coverage_amount;
        insurance_state.max_coverage_amount = max_coverage_amount;
        insurance_state.min_period_days = min_period_days;
        insurance_state.max_period_days = max_period_days;
        insurance_state.total_policies = 0;
        insurance_state.active_policies = 0;
        insurance_state.total_coverage = 0;
        insurance_state.total_premiums = 0;
        insurance_state.total_claims_paid = 0;
        insurance_state.base_premium_rate = BASE_PREMIUM_RATE;
        insurance_state.risk_curve_exponent = 2;
        insurance_state.reputation_impact_weight = 3;
        insurance_state.claims_history_impact_weight = 4;
        insurance_state.market_volatility_weight = 5;
        insurance_state.job_type_risk_weights = [10, 12, 9, 10, 11, 8]; // Normalized risk weights (x10)
        insurance_state.industry_risk_weights = [9, 13, 11, 10, 12, 9, 8]; // Normalized risk weights (x10)
        insurance_state.is_paused = false;
        insurance_state.last_update_timestamp = Clock::get()?.unix_timestamp;
        insurance_state.bump = *ctx.bumps.get("insurance_state").unwrap();
        
        msg!("Insurance program initialized");
        Ok(())
    }

    pub fn create_policy(
        ctx: Context<CreatePolicy>,
        coverage_amount: u64,
        period_days: u16,
        job_type: JobType,
        industry: Industry,
        reputation_score: Option<u8>,
        claims_history: Option<u8>,
        additional_details: Option<String>,
    ) -> Result<()> {
        let insurance_state = &ctx.accounts.insurance_state;
        let policy = &mut ctx.accounts.policy;
        let clock = Clock::get()?;
        
        // Validate parameters
        require!(
            coverage_amount >= insurance_state.min_coverage_amount && 
            coverage_amount <= insurance_state.max_coverage_amount,
            InsuranceError::InvalidCoverageAmount
        );
        
        require!(
            period_days >= insurance_state.min_period_days && 
            period_days <= insurance_state.max_period_days,
            InsuranceError::InvalidPeriodDays
        );
        
        require!(!insurance_state.is_paused, InsuranceError::ProgramPaused);
        
        // Use provided reputation score or default to 0
        let rep_score = reputation_score.unwrap_or(0);
        let claim_history = claims_history.unwrap_or(0);
        
        // Calculate premium using extended calculation function
        let premium_amount = calculate_premium(
            insurance_state,
            coverage_amount,
            period_days,
            job_type,
            industry,
            rep_score,
            claim_history,
            MARKET_CONDITION_DEFAULT as u8, // Default market conditions
        );
        
        // Calculate risk score for transparency
        let risk_score = calculate_risk_score(
            insurance_state,
            coverage_amount,
            period_days,
            job_type,
            industry,
            rep_score,
            claim_history
        );
        
        // Initialize policy
        policy.owner = ctx.accounts.owner.key();
        policy.coverage_amount = coverage_amount;
        policy.premium_amount = premium_amount;
        policy.start_date = clock.unix_timestamp;
        policy.end_date = clock.unix_timestamp + (period_days as i64 * 86400); // days to seconds
        policy.status = PolicyStatus::Active;
        policy.job_type = job_type;
        policy.industry = industry;
        policy.claims_count = 0;
        policy.reputation_score = rep_score;
        policy.risk_score = risk_score;
        policy.policy_details = additional_details.unwrap_or_default();
        policy.creation_block = clock.slot;
        policy.last_update_slot = clock.slot;
        policy.bump = *ctx.bumps.get("policy").unwrap();
        
        // Transfer premium from user to risk pool
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.owner_token_account.to_account_info(),
                to: ctx.accounts.risk_pool_token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        );
        
        token::transfer(transfer_ctx, premium_amount)?;
        
        // Update insurance state
        let mut insurance_state = ctx.accounts.insurance_state.to_account_info();
        let mut data = insurance_state.try_borrow_mut_data()?;
        let mut state = InsuranceState::try_deserialize(&mut &data[..])?;
        
        state.total_policies += 1;
        state.active_policies += 1;
        state.total_coverage += coverage_amount;
        state.total_premiums += premium_amount;
        state.last_update_timestamp = clock.unix_timestamp;
        
        InsuranceState::try_serialize(&state, &mut &mut data[..])?;
        
        // Notify risk pool of increased coverage (via CPI call would go here in production)
        msg!("Risk pool coverage liability increased by: {}", coverage_amount);
        
        // For blockchain explorer visibility, log all policy details
        msg!("Policy created successfully");
        msg!("Policy ID: {}", policy.key());
        msg!("Owner: {}", policy.owner);
        msg!("Coverage: {}", policy.coverage_amount);
        msg!("Premium: {}", policy.premium_amount);
        msg!("Risk Score: {}", policy.risk_score);
        msg!("Start Date: {}", policy.start_date);
        msg!("End Date: {}", policy.end_date);
        
        Ok(())
    }

    pub fn cancel_policy(ctx: Context<CancelPolicy>) -> Result<()> {
        let policy = &mut ctx.accounts.policy;
        let clock = Clock::get()?;
        
        require!(
            policy.status == PolicyStatus::Active,
            InsuranceError::PolicyNotActive
        );
        
        // Calculate refund amount based on remaining time
        let time_elapsed = clock.unix_timestamp - policy.start_date;
        let total_period = policy.end_date - policy.start_date;
        let time_remaining = policy.end_date - clock.unix_timestamp;
        
        // Only refund if more than 25% of the policy period remains
        let refund_amount = if time_remaining > (total_period / 4) {
            let refund_ratio = time_remaining as f64 / total_period as f64;
            let refund = (policy.premium_amount as f64 * refund_ratio * 0.75) as u64; // 75% of prorated amount
            refund
        } else {
            0
        };
        
        // Process refund if applicable
        if refund_amount > 0 {
            let seeds = &[
                b"insurance_state".as_ref(),
                &[ctx.accounts.insurance_state.bump],
            ];
            let signer = &[&seeds[..]];
            
            let transfer_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.risk_pool_token_account.to_account_info(),
                    to: ctx.accounts.owner_token_account.to_account_info(),
                    authority: ctx.accounts.insurance_state.to_account_info(),
                },
                signer,
            );
            
            token::transfer(transfer_ctx, refund_amount)?;
        }
        
        // Update policy status
        policy.status = PolicyStatus::Cancelled;
        policy.last_update_slot = clock.slot;
        
        // Update insurance state
        let mut insurance_state = ctx.accounts.insurance_state.to_account_info();
        let mut data = insurance_state.try_borrow_mut_data()?;
        let mut state = InsuranceState::try_deserialize(&mut &data[..])?;
        
        state.active_policies -= 1;
        state.total_coverage -= policy.coverage_amount;
        state.last_update_timestamp = clock.unix_timestamp;
        
        InsuranceState::try_serialize(&state, &mut &mut data[..])?;
        
        // Notify risk pool of decreased coverage (via CPI call would go here in production)
        msg!("Risk pool coverage liability decreased by: {}", policy.coverage_amount);
        
        msg!("Policy cancelled successfully");
        Ok(())
    }

    // New function to get detailed policy risk breakdown
    pub fn get_policy_risk_breakdown(
        ctx: Context<GetPolicyRiskBreakdown>,
        coverage_amount: u64,
        period_days: u16,
        job_type: JobType,
        industry: Industry,
        reputation_score: u8,
        claims_history: u8,
    ) -> Result<()> {
        let insurance_state = &ctx.accounts.insurance_state;
        
        // Calculate base premium
        let base_premium = insurance_state.base_premium_rate;
        
        // Calculate coverage ratio factor (non-linear scaling)
        let coverage_ratio_impact = ((coverage_amount as f64 / 1_000_000.0).powf(
            insurance_state.risk_curve_exponent as f64 / 10.0
        ) * 100.0) as u64;
        
        // Calculate period adjustment
        let period_factor = (1.0 + (period_days as f64 / 365.0) * 0.5) as f64;
        let period_adjustment = (period_factor * 100.0) as u64;
        
        // Get job type risk adjustment
        let job_type_risk = job_type.risk_weight(insurance_state) as u64;
        
        // Get industry risk adjustment
        let industry_risk = industry.risk_weight(insurance_state) as u64;
        
        // Calculate risk adjustment
        let risk_adjustment = ((job_type_risk as f64 / 10.0) * (industry_risk as f64 / 10.0) * 100.0) as u64;
        
        // Calculate reputation factor
        let reputation_factor = if reputation_score == 0 {
            100 // Default factor (1.0)
        } else {
            let max_discount = ((MAX_REPUTATION_FACTOR - MIN_REPUTATION_FACTOR) * 100.0) as u8;
            let reputation_discount = (reputation_score * max_discount) / 100;
            (100 - reputation_discount) as u64
        };
        
        // Calculate claims history impact
        let claims_impact = if claims_history == 0 {
            100 // Default factor (1.0)
        } else {
            let impact = (CLAIM_HISTORY_IMPACT_FACTOR.powf(claims_history as f64) * 100.0) as u64;
            std::cmp::min(impact, 300) // Cap at 3x
        };
        
        // Calculate final premium
        let raw_premium = ((base_premium as f64 / 100.0) * 
                         (coverage_ratio_impact as f64 / 100.0) * 
                         (period_adjustment as f64 / 100.0) * 
                         (risk_adjustment as f64 / 100.0) * 
                         (reputation_factor as f64 / 100.0) * 
                         (claims_impact as f64 / 100.0) * 
                         100.0) as u64;
        
        // Round up to nearest 1000 lamports for clean numbers
        let premium_amount = ((raw_premium + 999) / 1000) * 1000;
        
        // Also calculate risk score
        let risk_score = calculate_risk_score(
            insurance_state,
            coverage_amount,
            period_days,
            job_type,
            industry,
            reputation_score,
            claims_history
        );
        
        // Log all components for the client
        msg!("Policy Risk Breakdown:");
        msg!("Base Premium Rate: {}", base_premium);
        msg!("Coverage Amount: {}", coverage_amount);
        msg!("Coverage Ratio Impact: {}", coverage_ratio_impact);
        msg!("Period (Days): {}", period_days);
        msg!("Period Adjustment: {}", period_adjustment);
        msg!("Job Type Risk: {}", job_type_risk);
        msg!("Industry Risk: {}", industry_risk);
        msg!("Overall Risk Adjustment: {}", risk_adjustment);
        msg!("Reputation Factor: {}", reputation_factor);
        msg!("Claims History Impact: {}", claims_impact);
        msg!("Total Premium: {}", premium_amount);
        msg!("Risk Score (0-100): {}", risk_score);
        
        Ok(())
    }

    pub fn update_program_parameters(
        ctx: Context<UpdateProgramParameters>,
        base_reserve_ratio: Option<u8>,
        min_coverage_amount: Option<u64>,
        max_coverage_amount: Option<u64>,
        min_period_days: Option<u16>,
        max_period_days: Option<u16>,
        is_paused: Option<bool>,
        base_premium_rate: Option<u64>,
        risk_curve_exponent: Option<u8>,
        reputation_impact_weight: Option<u8>,
        claims_history_impact_weight: Option<u8>,
        market_volatility_weight: Option<u8>,
        job_type_risk_weights: Option<[u8; 6]>,
        industry_risk_weights: Option<[u8; 7]>,
    ) -> Result<()> {
        let insurance_state = &mut ctx.accounts.insurance_state;
        
        require!(
            ctx.accounts.authority.key() == insurance_state.authority,
            InsuranceError::Unauthorized
        );
        
        if let Some(ratio) = base_reserve_ratio {
            insurance_state.base_reserve_ratio = ratio;
        }
        
        if let Some(min_amount) = min_coverage_amount {
            insurance_state.min_coverage_amount = min_amount;
        }
        
        if let Some(max_amount) = max_coverage_amount {
            insurance_state.max_coverage_amount = max_amount;
        }
        
        if let Some(min_days) = min_period_days {
            insurance_state.min_period_days = min_days;
        }
        
        if let Some(max_days) = max_period_days {
            insurance_state.max_period_days = max_days;
        }
        
        if let Some(paused) = is_paused {
            insurance_state.is_paused = paused;
        }
        
        if let Some(rate) = base_premium_rate {
            insurance_state.base_premium_rate = rate;
        }
        
        if let Some(exponent) = risk_curve_exponent {
            insurance_state.risk_curve_exponent = exponent;
        }
        
        if let Some(weight) = reputation_impact_weight {
            insurance_state.reputation_impact_weight = weight;
        }
        
        if let Some(weight) = claims_history_impact_weight {
            insurance_state.claims_history_impact_weight = weight;
        }
        
        if let Some(weight) = market_volatility_weight {
            insurance_state.market_volatility_weight = weight;
        }
        
        if let Some(weights) = job_type_risk_weights {
            insurance_state.job_type_risk_weights = weights;
        }
        
        if let Some(weights) = industry_risk_weights {
            insurance_state.industry_risk_weights = weights;
        }
        
        msg!("Program parameters updated");
        Ok(())
    }
}

// Helper function to calculate premium with logarithmic risk curve and Bayesian adjustments
fn calculate_premium(
    insurance_state: &InsuranceState,
    coverage_amount: u64,
    period_days: u16,
    job_type: JobType,
    industry: Industry,
    reputation_score: u8,
    claims_history: u8,
    market_conditions: u8,
) -> u64 {
    // Calculate base premium
    let base_premium = insurance_state.base_premium_rate;
    
    // Calculate coverage ratio factor (non-linear scaling)
    let coverage_ratio_impact = ((coverage_amount as f64 / 1_000_000.0).powf(
        insurance_state.risk_curve_exponent as f64 / 10.0
    ) * 100.0) as u64;
    
    // Calculate period adjustment
    let period_factor = (1.0 + (period_days as f64 / 365.0) * 0.5) as f64;
    let period_adjustment = (period_factor * 100.0) as u64;
    
    // Get job type risk adjustment
    let job_type_risk = job_type.risk_weight(insurance_state) as u64;
    
    // Get industry risk adjustment
    let industry_risk = industry.risk_weight(insurance_state) as u64;
    
    // Calculate risk adjustment
    let risk_adjustment = ((job_type_risk as f64 / 10.0) * (industry_risk as f64 / 10.0) * 100.0) as u64;
    
    // Calculate reputation factor
    let reputation_factor = if reputation_score == 0 {
        100 // Default factor (1.0)
    } else {
        let max_discount = ((MAX_REPUTATION_FACTOR - MIN_REPUTATION_FACTOR) * 100.0) as u8;
        let reputation_discount = (reputation_score * max_discount) / 100;
        (100 - reputation_discount) as u64
    };
    
    // Calculate claims history impact
    let claims_impact = if claims_history == 0 {
        100 // Default factor (1.0)
    } else {
        let impact = (CLAIM_HISTORY_IMPACT_FACTOR.powf(claims_history as f64) * 100.0) as u64;
        std::cmp::min(impact, 300) // Cap at 3x
    };
    
    // Apply market condition adjustment
    let market_condition_adjustment = if market_conditions == 0 {
        100 // Default (1.0)
    } else {
        let market_factor = 0.9 + (market_conditions as f64 * 0.02);
        (market_factor * 100.0) as u64
    };
    
    // Calculate final premium
    let raw_premium = ((base_premium as f64 / 100.0) * 
                     (coverage_ratio_impact as f64 / 100.0) * 
                     (period_adjustment as f64 / 100.0) * 
                     (risk_adjustment as f64 / 100.0) * 
                     (reputation_factor as f64 / 100.0) * 
                     (claims_impact as f64 / 100.0) * 
                     (market_condition_adjustment as f64 / 100.0) * 
                     100.0) as u64;
    
    // Round up to nearest 1000 lamports for clean numbers
    let premium_amount = ((raw_premium + 999) / 1000) * 1000;
    premium_amount
}

// Calculate risk score (0-100)
fn calculate_risk_score(
    insurance_state: &InsuranceState,
    coverage_amount: u64,
    period_days: u16,
    job_type: JobType,
    industry: Industry,
    reputation_score: u8,
    claims_history: u8,
) -> u8 {
    // Get job type and industry risk components (0-100 scale)
    let job_risk = job_type.risk_weight(insurance_state) * 10; // 0-120 range
    let industry_risk = industry.risk_weight(insurance_state) * 10; // 0-130 range
    
    // Normalize risk weights to 0-100 scale
    let job_risk_normalized = std::cmp::min(job_risk, 100);
    let industry_risk_normalized = std::cmp::min(industry_risk, 100);
    
    // Calculate coverage ratio impact (higher coverage = higher risk)
    let coverage_ratio = (coverage_amount as f64 / insurance_state.max_coverage_amount as f64) * 100.0;
    let coverage_impact = std::cmp::min(coverage_ratio as u8, 100);
    
    // Calculate period impact (longer period = higher risk)
    let period_ratio = (period_days as f64 / insurance_state.max_period_days as f64) * 100.0;
    let period_impact = std::cmp::min(period_ratio as u8, 100);
    
    // Combine period and coverage into coverage_ratio_impact
    let coverage_ratio_impact = (coverage_impact + period_impact) / 2;
    
    // Calculate reputation impact (inverted: higher reputation = lower risk)
    let reputation_impact = if reputation_score == 0 {
        50 // Default medium risk if no reputation
    } else {
        100 - std::cmp::min(reputation_score, 100)
    };
    
    // Calculate claims history impact
    let claims_impact = if claims_history == 0 {
        0 // No claims history, lowest risk
    } else {
        std::cmp::min(claims_history * 25, 100) // Each claim adds 25 risk points, max 100
    };
    
    // Final risk score calculation using the formula from MEMORY:
    // RiskScore = (RiskAdjustment * 20 + ClaimsHistory * 15 + CoverageRatioImpact * 30 + ReputationImpact * 35)
    let risk_adjustment = (job_risk_normalized + industry_risk_normalized) / 2;
    
    let final_score = (
        (risk_adjustment as u32 * 20) +
        (claims_impact as u32 * 15) +
        (coverage_ratio_impact as u32 * 30) +
        (reputation_impact as u32 * 35)
    ) / 100;
    
    // Ensure score is in 0-100 range
    std::cmp::min(final_score as u8, 100)
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + InsuranceState::SIZE,
        seeds = [b"insurance_state"],
        bump
    )]
    pub insurance_state: Account<'info, InsuranceState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreatePolicy<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        seeds = [b"insurance_state"],
        bump = insurance_state.bump,
    )]
    pub insurance_state: Account<'info, InsuranceState>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + Policy::SIZE,
        seeds = [b"policy", owner.key().as_ref()],
        bump
    )]
    pub policy: Account<'info, Policy>,
    
    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key(),
        constraint = owner_token_account.mint == risk_pool_token_account.mint
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = risk_pool_token_account.owner == insurance_state.risk_pool_authority
    )]
    pub risk_pool_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelPolicy<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        seeds = [b"insurance_state"],
        bump = insurance_state.bump,
    )]
    pub insurance_state: Account<'info, InsuranceState>,
    
    #[account(
        mut,
        seeds = [b"policy", owner.key().as_ref()],
        bump = policy.bump,
        constraint = policy.owner == owner.key(),
    )]
    pub policy: Account<'info, Policy>,
    
    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key()
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = risk_pool_token_account.owner == insurance_state.risk_pool_authority
    )]
    pub risk_pool_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProgramParameters<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"insurance_state"],
        bump = insurance_state.bump,
    )]
    pub insurance_state: Account<'info, InsuranceState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetPolicyRiskBreakdown<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub insurance_state: Account<'info, InsuranceState>,
}

#[account]
#[derive(Default)]
pub struct InsuranceState {
    pub authority: Pubkey,
    pub risk_pool_authority: Pubkey,
    pub base_reserve_ratio: u8,
    pub min_coverage_amount: u64,
    pub max_coverage_amount: u64,
    pub min_period_days: u16,
    pub max_period_days: u16,
    pub total_policies: u64,
    pub active_policies: u64,
    pub total_coverage: u64,
    pub total_premiums: u64,
    pub total_claims_paid: u64,
    pub base_premium_rate: u64,
    pub risk_curve_exponent: u8,
    pub reputation_impact_weight: u8,
    pub claims_history_impact_weight: u8,
    pub market_volatility_weight: u8,
    pub job_type_risk_weights: [u8; 6],
    pub industry_risk_weights: [u8; 7],
    pub is_paused: bool,
    pub last_update_timestamp: i64, // New field to track last update time
    pub bump: u8,
    pub reserved: [u8; 32], // Reserved space for future fields
}

impl InsuranceState {
    pub const SIZE: usize = 32 + // authority
                            32 + // risk_pool_authority
                            1 +  // base_reserve_ratio
                            8 +  // min_coverage_amount
                            8 +  // max_coverage_amount
                            2 +  // min_period_days
                            2 +  // max_period_days
                            8 +  // total_policies
                            8 +  // active_policies
                            8 +  // total_coverage
                            8 +  // total_premiums
                            8 +  // total_claims_paid
                            8 +  // base_premium_rate
                            1 +  // risk_curve_exponent
                            1 +  // reputation_impact_weight
                            1 +  // claims_history_impact_weight
                            1 +  // market_volatility_weight
                            6 +  // job_type_risk_weights
                            7 +  // industry_risk_weights
                            1 +  // is_paused
                            8 +  // last_update_timestamp
                            1 +  // bump
                            32;  // reserved space for future fields
}

#[account]
#[derive(Default)]
pub struct Policy {
    pub owner: Pubkey,
    pub coverage_amount: u64,
    pub premium_amount: u64,
    pub start_date: i64,
    pub end_date: i64,
    pub status: PolicyStatus,
    pub job_type: JobType,
    pub industry: Industry,
    pub claims_count: u8,
    pub reputation_score: u8,   // New field for reputation score
    pub risk_score: u8,         // New field for calculated risk score
    pub policy_details: String, // New field for additional policy details
    pub creation_block: u64,    // New field for tracking creation block
    pub last_update_slot: u64,  // New field for tracking last update
    pub bump: u8,
    pub reserved: [u8; 16],     // Reserved space for future fields
}

impl Policy {
    pub const SIZE: usize = 32 + // owner
                           8 +  // coverage_amount
                           8 +  // premium_amount
                           8 +  // start_date
                           8 +  // end_date
                           1 +  // status
                           1 +  // job_type
                           1 +  // industry
                           1 +  // claims_count
                           1 +  // reputation_score
                           1 +  // risk_score
                           128 + // policy_details (string)
                           8 +  // creation_block
                           8 +  // last_update_slot
                           1 +  // bump
                           16;  // reserved
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum PolicyStatus {
    Inactive,
    Active,
    Expired,
    Cancelled,
}

impl Default for PolicyStatus {
    fn default() -> Self {
        PolicyStatus::Inactive
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum JobType {
    SoftwareDevelopment,
    Design,
    Writing,
    Marketing,
    Consulting,
    Other,
}

impl JobType {
    pub fn risk_weight(&self, insurance_state: &InsuranceState) -> u8 {
        match self {
            JobType::SoftwareDevelopment => insurance_state.job_type_risk_weights[0],
            JobType::Design => insurance_state.job_type_risk_weights[1],
            JobType::Writing => insurance_state.job_type_risk_weights[2],
            JobType::Marketing => insurance_state.job_type_risk_weights[3],
            JobType::Consulting => insurance_state.job_type_risk_weights[4],
            JobType::Other => insurance_state.job_type_risk_weights[5],
        }
    }
    
    pub fn as_index(&self) -> usize {
        match self {
            JobType::SoftwareDevelopment => 0,
            JobType::Design => 1,
            JobType::Writing => 2,
            JobType::Marketing => 3,
            JobType::Consulting => 4,
            JobType::Other => 5,
        }
    }
}

impl Default for JobType {
    fn default() -> Self {
        JobType::Other
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum Industry {
    Technology,
    Healthcare,
    Finance,
    Education,
    Retail,
    Entertainment,
    Other,
}

impl Industry {
    pub fn risk_weight(&self, insurance_state: &InsuranceState) -> u8 {
        match self {
            Industry::Technology => insurance_state.industry_risk_weights[0],
            Industry::Healthcare => insurance_state.industry_risk_weights[1],
            Industry::Finance => insurance_state.industry_risk_weights[2],
            Industry::Education => insurance_state.industry_risk_weights[3],
            Industry::Retail => insurance_state.industry_risk_weights[4],
            Industry::Entertainment => insurance_state.industry_risk_weights[5],
            Industry::Other => insurance_state.industry_risk_weights[6],
        }
    }
    
    pub fn as_index(&self) -> usize {
        match self {
            Industry::Technology => 0,
            Industry::Healthcare => 1,
            Industry::Finance => 2,
            Industry::Education => 3,
            Industry::Retail => 4,
            Industry::Entertainment => 5,
            Industry::Other => 6,
        }
    }
}

impl Default for Industry {
    fn default() -> Self {
        Industry::Other
    }
}

#[error_code]
pub enum InsuranceError {
    #[msg("Invalid coverage amount")]
    InvalidCoverageAmount,
    
    #[msg("Invalid period days")]
    InvalidPeriodDays,
    
    #[msg("Policy not active")]
    PolicyNotActive,
    
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Program is paused")]
    ProgramPaused,
}
