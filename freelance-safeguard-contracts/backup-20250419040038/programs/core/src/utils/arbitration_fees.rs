use anchor_lang::prelude::*;
use crate::FreelanceShieldError;

// Arbitration fee constants
pub const ARBITRATION_FEE_LOW_COMPLEXITY: u16 = 300;    // 3.00%
pub const ARBITRATION_FEE_MEDIUM_COMPLEXITY: u16 = 500; // 5.00%
pub const ARBITRATION_FEE_HIGH_COMPLEXITY: u16 = 700;   // 7.00%
pub const MIN_ARBITRATION_FEE: u64 = 10_000_000;        // 0.01 SOL

// Fee distribution constants
pub const ARBITRATOR_FEE_SHARE: u8 = 60;  // 60% to arbitrators
pub const RISK_POOL_FEE_SHARE: u8 = 30;   // 30% to risk pool
pub const DAO_TREASURY_FEE_SHARE: u8 = 10; // 10% to DAO treasury

/// Complexity levels for arbitration
pub enum ArbitrationComplexity {
    Low = 1,
    Medium = 2,
    High = 3,
}

/// Calculate arbitration fee based on claim amount and complexity
pub fn calculate_arbitration_fee(
    claim_amount: u64,
    complexity_level: u8,
) -> Result<u64> {
    // Validate inputs
    require!(claim_amount > 0, FreelanceShieldError::InvalidParameter);
    
    // Get fee percentage based on complexity
    let fee_percentage = match complexity_level {
        1 => ARBITRATION_FEE_LOW_COMPLEXITY,
        2 => ARBITRATION_FEE_MEDIUM_COMPLEXITY,
        3 => ARBITRATION_FEE_HIGH_COMPLEXITY,
        _ => return Err(FreelanceShieldError::InvalidParameter.into()),
    };
    
    // Calculate fee amount using checked operations
    let fee_amount = (claim_amount as u128)
        .checked_mul(fee_percentage as u128)
        .ok_or(FreelanceShieldError::ArithmeticError)?
        .checked_div(10000)
        .ok_or(FreelanceShieldError::ArithmeticError)?;
    
    // Ensure the result fits in u64
    if fee_amount > u64::MAX as u128 {
        return Err(FreelanceShieldError::ArithmeticError.into());
    }
    
    let fee_amount = fee_amount as u64;
    
    // Apply minimum fee
    Ok(std::cmp::max(fee_amount, MIN_ARBITRATION_FEE))
}

/// Determine claim complexity based on claim data
pub fn determine_claim_complexity(
    claim_amount: u64,
    claim_description_length: usize,
    has_evidence: bool,
    has_dispute: bool,
) -> u8 {
    // Start with medium complexity
    let mut complexity_level = ArbitrationComplexity::Medium as u8;
    
    // Adjust based on claim amount
    if claim_amount >= 100_000_000_000 { // 100 SOL
        complexity_level = ArbitrationComplexity::High as u8;
    } else if claim_amount <= 10_000_000_000 { // 10 SOL
        complexity_level = ArbitrationComplexity::Low as u8;
    }
    
    // Adjust based on description length (longer descriptions often indicate complexity)
    if claim_description_length > 500 {
        complexity_level = std::cmp::min(complexity_level + 1, ArbitrationComplexity::High as u8);
    }
    
    // Adjust based on evidence and disputes
    if has_evidence && has_dispute {
        complexity_level = ArbitrationComplexity::High as u8;
    }
    
    complexity_level
}

/// Calculate fee share for a specific recipient
pub fn calculate_fee_share(
    total_fee: u64,
    share_percentage: u8,
) -> Result<u64> {
    // Validate inputs
    require!(share_percentage <= 100, FreelanceShieldError::InvalidParameter);
    
    // Calculate share using checked operations
    let share = (total_fee as u128)
        .checked_mul(share_percentage as u128)
        .ok_or(FreelanceShieldError::ArithmeticError)?
        .checked_div(100)
        .ok_or(FreelanceShieldError::ArithmeticError)?;
    
    // Ensure the result fits in u64
    if share > u64::MAX as u128 {
        return Err(FreelanceShieldError::ArithmeticError.into());
    }
    
    Ok(share as u64)
}
