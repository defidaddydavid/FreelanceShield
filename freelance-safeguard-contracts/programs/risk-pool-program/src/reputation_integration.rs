use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};

// Integration module for connecting risk pool with reputation system
// Allows premiums to be adjusted based on reputation scores

/// Constants for reputation integration
pub const REPUTATION_SCORE_SCALE: u16 = 10000; // 0-10000 scale
pub const DEFAULT_PREMIUM_MULTIPLIER: u16 = 10000; // 100.00% (no discount)

/// Calculate premium with reputation discount
pub fn calculate_premium_with_reputation(
    ctx: &Context<crate::instructions::calculate_premium::CalculatePremium>,
    base_premium: u64,
    reputation_discount: Option<u16>,
) -> Result<u64> {
    // If no reputation discount provided, use default (no discount)
    let discount = reputation_discount.unwrap_or(0);
    
    // Calculate discounted premium (scale down from 10000)
    // If discount is 2000, it means 20% discount
    let discount_multiplier = REPUTATION_SCORE_SCALE.saturating_sub(discount);
    
    // Apply discount to premium
    let final_premium = (base_premium as u128 * discount_multiplier as u128 / REPUTATION_SCORE_SCALE as u128) as u64;
    
    msg!("Base premium: {}", base_premium);
    msg!("Reputation discount: {}% ({} basis points)", discount / 100, discount);
    msg!("Final premium: {}", final_premium);
    
    Ok(final_premium)
}

/// Get reputation discount from reputation program via CPI
pub fn fetch_reputation_discount(
    risk_pool_state: &Pubkey,
    reputation_program_id: &Pubkey,
    user: &Pubkey,
    user_reputation_profile: &Pubkey,
    reputation_state: &Pubkey,
    bayesian_params: &Pubkey,
    payer: &Pubkey,
) -> Result<u16> {
    // Create account infos for CPI call
    let account_metas = vec![
        AccountMeta::new_readonly(*payer, true),
        AccountMeta::new_readonly(*user, false),
        AccountMeta::new_readonly(*user_reputation_profile, false),
        AccountMeta::new_readonly(*reputation_state, false),
        AccountMeta::new_readonly(*bayesian_params, false),
    ];
    
    // Create CPI instruction to call calculate_premium_discount on reputation program
    let ix = Instruction {
        program_id: *reputation_program_id,
        accounts: account_metas,
        data: vec![7u8], // Instruction index for calculate_premium_discount
    };
    
    // Prepare seeds for PDA signing
    let risk_pool_seeds = &[b"risk-pool-state", &[0]]; // Replace 0 with actual bump
    
    // Call the instruction
    let result = invoke_signed(
        &ix,
        &[
            payer.clone().to_account_info(),
            user.clone().to_account_info(),
            user_reputation_profile.clone().to_account_info(),
            reputation_state.clone().to_account_info(),
            bayesian_params.clone().to_account_info(),
        ],
        &[&risk_pool_seeds[..]]
    );
    
    // Process result - in a real implementation, we would
    // parse the return value from the CPI call
    // This is a simplified implementation for demonstration
    
    // Default to no discount if error
    if result.is_err() {
        msg!("Error fetching reputation discount: {:?}", result);
        Ok(0)
    } else {
        // In a real implementation, parse the return value
        // For now, return a mock discount of 10%
        Ok(1000) // 10.00%
    }
}

/// Update reputation profile after policy premium payment
pub fn update_reputation_after_premium_payment(
    risk_pool_state: &Pubkey,
    reputation_program_id: &Pubkey,
    user: &Pubkey,
    user_reputation_profile: &Pubkey,
    reputation_state: &Pubkey,
    payer: &Pubkey,
    on_time_payment: bool,
) -> Result<()> {
    // Create account infos for CPI call
    let account_metas = vec![
        AccountMeta::new(*payer, true),
        AccountMeta::new(*user_reputation_profile, false),
        AccountMeta::new_readonly(*reputation_state, false),
        AccountMeta::new_readonly(*user, false),
    ];
    
    // Create CPI instruction - the exact instruction would depend on 
    // the reputation program's API for updating profiles
    let ix = Instruction {
        program_id: *reputation_program_id,
        accounts: account_metas,
        data: vec![8u8, if on_time_payment { 1u8 } else { 0u8 }], // Mock instruction data
    };
    
    // Prepare seeds for PDA signing
    let risk_pool_seeds = &[b"risk-pool-state", &[0]]; // Replace 0 with actual bump
    
    // Call the instruction
    let result = invoke_signed(
        &ix,
        &[
            payer.clone().to_account_info(),
            user_reputation_profile.clone().to_account_info(),
            reputation_state.clone().to_account_info(),
            user.clone().to_account_info(),
        ],
        &[&risk_pool_seeds[..]]
    );
    
    if result.is_err() {
        msg!("Error updating reputation after premium payment: {:?}", result);
    } else {
        msg!("Successfully updated reputation after premium payment");
    }
    
    Ok(())
}

/// Track claim submission in reputation profile
pub fn update_reputation_after_claim(
    risk_pool_state: &Pubkey,
    reputation_program_id: &Pubkey,
    user: &Pubkey,
    user_reputation_profile: &Pubkey,
    reputation_state: &Pubkey,
    payer: &Pubkey,
    claim_id: &str,
    claim_approved: bool,
) -> Result<()> {
    // Create account infos for CPI call
    let account_metas = vec![
        AccountMeta::new(*payer, true),
        AccountMeta::new(*user_reputation_profile, false),
        AccountMeta::new_readonly(*reputation_state, false),
        AccountMeta::new_readonly(*user, false),
    ];
    
    // Simplified instruction data construction - in a real implementation,
    // we would need to properly serialize the claim_id and other parameters
    let mut data = vec![9u8]; // Mock instruction index for update_claims_history
    data.push(1u8); // claim_submitted = true
    data.push(if claim_approved { 1u8 } else { 0u8 }); // claim_approved
    data.push(if !claim_approved { 1u8 } else { 0u8 }); // claim_rejected
    
    // Create CPI instruction
    let ix = Instruction {
        program_id: *reputation_program_id,
        accounts: account_metas,
        data,
    };
    
    // Prepare seeds for PDA signing
    let risk_pool_seeds = &[b"risk-pool-state", &[0]]; // Replace 0 with actual bump
    
    // Call the instruction
    let result = invoke_signed(
        &ix,
        &[
            payer.clone().to_account_info(),
            user_reputation_profile.clone().to_account_info(),
            reputation_state.clone().to_account_info(),
            user.clone().to_account_info(),
        ],
        &[&risk_pool_seeds[..]]
    );
    
    if result.is_err() {
        msg!("Error updating reputation after claim: {:?}", result);
    } else {
        msg!("Successfully updated reputation after claim");
    }
    
    Ok(())
}
