use anchor_lang::prelude::*;
use crate::state::{JobType, Industry, PolicyStatus, BayesianParameters, JOB_TYPES_COUNT, INDUSTRIES_COUNT, CLAIMS_HISTORY_BUCKETS};

// Constants for Bayesian model
pub const BAYESIAN_NORMALIZATION_FACTOR: u16 = 10000; // Base for probability calculations (100.00%)
pub const DEFAULT_PRIOR_PROBABILITY: u16 = 100;       // Default prior probability (1.00%)

/// Premium calculation components for detailed breakdown
#[derive(Default)]
pub struct PremiumComponents {
    pub base_rate: u64,
    pub coverage_factor: u64,
    pub period_factor: u64,
    pub risk_weight: u64,
    pub reputation_multiplier: u64,
    pub market_adjustment: u64,
    pub bayesian_adjustment: u64,  // Added Bayesian adjustment component
}

/// Calculates premium based on coverage amount, risk factors, and period using the advanced risk model
/// Returns both the premium amount and the breakdown components
pub fn calculate_premium_with_components(
    coverage_amount: u64,
    period_days: u16,
    job_type: u8,
    industry: u8,
    reputation_score: u8,
    claims_history: u8,
    market_conditions: u8,
    base_premium_rate: u64,
    risk_curve_exponent: u8,
    job_type_risk_weights: &[u8],
    industry_risk_weights: &[u8],
    claims_history_impact_weight: u8,
    market_volatility_weight: u8
) -> (u64, PremiumComponents) {
    // Convert parameters for calculation
    let coverage_in_sol = coverage_amount as f64 / 1_000_000_000.0; // Convert lamports to SOL
    let period_ratio = period_days as f64 / 30.0; // Period in months
    
    // Get base rate in SOL
    let base_rate = base_premium_rate as f64 / 1_000_000_000.0;
    
    // Get risk curve exponent (divide by 10 to get decimal values like 0.2)
    let risk_curve_exp = risk_curve_exponent as f64 / 10.0;
    
    // Calculate reputation factor (0.7-1.0 range)
    // Higher reputation score = lower premium
    let min_reputation_factor = 0.7;
    let max_reputation_factor = 1.0;
    let reputation_multiplier = if reputation_score > 0 {
        min_reputation_factor + ((max_reputation_factor - min_reputation_factor) * (100.0 - reputation_score as f64) / 100.0)
    } else {
        max_reputation_factor // Default to max for users with no reputation
    };
    
    // Get risk weights with appropriate scaling
    let job_type_risk_weight = get_job_type_risk_weight(job_type, job_type_risk_weights) as f64 / 10.0;
    let industry_risk_weight = get_industry_risk_weight(industry, industry_risk_weights) as f64 / 10.0;
    
    // Non-linear coverage scaling with logarithmic curve
    // This provides better scaling for large coverage amounts
    let max_coverage_ratio = 5.0;
    let coverage_factor_float = (1.0 + coverage_in_sol.ln().max(0.0)) * 
                          (coverage_in_sol.powf(risk_curve_exp).min(max_coverage_ratio));
    
    // Exponential period scaling with diminishing returns
    let period_factor_float = period_ratio.powf(1.1);
    
    // Combined risk weight with Bayesian adjustment based on claims history
    let claims_adjustment = 1.0 + (claims_history as f64 * (claims_history_impact_weight as f64 / 100.0));
    let risk_weight_float = job_type_risk_weight * industry_risk_weight * claims_adjustment;
    
    // Market condition adjustment
    let market_adjustment_float = 1.0 + (market_conditions as f64 * (market_volatility_weight as f64 / 100.0));
    
    // Simplified Bayesian adjustment (will be replaced with full Bayesian in calculate_premium_with_bayesian)
    let bayesian_adjustment_float = 1.0;
    
    // Calculate premium with all factors
    let premium_sol = base_rate * 
                    coverage_factor_float * 
                    period_factor_float * 
                    risk_weight_float * 
                    reputation_multiplier *
                    market_adjustment_float *
                    bayesian_adjustment_float;
    
    // Convert back to lamports
    let premium_amount = (premium_sol * 1_000_000_000.0) as u64;
    
    // Create components structure with scaled values for UI display
    let components = PremiumComponents {
        base_rate: base_premium_rate,
        coverage_factor: (coverage_factor_float * 100.0) as u64,
        period_factor: (period_factor_float * 100.0) as u64,
        risk_weight: (risk_weight_float * 100.0) as u64,
        reputation_multiplier: (reputation_multiplier * 100.0) as u64,
        market_adjustment: (market_adjustment_float * 100.0) as u64,
        bayesian_adjustment: (bayesian_adjustment_float * 100.0) as u64,
    };
    
    (premium_amount, components)
}

