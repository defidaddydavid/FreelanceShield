use anchor_lang::prelude::*;
use crate::FreelanceShieldError;

/// Calculate the minimum capital requirement based on risk parameters
pub fn calculate_min_capital_requirement(
    current_policies: u32,
    avg_claim_severity: u64,
    avg_claim_frequency: u8,
    market_volatility: u8,
    risk_buffer_percentage: u8
) -> Result<u64> {
    // Validate inputs
    require!(
        market_volatility <= 100,
        FreelanceShieldError::InvalidRiskParameter
    );
    
    require!(
        risk_buffer_percentage <= 100,
        FreelanceShieldError::InvalidRiskParameter
    );
    
    // Base expected loss = policies * avg_severity * avg_frequency
    let base_expected_loss = current_policies as u64 * avg_claim_severity * avg_claim_frequency as u64;
    
    // Volatility factor (1.0 to 2.0)
    let volatility_factor = 100 + market_volatility;
    
    // Risk buffer factor (1.0 to 2.0)
    let risk_buffer_factor = 100 + risk_buffer_percentage;
    
    // Calculate minimum capital with volatility and risk buffer
    // (base_expected_loss * volatility_factor * risk_buffer_factor) / 10000
    let min_capital = (base_expected_loss * volatility_factor as u64 * risk_buffer_factor as u64) / 10000;
    
    Ok(min_capital)
}

/// Calculate recommended premium adjustment based on risk metrics
pub fn calculate_premium_adjustment(
    capital_adequacy_ratio: u16,
    expected_loss_ratio: u16,
    market_volatility: u8
) -> Result<i8> {
    // Validate inputs
    require!(
        market_volatility <= 100,
        FreelanceShieldError::InvalidRiskParameter
    );
    
    // Base adjustment starts at 0
    let mut adjustment: i16 = 0;
    
    // Adjust based on capital adequacy
    if capital_adequacy_ratio < 80 {
        // Low capital adequacy, increase premium
        adjustment += 15;
    } else if capital_adequacy_ratio > 150 {
        // High capital adequacy, decrease premium
        adjustment -= 5;
    }
    
    // Adjust based on expected loss ratio
    if expected_loss_ratio > 80 {
        // High expected losses, increase premium
        adjustment += 10;
    } else if expected_loss_ratio < 40 {
        // Low expected losses, decrease premium
        adjustment -= 5;
    }
    
    // Adjust based on market volatility
    if market_volatility > 70 {
        // High volatility, increase premium
        adjustment += 5;
    }
    
    // Cap adjustment between -20% and +30%
    if adjustment > 30 {
        adjustment = 30;
    } else if adjustment < -20 {
        adjustment = -20;
    }
    
    // Convert to i8 for storage
    Ok(adjustment as i8)
}

/// Calculate premium for a policy based on risk parameters
pub fn calculate_premium(
    coverage_amount: u64,
    coverage_period_days: u16,
    risk_factor: u8,
    base_premium_rate: u16,
    product_risk_multiplier: u16
) -> Result<u64> {
    // Validate inputs
    require!(
        risk_factor <= 100,
        FreelanceShieldError::InvalidRiskParameter
    );
    
    // Calculate annual premium rate (per 10,000 units of coverage)
    // Formula: base_rate * risk_factor * product_multiplier / 10000
    let annual_rate = (base_premium_rate as u64 * risk_factor as u64 * product_risk_multiplier as u64) / 10000;
    
    // Calculate premium for the coverage amount
    // Formula: (coverage_amount * annual_rate) / 10000
    let annual_premium = (coverage_amount * annual_rate) / 10000;
    
    // Adjust for coverage period
    // Formula: (annual_premium * coverage_period_days) / 365
    let period_premium = (annual_premium * coverage_period_days as u64) / 365;
    
    Ok(period_premium)
}

/// Calculate risk score based on various factors
pub fn calculate_risk_score(
    coverage_amount: u64,
    coverage_period_days: u16,
    client_history_score: u8,
    project_complexity: u8,
    market_sector_risk: u8
) -> Result<u8> {
    // Validate inputs
    require!(
        client_history_score <= 100 &&
        project_complexity <= 100 &&
        market_sector_risk <= 100,
        FreelanceShieldError::InvalidRiskParameter
    );
    
    // Base risk starts at 50 (medium risk)
    let mut risk_score: u16 = 50;
    
    // Adjust based on coverage amount (higher coverage = higher risk)
    if coverage_amount > 10_000_000 { // 10M
        risk_score += 15;
    } else if coverage_amount > 1_000_000 { // 1M
        risk_score += 10;
    } else if coverage_amount > 100_000 { // 100K
        risk_score += 5;
    }
    
    // Adjust based on coverage period (longer period = higher risk)
    if coverage_period_days > 180 { // 6 months
        risk_score += 10;
    } else if coverage_period_days > 90 { // 3 months
        risk_score += 5;
    }
    
    // Adjust based on client history (higher score = lower risk)
    risk_score = risk_score.saturating_sub(client_history_score as u16 / 5);
    
    // Adjust based on project complexity (higher complexity = higher risk)
    risk_score += project_complexity as u16 / 5;
    
    // Adjust based on market sector risk
    risk_score += market_sector_risk as u16 / 5;
    
    // Cap risk score between 10 and 100
    if risk_score > 100 {
        risk_score = 100;
    } else if risk_score < 10 {
        risk_score = 10;
    }
    
    Ok(risk_score as u8)
}

