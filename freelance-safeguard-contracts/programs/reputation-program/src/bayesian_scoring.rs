use anchor_lang::prelude::*;

// Bayesian reputation system for FreelanceShield
// This implements a Bayesian approach to reputation calculation
// focusing on fraud-resistance and verifiable on-chain data

/// Bayesian reputation parameters stored on-chain
#[account]
#[derive(Default)]
pub struct BayesianParameters {
    // Authority that can update model parameters
    pub authority: Pubkey,
    
    // Prior belief parameters
    pub prior_mean: u16,          // Prior mean score (scaled by 100, e.g. 7500 = 75.00)
    pub prior_strength: u16,      // Prior confidence/strength (weight of prior vs evidence)
    
    // Evidence weighting parameters (all scaled by 100)
    pub contract_completion_weight: u16,  // Weight for successful contracts
    pub contract_dispute_weight: u16,     // Weight for disputed contracts
    pub claim_approval_weight: u16,       // Weight for approved claims
    pub claim_rejection_weight: u16,      // Weight for rejected claims
    pub time_decay_factor: u16,           // Time decay for historical evidence
    
    // Discount brackets (scaled by 100)
    pub min_discount: u16,        // Minimum discount (e.g., 500 = 5.00%)
    pub max_discount: u16,        // Maximum discount (e.g., 2500 = 25.00%)
    pub discount_curve_factor: u16, // Controls steepness of discount curve
    
    pub bump: u8,
}

impl BayesianParameters {
    pub const SIZE: usize = 8 +  // discriminator
                            32 + // authority
                            2 +  // prior_mean
                            2 +  // prior_strength
                            2 +  // contract_completion_weight
                            2 +  // contract_dispute_weight
                            2 +  // claim_approval_weight
                            2 +  // claim_rejection_weight
                            2 +  // time_decay_factor
                            2 +  // min_discount
                            2 +  // max_discount
                            2 +  // discount_curve_factor
                            1;   // bump
}

/// Evidence data for Bayesian calculation
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct BayesianEvidence {
    pub completed_contracts: u32,
    pub successful_contracts: u32,
    pub disputed_contracts: u32,
    pub claims_submitted: u32,
    pub claims_approved: u32,
    pub claims_rejected: u32,
    pub days_since_first_activity: u32,
    pub contract_completion_ratio: u16,  // Scaled by 10000
    pub claim_approval_ratio: u16,       // Scaled by 10000
}

/// Calculate reputation score using Bayesian inference (0-10000 scale)
pub fn calculate_bayesian_reputation(
    params: &BayesianParameters,
    evidence: &BayesianEvidence,
) -> u16 {
    // Start with prior mean
    let prior = params.prior_mean;
    
    if evidence.completed_contracts == 0 {
        return prior; // Return prior if no evidence
    }
    
    // Calculate evidence score components (all 0-10000 scale)
    
    // 1. Contract completion ratio evidence
    let contract_evidence = evidence.contract_completion_ratio;
    
    // 2. Claim history evidence 
    let claim_evidence = if evidence.claims_submitted > 0 {
        evidence.claim_approval_ratio
    } else {
        5000 // Neutral if no claims
    };
    
    // 3. Longevity factor (time in system)
    let longevity_factor = calculate_longevity_factor(evidence.days_since_first_activity);
    
    // Apply weights to evidence components
    let weighted_contract_evidence = params.contract_completion_weight as u32 * contract_evidence as u32 / 100;
    let weighted_claim_evidence = params.claim_approval_weight as u32 * claim_evidence as u32 / 100;
    let weighted_longevity = (5000u32 + longevity_factor as u32) * params.time_decay_factor as u32 / 100;
    
    // Calculate total evidence weight
    let total_weight = params.contract_completion_weight + 
                       params.claim_approval_weight +
                       params.time_decay_factor;
    
    // Calculate evidence score (weighted average)
    let evidence_score = if total_weight > 0 {
        (weighted_contract_evidence + weighted_claim_evidence + weighted_longevity) / 
        (total_weight as u32 / 100)
    } else {
        5000 // Default to neutral if weights are misconfigured
    };
    
    // Combine prior and evidence using Bayesian update
    // The strength of the prior vs evidence is determined by prior_strength and amount of evidence
    let evidence_strength = std::cmp::min(
        10000, 
        (evidence.completed_contracts as u32 * 100) / 
            std::cmp::max(1, params.prior_strength as u32)
    );
    let prior_weight = 10000 - evidence_strength;
    
    // Weighted average of prior and evidence
    let posterior = (prior as u32 * prior_weight + 
                   evidence_score * evidence_strength) / 10000;
    
    // Ensure the score is in range 0-10000
    std::cmp::min(10000, std::cmp::max(0, posterior as u16))
}

/// Calculate policy premium discount based on reputation score (0-10000)
pub fn calculate_premium_discount(
    params: &BayesianParameters,
    reputation_score: u16,
) -> u16 {
    // Simple sigmoid function to map reputation score to discount percentage
    // This creates a curved relationship between reputation and discount
    let x = ((reputation_score as i32) - 5000) as f32 / 1000.0;
    let sigmoid = 1.0 / (1.0 + (-x * params.discount_curve_factor as f32 / 1000.0).exp());
    
    // Map sigmoid output (0-1) to discount range
    let discount_range = params.max_discount - params.min_discount;
    let discount = params.min_discount + (sigmoid * discount_range as f32) as u16;
    
    // Cap at max discount
    std::cmp::min(discount, params.max_discount)
}

/// Helper function to calculate longevity factor based on time in system
/// Returns 0-10000 score with higher values for longer history
fn calculate_longevity_factor(days: u32) -> u16 {
    // Log curve: more impact for early days, diminishing returns for very long history
    let factor = if days == 0 {
        0
    } else if days < 30 {
        // Under 1 month: linear growth
        (days as u32 * 2500) / 30
    } else if days < 180 {
        // 1-6 months: moderate growth
        2500 + ((days as u32 - 30) * 2500) / 150
    } else if days < 365 {
        // 6-12 months: slower growth
        5000 + ((days as u32 - 180) * 2500) / 185
    } else {
        // Over 1 year: max factor (with small growth)
        let extra = std::cmp::min(1500, ((days as u32 - 365) * 1500) / 730); // Max extra 15% for 3+ years
        7500 + extra
    };
    
    std::cmp::min(10000, factor as u16)
}

/// Initialize default Bayesian parameters
pub fn initialize_default_parameters() -> BayesianParameters {
    BayesianParameters {
        authority: Pubkey::default(), // Will be set by caller
        prior_mean: 5000,            // Neutral prior (50.00%)
        prior_strength: 500,         // Moderate prior strength
        contract_completion_weight: 4500,  // 45% weight
        contract_dispute_weight: 2500,     // 25% weight
        claim_approval_weight: 2500,       // 25% weight
        claim_rejection_weight: 3000,      // 30% weight
        time_decay_factor: 500,           // 5% weight for time factor
        min_discount: 500,           // 5% minimum discount
        max_discount: 2500,          // 25% maximum discount
        discount_curve_factor: 1000, // Default curve steepness
        bump: 0,                     // Will be set by caller
    }
}