/// Enhanced premium calculation using full Bayesian model
/// This function should be used when Bayesian data is available
pub fn calculate_premium_with_bayesian(
    coverage_amount: u64,
    period_days: u16,
    job_type: u8,
    industry: u8,
    reputation_score: u8,
    claims_history: u8,
    market_conditions: u8,
    base_premium_rate: u64,
    risk_curve_exponent: u8,
    job_type_risk_weights: &[u8],
    industry_risk_weights: &[u8],
    claims_history_impact_weight: u8,
    market_volatility_weight: u8,
    bayesian_parameters: &BayesianParameters
) -> (u64, PremiumComponents) {
    // First calculate base premium and components
    let (base_premium, mut components) = calculate_premium_with_components(
        coverage_amount,
        period_days,
        job_type,
        industry,
        reputation_score,
        claims_history,
        market_conditions,
        base_premium_rate,
        risk_curve_exponent,
        job_type_risk_weights,
        industry_risk_weights,
        claims_history_impact_weight,
        market_volatility_weight
    );
    
    // Apply Bayesian adjustment if we have sufficient data
    if bayesian_parameters.total_policies_processed > 100 {
        // Get prior probability for this job type and industry combination
        let job_industry_index = (job_type as usize % JOB_TYPES_COUNT) * INDUSTRIES_COUNT + 
                                (industry as usize % INDUSTRIES_COUNT);
        
        let prior_probability = if job_industry_index < bayesian_parameters.prior_probabilities.len() {
            bayesian_parameters.prior_probabilities[job_industry_index]
        } else {
            DEFAULT_PRIOR_PROBABILITY
        };
        
        // Get likelihood based on claims history bucket
        let claims_bucket = determine_claims_bucket(claims_history);
        let likelihood = if claims_bucket < bayesian_parameters.likelihood_parameters.len() {
            bayesian_parameters.likelihood_parameters[claims_bucket]
        } else {
            DEFAULT_PRIOR_PROBABILITY
        };
        
        // Calculate posterior probability (Bayes' theorem)
        // P(Risk|Claims) ∝ P(Claims|Risk) * P(Risk)
        let posterior = (prior_probability as u32 * likelihood as u32) / 
                        BAYESIAN_NORMALIZATION_FACTOR as u32;
        
        // Calculate adjustment factor (how much the posterior differs from prior)
        let bayesian_adjustment_float = (posterior as f64) / (DEFAULT_PRIOR_PROBABILITY as f64);
        
        // Apply Bayesian adjustment with a dampening factor to prevent extreme adjustments
        let dampened_adjustment = 0.8 + (bayesian_adjustment_float * 0.2).min(2.0).max(0.5);
        
        // Update the premium amount
        let adjusted_premium = (base_premium as f64 * dampened_adjustment) as u64;
        
        // Update the Bayesian adjustment component
        components.bayesian_adjustment = (dampened_adjustment * 100.0) as u64;
        
        (adjusted_premium, components)
    } else {
        // Not enough data for Bayesian adjustment
        (base_premium, components)
    }
}

/// Determines which claims history bucket to use
fn determine_claims_bucket(claims_history: u8) -> usize {
    match claims_history {
        0 => 0,
        1 => 1,
        2 => 2,
        3..=4 => 3,
        _ => 4,
    }
}

/// Calculates premium based on coverage amount, risk factors, and period using the advanced risk model
pub fn calculate_premium(
    coverage_amount: u64,
    period_days: u16,
    job_type: u8,
    industry: u8,
    reputation_score: u8,
    claims_history: u8,
    market_conditions: u8,
    base_premium_rate: u64,
    risk_curve_exponent: u8,
    job_type_risk_weights: &[u8],
    industry_risk_weights: &[u8],
    claims_history_impact_weight: u8,
    market_volatility_weight: u8
) -> u64 {
    let (premium, _) = calculate_premium_with_components(
        coverage_amount,
        period_days,
        job_type,
        industry,
        reputation_score,
        claims_history,
        market_conditions,
        base_premium_rate,
        risk_curve_exponent,
        job_type_risk_weights,
        industry_risk_weights,
        claims_history_impact_weight,
        market_volatility_weight
    );
    
    premium
}

