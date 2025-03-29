use anchor_lang::prelude::*;

/// Main program state account for the FreelanceShield core program
/// This consolidates parameters previously spread across multiple programs
#[account]
#[derive(Default)]
pub struct ProgramState {
    /// Program authority (admin)
    pub authority: Pubkey,
    
    // === Insurance Parameters ===
    /// Base reserve ratio required (percentage)
    pub base_reserve_ratio: u8,
    /// Minimum allowed coverage amount (in lamports)
    pub min_coverage_amount: u64,
    /// Maximum allowed coverage amount (in lamports)
    pub max_coverage_amount: u64,
    /// Minimum policy period in days
    pub min_period_days: u16,
    /// Maximum policy period in days
    pub max_period_days: u16,
    /// Grace period after policy expiration (in days)
    pub grace_period_days: u8,
    /// Period for submitting claims after policy expiration (in days)
    pub claim_period_days: u8,
    
    // === Risk Parameters ===
    /// Target reserve ratio (percentage)
    pub target_reserve_ratio: u8,
    /// Minimum capital requirement (in lamports)
    pub min_capital_requirement: u64,
    /// Risk buffer percentage for simulation
    pub risk_buffer_percentage: u8,
    /// Number of iterations for Monte Carlo simulation
    pub monte_carlo_iterations: u16,
    
    // === Claims Parameters ===
    /// Threshold for sending claims to arbitration
    pub arbitration_threshold: u8,
    /// Maximum auto-approval claim amount
    pub auto_claim_limit: u64,
    /// Risk threshold for auto-processing
    pub auto_process_threshold: u8,
    /// Minimum votes required for community decision
    pub min_votes_required: u8,
    /// Voting period in days
    pub voting_period_days: u8,
    
    // === Premium Calculation Parameters ===
    /// Base premium rate (in lamports)
    pub base_premium_rate: u64,
    /// Risk curve exponent for non-linear pricing
    pub risk_curve_exponent: u8,
    /// Weight of reputation in pricing
    pub reputation_impact_weight: u8,
    /// Weight of claims history in pricing
    pub claims_history_impact_weight: u8,
    /// Weight of market volatility in pricing
    pub market_volatility_weight: u8,
    /// Normalized risk weights by job type (x10)
    pub job_type_risk_weights: [u8; 6],
    /// Normalized risk weights by industry (x10)
    pub industry_risk_weights: [u8; 7],
    
    // === Program Statistics ===
    /// Total number of products created
    pub total_products: u64,
    /// Total number of policies issued
    pub total_policies: u64,
    /// Number of currently active policies
    pub active_policies: u64,
    /// Total coverage amount across all policies
    pub total_coverage: u64,
    /// Total premiums collected
    pub total_premiums: u64,
    /// Total claims paid
    pub total_claims_paid: u64,
    /// Total approved claims
    pub approved_claims: u64,
    /// Total rejected claims
    pub rejected_claims: u64,
    /// Total arbitrated claims
    pub arbitrated_claims: u64,
    /// Premium to claims ratio (x100)
    pub premium_to_claims_ratio: u16,
    
    // === Risk Pool Stats ===
    /// Total capital in the risk pool
    pub total_capital: u64,
    /// Total coverage liability
    pub total_coverage_liability: u64,
    /// Current reserve ratio
    pub current_reserve_ratio: u8,
    
