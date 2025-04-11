use anchor_lang::prelude::*;
use crate::state::*;

/// This module contains specialized logic for detecting fraudulent claims
/// based on various indicators and patterns in the claim data

// Fraud flags - each bit represents a potential fraud indicator
pub const FRAUD_FLAG_TIMING: u8 = 1;         // 0b00000001 - Suspicious timing of claim
pub const FRAUD_FLAG_AMOUNT: u8 = 2;         // 0b00000010 - Suspicious claim amount
pub const FRAUD_FLAG_HISTORY: u8 = 4;        // 0b00000100 - Suspicious claimant history
pub const FRAUD_FLAG_EVIDENCE: u8 = 8;       // 0b00001000 - Suspicious evidence patterns
pub const FRAUD_FLAG_COLLUSION: u8 = 16;     // 0b00010000 - Potential collusion detected
pub const FRAUD_FLAG_MULTIPLE: u8 = 32;      // 0b00100000 - Multiple related claims
pub const FRAUD_FLAG_INCONSISTENCY: u8 = 64; // 0b01000000 - Inconsistencies in claim data

/// Structure to hold all results from fraud detection
pub struct FraudDetectionResult {
    pub fraud_flags: u8,
    pub fraud_score: u8,            // 0-100 score, higher = more suspicious
    pub requires_manual_review: bool,
    pub rejection_reason: Option<String>,
}

/// Analyze a claim for potential fraud indicators
pub fn analyze_claim_for_fraud(
    claim: &ClaimAccount,
    policy: &PolicyAccount,
    claimant_history: &ClaimantHistory,
    evidence: &[EvidenceItem],
) -> FraudDetectionResult {
    let mut fraud_flags: u8 = 0;
    let mut fraud_score: u8 = 0;
    
    // Check 1: Policy timing - Was the policy purchased right before the claim?
    if check_suspicious_policy_timing(claim, policy) {
        fraud_flags |= FRAUD_FLAG_TIMING;
        fraud_score += 20;
    }
    
    // Check 2: Claim amount - Is the claim amount suspiciously high?
    if check_suspicious_claim_amount(claim, policy) {
        fraud_flags |= FRAUD_FLAG_AMOUNT;
        fraud_score += 15;
    }
    
    // Check 3: Claim history - Does the claimant have a suspicious claim history?
    if check_suspicious_claim_history(claim, claimant_history) {
        fraud_flags |= FRAUD_FLAG_HISTORY;
        fraud_score += 25;
    }
    
    // Check 4: Evidence patterns - Are there suspicious patterns in the evidence?
    if check_suspicious_evidence(claim, evidence) {
        fraud_flags |= FRAUD_FLAG_EVIDENCE;
        fraud_score += 20;
    }
    
    // Check 5: Collusion - Is there potential collusion between parties?
    if check_potential_collusion(claim, claimant_history) {
        fraud_flags |= FRAUD_FLAG_COLLUSION;
        fraud_score += 30;
    }
    
    // Check 6: Multiple claims - Are there multiple related claims?
    if check_multiple_related_claims(claim, claimant_history) {
        fraud_flags |= FRAUD_FLAG_MULTIPLE;
        fraud_score += 15;
    }
    
    // Check 7: Consistency check - Are there inconsistencies in the claim data?
    if check_claim_inconsistencies(claim, evidence) {
        fraud_flags |= FRAUD_FLAG_INCONSISTENCY;
        fraud_score += 20;
    }
    
    // Cap fraud score at 100
    if fraud_score > 100 {
        fraud_score = 100;
    }
    
    // Determine if manual review is required
    let requires_manual_review = fraud_score >= 40;
    
    // Generate rejection reason if score is extremely high
    let rejection_reason = if fraud_score >= 85 {
        Some(generate_rejection_reason(fraud_flags))
    } else {
        None
    };
    
    FraudDetectionResult {
        fraud_flags,
        fraud_score,
        requires_manual_review,
        rejection_reason,
    }
}

/// Check if the timing between policy purchase and claim is suspicious
fn check_suspicious_policy_timing(claim: &ClaimAccount, policy: &PolicyAccount) -> bool {
    // Get the current timestamp
    let current_time = Clock::get().unwrap().unix_timestamp;
    
    // Calculate the time elapsed since policy creation (in days)
    let policy_age_days = (current_time - policy.created_at) / (24 * 60 * 60);
    
    // Policies less than 7 days old with claims are suspicious
    if policy_age_days < 7 {
        return true;
    }
    
    // Check if claim is near policy expiration (potential last-minute fraud)
    if policy.expiry_time > 0 {
        let time_to_expiry_days = (policy.expiry_time - current_time) / (24 * 60 * 60);
        if time_to_expiry_days < 3 {
            return true;
        }
    }
    
    false
}

/// Check if the claim amount is suspiciously high relative to policy coverage
fn check_suspicious_claim_amount(claim: &ClaimAccount, policy: &PolicyAccount) -> bool {
    // Claims for more than 90% of maximum coverage are suspicious
    let coverage_ratio = (claim.amount as f64) / (policy.coverage_amount as f64);
    if coverage_ratio > 0.9 {
        return true;
    }
    
    // Check if the claim amount is much higher than the claimant's typical project value
    if let Some(avg_project_value) = policy.average_project_value {
        let value_ratio = (claim.amount as f64) / (avg_project_value as f64);
        if value_ratio > 3.0 {
            return true;
        }
    }
    
    false
}

