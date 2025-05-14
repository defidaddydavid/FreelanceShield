use anchor_lang::prelude::*;

// Integration module for connecting risk pool with reputation system
// Allows premiums to be adjusted based on reputation scores

/// Constants for reputation integration
pub const REPUTATION_SCORE_SCALE: u16 = 10000; // 0-10000 scale
pub const DEFAULT_PREMIUM_MULTIPLIER: u16 = 10000; // 100.00% (no discount)

/// Calculate premium with reputation discount
///
/// # Arguments
/// * `base_premium` - The base premium amount
/// * `reputation_discount` - Optional reputation discount (0-10000)
///
/// # Returns
/// * `Result<u64>` - The calculated premium amount or an error
pub fn calculate_premium_with_reputation(
    base_premium: u64,
    reputation_discount: Option<u16>,
) -> Result<u64> {
    // If no reputation discount provided, use default (no discount)
    let discount = reputation_discount.unwrap_or(0);
    
    // Validate discount is within bounds
    require!(discount <= REPUTATION_SCORE_SCALE, crate::RiskPoolError::InvalidAmount);
    
    // Calculate discounted premium (scale down from 10000)
    // If discount is 2000, it means 20% discount
    let discount_multiplier = REPUTATION_SCORE_SCALE.saturating_sub(discount);
    
    // Apply discount to premium with checked arithmetic
    let final_premium = (base_premium as u128)
        .checked_mul(discount_multiplier as u128)
        .ok_or(crate::RiskPoolError::ArithmeticError)?
        .checked_div(REPUTATION_SCORE_SCALE as u128)
        .ok_or(crate::RiskPoolError::ArithmeticError)?;
    
    // Ensure the result fits in u64
    if final_premium > u64::MAX as u128 {
        return Err(crate::RiskPoolError::ArithmeticError.into());
    }
    
    Ok(final_premium as u64)
}
