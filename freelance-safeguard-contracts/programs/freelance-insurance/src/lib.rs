use anchor_lang::prelude::*;

// Import submodules
pub mod instructions;
pub mod state;
pub mod utils;

// Re-export important structs for easier imports in clients
pub use instructions::*;
pub use state::*;

// Use the same program ID as the original
declare_id!("FhUteMD3L7eZGgLH2SiTzrePzxazTTTrZ8nNFPTVUcVt");

#[program]
pub mod freelance_insurance {
    use super::*;

    // Initialize the insurance program with a risk pool
    pub fn initialize_program(ctx: Context<InitializeProgram>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    // Create a new insurance policy
    pub fn create_policy(
        ctx: Context<CreatePolicy>,
        coverage_amount: u64,
        period_days: u16,
        job_type_value: u8,
        industry_value: u8,
        reputation_score: u8,
        claims_history: u8,
    ) -> Result<()> {
        instructions::policy::create::handler(
            ctx, 
            coverage_amount, 
            period_days, 
            job_type_value, 
            industry_value, 
            reputation_score, 
            claims_history
        )
    }
    
    // Calculate premium estimate without creating a policy
    pub fn calculate_premium(
        ctx: Context<CalculatePremium>,
        coverage_amount: u64,
        period_days: u16,
        job_type: u8,
        industry: u8,
        reputation_score: u8,
        claims_history: u8,
        market_conditions: u8,
    ) -> Result<PremiumCalculationResult> {
        instructions::policy::calculate_premium::handler(
            ctx,
            coverage_amount,
            period_days,
            job_type,
            industry,
            reputation_score,
            claims_history,
            market_conditions
        )
    }

    // Update risk parameters (admin only)
    pub fn update_risk_parameters(
        ctx: Context<UpdateRiskParameters>,
        base_premium_rate: Option<u64>,
        risk_curve_exponent: Option<u8>,
        reputation_impact_weight: Option<u8>,
        claims_history_impact_weight: Option<u8>,
        market_volatility_weight: Option<u8>,
        job_type_risk_weights: Option<[u8; 6]>,
        industry_risk_weights: Option<[u8; 7]>,
        min_coverage_amount: Option<u64>,
        max_coverage_amount: Option<u64>,
        min_period_days: Option<u16>,
        max_period_days: Option<u16>,
        is_paused: Option<bool>,
    ) -> Result<()> {
        instructions::admin::update_risk_parameters::handler(
            ctx,
            base_premium_rate,
            risk_curve_exponent,
            reputation_impact_weight,
            claims_history_impact_weight,
            market_volatility_weight,
            job_type_risk_weights,
            industry_risk_weights,
            min_coverage_amount,
            max_coverage_amount,
            min_period_days,
            max_period_days,
            is_paused
        )
    }

    // Update Bayesian model parameters (admin only)
    pub fn update_bayesian_model(ctx: Context<UpdateBayesianModel>) -> Result<()> {
        instructions::admin::update_bayesian_model::handler(ctx)
    }

    // Process claim data for Bayesian model
    pub fn process_claim_data(ctx: Context<ProcessClaimData>) -> Result<()> {
        instructions::policy::process_claim_data::handler(ctx)
    }
    
    // Collect policy data for Bayesian model
    pub fn collect_policy_data(ctx: Context<CollectPolicyData>) -> Result<()> {
        instructions::policy::collect_policy_data::handler(ctx)
    }
    
    // Submit a claim for an active policy
    pub fn submit_claim(
        ctx: Context<SubmitClaim>,
        amount: u64,
        evidence_type: String,
        evidence_description: String,
        evidence_attachments: Vec<String>,
    ) -> Result<()> {
        instructions::claim::submit::handler(ctx, amount, evidence_type, evidence_description, evidence_attachments)
    }

    // Process a claim (approve or reject)
    pub fn process_claim(
        ctx: Context<ProcessClaim>,
        approved: bool,
        reason: String,
    ) -> Result<()> {
        instructions::claim::process::handler(ctx, approved, reason)
    }

    // Verify payment for a contract
    pub fn verify_payment(
        ctx: Context<VerifyPayment>,
        expected_amount: u64,
        deadline: i64,
    ) -> Result<()> {
        instructions::payment::verify::handler(ctx, expected_amount, deadline)
    }

    // Confirm payment was made
    pub fn confirm_payment(ctx: Context<ConfirmPayment>) -> Result<()> {
        instructions::payment::confirm::handler(ctx)
    }

    // Auto-trigger claim if payment deadline is missed
    pub fn trigger_missed_payment_claim(
        ctx: Context<TriggerMissedPaymentClaim>,
        amount: u64,
    ) -> Result<()> {
        instructions::payment::missed::handler(ctx, amount)
    }
}

// Error codes
#[error_code]
pub enum InsuranceError {
    #[msg("Policy is not active")]
    PolicyNotActive,
    
    #[msg("Claim exceeds coverage amount")]
    ClaimExceedsCoverage,
    
    #[msg("Policy has expired")]
    PolicyExpired,
    
    #[msg("Claim is not in pending status")]
    ClaimNotPending,
    
    #[msg("Only policy owner can submit claim")]
    OnlyPolicyOwner,
    
    #[msg("Only admin can process claims")]
    OnlyAdmin,
    
    #[msg("Insufficient funds in risk pool")]
    InsufficientFunds,
    
    #[msg("Deadline not passed yet")]
    DeadlineNotPassed,
    
    #[msg("Payment already confirmed")]
    PaymentAlreadyConfirmed,
    
    #[msg("Payment already claimed")]
    PaymentAlreadyClaimed,
    
    #[msg("Invalid job type")]
    InvalidJobType,
    
    #[msg("Invalid industry")]
    InvalidIndustry,
    
    #[msg("Coverage amount too low")]
    CoverageTooLow,
    
    #[msg("Coverage amount too high")]
    CoverageTooHigh,
    
    #[msg("Period too short")]
    PeriodTooShort,
    
    #[msg("Period too long")]
    PeriodTooLong,
    
    #[msg("Insurance program is paused")]
    ProgramPaused,
    
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Too frequent update")]
    TooFrequentUpdate,
    
    #[msg("Invalid policy status")]
    InvalidPolicyStatus,
}