    // === Program Status ===
    /// Whether the program is paused
    pub is_paused: bool,
    /// Last update timestamp
    pub last_update_timestamp: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl ProgramState {
    pub const SEED_PREFIX: &'static [u8] = b"program_state";
    
    pub const SIZE: usize = 8 + // discriminator
        32 + // authority
        1 +  // base_reserve_ratio
        8 +  // min_coverage_amount
        8 +  // max_coverage_amount
        2 +  // min_period_days
        2 +  // max_period_days
        1 +  // grace_period_days
        1 +  // claim_period_days
        1 +  // target_reserve_ratio
        8 +  // min_capital_requirement
        1 +  // risk_buffer_percentage
        2 +  // monte_carlo_iterations
        1 +  // arbitration_threshold
        8 +  // auto_claim_limit
        1 +  // auto_process_threshold
        1 +  // min_votes_required
        1 +  // voting_period_days
        8 +  // base_premium_rate
        1 +  // risk_curve_exponent
        1 +  // reputation_impact_weight
        1 +  // claims_history_impact_weight
        1 +  // market_volatility_weight
        6 +  // job_type_risk_weights
        7 +  // industry_risk_weights
        8 +  // total_products
        8 +  // total_policies
        8 +  // active_policies
        8 +  // total_coverage
        8 +  // total_premiums
        8 +  // total_claims_paid
        8 +  // approved_claims
        8 +  // rejected_claims
        8 +  // arbitrated_claims
        2 +  // premium_to_claims_ratio
        8 +  // total_capital
        8 +  // total_coverage_liability
        1 +  // current_reserve_ratio
        1 +  // is_paused
        8 +  // last_update_timestamp
        1;   // bump
}

/// Parameters for initializing the program
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeParams {
    /// Base reserve ratio required (percentage)
    pub base_reserve_ratio: u8,
    /// Minimum allowed coverage amount (in lamports)
    pub min_coverage_amount: u64,
    /// Maximum allowed coverage amount (in lamports)
    pub max_coverage_amount: u64,
    /// Minimum policy period in days
    pub min_period_days: u16,
    /// Maximum policy period in days
    pub max_period_days: u16,
    /// Grace period after policy expiration (in days)
    pub grace_period_days: u8,
    /// Period for submitting claims after policy expiration (in days)
    pub claim_period_days: u8,
    /// Target reserve ratio (percentage)
    pub target_reserve_ratio: u8,
    /// Minimum capital requirement (in lamports)
    pub min_capital_requirement: u64,
    /// Risk buffer percentage for simulation
    pub risk_buffer_percentage: u8,
    /// Number of iterations for Monte Carlo simulation
    pub monte_carlo_iterations: u16,
    /// Threshold for sending claims to arbitration
    pub arbitration_threshold: u8,
    /// Maximum auto-approval claim amount
    pub auto_claim_limit: u64,
    /// Risk threshold for auto-processing
    pub auto_process_threshold: u8,
    /// Minimum votes required for community decision
    pub min_votes_required: u8,
    /// Voting period in days
    pub voting_period_days: u8,
    /// Base premium rate (in lamports)
    pub base_premium_rate: u64,
}

/// Parameters for updating program parameters
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateProgramParamsParams {
    /// Base reserve ratio required (percentage)
    pub base_reserve_ratio: Option<u8>,
    /// Minimum allowed coverage amount (in lamports)
    pub min_coverage_amount: Option<u64>,
    /// Maximum allowed coverage amount (in lamports)
    pub max_coverage_amount: Option<u64>,
    /// Minimum policy period in days
    pub min_period_days: Option<u16>,
    /// Maximum policy period in days
    pub max_period_days: Option<u16>,
    /// Grace period after policy expiration (in days)
    pub grace_period_days: Option<u8>,
    /// Period for submitting claims after policy expiration (in days)
    pub claim_period_days: Option<u8>,
    /// Target reserve ratio (percentage)
    pub target_reserve_ratio: Option<u8>,
    /// Minimum capital requirement (in lamports)
    pub min_capital_requirement: Option<u64>,
    /// Risk buffer percentage for simulation
    pub risk_buffer_percentage: Option<u8>,
    /// Number of iterations for Monte Carlo simulation
    pub monte_carlo_iterations: Option<u16>,
    /// Threshold for sending claims to arbitration
    pub arbitration_threshold: Option<u8>,
    /// Maximum auto-approval claim amount
    pub auto_claim_limit: Option<u64>,
    /// Risk threshold for auto-processing
    pub auto_process_threshold: Option<u8>,
    /// Minimum votes required for community decision
    pub min_votes_required: Option<u8>,
    /// Voting period in days
    pub voting_period_days: Option<u8>,
    /// Base premium rate (in lamports)
    pub base_premium_rate: Option<u64>,
    /// Risk curve exponent for non-linear pricing
    pub risk_curve_exponent: Option<u8>,
    /// Weight of reputation in pricing
    pub reputation_impact_weight: Option<u8>,
    /// Weight of claims history in pricing
    pub claims_history_impact_weight: Option<u8>,
    /// Weight of market volatility in pricing
    pub market_volatility_weight: Option<u8>,
    /// Normalized risk weights by job type (x10)
    pub job_type_risk_weights: Option<[u8; 6]>,
    /// Normalized risk weights by industry (x10)
    pub industry_risk_weights: Option<[u8; 7]>,
    /// Whether the program is paused
    pub is_paused: Option<bool>,
}

