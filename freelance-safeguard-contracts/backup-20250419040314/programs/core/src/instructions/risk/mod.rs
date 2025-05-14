pub mod initialize_pool;
pub mod deposit;
pub mod withdraw;
pub mod simulate;
pub mod update_metrics;

pub use initialize_pool::*;
pub use deposit::*;
pub use withdraw::*;
pub use simulate::*;
pub use update_metrics::*;

// Parameter structs for risk management instructions

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

/// Parameters for risk simulation
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RiskSimulationParams {
    /// Current number of active policies
    pub current_policies: u32,
    /// Average claim frequency (claims per 100 policies per year)
    pub avg_claim_frequency: u8,
    /// Average claim severity (amount)
    pub avg_claim_severity: u64,
    /// Market volatility factor (0-100)
    pub market_volatility: u8,
}

/// Simulation result account
#[account]
pub struct SimulationResult {
    /// Timestamp when simulation was run
    pub run_timestamp: i64,
    /// Number of current policies used in simulation
    pub current_policies: u32,
    /// Average claim frequency used in simulation
    pub avg_claim_frequency: u8,
    /// Average claim severity used in simulation
    pub avg_claim_severity: u64,
    /// Market volatility factor used in simulation
    pub market_volatility: u8,
    /// Expected loss ratio (claims / premiums) * 100
    pub expected_loss_ratio: u16,
    /// Minimum required capital based on simulation
    pub min_required_capital: u64,
    /// Capital adequacy ratio (capital / required capital) * 100
    pub capital_adequacy_ratio: u16,
    /// 95th percentile tail risk (potential extreme loss)
    pub tail_risk_95th: u64,
    /// 99th percentile tail risk (potential extreme loss)
    pub tail_risk_99th: u64,
    /// Recommended premium adjustment (percentage, can be negative)
    pub recommended_premium_adjustment: i8,
    /// Bump for PDA
    pub bump: u8,
}

impl SimulationResult {
    pub const SEED_PREFIX: &'static [u8] = b"simulation";
    pub const SIZE: usize = 8 + // discriminator
        8 + // run_timestamp
        4 + // current_policies
        1 + // avg_claim_frequency
        8 + // avg_claim_severity
        1 + // market_volatility
        2 + // expected_loss_ratio
        8 + // min_required_capital
        2 + // capital_adequacy_ratio
        8 + // tail_risk_95th
        8 + // tail_risk_99th
        1 + // recommended_premium_adjustment
        1;  // bump
}

