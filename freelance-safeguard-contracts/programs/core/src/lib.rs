use anchor_lang::prelude::*;

// Import submodules
pub mod instructions;
pub mod state;
pub mod utils;
pub mod error_helpers;
pub mod cpi_validation;
pub mod interfaces;
pub mod adapters;

// Re-export important structs for easier imports in clients
// Use specific imports instead of glob imports to avoid ambiguity
pub use instructions::{
    claim::{
        arbitrate::ArbitrateClaim,
        dispute::DisputeClaim,
        pay::PayClaim,
        process::ProcessClaim,
        submit::SubmitClaim,
        vote::VoteOnClaim,
    },
    policy::{
        cancel::CancelPolicy,
        purchase::PurchasePolicy,
    },
    product::{
        create::CreateProduct,
        update::UpdateProduct,
    },
    program::{
        initialize::Initialize,
        update::UpdateProgramParameters,
    },
    risk::{
        deposit::DepositCapital,
        initialize::InitializeRiskPool,
        simulate::SimulateRisk,
        update::UpdateRiskMetrics,
        withdraw::WithdrawCapital,
    },
    treasury::{
        initialize::InitializeDomainTreasury,
        update::UpdateDomainTreasury,
        send_payment::SendPremiumToRiskPool,
    },
    reputation::{
        fetch_ethos_score::FetchEthosScore,
        simulate_ethos_reputation::SimulateEthosReputation,
    },
};

// Import parameter structs with specific namespaces
pub use state::params::*;
pub use state::product::Product;
pub use state::policy::Policy;
pub use state::claim::Claim;
pub use state::risk_pool::RiskPool;
pub use state::program_state::ProgramState;
pub use state::feature_flags::FeatureFlags;

// Add explicit exports for utility modules
pub use crate::error_helpers::*;
pub use crate::cpi_validation::*;

// Export interfaces and adapters for client use
pub use interfaces::reputation::{ReputationProvider, ReputationScore, ReputationFactors};
pub use interfaces::authentication::{AuthenticationProvider, AuthorityLevel, AuthContext, AuthMetadata};
pub use adapters::{get_reputation_provider, get_auth_provider};

// Program ID - this will be updated once deployed
declare_id!("VLemBYrguAkGx1NUpviKW5epn9zJRTLKvfEzmVvpupD");

const TIMELOCK_DURATION: i64 = 60 * 60 * 24; // 1 day

#[program]
pub mod freelance_shield_core {
    use super::*;

    // ===== PROGRAM INITIALIZATION =====
    
    /// Initialize the core program settings
    pub fn initialize(
        ctx: Context<Initialize>,
        params: InitializeParams,
    ) -> Result<()> {
        instructions::program::initialize::handler(ctx, params)
    }
    
    // ===== COVER/PRODUCT MANAGEMENT =====
    
    /// Create a new insurance product
    pub fn create_product(
        ctx: Context<CreateProduct>,
        params: CreateProductParams,
    ) -> Result<()> {
        instructions::product::create::handler(ctx, params)
    }
    
    /// Update an existing insurance product
    pub fn update_product(
        ctx: Context<UpdateProduct>,
        params: UpdateProductParams,
    ) -> Result<()> {
        instructions::product::update::handler(ctx, params)
    }
    
    // ===== POLICY MANAGEMENT =====
    
    /// Purchase a new insurance policy
    pub fn purchase_policy(
        ctx: Context<PurchasePolicy>,
        params: PurchasePolicyParams,
    ) -> Result<()> {
        instructions::policy::purchase::handler(ctx, params)
    }
    
    /// Cancel an existing policy with refund calculation
    pub fn cancel_policy(
        ctx: Context<CancelPolicy>,
    ) -> Result<()> {
        instructions::policy::cancel::handler(ctx)
    }
    
    // ===== CLAIMS MANAGEMENT =====
    
    /// Submit a new insurance claim
    pub fn submit_claim(
        ctx: Context<SubmitClaim>,
        params: SubmitClaimParams,
    ) -> Result<()> {
        instructions::claim::submit::handler(ctx, params)
    }
    
