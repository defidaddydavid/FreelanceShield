use anchor_lang::prelude::*;
use crate::reputation_integration::{calculate_premium_with_reputation, fetch_reputation_discount};

/// Premium calculation module for the FreelanceShield risk pool
/// Implements dynamic premium calculation based on:
/// 1. Contract value
/// 2. Historical risk factors
/// 3. User reputation score
/// 4. Global risk pool metrics

// Risk category constants
pub const RISK_CATEGORY_LOW: u8 = 1;
pub const RISK_CATEGORY_MEDIUM: u8 = 2;
pub const RISK_CATEGORY_HIGH: u8 = 3;

// Base premium rates (in basis points - 100 = 1%)
pub const BASE_PREMIUM_LOW_RISK: u16 = 200;    // 2.00%
pub const BASE_PREMIUM_MEDIUM_RISK: u16 = 350; // 3.50%
pub const BASE_PREMIUM_HIGH_RISK: u16 = 500;   // 5.00%

// Minimum premiums by risk category (in lamports)
pub const MIN_PREMIUM_LOW_RISK: u64 = 5_000_000;    // 0.005 SOL
pub const MIN_PREMIUM_MEDIUM_RISK: u64 = 10_000_000; // 0.01 SOL
pub const MIN_PREMIUM_HIGH_RISK: u64 = 20_000_000;   // 0.02 SOL

/// Calculate base premium for a contract
pub fn calculate_base_premium(
    contract_value: u64,
    risk_category: u8,
    contract_duration_days: u16,
) -> Result<u64> {
    // Get base premium rate based on risk category
    let base_rate = match risk_category {
        RISK_CATEGORY_LOW => BASE_PREMIUM_LOW_RISK,
        RISK_CATEGORY_MEDIUM => BASE_PREMIUM_MEDIUM_RISK,
        RISK_CATEGORY_HIGH => BASE_PREMIUM_HIGH_RISK,
        _ => return Err(error!(RiskPoolError::InvalidRiskCategory)),
    };
    
    // Calculate duration factor (longer contracts have reduced rates)
    let duration_factor = if contract_duration_days <= 7 {
        // Short term contracts have higher rates
        12000 // 1.20x multiplier
    } else if contract_duration_days <= 30 {
        // 1-4 weeks
        10000 // 1.00x multiplier (baseline)
    } else if contract_duration_days <= 90 {
        // 1-3 months
        9000 // 0.90x multiplier
    } else {
        // 3+ months
        8000 // 0.80x multiplier
    };
    
    // Calculate premium with duration adjustment
    let adjusted_rate = (base_rate as u64 * duration_factor as u64) / 10000;
    
    // Calculate premium amount
    let premium = (contract_value * adjusted_rate) / 10000;
    
    // Enforce minimum premium
    let min_premium = match risk_category {
        RISK_CATEGORY_LOW => MIN_PREMIUM_LOW_RISK,
        RISK_CATEGORY_MEDIUM => MIN_PREMIUM_MEDIUM_RISK,
        RISK_CATEGORY_HIGH => MIN_PREMIUM_HIGH_RISK,
        _ => return Err(error!(RiskPoolError::InvalidRiskCategory)),
    };
    
    Ok(std::cmp::max(premium, min_premium))
}

/// Calculate premium with all factors including reputation
pub fn calculate_premium_with_all_factors(
    ctx: &Context<crate::instructions::calculate_premium::CalculatePremium>,
    contract_value: u64,
    risk_category: u8,
    contract_duration_days: u16,
    reputation_program_id: &Pubkey,
    user: &Pubkey,
    user_reputation_profile: &Pubkey, 
    reputation_state: &Pubkey,
    bayesian_params: &Pubkey,
) -> Result<u64> {
    // Calculate base premium
    let base_premium = calculate_base_premium(
        contract_value, 
        risk_category, 
        contract_duration_days
    )?;
    
    // Get reputation discount if available
    let reputation_discount = fetch_reputation_discount(
        &ctx.accounts.risk_pool_state.key(),
        reputation_program_id,
        user,
        user_reputation_profile,
        reputation_state,
        bayesian_params,
        &ctx.accounts.authority.key(),
    ).ok();
    
    // Calculate final premium with reputation discount
    calculate_premium_with_reputation(ctx, base_premium, reputation_discount)
}

/// Calculate risk for a specific contract
pub fn assess_contract_risk(
    contract_value: u64,
    freelancer_completed_contracts: u32,
    freelancer_reputation_score: u16, // 0-10000 scale
    client_completed_contracts: u32,
    client_reputation_score: u16,     // 0-10000 scale
    contract_type: &str,
    requires_milestone_payments: bool,
) -> u8 {
    // Base risk starts at medium
    let mut risk_points = 50;
    
    // Contract value risk (higher value = higher risk)
    if contract_value >= 100_000_000_000 { // 100 SOL
        risk_points += 20;
    } else if contract_value >= 50_000_000_000 { // 50 SOL
        risk_points += 10;
    } else if contract_value >= 10_000_000_000 { // 10 SOL
        risk_points += 5;
    }
    
    // Freelancer experience risk
    if freelancer_completed_contracts >= 50 {
        risk_points -= 15;
    } else if freelancer_completed_contracts >= 20 {
        risk_points -= 10;
    } else if freelancer_completed_contracts >= 5 {
        risk_points -= 5;
    } else {
        risk_points += 10; // Very new freelancer
    }
    
    // Freelancer reputation risk
    if freelancer_reputation_score >= 8000 { // 80%+
        risk_points -= 15;
    } else if freelancer_reputation_score >= 6000 { // 60%+
        risk_points -= 10;
    } else if freelancer_reputation_score <= 4000 { // Below 40%
        risk_points += 15;
    }
    
    // Client experience risk
    if client_completed_contracts >= 20 {
        risk_points -= 10;
    } else if client_completed_contracts == 0 {
        risk_points += 10; // New client
    }
    
    // Client reputation risk
    if client_reputation_score >= 8000 { // 80%+
        risk_points -= 10;
    } else if client_reputation_score <= 4000 { // Below 40%
        risk_points += 15;
    }
    
    // Contract type risk
    match contract_type.to_lowercase().as_str() {
        "development" => risk_points += 0, // Baseline
        "design" => risk_points -= 5,      // Lower risk
        "marketing" => risk_points += 5,   // Higher risk
        "writing" => risk_points -= 5,     // Lower risk
        "consulting" => risk_points += 10, // Higher risk
        _ => risk_points += 5,             // Unknown type
    }
    
    // Milestone payments risk reduction
    if requires_milestone_payments {
        risk_points -= 10; // Reduced risk with milestones
    }
    
    // Convert risk points to category
    if risk_points < 40 {
        RISK_CATEGORY_LOW
    } else if risk_points < 70 {
        RISK_CATEGORY_MEDIUM
    } else {
        RISK_CATEGORY_HIGH
    }
}

#[error_code]
pub enum RiskPoolError {
    #[msg("Invalid risk category provided")]
    InvalidRiskCategory,
    
    #[msg("Invalid contract value")]
    InvalidContractValue,
    
    #[msg("Invalid contract duration")]
    InvalidContractDuration,
    
    #[msg("Risk pool capital insufficient")]
    InsufficientCapital,
    
    #[msg("Premium calculation error")]
    PremiumCalculationError,
}
