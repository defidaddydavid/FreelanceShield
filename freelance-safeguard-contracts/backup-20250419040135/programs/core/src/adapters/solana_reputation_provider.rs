use anchor_lang::prelude::*;
use crate::interfaces::reputation::{ReputationProvider, ReputationScore, ReputationFactors};

/// Implementation of ReputationProvider for the on-chain Solana-based reputation system
pub struct SolanaReputationProvider;

impl ReputationProvider for SolanaReputationProvider {
    fn get_reputation_score(user: &Pubkey) -> Result<u8> {
        // Instead of directly importing from reputation_program, we'll use CPI
        // to call the reputation program, reducing direct dependencies
        
        // Get the reputation program ID
        let reputation_program_id = crate::state::constants::REPUTATION_PROGRAM_ID;
        
        // Build the CPI call to get reputation score
        // This is a simplified example - actual implementation would use proper CPI
        let score = match crate::cpi_validation::validate_reputation_score(user, &reputation_program_id) {
            Ok(score) => score,
            Err(_) => 50, // Default score if not found
        };
        
        Ok(score)
    }
    
    fn update_successful_transaction(user: &Pubkey, transaction_value: u64) -> Result<()> {
        // Get the reputation program ID
        let reputation_program_id = crate::state::constants::REPUTATION_PROGRAM_ID;
        
        // Build the CPI call to update transaction metrics
        // This is a simplified example - actual implementation would use proper CPI
        let _ = crate::cpi_validation::update_reputation_transaction(
            user,
            transaction_value,
            true, // successful
            &reputation_program_id
        );
        
        Ok(())
    }
    
    fn update_dispute(user: &Pubkey, is_at_fault: bool) -> Result<()> {
        // Get the reputation program ID
        let reputation_program_id = crate::state::constants::REPUTATION_PROGRAM_ID;
        
        // Build the CPI call to update dispute metrics
        // This is a simplified example - actual implementation would use proper CPI
        let _ = crate::cpi_validation::update_reputation_dispute(
            user,
            is_at_fault,
            &reputation_program_id
        );
        
        Ok(())
    }
    
    fn update_claim(user: &Pubkey, claim_approved: bool) -> Result<()> {
        // Get the reputation program ID
        let reputation_program_id = crate::state::constants::REPUTATION_PROGRAM_ID;
        
        // Build the CPI call to update claim metrics
        // This is a simplified example - actual implementation would use proper CPI
        let _ = crate::cpi_validation::update_reputation_claim(
            user,
            claim_approved,
            &reputation_program_id
        );
        
        Ok(())
    }
}

/// Helper function to calculate reputation score from factors
pub fn calculate_reputation_score(
    successful_transactions: u32,
    transaction_volume: u64,
    disputes: u32,
    disputes_at_fault: u32,
    claims_submitted: u32,
    claims_approved: u32,
    account_age_days: u32,
    factors: &ReputationFactors,
) -> u8 {
    // This is moved from the reputation program to reduce dependencies
    // Simplified calculation - actual implementation would be more complex
    
    // Base score starts at 50
    let mut score: u32 = 50;
    
    // Successful transactions (0-20 points)
    let tx_score = std::cmp::min(successful_transactions, 100) as u32 * 
        factors.successful_transactions_weight as u32 / 100;
    score += tx_score;
    
    // Transaction volume (0-15 points)
    let volume_score = std::cmp::min(transaction_volume / 1_000_000, 100) as u32 * 
        factors.transaction_volume_weight as u32 / 100;
    score += volume_score;
    
    // Disputes (negative factor, 0-25 points deduction)
    if disputes > 0 {
        let dispute_ratio = if disputes > 0 {
            disputes_at_fault as f32 / disputes as f32
        } else {
            0.0
        };
        let dispute_score = (dispute_ratio * 100.0) as u32 * 
            factors.disputes_weight as u32 / 100;
        score = score.saturating_sub(dispute_score);
    }
    
    // Claims history (0-15 points)
    if claims_submitted > 0 {
        let claims_ratio = if claims_submitted > 0 {
            claims_approved as f32 / claims_submitted as f32
        } else {
            0.0
        };
        let claims_score = (claims_ratio * 100.0) as u32 * 
            factors.claims_history_weight as u32 / 100;
        score += claims_score;
    }
    
    // Account age (0-10 points)
    let age_score = std::cmp::min(account_age_days / 30, 12) as u32 * 
        factors.account_age_weight as u32 / 12;
    score += age_score;
    
    // Ensure score is between 0-100
    std::cmp::min(score, 100) as u8
}
