use anchor_lang::prelude::*;

// Constants for Bayesian model
pub const JOB_TYPES_COUNT: usize = 6;
pub const INDUSTRIES_COUNT: usize = 7;
pub const CLAIMS_HISTORY_BUCKETS: usize = 5;

/// Bayesian model parameters for risk assessment
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct BayesianParameters {
    /// Prior probabilities for each job type and industry combination
    /// Stored as basis points (1/100 of a percent)
    pub prior_probabilities: [u16; JOB_TYPES_COUNT * INDUSTRIES_COUNT],
    
    /// Likelihood parameters for different claims history buckets
    /// Stored as basis points (1/100 of a percent)
    pub likelihood_parameters: [u16; CLAIMS_HISTORY_BUCKETS],
    
    /// Total policies processed in the Bayesian model
    pub total_policies_processed: u64,
    
    /// Total claims processed in the Bayesian model
    pub total_claims_processed: u64,
    
    /// Last update timestamp
    pub last_update_timestamp: i64,
}

#[account]
pub struct InsuranceState {
    /// Version of the insurance state structure for future upgrades
    pub version: u8,
    
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
    pub is_paused: bool,
    
    // Advanced risk model parameters
    pub base_premium_rate: u64,            // Base premium rate in lamports
    pub risk_curve_exponent: u8,           // Exponent for risk curve (divided by 10 for decimal)
    pub reputation_impact_weight: u8,      // Weight for reputation impact (percentage)
    pub claims_history_impact_weight: u8,  // Weight for claims history impact (percentage)
    pub market_volatility_weight: u8,      // Weight for market volatility (percentage)
    
    // Risk weights for different job types and industries
    pub job_type_risk_weights: [u8; 6],    // Risk weights for each job type (divided by 10 for decimal)
    pub industry_risk_weights: [u8; 7],    // Risk weights for each industry (divided by 10 for decimal)
    
    /// Bayesian model parameters for advanced risk assessment
    pub bayesian_parameters: BayesianParameters,
    
    /// Reserved space for future upgrades (64 bytes)
    pub reserved: [u8; 64],
    
    pub bump: u8,
}

impl InsuranceState {
    pub fn space() -> usize {
        8 +                 // discriminator
        1 +                 // version
        32 +                // authority
        32 +                // risk_pool_authority
        1 +                 // base_reserve_ratio
        8 +                 // min_coverage_amount
        8 +                 // max_coverage_amount
        2 +                 // min_period_days
        2 +                 // max_period_days
        8 +                 // total_policies
        8 +                 // active_policies
        8 +                 // total_coverage
        8 +                 // total_premiums
        8 +                 // total_claims_paid
        1 +                 // is_paused
        8 +                 // base_premium_rate
        1 +                 // risk_curve_exponent
        1 +                 // reputation_impact_weight
        1 +                 // claims_history_impact_weight
        1 +                 // market_volatility_weight
        6 +                 // job_type_risk_weights
        7 +                 // industry_risk_weights
        (2 * JOB_TYPES_COUNT * INDUSTRIES_COUNT) + // prior_probabilities
        (2 * CLAIMS_HISTORY_BUCKETS) +            // likelihood_parameters
        8 +                 // total_policies_processed
        8 +                 // total_claims_processed
        8 +                 // last_update_timestamp
        64 +                // reserved
        1                   // bump
    }
}
