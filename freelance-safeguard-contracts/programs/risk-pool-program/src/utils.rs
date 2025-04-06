use anchor_lang::prelude::*;
use crate::RiskPoolError;

/// Calculate reserve ratio with proper error handling
/// 
/// # Arguments
/// * `total_capital` - The total capital in the risk pool
/// * `total_coverage_liability` - The total coverage liability
/// * `target_reserve_ratio` - The target reserve ratio
/// 
/// # Returns
/// * `Result<u8>` - The calculated reserve ratio or an error
pub fn calculate_reserve_ratio(
    total_capital: u64,
    total_coverage_liability: u64,
    target_reserve_ratio: u8,
) -> Result<u8> {
    if total_coverage_liability == 0 {
        return Ok(100);
    }
    
    // Calculate reserve ratio using checked operations
    let capital_u128 = total_capital as u128;
    let liability_u128 = total_coverage_liability as u128;
    
    let ratio_u128 = capital_u128
        .checked_mul(100)
        .ok_or(RiskPoolError::ArithmeticError)?
        .checked_div(liability_u128)
        .ok_or(RiskPoolError::ArithmeticError)?;
    
    // Ensure the result fits in u8
    if ratio_u128 > 255 {
        return Ok(255);
    }
    
    let reserve_ratio = ratio_u128 as u8;
    
    // Calculate buffer above target
    if reserve_ratio >= target_reserve_ratio {
        Ok(reserve_ratio)
    } else {
        Ok(0)
    }
}

/// Calculate percentage of a value with proper error handling
/// 
/// # Arguments
/// * `value` - The base value
/// * `percentage` - The percentage to calculate (can be > 100)
/// 
/// # Returns
/// * `Result<u64>` - The calculated percentage or an error
pub fn calculate_percentage(
    value: u64,
    percentage: u16,
) -> Result<u64> {
    // Calculate percentage using checked operations
    let value_u128 = value as u128;
    let percentage_u128 = percentage as u128;
    
    let result_u128 = value_u128
        .checked_mul(percentage_u128)
        .ok_or(RiskPoolError::ArithmeticError)?
        .checked_div(100)
        .ok_or(RiskPoolError::ArithmeticError)?;
    
    // Ensure the result fits in u64
    if result_u128 > u64::MAX as u128 {
        return Err(RiskPoolError::ArithmeticError.into());
    }
    
    Ok(result_u128 as u64)
}

/// Calculate percentage of a value with checked operations
/// 
/// # Arguments
/// * `numerator` - The numerator
/// * `denominator` - The denominator
/// 
/// # Returns
/// * `Result<u16>` - The calculated percentage or an error
pub fn checked_percentage_of(
    numerator: u64,
    denominator: u64,
) -> Result<u16> {
    if denominator == 0 {
        return Err(RiskPoolError::DivideByZero.into());
    }
    
    // Calculate percentage using checked operations
    let numerator_u128 = numerator as u128;
    let denominator_u128 = denominator as u128;
    
    let percentage_u128 = numerator_u128
        .checked_mul(100)
        .ok_or(RiskPoolError::ArithmeticError)?
        .checked_div(denominator_u128)
        .ok_or(RiskPoolError::ArithmeticError)?;
    
    // Ensure the result fits in u16
    if percentage_u128 > u16::MAX as u128 {
        return Ok(u16::MAX);
    }
    
    Ok(percentage_u128 as u16)
}

/// Safely calculate a percentage of a value
/// 
/// # Arguments
/// * `value` - The base value
/// * `percentage` - The percentage (0-100)
/// 
/// # Returns
/// * `Result<u64>` - The calculated amount or an error
pub fn calculate_percentage_amount(value: u64, percentage: u8) -> Result<u64> {
    if percentage > 100 {
        return Err(RiskPoolError::InvalidParameter.into());
    }
    
    let result_u128 = (value as u128)
        .checked_mul(percentage as u128)
        .ok_or(RiskPoolError::ArithmeticError)?
        .checked_div(100)
        .ok_or(RiskPoolError::ArithmeticError)?;
    
    if result_u128 > u64::MAX as u128 {
        return Err(RiskPoolError::ArithmeticError.into());
    }
    
    Ok(result_u128 as u64)
}

/// Validate a program derived address
pub fn validate_pda(
    expected_address: &Pubkey,
    seeds: &[&[u8]],
    program_id: &Pubkey,
) -> Result<u8> {
    let (derived_address, bump) = Pubkey::find_program_address(seeds, program_id);
    if derived_address != *expected_address {
        return Err(RiskPoolError::InvalidAccount.into());
    }
    Ok(bump)
}