/// Calculates risk score (0-100) based on various risk factors
pub fn calculate_risk_score(
    coverage_amount: u64,
    job_type: u8,
    industry: u8,
    reputation_score: u8,
    claims_history: u8,
    job_type_risk_weights: &[u8],
    industry_risk_weights: &[u8]
) -> u8 {
    // Convert parameters for calculation
    let coverage_in_sol = coverage_amount as f64 / 1_000_000_000.0; // Convert lamports to SOL
    
    // Get risk weights with appropriate scaling
    let job_type_risk_weight = get_job_type_risk_weight(job_type, job_type_risk_weights) as f64 / 10.0;
    let industry_risk_weight = get_industry_risk_weight(industry, industry_risk_weights) as f64 / 10.0;
    
    // Calculate risk components
    let coverage_ratio_impact = (coverage_in_sol / 10.0).min(1.0);
    let reputation_impact = 1.0 - (reputation_score as f64 / 100.0);
    let claims_impact = (claims_history as f64 * 0.2).min(1.0);
    
    // Combined job type and industry risk (20%)
    let combined_risk = (job_type_risk_weight * industry_risk_weight).min(1.0);
    
    // Calculate weighted risk score (0-100)
    let risk_score = (
        (combined_risk * 0.2) +         // Job type and industry (20%)
        (claims_impact * 0.15) +        // Claims history impact (15%)
        (coverage_ratio_impact * 0.3) + // Coverage ratio impact (30%)
        (reputation_impact * 0.35)      // Reputation impact (35%)
    ) * 100.0;
    
    risk_score.min(100.0) as u8
}

/// Helper method to get job type risk weight
pub fn get_job_type_risk_weight(job_type: u8, job_type_risk_weights: &[u8]) -> u8 {
    if job_type < job_type_risk_weights.len() as u8 {
        job_type_risk_weights[job_type as usize]
    } else {
        // Default to medium risk (1.5) if job type is out of range
        15
    }
}

/// Helper method to get industry risk weight
pub fn get_industry_risk_weight(industry: u8, industry_risk_weights: &[u8]) -> u8 {
    if industry < industry_risk_weights.len() as u8 {
        industry_risk_weights[industry as usize]
    } else {
        // Default to medium risk (1.5) if industry is out of range
        15
    }
}

/// Calculates the required reserve amount based on total coverage and reserve ratio
pub fn calculate_reserve_requirement(
    total_coverage: u64,
    reserve_ratio: u8
) -> u64 {
    (total_coverage as u128 * reserve_ratio as u128 / 100) as u64
}

/// Calculates the maximum coverage that can be offered based on available reserves
pub fn calculate_max_coverage(
    available_reserves: u64,
    reserve_ratio: u8
) -> u64 {
    (available_reserves as u128 * 100 / reserve_ratio as u128) as u64
}

/// Updates Bayesian parameters based on new policy and claim data
pub fn update_bayesian_parameters(
    bayesian_parameters: &mut BayesianParameters,
    job_type: u8,
    industry: u8,
    claims_history: u8,
    has_claim: bool,
    current_timestamp: i64
) {
    // Calculate index for job type and industry combination
    let job_industry_index = (job_type as usize % JOB_TYPES_COUNT) * INDUSTRIES_COUNT + 
                            (industry as usize % INDUSTRIES_COUNT);
    
    // Increment total policies processed
    bayesian_parameters.total_policies_processed += 1;
    
    // Update prior probabilities for this job type and industry
    if job_industry_index < bayesian_parameters.prior_probabilities.len() {
        // Gradually adjust the prior probability based on new data
        let current_prior = bayesian_parameters.prior_probabilities[job_industry_index];
        let weight_factor = 0.95; // How much weight to give to existing data vs new data
        
        // If there's a claim, increase the prior probability
        if has_claim {
            let new_prior = (current_prior as f64 * weight_factor + 
                           (1.0 - weight_factor) * 200.0) as u16; // Higher risk
            bayesian_parameters.prior_probabilities[job_industry_index] = new_prior.min(1000);
            
            // Increment total claims processed
            bayesian_parameters.total_claims_processed += 1;
        } else {
            let new_prior = (current_prior as f64 * weight_factor + 
                           (1.0 - weight_factor) * 50.0) as u16; // Lower risk
            bayesian_parameters.prior_probabilities[job_industry_index] = new_prior.max(10);
        }
    }
    
    // Update likelihood parameters based on claims history
    let claims_bucket = determine_claims_bucket(claims_history);
    if claims_bucket < bayesian_parameters.likelihood_parameters.len() {
        // Update likelihood based on whether this policy had a claim
        let current_likelihood = bayesian_parameters.likelihood_parameters[claims_bucket];
        let weight_factor = 0.95; // How much weight to give to existing data vs new data
        
        if has_claim {
            let new_likelihood = (current_likelihood as f64 * weight_factor + 
                                (1.0 - weight_factor) * 200.0) as u16; // Higher likelihood of claim
            bayesian_parameters.likelihood_parameters[claims_bucket] = new_likelihood.min(1000);
        } else {
            let new_likelihood = (current_likelihood as f64 * weight_factor + 
                                (1.0 - weight_factor) * 50.0) as u16; // Lower likelihood of claim
            bayesian_parameters.likelihood_parameters[claims_bucket] = new_likelihood.max(10);
        }
    }
    
    // Update timestamp
    bayesian_parameters.last_update_timestamp = current_timestamp;
}
