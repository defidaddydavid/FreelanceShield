use anchor_lang::prelude::*;
use crate::state::*;
use crate::InsuranceError;

/// Validates that a policy is active and has not expired
pub fn validate_active_policy(policy: &Account<Policy>) -> Result<()> {
    require!(
        policy.status == PolicyStatus::Active,
        InsuranceError::PolicyNotActive
    );
    
    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp <= policy.end_date,
        InsuranceError::PolicyExpired
    );
    
    Ok(())
}

/// Validates that a claim amount is within the policy coverage limits
pub fn validate_claim_amount(claim_amount: u64, policy: &Account<Policy>) -> Result<()> {
    require!(
        claim_amount <= policy.coverage_amount,
        InsuranceError::ClaimExceedsCoverage
    );
    
    Ok(())
}

/// Validates that the risk pool has sufficient funds to pay a claim
pub fn validate_risk_pool_funds(risk_pool: &Account<RiskPool>, claim_amount: u64) -> Result<()> {
    // This would typically check token account balances
    // For now, we'll just use a placeholder check
    require!(
        risk_pool.total_staked >= claim_amount,
        InsuranceError::InsufficientFunds
    );
    
    Ok(())
}
