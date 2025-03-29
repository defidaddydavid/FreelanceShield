use anchor_lang::prelude::*;
use crate::constants::*;

// Helper function to calculate reputation score (0-100)
pub fn calculate_reputation_score(
    completed_contracts: u32,
    successful_contracts: u32,
    disputed_contracts: u32,
    claims_submitted: u32,
    claims_approved: u32,
    claims_rejected: u32,
) -> u8 {
    // Ensure we don't divide by zero
    if completed_contracts == 0 {
        return DEFAULT_INITIAL_SCORE;
    }
    
    // Calculate success and dispute rates
    let success_rate = (successful_contracts as f32) / (completed_contracts as f32);
    let dispute_rate = if completed_contracts > 0 {
        (disputed_contracts as f32) / (completed_contracts as f32)
    } else {
        0.0
    };
    
    // Calculate claims approval rate
    let claims_approval_rate = if claims_submitted > 0 {
        (claims_approved as f32) / (claims_submitted as f32)
    } else {
        1.0 // Default to 1.0 if no claims submitted
    };
    
    // Calculate claims rejection rate
    let claims_rejection_rate = if claims_submitted > 0 {
        (claims_rejected as f32) / (claims_submitted as f32)
    } else {
        0.0 // Default to 0.0 if no claims submitted
    };
    
    // Base score starts at 70
    let mut score = 70.0;
    
    // Add points for high success rate (up to +20 points)
    score += success_rate * 20.0;
    
    // Subtract points for high dispute rate (up to -15 points)
    score -= dispute_rate * 15.0;
    
    // Add points for high claims approval rate (up to +5 points)
    score += claims_approval_rate * 5.0;
    
    // Subtract points for high claims rejection rate (up to -10 points)
    score -= claims_rejection_rate * 10.0;
    
    // Ensure score stays within bounds
    if score < MIN_REPUTATION_SCORE as f32 {
        return MIN_REPUTATION_SCORE;
    } else if score > MAX_REPUTATION_SCORE as f32 {
        return MAX_REPUTATION_SCORE;
    } else {
        return score as u8;
    }
}

// Helper function to calculate reputation factor (70-100)
pub fn calculate_reputation_factor(reputation_score: u8) -> u8 {
    // Map reputation score (0-100) to reputation factor (70-100)
    MIN_REPUTATION_FACTOR + ((reputation_score as u16 * (MAX_REPUTATION_FACTOR - MIN_REPUTATION_FACTOR) as u16) / MAX_REPUTATION_SCORE as u16) as u8
}

