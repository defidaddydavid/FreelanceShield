use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::utils::*;
use crate::FreelanceShieldError;
use crate::adapters::{get_auth_provider, get_reputation_provider};

/// Accounts for purchasing an insurance policy
#[derive(Accounts)]
pub struct PurchasePolicy<'info> {
    /// Policy purchaser
    #[account(mut)]
    pub owner: Signer<'info>,
    
    /// Program state PDA
    #[account(
        seeds = [ProgramState::SEED_PREFIX],
        bump = program_state.bump,
    )]
    pub program_state: Account<'info, ProgramState>,
    
    /// Product that the policy is for
    #[account(
        constraint = product.is_active @ FreelanceShieldError::InvalidProductStatus,
    )]
    pub product: Account<'info, Product>,
    
    /// Risk pool for the product
    #[account(
        mut,
        constraint = risk_pool.product == product.key() @ FreelanceShieldError::InvalidParameters,
    )]
    pub risk_pool: Account<'info, RiskPool>,
    
    /// Domain treasury for collecting fees
    #[account(
        mut,
        seeds = [
            DomainTreasury::DOMAIN_TREASURY_SEED.as_bytes(),
            product.domain.as_bytes(),
        ],
        bump = domain_treasury.bump,
    )]
    pub domain_treasury: Account<'info, DomainTreasury>,
    
    /// Protocol treasury for collecting protocol fees
    #[account(
        mut,
        constraint = program_state.treasury == protocol_treasury.key() @ FreelanceShieldError::InvalidParameters,
    )]
    pub protocol_treasury: SystemAccount<'info>,
    
    /// New policy account to be initialized
    #[account(
        init,
        payer = owner,
        space = Policy::SIZE,
        seeds = [
            Policy::SEED_PREFIX,
            owner.key().as_ref(),
            product.key().as_ref(),
        ],
        bump,
    )]
    pub policy: Account<'info, Policy>,
    
    /// Owner's token account for paying the premium
    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key() @ FreelanceShieldError::Unauthorized,
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    /// Risk pool token account for receiving the premium
    #[account(
        mut,
        constraint = risk_pool_token_account.owner == risk_pool.key() @ FreelanceShieldError::InvalidParameters,
    )]
    pub risk_pool_token_account: Account<'info, TokenAccount>,
    
    /// System program for creating the policy account
    pub system_program: Program<'info, System>,
    
    /// Token program for transferring the premium
    pub token_program: Program<'info, Token>,
}

/// Parameters for purchasing an insurance policy
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct PurchasePolicyParams {
    /// Coverage amount in lamports
    pub coverage_amount: u64,
    
    /// Duration of the policy in seconds
    pub duration: i64,
    
    /// Premium amount in tokens
    pub premium_amount: u64,
    
    /// Optional metadata for the policy
    pub metadata: Option<String>,
    
    /// Optional authentication metadata for Privy integration
    pub auth_metadata: Option<String>,
}

/// Purchase an insurance policy
pub fn handler(ctx: Context<PurchasePolicy>, params: PurchasePolicyParams) -> Result<()> {
    let policy = &mut ctx.accounts.policy;
    let product = &ctx.accounts.product;
    let risk_pool = &mut ctx.accounts.risk_pool;
    let domain_treasury = &mut ctx.accounts.domain_treasury;
    let owner = &ctx.accounts.owner;
    let program_state = &ctx.accounts.program_state;
    let clock = Clock::get()?;
    
    // Validate policy parameters
    require!(
        params.coverage_amount > 0 && 
        params.coverage_amount <= product.max_coverage,
        FreelanceShieldError::InvalidParameters
    );
    
    require!(
        params.duration >= product.min_duration && 
        params.duration <= product.max_duration,
        FreelanceShieldError::InvalidParameters
    );
    
    // Verify authentication using the abstraction layer
    // This will use either standard Solana auth or Privy based on feature flags
    let auth_provider = get_auth_provider();
    let has_permission = auth_provider.has_permission(&owner.key(), "purchase_policy")?;
    require!(has_permission, FreelanceShieldError::Unauthorized);
    
    // Calculate premium based on coverage, duration, and risk factors
    let premium_calculation = calculate_premium(
        params.coverage_amount,
        params.duration,
        product,
        risk_pool,
    )?;
    
    // Verify premium amount matches calculation
    require!(
        params.premium_amount >= premium_calculation.total_premium,
        FreelanceShieldError::InsufficientPremiumAmount
    );
    
    // Initialize policy data
    policy.owner = owner.key();
    policy.product = product.key();
    policy.coverage_amount = params.coverage_amount;
    policy.premium_amount = premium_calculation.total_premium;
    policy.start_date = clock.unix_timestamp;
    policy.end_date = clock.unix_timestamp + params.duration;
    policy.status = PolicyStatus::Active;
    policy.claims_count = 0;
    policy.active_claims_count = 0;
    policy.metadata = params.metadata;
    policy.bump = *ctx.bumps.get("policy").unwrap();
    
    // Transfer premium tokens
    let cpi_accounts = Transfer {
        from: ctx.accounts.owner_token_account.to_account_info(),
        to: ctx.accounts.risk_pool_token_account.to_account_info(),
        authority: owner.to_account_info(),
    };
    
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
    );
    
    token::transfer(cpi_ctx, premium_calculation.total_premium)?;
    
    // Update risk pool data
    risk_pool.total_policies += 1;
    risk_pool.active_policies += 1;
    risk_pool.total_coverage += params.coverage_amount;
    risk_pool.total_premiums += premium_calculation.total_premium;
    
    // Update domain treasury data
    domain_treasury.total_policies += 1;
    domain_treasury.total_premiums += premium_calculation.total_premium;
    
    // Update reputation data using the abstraction layer
    let reputation_provider = get_reputation_provider();
    reputation_provider.update_successful_transaction(&owner.key(), params.premium_amount)?;
    
    msg!("Policy purchased for product {} with coverage {}", product.key(), params.coverage_amount);
    
    Ok(())
}
