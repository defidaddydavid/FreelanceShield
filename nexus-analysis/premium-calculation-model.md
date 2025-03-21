# Premium Calculation Model Analysis
## Adapting Nexus Mutual's Approach to FreelanceShield

This document analyzes Nexus Mutual's premium calculation methodology and proposes an enhanced model for FreelanceShield's Solana/Anchor implementation.

## Nexus Mutual's Premium Calculation

Nexus Mutual uses a sophisticated risk-based premium calculation that considers multiple factors:

1. **Base Rate**: A starting premium rate for each coverage type
2. **Coverage Amount**: The amount of coverage requested
3. **Time Period**: Duration of coverage
4. **Risk Factors**:
   - Protocol-specific risk assessment
   - Historical claims data
   - Capital availability
   - Market conditions

### Simplified Formula

```
Premium = BaseRate * CoverageAmount * TimeFactor * RiskMultiplier * CapitalFactor
```

Where:
- **BaseRate**: Base premium rate per coverage unit
- **CoverageAmount**: Amount of coverage requested
- **TimeFactor**: Duration factor (e.g., days/365 for annual rate)
- **RiskMultiplier**: Combined risk assessment (protocol risk, historical claims)
- **CapitalFactor**: Adjustment based on capital adequacy

## FreelanceShield's Current Premium Calculation

Based on the reviewed code, FreelanceShield currently uses a simpler model:

```rust
// Constants for premium calculation
pub const BASE_PREMIUM_RATE: u64 = 100_000; // 0.1 SOL in lamports
pub const MAX_COVERAGE_RATIO: f64 = 5.0;
pub const MIN_REPUTATION_FACTOR: f64 = 0.7;
pub const MAX_REPUTATION_FACTOR: f64 = 1.0;
pub const CLAIM_HISTORY_IMPACT_FACTOR: f64 = 1.5;
pub const MARKET_CONDITION_DEFAULT: f64 = 1.0;

// Calculate premium using extended calculation function
let premium_amount = calculate_premium(
    insurance_state,
    coverage_amount,
    period_days,
    job_type,
    industry,
    rep_score,
    claim_history,
    MARKET_CONDITION_DEFAULT as u8, // Default market conditions
);
```

## Enhanced Premium Calculation Model

### Proposed Improvements

1. **Bayesian Risk Assessment**:
   - Use Bayesian probability to update risk assessments based on new data
   - Incorporate prior probabilities from historical data
   - Update risk models as new claims are processed

2. **Multi-factor Risk Analysis**:
   - Job type risk (existing)
   - Industry risk (existing)
   - Reputation score (existing)
   - Project complexity factor (new)
   - Client history factor (new)
   - Market volatility index (new)

3. **Dynamic Capital Efficiency**:
   - Adjust premiums based on current capital adequacy
   - Implement countercyclical pricing to build reserves during low-claim periods
   - Discount premiums when capital exceeds target levels

4. **Time-Weighted Risk Factors**:
   - Higher risk for longer coverage periods
   - Non-linear scaling for time factors
   - Seasonal adjustments based on historical claim patterns

### Implementation in Solana/Anchor