    /// Vote on a pending claim (for community governance)
    pub fn vote_on_claim(
        ctx: Context<VoteOnClaim>,
        params: VoteOnClaimParams,
    ) -> Result<()> {
        instructions::claim::vote::handler(ctx, params)
    }
    
    /// Process a claim (admin decision)
    pub fn process_claim(
        ctx: Context<ProcessClaim>,
        approved: bool,
        reason: String,
    ) -> Result<()> {
        instructions::claim::process::handler(ctx, approved, reason)
    }
    
    /// Pay an approved claim
    pub fn pay_claim(
        ctx: Context<PayClaim>,
        transaction_signature: Option<String>,
    ) -> Result<()> {
        // Add reentrancy check
        let claim = &mut ctx.accounts.claim;
        require!(!claim.is_processing, FreelanceShieldError::ReentrancyDetected);
        
        // Set processing flag to prevent reentrancy
        claim.is_processing = true;
        
        let result = instructions::claim::pay::handler(ctx, transaction_signature);
        
        // Reset processing flag regardless of result
        claim.is_processing = false;
        
        result
    }
    
    /// Arbitrate a disputed claim
    pub fn arbitrate_claim(
        ctx: Context<ArbitrateClaim>,
        approved: bool,
        reason: String,
    ) -> Result<()> {
        instructions::claim::arbitrate::handler(ctx, approved, reason)
    }
    
    /// Dispute a claim
    pub fn dispute_claim(
        ctx: Context<DisputeClaim>,
        reason: String,
    ) -> Result<()> {
        instructions::claim::dispute::handler(ctx, reason)
    }
    
    // ===== RISK POOL MANAGEMENT =====
    
    /// Initialize a new risk pool
    pub fn initialize_risk_pool(
        ctx: Context<InitializeRiskPool>,
        params: InitializeRiskPoolParams,
    ) -> Result<()> {
        instructions::risk::initialize::handler(ctx, params)
    }
    
    /// Deposit capital into a risk pool
    pub fn deposit_capital(
        ctx: Context<DepositCapital>,
        amount: u64,
    ) -> Result<()> {
        instructions::risk::deposit::handler(ctx, amount)
    }
    
    /// Withdraw capital from a risk pool
    pub fn withdraw_capital(
        ctx: Context<WithdrawCapital>,
        amount: u64,
    ) -> Result<()> {
        instructions::risk::withdraw::handler(ctx, amount)
    }
    
    /// Update risk metrics
    pub fn update_risk_metrics(
        ctx: Context<UpdateRiskMetrics>,
        params: UpdateRiskMetricsParams,
    ) -> Result<()> {
        instructions::risk::update::handler(ctx, params)
    }
    
    /// Simulate risk for a policy
    pub fn simulate_risk(
        ctx: Context<SimulateRisk>,
        params: SimulateRiskParams,
    ) -> Result<()> {
        instructions::risk::simulate::handler(ctx, params)
    }
    
    // ===== TREASURY MANAGEMENT =====
    
    /// Initialize a domain treasury
    pub fn initialize_domain_treasury(
        ctx: Context<InitializeDomainTreasury>,
        domain: String,
        bump: u8,
    ) -> Result<()> {
        instructions::treasury::initialize::handler(ctx, domain, bump)
    }
    
    /// Update a domain treasury
    pub fn update_domain_treasury(
        ctx: Context<UpdateDomainTreasury>,
        params: UpdateDomainTreasuryParams,
    ) -> Result<()> {
        instructions::treasury::update::handler(ctx, params)
    }
    
    /// Send premium to risk pool
    pub fn send_premium_to_risk_pool(
        ctx: Context<SendPremiumToRiskPool>,
        amount: u64,
    ) -> Result<()> {
        instructions::treasury::send_payment::handler(ctx, amount)
    }
    
    // ===== PROGRAM MANAGEMENT =====
    
