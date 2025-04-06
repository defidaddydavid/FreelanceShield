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
    // Base adjustment starts at 0
    let mut adjustment: i16 = 0;
    
    // Enhanced capital adequacy adjustment with graduated tiers
    if capital_adequacy_ratio < 60 {
        // Critical capital adequacy, significant premium increase
        adjustment += 25;
        msg!("Critical capital adequacy ({}%), adding +25% to premium", capital_adequacy_ratio);
    } else if capital_adequacy_ratio < 80 {
        // Low capital adequacy, moderate premium increase
        adjustment += 15;
        msg!("Low capital adequacy ({}%), adding +15% to premium", capital_adequacy_ratio);
    } else if capital_adequacy_ratio < 100 {
        // Below target capital adequacy, small premium increase
        adjustment += 5;
        msg!("Below target capital adequacy ({}%), adding +5% to premium", capital_adequacy_ratio);
    } else if capital_adequacy_ratio > 200 {
        // Very high capital adequacy, larger premium decrease
        adjustment -= 10;
        msg!("Very high capital adequacy ({}%), reducing premium by -10%", capital_adequacy_ratio);
    } else if capital_adequacy_ratio > 150 {
        // High capital adequacy, moderate premium decrease
        adjustment -= 5;
        msg!("High capital adequacy ({}%), reducing premium by -5%", capital_adequacy_ratio);
    }
    
    // Enhanced expected loss ratio adjustment with graduated tiers
    if expected_loss_ratio > 90 {
        // Critical loss ratio, significant premium increase
        adjustment += 20;
        msg!("Critical loss ratio ({}%), adding +20% to premium", expected_loss_ratio);
    } else if expected_loss_ratio > 80 {
        // High loss ratio, moderate premium increase
        adjustment += 10;
        msg!("High loss ratio ({}%), adding +10% to premium", expected_loss_ratio);
    } else if expected_loss_ratio > 70 {
        // Above target loss ratio, small premium increase
        adjustment += 5;
        msg!("Above target loss ratio ({}%), adding +5% to premium", expected_loss_ratio);
    } else if expected_loss_ratio < 30 {
        // Very low loss ratio, larger premium decrease
        adjustment -= 10;
        msg!("Very low loss ratio ({}%), reducing premium by -10%", expected_loss_ratio);
    } else if expected_loss_ratio < 40 {
        // Low loss ratio, moderate premium decrease
        adjustment -= 5;
        msg!("Low loss ratio ({}%), reducing premium by -5%", expected_loss_ratio);
    }
    
    // Enhanced market volatility adjustment with graduated tiers
    if market_volatility > 80 {
        // Extreme volatility, significant premium increase
        adjustment += 15;
        msg!("Extreme market volatility ({}%), adding +15% to premium", market_volatility);
    } else if market_volatility > 70 {
        // High volatility, moderate premium increase
        adjustment += 10;
        msg!("High market volatility ({}%), adding +10% to premium", market_volatility);
    } else if market_volatility > 60 {
        // Above average volatility, small premium increase
        adjustment += 5;
        msg!("Above average market volatility ({}%), adding +5% to premium", market_volatility);
    }
    
    // Cap adjustment between -20% and +30%
    if adjustment > 30 {
        adjustment = 30;
        msg!("Premium adjustment capped at maximum +30%");
    } else if adjustment < -20 {
        adjustment = -20;
        msg!("Premium adjustment capped at minimum -20%");
    }
    
    msg!("Final premium adjustment: {}%", adjustment);
    
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

/// Calculate risk score for a claim based on multiple weighted factors
/// Returns a risk score from 0-100 (higher = riskier)
pub fn calculate_claim_risk_score(
    policy_risk_score: u8,
    claim_amount: u64,
    coverage_amount: u64,
    policy_duration_seconds: i64,
    time_since_policy_start: i64,
    claims_count: u8,
    avg_claim_amount: Option<u64>,
) -> Result<u8> {
    // Validate inputs
    require!(
        policy_risk_score <= 100,
        FreelanceShieldError::InvalidRiskParameter
    );
    
    // Factor 1: Amount ratio (claim amount as percentage of coverage)
    // Higher percentage = higher risk
    let amount_ratio = if coverage_amount > 0 {
        ((claim_amount as f64 / coverage_amount as f64) * 100.0) as u8
    } else {
        100 // Maximum risk if coverage amount is zero
    };
    
    // Factor 2: Policy age factor
    // Newer policies with claims are riskier
    let policy_age_factor = if policy_duration_seconds > 0 {
        let policy_age_percentage = ((time_since_policy_start as f64 / policy_duration_seconds as f64) * 100.0) as u8;
        // Invert so newer policies (lower percentage) have higher risk
        100 - policy_age_percentage.min(100)
    } else {
        100 // Maximum risk if policy duration is zero
    };
    
    // Factor 3: Previous claims factor
    // More previous claims = higher risk
    let claims_factor = (claims_count * 20).min(100);
    
    // Factor 4: Anomaly detection
    // Compare claim amount to average claim amount
    let anomaly_factor = if let Some(avg) = avg_claim_amount {
        if avg > 0 {
            let deviation = if claim_amount > avg {
                ((claim_amount as f64 / avg as f64) - 1.0) * 100.0
            } else {
                0.0
            };
            (deviation as u8).min(100)
        } else {
            50 // Neutral if no average data
        }
    } else {
        50 // Neutral if no average data
    };
    
    // Calculate weighted risk score
    // Base policy risk: 30%
    // Amount ratio: 25%
    // Policy age: 20%
    // Claims history: 15%
    // Anomaly detection: 10%
    let risk_score = (
        (policy_risk_score as u16 * 30) +
        (amount_ratio as u16 * 25) +
        (policy_age_factor as u16 * 20) +
        (claims_factor as u16 * 15) +
        (anomaly_factor as u16 * 10)
    ) / 100;
    
    // Log detailed risk factors for transparency
    msg!("Risk factors - Policy: {}, Amount: {}, Age: {}, Claims: {}, Anomaly: {}", 
        policy_risk_score, amount_ratio, policy_age_factor, claims_factor, anomaly_factor);
    
    Ok(risk_score as u8)
}

/// Simple version of claim risk calculation for backward compatibility
pub fn calculate_claim_risk_score_simple(
    policy_risk_score: u8,
    claim_amount: u64,
    coverage_amount: u64,
    policy_duration_seconds: i64,
    time_since_policy_start: i64
) -> Result<u8> {
    // This is a simplified version that only uses basic factors
    // for compatibility with existing code
    
    // Amount ratio (claim amount as percentage of coverage)
    let amount_ratio = if coverage_amount > 0 {
        ((claim_amount as f64 / coverage_amount as f64) * 100.0) as u8
    } else {
        100 // Maximum risk if coverage amount is zero
    };
    
    // Policy age factor
    let policy_age_factor = if policy_duration_seconds > 0 {
        let policy_age_percentage = ((time_since_policy_start as f64 / policy_duration_seconds as f64) * 100.0) as u8;
        100 - policy_age_percentage.min(100)
    } else {
        100 // Maximum risk if policy duration is zero
    };
    
    // Calculate weighted risk score
    let risk_score = (
        (policy_risk_score as u16 * 40) +
        (amount_ratio as u16 * 40) +
        (policy_age_factor as u16 * 20)
    ) / 100;
    
    Ok(risk_score as u8)
}
