use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;

// Helper functions for risk score calculation
pub fn calculate_overall_risk_score(risk_factors: &[RiskFactorScore]) -> i32 {
    if risk_factors.is_empty() {
        return 0;
    }
    
    // Weights for different risk factors (must sum to 100)
    let weights = [25, 15, 15, 10, 10, 5, 5, 5, 5, 5];
    
    // Calculate weighted sum
    let mut weighted_sum = 0;
    let mut total_weight = 0;
    
    for (i, factor) in risk_factors.iter().enumerate() {
        let weight = if i < weights.len() { weights[i] } else { 5 };
        weighted_sum += factor.score * weight as i32;
        total_weight += weight;
    }
    
    // Normalize by total weight
    weighted_sum / total_weight as i32
}

// Calculate coverage limit based on risk score
pub fn calculate_coverage_limit(risk_score: i32, base_limit: u64) -> u64 {
    // Lower risk score = higher coverage limit
    // Risk score range: -100 (best) to 100 (worst)
    let multiplier = 2.0 - (risk_score as f64 + 100.0) / 200.0;
    
    // Ensure multiplier is within reasonable bounds
    let capped_multiplier = multiplier.max(0.5).min(2.0);
    
    // Apply multiplier to base coverage limit
    (base_limit as f64 * capped_multiplier) as u64
}

// Calculate waiting period in days based on risk score
pub fn calculate_waiting_period(risk_score: i32) -> u8 {
    // Higher risk score = longer waiting period
    // Base waiting period of 3 days
    let base_period = 3;
    
    // Add days based on risk score (normalized to 0-100 range)
    let normalized_score = (risk_score + 100) / 2;
    let additional_days = (normalized_score as f64 / 20.0).floor() as u8;
    
    // Cap at 14 days maximum
    (base_period + additional_days).min(14)
}

// Helper function for automated claim verification
pub fn auto_verify_claim(
    claim: &ClaimVerification,
    claimant_identity: &IdentityAccount,
    claimant_risk: &RiskAssessment,
) -> ValidationResult {
    // Score starts at neutral (0)
    let mut verification_score = 0;
    
    // Factor 1: Identity verification level (higher is better)
    match claimant_identity.verification_level {
        VerificationLevel::Basic => verification_score += 0,
        VerificationLevel::Intermediate => verification_score += 5,
        VerificationLevel::Advanced => verification_score += 15,
        VerificationLevel::Premium => verification_score += 25,
    }
    
    // Factor 2: Risk score (lower is better)
    verification_score -= claimant_risk.overall_risk_score / 10;
    
    // Factor 3: Evidence completeness
    let required_evidence_count = claim.claim_data.required_evidence_types.len();
    let submitted_evidence_count = claim.evidence.len();
    
    if required_evidence_count > 0 {
        let evidence_ratio = (submitted_evidence_count as f64 / required_evidence_count as f64).min(1.0);
        verification_score += (evidence_ratio * 30.0) as i32;
    }
    
    // Factor 4: Claim amount vs coverage limit
    let claim_ratio = claim.claim_data.claim_amount as f64 / claimant_risk.coverage_limit as f64;
    if claim_ratio > 0.8 {
        verification_score -= 20; // High percentage of coverage limit is suspicious
    }
    
    // Factor 5: Timing of the claim after policy initiation
    let claim_creation = claim.created_at;
    let policy_age = claim_creation - claimant_risk.created_at;
    let policy_age_days = policy_age / (24 * 60 * 60);
    
    if policy_age_days < claimant_risk.waiting_period_days as i64 {
        verification_score -= 50; // Claiming before waiting period is highly suspicious
    } else if policy_age_days < 30 {
        verification_score -= 10; // Claiming within first month is somewhat suspicious
    }
    
    // Factor 6: Fraud flags
    if claim.fraud_flags > 0 {
        verification_score -= 10 * claim.fraud_flags as i32;
    }
    
    // Determine validation result based on final score
    if verification_score >= 60 {
        ValidationResult::Valid
    } else if verification_score >= 40 {
        ValidationResult::PartiallyValid
    } else if verification_score >= 20 {
        ValidationResult::NeedsMoreEvidence
    } else if verification_score < 0 {
        ValidationResult::Fraudulent
    } else {
        ValidationResult::Invalid
    }
}

// Helper function to calculate fraud detection score
pub fn calculate_fraud_probability(
    claimant: &Pubkey,
    respondent: &Pubkey,
    claim_data: &ClaimData,
    claimant_risk: &RiskAssessment,
    fraud_reports: &[FraudReport],
) -> u8 {
    let mut fraud_score = 0;
    
    // Factor 1: Previous fraud reports against claimant
    let claimant_fraud_reports = fraud_reports.iter()
        .filter(|report| report.reported_user == *claimant)
        .count();
    
    fraud_score += (claimant_fraud_reports as u8).min(50);
    
    // Factor 2: Relationship between claimant and respondent
    // This would require more data, like transaction history between the two
    
    // Factor 3: Risk score of claimant
    if claimant_risk.overall_risk_score > 50 {
        fraud_score += 20;
    } else if claimant_risk.overall_risk_score > 0 {
        fraud_score += 10;
    }
    
    // Factor 4: Claim amount
    let high_value_threshold = 1_000_000; // 1M token units
    if claim_data.claim_amount > high_value_threshold {
        fraud_score += 15;
    }
    
    // Cap at 100
    fraud_score.min(100)
}

// Verify oracle signature for external identity verification
pub fn verify_oracle_signature(
    oracle_pubkey: Pubkey,
    verification_hash: &[u8; 32],
    oracle_signature: &[u8; 64],
) -> bool {
    // In production, you would verify the ed25519 signature
    // This would validate that the oracle actually signed the verification data
    
    // For this implementation, we'll return true for testing
    // TODO: Implement proper signature verification
    true
}

// Check if a program is authorized to update data
pub fn is_authorized_program(program_id: Pubkey) -> bool {
    // In production, you would maintain a list of authorized programs
    // such as your core program, claims processor, and policy program
    
    // For testing, we'll just return true
    // TODO: Implement proper authorization checks
    true
}

// Check if two users are connected/related (for collusion detection)
pub fn check_user_connection(user_a: &Pubkey, user_b: &Pubkey) -> bool {
    // This would ideally use on-chain and off-chain data to determine connection
    // For now, just a placeholder
    false
}