    /// Update program parameters
    pub fn update_program_parameters(
        ctx: Context<UpdateProgramParameters>,
        params: UpdateProgramParametersParams,
    ) -> Result<()> {
        instructions::program::update::handler(ctx, params)
    }
    
    // ===== FEATURE FLAG MANAGEMENT =====
    
    /// Enable a feature flag
    pub fn enable_feature(
        ctx: Context<UpdateProgramParameters>,
        feature: String,
    ) -> Result<()> {
        // Verify authority
        require!(
            ctx.accounts.program_state.authority == ctx.accounts.authority.key(),
            FreelanceShieldError::Unauthorized
        );
        
        // Enable the feature
        ctx.accounts.program_state.enable_feature(&feature)?;
        
        Ok(())
    }
    
    /// Disable a feature flag
    pub fn disable_feature(
        ctx: Context<UpdateProgramParameters>,
        feature: String,
    ) -> Result<()> {
        // Verify authority
        require!(
            ctx.accounts.program_state.authority == ctx.accounts.authority.key(),
            FreelanceShieldError::Unauthorized
        );
        
        // Disable the feature
        ctx.accounts.program_state.disable_feature(&feature)?;
        
        Ok(())
    }
    
    // ===== ETHOS REPUTATION INTEGRATION =====
    
    /// Fetch a user's Ethos reputation score
    pub fn fetch_ethos_score(
        ctx: Context<FetchEthosScore>,
        params: FetchEthosScoreParams,
    ) -> Result<()> {
        instructions::reputation::fetch_ethos_score::handler(ctx, params)
    }
    
    /// Simulate Ethos reputation changes
    pub fn simulate_ethos_reputation(
        ctx: Context<SimulateEthosReputation>,
        params: SimulateEthosReputationParams,
    ) -> Result<()> {
        instructions::reputation::simulate_ethos_reputation::handler(ctx, params)
    }
}

// Error handling
#[error_code]
pub enum FreelanceShieldError {
    #[msg("Program is paused")]
    ProgramPaused,
    
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Invalid parameter")]
    InvalidParameter,
    
    // Program errors
    #[msg("Program already initialized")]
    ProgramAlreadyInitialized,
    
    // Product errors
    #[msg("Product not found")]
    ProductNotFound,
    
    #[msg("Product already exists")]
    ProductAlreadyExists,
    
    #[msg("Product not active")]
    ProductNotActive,
    
    #[msg("Invalid product parameters")]
    InvalidProductParameters,
    
    // Policy errors
    #[msg("Policy not found")]
    PolicyNotFound,
    
    #[msg("Policy already exists")]
    PolicyAlreadyExists,
    
    #[msg("Policy not active")]
    PolicyNotActive,
    
    #[msg("Policy expired")]
    PolicyExpired,
    
    #[msg("Policy not in claim pending status")]
    PolicyNotInClaimPending,
    
    #[msg("Invalid coverage amount")]
    InvalidCoverageAmount,
    
    #[msg("Invalid coverage period")]
    InvalidCoveragePeriod,
    
    #[msg("Invalid project details")]
    InvalidProjectDetails,
    
    #[msg("Invalid client details")]
    InvalidClientDetails,
    
    #[msg("Insufficient premium amount")]
    InsufficientPremiumAmount,
    
    // Claim errors
    #[msg("Claim not found")]
    ClaimNotFound,
    
    #[msg("Claim already exists")]
    ClaimAlreadyExists,
    
    #[msg("Claim not pending vote")]
    ClaimNotPendingVote,
    
    #[msg("Claim not approved")]
    ClaimNotApproved,
    
    #[msg("Claim not rejected")]
    ClaimNotRejected,
    
    #[msg("Claim cannot be processed")]
    ClaimCannotBeProcessed,
    
    #[msg("Claim not in arbitration")]
    ClaimNotInArbitration,
    
    #[msg("Invalid claim amount")]
    InvalidClaimAmount,
    