```rust
// Enhanced premium calculation constants
pub const BASE_PREMIUM_RATE: u64 = 100_000; // 0.1 SOL in lamports
pub const MAX_COVERAGE_RATIO: f64 = 5.0;
pub const MIN_REPUTATION_FACTOR: f64 = 0.7;
pub const MAX_REPUTATION_FACTOR: f64 = 1.0;
pub const CLAIM_HISTORY_IMPACT_FACTOR: f64 = 1.5;
pub const MARKET_VOLATILITY_WEIGHT: u8 = 10;
pub const PROJECT_COMPLEXITY_WEIGHT: u8 = 15;
pub const CLIENT_HISTORY_WEIGHT: u8 = 12;
pub const CAPITAL_EFFICIENCY_THRESHOLD: f64 = 1.5; // 150% of target capital

// Enhanced premium calculation structure
pub struct PremiumFactors {
    pub job_type_risk: u8,
    pub industry_risk: u8,
    pub reputation_factor: f64,
    pub claims_history_factor: f64,
    pub project_complexity: u8,
    pub client_history: u8,
    pub market_volatility: u8,
    pub capital_efficiency: f64,
    pub time_factor: f64,
}

// Enhanced premium calculation function
pub fn calculate_premium(
    insurance_state: &InsuranceState,
    risk_pool_state: &RiskPoolState,
    coverage_amount: u64,
    period_days: u16,
    job_type: JobType,
    industry: Industry,
    reputation_score: u8,
    claims_history: u8,
    project_complexity: u8,
    client_history: u8,
    market_volatility: u8,
) -> u64 {
    // Calculate base premium
    let base_premium = insurance_state.base_premium_rate;
    
    // Calculate time factor (non-linear scaling)
    let time_factor = calculate_time_factor(period_days);
    
    // Calculate risk factors
    let factors = PremiumFactors {
        job_type_risk: job_type.risk_weight(insurance_state),
        industry_risk: industry.risk_weight(insurance_state),
        reputation_factor: calculate_reputation_factor(reputation_score),
        claims_history_factor: calculate_claims_history_factor(claims_history),
        project_complexity,
        client_history,
        market_volatility,
        capital_efficiency: calculate_capital_efficiency_factor(risk_pool_state),
        time_factor,
    };
    
    // Calculate combined risk multiplier using Bayesian approach
    let risk_multiplier = calculate_bayesian_risk_multiplier(&factors);
    
    // Calculate final premium
    let premium = (base_premium as f64 * 
                  coverage_amount as f64 * 
                  time_factor * 
                  risk_multiplier / 
                  1_000_000.0) as u64;
    
    // Ensure minimum premium
    max(premium, insurance_state.minimum_premium)
}

// Calculate time factor with non-linear scaling
fn calculate_time_factor(period_days: u16) -> f64 {
    // Base annual factor
    let annual_factor = period_days as f64 / 365.0;
    
    // Apply non-linear scaling (higher relative premiums for longer periods)
    // This reflects increasing uncertainty over time
    if period_days <= 30 {
        // Short-term (up to 1 month): linear
        annual_factor
    } else if period_days <= 90 {
        // Medium-term (1-3 months): slight increase
        annual_factor * (1.0 + 0.05 * (period_days as f64 - 30.0) / 60.0)
    } else if period_days <= 180 {
        // Medium-long term (3-6 months): moderate increase
        annual_factor * (1.05 + 0.10 * (period_days as f64 - 90.0) / 90.0)
    } else {
        // Long-term (6+ months): significant increase
        annual_factor * (1.15 + 0.15 * (period_days as f64 - 180.0) / 185.0)
    }
}

// Calculate reputation factor
fn calculate_reputation_factor(reputation_score: u8) -> f64 {
    // Convert reputation score (0-100) to a factor between MIN_REPUTATION_FACTOR and MAX_REPUTATION_FACTOR
    // Higher reputation = lower premium
    let normalized_score = min(100, reputation_score) as f64 / 100.0;
    MAX_REPUTATION_FACTOR - normalized_score * (MAX_REPUTATION_FACTOR - MIN_REPUTATION_FACTOR)
}

// Calculate claims history factor
fn calculate_claims_history_factor(claims_history: u8) -> f64 {
    // Higher claims history = higher premium
    1.0 + (claims_history as f64 * CLAIM_HISTORY_IMPACT_FACTOR / 100.0)
}

// Calculate capital efficiency factor
fn calculate_capital_efficiency_factor(risk_pool_state: &RiskPoolState) -> f64 {
    // Calculate current capital ratio (actual/target)
    let capital_ratio = if risk_pool_state.target_reserve_ratio > 0 {
        risk_pool_state.current_reserve_ratio as f64 / risk_pool_state.target_reserve_ratio as f64
    } else {
        1.0
    };
    
    // Apply countercyclical pricing:
    // - When capital is low (ratio < 1.0): increase premiums
    // - When capital is adequate (ratio = 1.0): neutral
    // - When capital is abundant (ratio > CAPITAL_EFFICIENCY_THRESHOLD): discount premiums
    if capital_ratio < 1.0 {
        // Capital below target: increase premiums (up to 50% increase when ratio = 0.5)
        1.0 + (1.0 - capital_ratio)
    } else if capital_ratio > CAPITAL_EFFICIENCY_THRESHOLD {
        // Capital above threshold: discount premiums (up to 25% discount)
        max(0.75, 1.0 - (capital_ratio - CAPITAL_EFFICIENCY_THRESHOLD) * 0.25)
    } else {
        // Capital at target level: neutral pricing
        1.0
    }
}

// Calculate Bayesian risk multiplier
fn calculate_bayesian_risk_multiplier(factors: &PremiumFactors) -> f64 {
    // Prior probability based on job type and industry (base risk)
    let prior_probability = (factors.job_type_risk as f64 / 10.0) * 
                           (factors.industry_risk as f64 / 10.0);
    
    // Evidence factors
    let evidence_factors = [
        factors.reputation_factor,
        factors.claims_history_factor,
        factors.project_complexity as f64 / 100.0 * PROJECT_COMPLEXITY_WEIGHT as f64 / 10.0,
        factors.client_history as f64 / 100.0 * CLIENT_HISTORY_WEIGHT as f64 / 10.0,
        factors.market_volatility as f64 / 100.0 * MARKET_VOLATILITY_WEIGHT as f64 / 10.0
    ];
    
    // Calculate likelihood (product of evidence factors)
    let likelihood = evidence_factors.iter().fold(1.0, |acc, &factor| acc * factor);
    
    // Calculate posterior probability (Bayesian update)
    let posterior = prior_probability * likelihood;
    
    // Scale to reasonable premium multiplier range (0.5 to 5.0)
    0.5 + (posterior * 4.5)
}
```