/// Check if the claimant has a suspicious claim history
fn check_suspicious_claim_history(claim: &ClaimAccount, history: &ClaimantHistory) -> bool {
    // Multiple claims in a short period are suspicious
    let recent_claims_count = history.claims_last_30_days;
    if recent_claims_count >= 2 {
        return true;
    }
    
    // High claim frequency relative to projects is suspicious
    if history.total_projects > 0 {
        let claim_ratio = (history.total_claims as f64) / (history.total_projects as f64);
        if claim_ratio > 0.4 { // More than 40% of projects resulted in claims
            return true;
        }
    }
    
    // Previous rejected claims for fraud are very suspicious
    if history.fraud_rejected_claims > 0 {
        return true;
    }
    
    false
}

/// Check for suspicious patterns in the evidence
fn check_suspicious_evidence(claim: &ClaimAccount, evidence: &[EvidenceItem]) -> bool {
    // No evidence or minimal evidence is suspicious for large claims
    if evidence.len() < 2 && claim.amount > 1000 {
        return true;
    }
    
    // Check for evidence timestamps all created in a very short time window
    // (suggesting they might have been created all at once)
    if evidence.len() >= 2 {
        let mut min_timestamp = i64::MAX;
        let mut max_timestamp = i64::MIN;
        
        for item in evidence {
            if item.timestamp < min_timestamp {
                min_timestamp = item.timestamp;
            }
            if item.timestamp > max_timestamp {
                max_timestamp = item.timestamp;
            }
        }
        
        // If all evidence was created within 10 minutes, it's suspicious
        let time_window = max_timestamp - min_timestamp;
        if time_window < 600 && evidence.len() > 3 {
            return true;
        }
    }
    
    // Look for duplicated evidence hashes
    let mut hashes = Vec::with_capacity(evidence.len());
    for item in evidence {
        if hashes.contains(&item.evidence_hash) {
            return true;
        }
        hashes.push(item.evidence_hash);
    }
    
    false
}

/// Check for potential collusion between claimant and respondent
fn check_potential_collusion(claim: &ClaimAccount, history: &ClaimantHistory) -> bool {
    // Check for repeated interactions with the same respondent
    if history.repeated_respondent_count > 2 {
        return true;
    }
    
    // Check for transaction history between parties
    if history.transaction_count_with_respondent > 0 && 
       history.successful_projects_with_respondent == 0 {
        // Transactions but no successful projects is suspicious
        return true;
    }
    
    false
}

/// Check for multiple related claims
fn check_multiple_related_claims(claim: &ClaimAccount, history: &ClaimantHistory) -> bool {
    // Multiple claims against the same respondent
    if history.claims_against_current_respondent > 1 {
        return true;
    }
    
    // Multiple claims of the same type in a short period
    if history.same_type_claims_last_90_days > 2 {
        return true;
    }
    
    false
}

/// Check for inconsistencies in the claim data compared to evidence
fn check_claim_inconsistencies(claim: &ClaimAccount, evidence: &[EvidenceItem]) -> bool {
    // This would involve deeper analysis of evidence content
    // For simplicity, we're implementing a basic check
    let mut has_contract_evidence = false;
    let mut has_communication_evidence = false;
    let mut has_delivery_evidence = false;
    
    for item in evidence {
        match item.evidence_type {
            EvidenceType::Contract => has_contract_evidence = true,
            EvidenceType::Communication => has_communication_evidence = true,
            EvidenceType::Deliverable => has_delivery_evidence = true,
            _ => {}
        }
    }
    
    // For non-payment claims, should have contract and delivery evidence
    if claim.claim_type == ClaimType::NonPayment && 
       (!has_contract_evidence || !has_delivery_evidence) {
        return true;
    }
    
    // For quality dispute, should have contract and communication evidence
    if claim.claim_type == ClaimType::QualityDispute && 
       (!has_contract_evidence || !has_communication_evidence) {
        return true;
    }
    
    false
}

/// Generate a rejection reason based on fraud flags
fn generate_rejection_reason(fraud_flags: u8) -> String {
    let mut reasons = Vec::new();
    
    if fraud_flags & FRAUD_FLAG_TIMING != 0 {
        reasons.push("suspicious timing between policy purchase and claim filing");
    }
    
    if fraud_flags & FRAUD_FLAG_AMOUNT != 0 {
        reasons.push("claim amount anomaly detected");
    }
    
    if fraud_flags & FRAUD_FLAG_HISTORY != 0 {
        reasons.push("unusual claiming pattern detected");
    }
    
    if fraud_flags & FRAUD_FLAG_EVIDENCE != 0 {
        reasons.push("evidence inconsistencies detected");
    }
    
    if fraud_flags & FRAUD_FLAG_COLLUSION != 0 {
        reasons.push("potential collusion pattern detected");
    }
    
    if fraud_flags & FRAUD_FLAG_MULTIPLE != 0 {
        reasons.push("multiple related claims detected");
    }
    
    if fraud_flags & FRAUD_FLAG_INCONSISTENCY != 0 {
        reasons.push("claim data inconsistencies detected");
    }
    
    if reasons.is_empty() {
        return "Automated fraud detection system flagged this claim for manual review".to_string();
    }
    
    format!("Claim rejected due to: {}", reasons.join(", "))
}
