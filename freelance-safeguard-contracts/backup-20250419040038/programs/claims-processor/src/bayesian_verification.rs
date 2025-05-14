use anchor_lang::prelude::*;

/// Bayesian verification state for claims processing
#[account]
pub struct BayesianVerificationModel {
    // Authority that can update the model parameters
    pub authority: Pubkey,
    
    // Prior probability parameters
    pub prior_fraud_probability: u16, // Scaled by 10000 (e.g., 500 = 5%)
    
    // Likelihood parameters for evidence evaluation
    pub completion_weight: u16,       // Weight for work completion evidence
    pub review_weight: u16,           // Weight for review score evidence
    pub history_weight: u16,          // Weight for claim history evidence
    pub time_weight: u16,             // Weight for time since work completion
    
    // Thresholds for classification
    pub approve_threshold: u16,       // Threshold to auto-approve claim (scaled by 10000)
    pub deny_threshold: u16,          // Threshold to auto-deny claim (scaled by 10000)
    
    // Performance metrics
    pub total_claims_processed: u64,
    pub approved_claims: u64,
    pub denied_claims: u64,
    pub manual_review_claims: u64,
    
    // Learning metrics
    pub false_positives: u64,         // Approved claims that were actually fraudulent
    pub false_negatives: u64,         // Denied claims that were actually legitimate
    pub true_positives: u64,          // Correctly approved claims
    pub true_negatives: u64,          // Correctly denied claims
    
    // Learning rate parameters
    pub threshold_adjustment_rate: u16, // Rate at which thresholds are adjusted (basis points)
    pub weight_adjustment_rate: u16,    // Rate at which weights are adjusted (basis points)
    
    // Reserved space for future parameters without Default trait needed
    pub reserved: [u8; 32],
    
    pub bump: u8,
}

impl Default for BayesianVerificationModel {
    fn default() -> Self {
        Self {
            authority: Pubkey::default(),
            prior_fraud_probability: 500, // 5% prior fraud probability
            completion_weight: 3500,      // 35% weight on completion evidence
            review_weight: 2500,          // 25% weight on review score evidence
            history_weight: 2500,         // 25% weight on claim history evidence
            time_weight: 1500,            // 15% weight on time since completion
            approve_threshold: 8000,      // 80% threshold for auto-approval
            deny_threshold: 2000,         // 20% threshold for auto-denial
            total_claims_processed: 0,
            approved_claims: 0,
            denied_claims: 0,
            manual_review_claims: 0,
            false_positives: 0,
            false_negatives: 0,
            true_positives: 0,
            true_negatives: 0,
            threshold_adjustment_rate: 200, // 2% adjustment rate
            weight_adjustment_rate: 100,    // 1% adjustment rate
            reserved: [0u8; 32],          // Initialize all bytes to 0
            bump: 255,                    // Invalid bump, to be set during initialization
        }
    }
}

impl BayesianVerificationModel {
    pub const SIZE: usize = 8 +  // discriminator
                            32 + // authority
                            2 +  // prior_fraud_probability
                            2 +  // completion_weight
                            2 +  // review_weight
                            2 +  // history_weight
                            2 +  // time_weight
                            2 +  // approve_threshold
                            2 +  // deny_threshold
                            8 +  // total_claims_processed
                            8 +  // approved_claims
                            8 +  // denied_claims
                            8 +  // manual_review_claims
                            8 +  // false_positives
                            8 +  // false_negatives
                            8 +  // true_positives
                            8 +  // true_negatives
                            2 +  // threshold_adjustment_rate
                            2 +  // weight_adjustment_rate
                            32 + // reserved
                            1;   // bump
}

/// Evidence factors for Bayesian claim verification
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct ClaimEvidence {
    // Work completion evidence (0-100)
    // 0 = no evidence of completion, 100 = strong evidence
    pub completion_score: u8,
    
    // Review score from client (0-100)
    pub review_score: u8,
    
    // Previous claim history (0-100)
    // 0 = many previous fraudulent claims, 100 = perfect history
    pub history_score: u8,
    
    // Time since work completion in days (0-255)
    // Lower values indicate a claim filed shortly after completion
    pub days_since_completion: u8,
}

