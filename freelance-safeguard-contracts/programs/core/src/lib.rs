use anchor_lang::prelude::*;

// Import submodules
pub mod instructions;
pub mod state;
pub mod utils;
pub mod error_helpers;

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
};

// Import parameter structs with specific namespaces
pub use state::params::*;
pub use state::product::Product;
pub use state::policy::Policy;
pub use state::claim::Claim;
pub use state::risk_pool::RiskPool;
pub use state::program_state::ProgramState;

// Program ID - this will be updated once deployed
declare_id!("71MWZDSCrSusXnwj42o4j6AfiZqQDPjVBLmQKtSoChZp");

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
        instructions::claim::pay::handler(ctx, transaction_signature)
    }
    
    /// Dispute a rejected claim
    pub fn dispute_claim(
        ctx: Context<DisputeClaim>,
        reason: String,
        new_evidence: Option<Vec<String>>,
    ) -> Result<()> {
        instructions::claim::dispute::handler(ctx, reason, new_evidence)
    }
    
    /// Arbitrate a disputed or complex claim
    pub fn arbitrate_claim(
        ctx: Context<ArbitrateClaim>,
        params: ArbitrateClaimParams, 
    ) -> Result<()> {
        instructions::claim::arbitrate::handler(ctx, params)
    }
    
    // ===== RISK MANAGEMENT =====
    
    /// Initialize the risk pool
    pub fn initialize_risk_pool(
        ctx: Context<InitializeRiskPool>,
        max_auto_approve_amount: u64,
        staking_allocation_percentage: u8,
        treasury_allocation_percentage: u8,
        treasury_wallet: Pubkey,
    ) -> Result<()> {
        instructions::risk::initialize_pool::handler(
            ctx,
            max_auto_approve_amount,
            staking_allocation_percentage,
            treasury_allocation_percentage,
            treasury_wallet
        )
    }
    
    /// Deposit capital to the risk pool
    pub fn deposit_capital(
        ctx: Context<DepositCapital>,
        params: DepositCapitalParams,
    ) -> Result<()> {
        instructions::risk::deposit::handler(ctx, params)
    }
    
    /// Withdraw capital from the risk pool
    pub fn withdraw_capital(
        ctx: Context<WithdrawCapital>,
        params: WithdrawCapitalParams,
    ) -> Result<()> {
        instructions::risk::withdraw::handler(ctx, params)
    }
    
    /// Run risk simulation
    pub fn run_risk_simulation(
        ctx: Context<SimulateRisk>,
        params: RiskSimulationParams,
    ) -> Result<()> {
        instructions::risk::simulate::handler(ctx, params)
    }
    
    /// Update risk metrics
    pub fn update_risk_metrics(
        ctx: Context<UpdateRiskMetrics>,
    ) -> Result<()> {
        instructions::risk::update_metrics::handler(ctx)
    }
    
    // ===== PROGRAM ADMINISTRATION =====
    
    /// Update core program parameters
    pub fn update_program_parameters(
        ctx: Context<UpdateProgramParameters>,
        params: UpdateProgramParamsParams,
    ) -> Result<()> {
        instructions::program::update::handler(ctx, params)
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
}