## Risk Score Calculation

In addition to premium calculation, we can enhance the risk score calculation to provide transparency to users:

```rust
// Calculate risk score (0-100)
pub fn calculate_risk_score(
    insurance_state: &InsuranceState,
    risk_pool_state: &RiskPoolState,
    coverage_amount: u64,
    period_days: u16,
    job_type: JobType,
    industry: Industry,
    reputation_score: u8,
    claims_history: u8,
    project_complexity: u8,
    client_history: u8,
) -> u8 {
    // Calculate individual risk components (0-100 scale)
    let job_type_risk = (job_type.risk_weight(insurance_state) as f64 / 15.0 * 100.0) as u8;
    let industry_risk = (industry.risk_weight(insurance_state) as f64 / 15.0 * 100.0) as u8;
    
    // Reputation is inverse (higher reputation = lower risk)
    let reputation_risk = 100 - min(100, reputation_score);
    
    // Claims history directly impacts risk
    let claims_risk = min(100, claims_history * 20);
    
    // Project complexity risk
    let complexity_risk = min(100, project_complexity);
    
    // Client history risk
    let client_risk = min(100, client_history);
    
    // Coverage amount risk (higher coverage = higher risk)
    let coverage_risk = min(100, ((coverage_amount as f64 / 
                               insurance_state.max_coverage_amount as f64) * 100.0) as u8);
    
    // Time period risk (longer period = higher risk)
    let period_risk = min(100, ((period_days as f64 / 
                             insurance_state.max_period_days as f64) * 100.0) as u8);
    
    // Calculate weighted average
    let weighted_risk = (
        job_type_risk as u16 * 15 +
        industry_risk as u16 * 15 +
        reputation_risk as u16 * 20 +
        claims_risk as u16 * 20 +
        complexity_risk as u16 * 10 +
        client_risk as u16 * 10 +
        coverage_risk as u16 * 5 +
        period_risk as u16 * 5
    ) / 100;
    
    min(100, weighted_risk as u8)
}
```

## Risk Breakdown for Transparency

To provide transparency to users, we can implement a function to break down the risk factors:

```rust
// Risk breakdown structure
pub struct RiskBreakdown {
    pub overall_risk_score: u8,
    pub job_type_risk: u8,
    pub industry_risk: u8,
    pub reputation_risk: u8,
    pub claims_history_risk: u8,
    pub project_complexity_risk: u8,
    pub client_history_risk: u8,
    pub coverage_amount_risk: u8,
    pub time_period_risk: u8,
    pub premium_amount: u64,
    pub capital_efficiency_factor: f64,
}

// Get detailed risk breakdown
pub fn get_risk_breakdown(
    ctx: Context<GetRiskBreakdown>,
    coverage_amount: u64,
    period_days: u16,
    job_type: JobType,
    industry: Industry,
    reputation_score: u8,
    claims_history: u8,
    project_complexity: u8,
    client_history: u8,
) -> Result<RiskBreakdown> {
    // Calculate individual risk components
    // ...
    
    // Calculate overall risk score
    let overall_risk_score = calculate_risk_score(
        &ctx.accounts.insurance_state,
        &ctx.accounts.risk_pool_state,
        coverage_amount,
        period_days,
        job_type,
        industry,
        reputation_score,
        claims_history,
        project_complexity,
        client_history,
    );
    
    // Calculate premium
    let premium_amount = calculate_premium(
        &ctx.accounts.insurance_state,
        &ctx.accounts.risk_pool_state,
        coverage_amount,
        period_days,
        job_type,
        industry,
        reputation_score,
        claims_history,
        project_complexity,
        client_history,
        MARKET_CONDITION_DEFAULT as u8,
    );
    
    // Calculate capital efficiency factor
    let capital_efficiency_factor = calculate_capital_efficiency_factor(
        &ctx.accounts.risk_pool_state
    );
    
    // Return breakdown
    Ok(RiskBreakdown {
        overall_risk_score,
        job_type_risk,
        industry_risk,
        reputation_risk,
        claims_history_risk,
        project_complexity_risk,
        client_history_risk,
        coverage_amount_risk,
        time_period_risk,
        premium_amount,
        capital_efficiency_factor,
    })
}
```

## Integration with Oracle Data

To enhance premium calculation with real-world data, we can integrate with oracles:

```rust
// Oracle data structure
pub struct OracleData {
    pub market_volatility_index: u8,
    pub industry_risk_indices: HashMap<Industry, u8>,
    pub global_economic_indicators: u8,
    pub last_update_timestamp: i64,
}

// Update premium calculation with oracle data
pub fn update_premium_parameters_from_oracle(
    ctx: Context<UpdatePremiumParameters>,
    oracle_data: OracleData,
) -> Result<()> {
    let insurance_state = &mut ctx.accounts.insurance_state;
    
    // Validate authority
    require!(
        ctx.accounts.authority.key() == insurance_state.authority,
        InsuranceError::Unauthorized
    );
    
    // Validate oracle data freshness
    let current_time = Clock::get()?.unix_timestamp;
    require!(
        current_time - oracle_data.last_update_timestamp < 86400, // 24 hours
        InsuranceError::StaleOracleData
    );
    
    // Update market volatility weight
    insurance_state.market_volatility_weight = 
        calculate_market_volatility_weight(oracle_data.market_volatility_index);
    
    // Update industry risk weights
    for (industry, risk_index) in oracle_data.industry_risk_indices {
        let industry_index = industry.as_index();
        if industry_index < insurance_state.industry_risk_weights.len() {
            insurance_state.industry_risk_weights[industry_index] = 
                calculate_industry_risk_weight(risk_index);
        }
    }
    
    // Update last update timestamp
    insurance_state.last_update_timestamp = current_time;
    
    Ok(())
}
```

## Conclusion

By implementing these enhanced premium calculation models, FreelanceShield can achieve:

1. **More Accurate Risk Assessment**: Using Bayesian methods to incorporate multiple risk factors
2. **Dynamic Pricing**: Adjusting premiums based on capital adequacy and market conditions
3. **Transparency**: Providing detailed risk breakdowns to users
4. **Capital Efficiency**: Optimizing premium collection to maintain target reserve levels
5. **Data-Driven Decisions**: Incorporating oracle data for real-world risk factors

These improvements will help FreelanceShield build a more sustainable and fair insurance system that can accurately price risk while maintaining sufficient reserves to cover claims.
