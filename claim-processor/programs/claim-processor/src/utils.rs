use anchor_lang::prelude::*;
use crate::state::*;

/// Updates the claimant history when a claim is rejected
pub fn update_claimant_history_for_rejected_claim(
    claimant_history: &mut ClaimantHistory,
    claim_amount: u64,
    is_fraud: bool
) -> Result<()> {
    // Update rejection counts
    claimant_history.rejected_claims += 1;
    
    // If rejected for fraud, update the fraud rejection count
    if is_fraud {
        claimant_history.fraud_rejected_claims += 1;
    }
    
    // Note: We don't update total_paid_amount since the claim was rejected
    
    Ok(())
}

/// Calculate risk adjustment based on claim history
pub fn calculate_risk_adjustment(
    claimant_history: &ClaimantHistory,
) -> f64 {
    let mut risk_multiplier = 1.0;
    
    // Adjust based on fraud rejections (strong negative signal)
    if claimant_history.fraud_rejected_claims > 0 {
        risk_multiplier += (claimant_history.fraud_rejected_claims as f64) * 0.5;
    }
    
    // Adjust based on claim frequency in last 90 days
    if claimant_history.claims_last_90_days > 1 {
        risk_multiplier += (claimant_history.claims_last_90_days as f64 - 1.0) * 0.2;
    }
    
    // Adjust based on overall claim to project ratio
    if claimant_history.total_projects > 0 {
        let claim_ratio = (claimant_history.total_claims as f64) / (claimant_history.total_projects as f64);
        if claim_ratio > 0.2 { // More than 20% of projects resulted in claims
            risk_multiplier += (claim_ratio - 0.2) * 2.0;
        }
    }
    
    // Adjust based on approval rate (lower approval rate increases risk)
    if claimant_history.total_claims > 0 {
        let approval_rate = (claimant_history.approved_claims as f64) / (claimant_history.total_claims as f64);
        if approval_rate < 0.7 { // Less than 70% approval rate
            risk_multiplier += (0.7 - approval_rate) * 0.5;
        }
    }
    
    // Cap the risk multiplier
    if risk_multiplier > 3.0 {
        risk_multiplier = 3.0;
    }
    
    risk_multiplier
}

/// Update the waiting period for a policy based on claimant risk profile
pub fn calculate_waiting_period_days(
    claimant_history: &ClaimantHistory,
) -> u32 {
    let mut base_waiting_period = 14; // Base waiting period: 14 days
    
    // Increase waiting period for users with fraud rejections
    if claimant_history.fraud_rejected_claims > 0 {
        base_waiting_period += claimant_history.fraud_rejected_claims as u32 * 7; // +7 days per fraud rejection
    }
    
    // Increase waiting period for users with high claim frequency
    if claimant_history.claims_last_90_days > 1 {
        base_waiting_period += (claimant_history.claims_last_90_days as u32 - 1) * 3; // +3 days per extra recent claim
    }
    
    // Cap the waiting period
    if base_waiting_period > 60 {
        base_waiting_period = 60; // Maximum 60-day waiting period
    }
    
    base_waiting_period
}

/// Calculate premium adjustment based on claimant risk profile
pub fn calculate_premium_adjustment(
    claimant_history: &ClaimantHistory,
) -> f64 {
    let mut premium_multiplier = 1.0;
    
    // Adjust based on fraud rejections (strong negative signal)
    if claimant_history.fraud_rejected_claims > 0 {
        premium_multiplier += (claimant_history.fraud_rejected_claims as f64) * 0.3;
    }
    
    // Adjust based on claim frequency
    if claimant_history.claims_last_365_days > 2 {
        premium_multiplier += (claimant_history.claims_last_365_days as f64 - 2.0) * 0.15;
    }
    
    // Adjust based on claim to project ratio
    if claimant_history.total_projects > 0 {
        let claim_ratio = (claimant_history.total_claims as f64) / (claimant_history.total_projects as f64);
        if claim_ratio > 0.2 { // More than 20% of projects resulted in claims
            premium_multiplier += (claim_ratio - 0.2) * 1.5;
        }
    }
    
    // Reward for good history (discount)
    if claimant_history.total_claims > 5 && claimant_history.fraud_rejected_claims == 0 {
        let approval_rate = (claimant_history.approved_claims as f64) / (claimant_history.total_claims as f64);
        if approval_rate > 0.9 { // Very high approval rate
            premium_multiplier -= 0.15; // 15% discount
        } else if approval_rate > 0.8 {
            premium_multiplier -= 0.1; // 10% discount
        }
    }
    
    // Cap the premium multiplier
    if premium_multiplier < 0.75 {
        premium_multiplier = 0.75; // Maximum 25% discount
    }
    
    if premium_multiplier > 3.0 {
        premium_multiplier = 3.0; // Maximum 3x premium increase
    }
    
    premium_multiplier
}