/// Calculate probability that a claim is legitimate using Bayesian inference
/// Returns a probability between 0-10000 (0% to 100%)
pub fn calculate_claim_legitimacy(
    model: &BayesianVerificationModel,
    evidence: &ClaimEvidence,
) -> u16 {
    // Prior probability of fraud (complement is legitimate probability)
    let prior_fraud = model.prior_fraud_probability;
    let prior_legitimate = 10000 - prior_fraud;
    
    // Calculate likelihood ratios based on evidence
    // Higher evidence scores increase the likelihood of legitimacy
    
    // Normalize weights to ensure they sum to 10000
    let total_weight = model.completion_weight + model.review_weight + 
                       model.history_weight + model.time_weight;
    
    // If weights are zero or invalid, use equal weighting
    let (completion_weight, review_weight, history_weight, time_weight) = if total_weight == 0 {
        (2500, 2500, 2500, 2500) // Equal 25% weights
    } else {
        // Normalize to 10000
        let scale_factor = 10000 / total_weight;
        (
            model.completion_weight * scale_factor,
            model.review_weight * scale_factor,
            model.history_weight * scale_factor,
            model.time_weight * scale_factor
        )
    };
    
    // Calculate weighted evidence score (0-10000)
    let weighted_evidence = 
        ((evidence.completion_score as u32 * completion_weight as u32) / 100 +
         (evidence.review_score as u32 * review_weight as u32) / 100 +
         (evidence.history_score as u32 * history_weight as u32) / 100 +
         ((100 - std::cmp::min(evidence.days_since_completion, 100)) as u32 * time_weight as u32) / 100) as u16;
    
    // Apply Bayes' theorem:
    // P(legitimate|evidence) = P(evidence|legitimate) * P(legitimate) / P(evidence)
    
    // Since we're comparing legitimate vs. fraud probabilities, we can use likelihood ratio:
    // P(legitimate|evidence) = L * P(legitimate) / [L * P(legitimate) + P(fraud)]
    // Where L is the likelihood ratio P(evidence|legitimate) / P(evidence|fraud)
    
    // Map weighted evidence to a likelihood ratio that favors legitimacy as evidence increases
    let likelihood_ratio = (weighted_evidence as u32 * 3) / 100;
    
    // Apply Bayes' formula (with scaling to avoid floating point)
    let numerator = likelihood_ratio * prior_legitimate as u32;
    let denominator = numerator + (10000 - weighted_evidence as u32) * prior_fraud as u32 / 100;
    
    // Avoid division by zero
    if denominator == 0 {
        return 5000; // Return 50% if calculation fails
    }
    
    let posterior_legitimate = (numerator * 10000 / denominator) as u16;
    
    // Clamp to valid probability range
    std::cmp::min(std::cmp::max(posterior_legitimate, 0), 10000)
}

/// Determine claim verification result based on Bayesian model thresholds
pub fn verify_claim(
    model: &BayesianVerificationModel,
    evidence: &ClaimEvidence,
) -> ClaimVerificationResult {
    let legitimacy_probability = calculate_claim_legitimacy(model, evidence);
    
    if legitimacy_probability >= model.approve_threshold {
        ClaimVerificationResult::Approved
    } else if legitimacy_probability <= model.deny_threshold {
        ClaimVerificationResult::Denied
    } else {
        ClaimVerificationResult::ManualReview
    }
}

/// Possible outcomes of the claim verification process
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ClaimVerificationResult {
    Approved,
    Denied,
    ManualReview,
}

// Initialize a default Bayesian model with reasonable parameters
pub fn initialize_default_model() -> BayesianVerificationModel {
    BayesianVerificationModel {
        authority: Pubkey::default(), // Will be set by the caller
        prior_fraud_probability: 500, // 5% prior fraud probability
        completion_weight: 3500,      // 35% weight on completion evidence
        review_weight: 2500,          // 25% weight on review score
        history_weight: 2500,         // 25% weight on claim history
        time_weight: 1500,            // 15% weight on time since completion
        approve_threshold: 8000,      // 80% threshold for auto-approval
        deny_threshold: 2000,         // 20% threshold for auto-denial
        total_claims_processed: 0,
        approved_claims: 0,
        denied_claims: 0,
        manual_review_claims: 0,
        false_positives: 0,
        false_negatives: 0,
        true_positives: 0,
        true_negatives: 0,
        threshold_adjustment_rate: 200, // 2% adjustment rate
        weight_adjustment_rate: 100,    // 1% adjustment rate
        reserved: [0; 32],
        bump: 0,                     // Will be set by the caller
    }
}

