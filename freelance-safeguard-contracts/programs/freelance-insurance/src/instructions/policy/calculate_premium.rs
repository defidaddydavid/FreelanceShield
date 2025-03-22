use anchor_lang::prelude::*;
use crate::state::*;
use crate::utils::math;

#[derive(Accounts)]
pub struct CalculatePremium<'info> {
    /// The user requesting the premium calculation
    pub user: Signer<'info>,
    
    /// The insurance state account containing risk parameters
    pub insurance_state: Account<'info, InsuranceState>,
}

/// Response structure for premium calculation
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct PremiumCalculationResult {
    /// Premium amount in lamports
    pub premium_amount: u64,
    
    /// Risk score (0-100)
    pub risk_score: u8,
    
    /// Base rate used in calculation (in lamports)
    pub base_rate: u64,
    
    /// Coverage factor used in calculation
    pub coverage_factor: u64,
    
    /// Period factor used in calculation
    pub period_factor: u64,
    
    /// Risk weight used in calculation
    pub risk_weight: u64,
    
    /// Reputation multiplier used in calculation
    pub reputation_multiplier: u64,
    
    /// Market adjustment used in calculation
    pub market_adjustment: u64,
}

pub fn handler(
    ctx: Context<CalculatePremium>,
    coverage_amount: u64,
    period_days: u16,
    job_type: u8,
    industry: u8,
    reputation_score: u8,
    claims_history: u8,
    market_conditions: u8,
) -> Result<PremiumCalculationResult> {
    let insurance_state = &ctx.accounts.insurance_state;
    
    // Calculate premium using advanced risk model with detailed components
    let (premium_amount, components) = math::calculate_premium_with_components(
        coverage_amount,
        period_days,
        job_type,
        industry,
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
        job_type,
        industry,
        reputation_score,
        claims_history,
        &insurance_state.job_type_risk_weights,
        &insurance_state.industry_risk_weights
    );
    
    Ok(PremiumCalculationResult {
        premium_amount,
        risk_score,
        base_rate: components.base_rate,
        coverage_factor: components.coverage_factor,
        period_factor: components.period_factor,
        risk_weight: components.risk_weight,
        reputation_multiplier: components.reputation_multiplier,
        market_adjustment: components.market_adjustment,
    })
}