/// Verify that the claim evidence meets minimum requirements
pub fn verify_evidence_requirements(
    claim: &ClaimAccount,
    evidence: &[EvidenceItem],
) -> Result<bool> {
    // Minimum evidence count based on claim amount
    let min_evidence_count = if claim.amount > 5000 {
        4 // Larger claims need more evidence
    } else if claim.amount > 1000 {
        3 // Medium claims
    } else {
        2 // Small claims
    };
    
    // Check if we have enough evidence
    if evidence.len() < min_evidence_count {
        return Ok(false);
    }
    
    // For each claim type, check if specific evidence types are present
    match claim.claim_type {
        ClaimType::NonPayment => {
            let has_contract = evidence.iter().any(|e| e.evidence_type == EvidenceType::Contract);
            let has_delivery = evidence.iter().any(|e| e.evidence_type == EvidenceType::Deliverable);
            let has_communication = evidence.iter().any(|e| e.evidence_type == EvidenceType::Communication);
            
            if !has_contract || !has_delivery || !has_communication {
                return Ok(false);
            }
        },
        ClaimType::IncompleteWork => {
            let has_contract = evidence.iter().any(|e| e.evidence_type == EvidenceType::Contract);
            let has_communication = evidence.iter().any(|e| e.evidence_type == EvidenceType::Communication);
            
            if !has_contract || !has_communication {
                return Ok(false);
            }
        },
        ClaimType::QualityDispute => {
            let has_contract = evidence.iter().any(|e| e.evidence_type == EvidenceType::Contract);
            let has_delivery = evidence.iter().any(|e| e.evidence_type == EvidenceType::Deliverable);
            let has_quality = evidence.iter().any(|e| e.evidence_type == EvidenceType::QualityAssessment);
            
            if !has_contract || !has_delivery || !has_quality {
                return Ok(false);
            }
        },
        ClaimType::DeadlineMissed => {
            let has_contract = evidence.iter().any(|e| e.evidence_type == EvidenceType::Contract);
            let has_timeline = evidence.iter().any(|e| e.evidence_type == EvidenceType::Timeline);
            
            if !has_contract || !has_timeline {
                return Ok(false);
            }
        },
        _ => {
            // For other claim types, just check for the minimum count
            if evidence.len() < min_evidence_count {
                return Ok(false);
            }
        }
    }
    
    Ok(true)
}

/// Calculate coverage cap based on claim history and risk profile
pub fn calculate_coverage_cap(
    base_coverage: u64,
    claimant_history: &ClaimantHistory,
) -> u64 {
    let mut risk_factor = 1.0;
    
    // Adjust based on fraud rejections (strong negative signal)
    if claimant_history.fraud_rejected_claims > 0 {
        risk_factor -= (claimant_history.fraud_rejected_claims as f64) * 0.2;
    }
    
    // Adjust based on claim frequency
    if claimant_history.claims_last_90_days > 1 {
        risk_factor -= (claimant_history.claims_last_90_days as f64 - 1.0) * 0.1;
    }
    
    // Adjust based on claim to project ratio
    if claimant_history.total_projects > 0 {
        let claim_ratio = (claimant_history.total_claims as f64) / (claimant_history.total_projects as f64);
        if claim_ratio > 0.2 { // More than 20% of projects resulted in claims
            risk_factor -= (claim_ratio - 0.2) * 0.5;
        }
    }
    
    // Reward for good history
    if claimant_history.total_claims > 5 && claimant_history.fraud_rejected_claims == 0 {
        let approval_rate = (claimant_history.approved_claims as f64) / (claimant_history.total_claims as f64);
        if approval_rate > 0.9 { // Very high approval rate
            risk_factor += 0.1; // 10% increase
        }
    }
    
    // Cap the risk factor
    if risk_factor < 0.5 {
        risk_factor = 0.5; // Minimum 50% of base coverage
    }
    
    if risk_factor > 1.2 {
        risk_factor = 1.2; // Maximum 120% of base coverage
    }
    
    (base_coverage as f64 * risk_factor) as u64
}

/// Check if the claimant and respondent have unusual transaction patterns that might indicate collusion
pub fn check_transaction_patterns(
    claimant_history: &ClaimantHistory,
) -> bool {
    // Check if there have been many transactions but no successful projects
    if claimant_history.transaction_count_with_respondent > 2 && 
       claimant_history.successful_projects_with_respondent == 0 {
        return true;
    }
    
    // Check if there are repeated claims against the same respondent
    if claimant_history.claims_against_current_respondent > 1 {
        return true;
    }
    
    false
}

/// Convert a fraud score to a readable risk level
pub fn fraud_score_to_risk_level(fraud_score: u8) -> &'static str {
    match fraud_score {
        0..=20 => "Low Risk",
        21..=40 => "Moderate Risk",
        41..=70 => "High Risk",
        71..=100 => "Very High Risk",
        _ => "Unknown Risk"
    }
}