    #[msg("Claim amount too small (must be at least 1% of coverage amount)")]
    ClaimAmountTooSmall,
    
    #[msg("Invalid claim description")]
    InvalidClaimDescription,
    
    #[msg("Invalid evidence hash")]
    InvalidEvidenceHash,
    
    #[msg("Too many evidence attachments")]
    TooManyEvidenceAttachments,
    
    #[msg("Invalid vote reason")]
    InvalidVoteReason,
    
    #[msg("Already voted on this claim")]
    AlreadyVoted,
    
    #[msg("Voting period ended")]
    VotingPeriodEnded,
    
    #[msg("Dispute period ended")]
    DisputePeriodEnded,
    
    #[msg("Invalid reason")]
    InvalidReason,
    
    // Risk pool errors
    #[msg("Risk pool paused")]
    RiskPoolPaused,
    
    #[msg("Invalid deposit amount")]
    InvalidDepositAmount,
    
    #[msg("Invalid withdrawal amount")]
    InvalidWithdrawalAmount,
    
    #[msg("Insufficient balance")]
    InsufficientBalance,
    
    #[msg("Withdrawal exceeds available capital")]
    WithdrawalExceedsAvailableCapital,
    
    #[msg("Invalid allocation percentages")]
    InvalidAllocationPercentages,
    
    #[msg("Invalid risk parameter")]
    InvalidRiskParameter,
    
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    
    // Token errors
    #[msg("Token transfer failed")]
    TokenTransferFailed,
    
    #[msg("Invalid token account owner")]
    InvalidTokenAccountOwner,
    
    #[msg("Insufficient funds for token transfer")]
    InsufficientFundsForTokenTransfer,
    
    #[msg("Token account mismatch")]
    TokenAccountMismatch,
    
    // Domain treasury errors
    #[msg("Treasury address mismatch")]
    TreasuryAddressMismatch,
    
    #[msg("Domain too long")]
    DomainTooLong,
    
    #[msg("Invalid protocol domain")]
    InvalidProtocolDomain,
    
    #[msg("Domain treasury already initialized")]
    DomainTreasuryAlreadyInitialized,
    
    #[msg("Invalid risk pool account")]
    InvalidRiskPoolAccount,
    
    // Additional error variants needed for policy renewal and claims
    #[msg("Product is inactive")]
    ProductInactive,
    
    #[msg("Policy cannot be renewed")]
    PolicyCannotBeRenewed,
    
    #[msg("Invalid period for policy")]
    InvalidPeriod,
    
    #[msg("Claim period has ended")]
    ClaimPeriodEnded,
    
    #[msg("Invalid evidence type")]
    InvalidEvidenceType,
    
    #[msg("Invalid evidence description")]
    InvalidEvidenceDescription,
    
    // Product-specific errors
    #[msg("Invalid product name")]
    InvalidProductName,
    
    #[msg("Invalid product description")]
    InvalidProductDescription,
    
    #[msg("Product already active")]
    ProductAlreadyActive,
    
    #[msg("Product already inactive")]
    ProductAlreadyInactive,
    
    #[msg("Invalid policy details")]
    InvalidPolicyDetails,
    
    // General errors
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Insufficient funds")]
    InsufficientFunds,
    
    // Additional error variants for risk calculations and cross-program invocations
    #[msg("Risk pool not initialized")]
    RiskPoolNotInitialized,
    
    #[msg("Risk pool already initialized")]
    RiskPoolAlreadyInitialized,
    
    #[msg("Invalid risk simulation parameters")]
    InvalidRiskSimulationParameters,
    
    #[msg("Risk calculation failed")]
    RiskCalculationFailed,
    
    #[msg("Cross-program invocation failed")]
    CrossProgramInvocationFailed,
    
    #[msg("Serialization error")]
    SerializationError,
    
    #[msg("Deserialization error")]
    DeserializationError,
    
    #[msg("Reentrancy detected")]
    ReentrancyDetected,
    
    #[msg("Timelock not expired")]
    TimelockNotExpired,
}