/// Update Bayesian model based on actual claim outcome
/// This function implements adaptive learning to improve the model over time
pub fn update_bayesian_model(
    model: &mut BayesianVerificationModel,
    claim_result: ClaimVerificationResult,
    actual_outcome: bool, // true if claim was legitimate
) -> Result<()> {
    // Update performance metrics
    model.total_claims_processed += 1;
    
    // Track prediction accuracy
    match (claim_result, actual_outcome) {
        (ClaimVerificationResult::Approved, true) => {
            // True positive - correctly approved legitimate claim
            model.true_positives += 1;
        },
        (ClaimVerificationResult::Approved, false) => {
            // False positive - incorrectly approved fraudulent claim
            model.false_positives += 1;
            
            // Adjust approve threshold upward to be more conservative
            let adjustment = (model.approve_threshold as u32 * model.threshold_adjustment_rate as u32) / 10000;
            model.approve_threshold = std::cmp::min(
                model.approve_threshold.saturating_add(adjustment as u16),
                9500 // Cap at 95% to avoid being too restrictive
            );
        },
        (ClaimVerificationResult::Denied, true) => {
            // False negative - incorrectly denied legitimate claim
            model.false_negatives += 1;
            
            // Adjust deny threshold downward to be less restrictive
            let adjustment = (model.deny_threshold as u32 * model.threshold_adjustment_rate as u32) / 10000;
            model.deny_threshold = std::cmp::max(
                model.deny_threshold.saturating_sub(adjustment as u16),
                500 // Floor at 5% to maintain some filtering
            );
        },
        (ClaimVerificationResult::Denied, false) => {
            // True negative - correctly denied fraudulent claim
            model.true_negatives += 1;
        },
        (ClaimVerificationResult::ManualReview, _) => {
            // Manual review cases don't affect the model directly
            model.manual_review_claims += 1;
        }
    }
    
    // Adjust weights based on historical performance if we have enough data
    if model.total_claims_processed > 100 {
        // Calculate accuracy metrics
        let total_predictions = model.true_positives + model.true_negatives + 
                               model.false_positives + model.false_negatives;
        
        if total_predictions > 0 {
            // Overall accuracy
            let accuracy = ((model.true_positives + model.true_negatives) * 10000) / total_predictions;
            
            // If accuracy is below 80%, adjust weights to improve performance
            if accuracy < 8000 {
                // Adjust weights based on which type of error is more common
                if model.false_positives > model.false_negatives {
                    // More false positives, increase weight on completion evidence
                    let adjustment = (model.completion_weight as u32 * model.weight_adjustment_rate as u32) / 10000;
                    model.completion_weight = model.completion_weight.saturating_add(adjustment as u16);
                } else {
                    // More false negatives, increase weight on history evidence
                    let adjustment = (model.history_weight as u32 * model.weight_adjustment_rate as u32) / 10000;
                    model.history_weight = model.history_weight.saturating_add(adjustment as u16);
                }
                
                // Normalize weights to ensure they sum to 10000
                let total_weight = model.completion_weight + model.review_weight + 
                                  model.history_weight + model.time_weight;
                
                if total_weight > 0 {
                    let scale_factor = 10000 / total_weight;
                    model.completion_weight = (model.completion_weight as u32 * scale_factor as u32 / 10000) as u16;
                    model.review_weight = (model.review_weight as u32 * scale_factor as u32 / 10000) as u16;
                    model.history_weight = (model.history_weight as u32 * scale_factor as u32 / 10000) as u16;
                    model.time_weight = (model.time_weight as u32 * scale_factor as u32 / 10000) as u16;
                }
            }
        }
    }
    
    Ok(())
}
