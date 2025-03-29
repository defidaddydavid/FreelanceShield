use anchor_lang::prelude::*;

/// Risk pool state account
#[account]
#[derive(Default)]
pub struct RiskPool {
    /// Authority that manages the risk pool
    pub authority: Pubkey,
    /// Total capital in the risk pool (in lamports)
    pub total_capital: u64,
    /// Total coverage liability (in lamports)
    pub total_coverage_liability: u64,
    /// Current reserve ratio (percentage)
    pub current_reserve_ratio: u8,
    /// Total premiums collected (in lamports)
    pub total_premiums_collected: u64,
    /// Total claims paid out (in lamports)
    pub total_claims_paid: u64,
    /// Premium to claims ratio (x100)
    pub premium_to_claims_ratio: u16,
    /// Last metrics update timestamp
    pub last_metrics_update: i64,
    /// Maximum amount that can be auto-approved for claims
    pub max_auto_approve_amount: u64,
    /// Percentage allocated to staking rewards
    pub staking_allocation_percentage: u8,
    /// Treasury allocation percentage
    pub treasury_allocation_percentage: u8,
    /// Treasury wallet address
    pub treasury_wallet: Pubkey,
    /// Whether the risk pool is paused
    pub is_paused: bool,
    /// PDA bump seed
    pub bump: u8,
}

impl RiskPool {
    pub const SEED_PREFIX: &'static [u8] = b"risk_pool";
    
    pub const SIZE: usize = 8 + // discriminator
        32 + // authority
        8 +  // total_capital
        8 +  // total_coverage_liability
        1 +  // current_reserve_ratio
        8 +  // total_premiums_collected
        8 +  // total_claims_paid
        2 +  // premium_to_claims_ratio
        8 +  // last_metrics_update
        8 +  // max_auto_approve_amount
        1 +  // staking_allocation_percentage
        1 +  // treasury_allocation_percentage
        32 + // treasury_wallet
        1 +  // is_paused
        1;   // bump
}

/// Risk simulation results
#[account]
#[derive(Default)]
pub struct SimulationResult {
    /// Timestamp of simulation run
    pub run_timestamp: i64,
    /// Number of current policies at time of simulation
    pub current_policies: u64,
    /// Average claim frequency (x10)
    pub avg_claim_frequency: u8,
    /// Average claim severity in lamports
    pub avg_claim_severity: u64,
    /// Market volatility factor (x10)
    pub market_volatility: u8,
    /// Expected loss ratio (x100)
    pub expected_loss_ratio: u16,
    /// Capital adequacy ratio (x100)
    pub capital_adequacy_ratio: u16,
    /// Minimum required capital
    pub min_required_capital: u64,
    /// 95th percentile loss estimate
    pub tail_risk_95th: u64,
    /// 99th percentile loss estimate
    pub tail_risk_99th: u64,
    /// Recommended premium adjustment (x100, +/- percentage)
    pub recommended_premium_adjustment: i16,
    /// PDA bump seed
    pub bump: u8,
}

impl SimulationResult {
    pub const SEED_PREFIX: &'static [u8] = b"simulation_result";
    
    pub const SIZE: usize = 8 + // discriminator
        8 +  // run_timestamp
        8 +  // current_policies
        1 +  // avg_claim_frequency
        8 +  // avg_claim_severity
        1 +  // market_volatility
        2 +  // expected_loss_ratio
        2 +  // capital_adequacy_ratio
        8 +  // min_required_capital
        8 +  // tail_risk_95th
        8 +  // tail_risk_99th
        2 +  // recommended_premium_adjustment
        1;   // bump
}

/// Parameters for a risk simulation
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RiskSimulationParams {
    /// Current number of active policies
    pub current_policies: u64,
    /// Average claim frequency (x10)
    pub avg_claim_frequency: u8,
    /// Average claim severity in lamports
    pub avg_claim_severity: u64,
    /// Market volatility factor (x10)
    pub market_volatility: u8,
}

/// Parameters for depositing capital
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct DepositCapitalParams {
    /// Amount to deposit
    pub amount: u64,
}

/// Parameters for withdrawing capital
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct WithdrawCapitalParams {
    /// Amount to withdraw
    pub amount: u64,
}

