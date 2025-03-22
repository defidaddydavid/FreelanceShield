use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct UpdateRiskParameters<'info> {
    #[account(
        constraint = authority.key() == insurance_state.authority @ ErrorCode::Unauthorized
    )]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"insurance_state"],
        bump = insurance_state.bump
    )]
    pub insurance_state: Account<'info, InsuranceState>,
}

pub fn handler(
    ctx: Context<UpdateRiskParameters>,
    base_premium_rate: Option<u64>,
    risk_curve_exponent: Option<u8>,
    reputation_impact_weight: Option<u8>,
    claims_history_impact_weight: Option<u8>,
    market_volatility_weight: Option<u8>,
    job_type_risk_weights: Option<[u8; 6]>,
    industry_risk_weights: Option<[u8; 7]>,
    min_coverage_amount: Option<u64>,
    max_coverage_amount: Option<u64>,
    min_period_days: Option<u16>,
    max_period_days: Option<u16>,
    is_paused: Option<bool>,
) -> Result<()> {
    let insurance_state = &mut ctx.accounts.insurance_state;
    
    // Update risk model parameters if provided
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
    
    // Update coverage and period limits if provided
    if let Some(min_coverage) = min_coverage_amount {
        insurance_state.min_coverage_amount = min_coverage;
    }
    
    if let Some(max_coverage) = max_coverage_amount {
        insurance_state.max_coverage_amount = max_coverage;
    }
    
    if let Some(min_period) = min_period_days {
        insurance_state.min_period_days = min_period;
    }
    
    if let Some(max_period) = max_period_days {
        insurance_state.max_period_days = max_period;
    }
    
    // Update pause state if provided
    if let Some(paused) = is_paused {
        insurance_state.is_paused = paused;
    }
    
    Ok(())
}
