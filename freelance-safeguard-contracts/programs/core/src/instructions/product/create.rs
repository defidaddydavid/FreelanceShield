use anchor_lang::prelude::*;
use crate::state::*;
use crate::FreelanceShieldError;

/// Accounts for creating a new insurance product
#[derive(Accounts)]
pub struct CreateProduct<'info> {
    /// Program authority
    #[account(
        constraint = program_state.authority == authority.key() @ FreelanceShieldError::Unauthorized
    )]
    pub authority: Signer<'info>,
    
    /// Program state PDA
    #[account(
        mut,
        seeds = [ProgramState::SEED_PREFIX],
        bump = program_state.bump,
        constraint = !program_state.is_paused @ FreelanceShieldError::ProgramPaused
    )]
    pub program_state: Account<'info, ProgramState>,
    
    /// Product account PDA
    #[account(
        init,
        payer = authority,
        space = Product::SIZE,
        seeds = [Product::SEED_PREFIX, &product_id.key().to_bytes()],
        bump
    )]
    pub product: Account<'info, Product>,
    
    /// Product ID (unique identifier)
    /// This can be a PDA or a regular keypair
    pub product_id: AccountInfo<'info>,
    
    /// System program
    pub system_program: Program<'info, System>,
}

/// Create a new insurance product
pub fn handler(ctx: Context<CreateProduct>, params: CreateProductParams) -> Result<()> {
    let clock = Clock::get()?;
    let product = &mut ctx.accounts.product;
    let program_state = &mut ctx.accounts.program_state;
    
    // Validate product parameters
    require!(
        params.name.len() <= Product::MAX_NAME_LENGTH,
        FreelanceShieldError::InvalidProductName
    );
    
    require!(
        params.description.len() <= Product::MAX_DESCRIPTION_LENGTH,
        FreelanceShieldError::InvalidProductDescription
    );
    
    require!(
        params.min_coverage_amount >= program_state.min_coverage_amount,
        FreelanceShieldError::InvalidCoverageAmount
    );
    
    require!(
        params.max_coverage_amount <= program_state.max_coverage_amount,
        FreelanceShieldError::InvalidCoverageAmount
    );
    
    require!(
        params.min_period_days >= program_state.min_period_days,
        FreelanceShieldError::InvalidPeriod
    );
    
    require!(
        params.max_period_days <= program_state.max_period_days,
        FreelanceShieldError::InvalidPeriod
    );
    
    // Initialize product
    product.authority = ctx.accounts.authority.key();
    product.product_id = ctx.accounts.product_id.key();
    product.name = params.name;
    product.description = params.description;
    product.product_type = params.product_type;
    product.min_coverage_amount = params.min_coverage_amount;
    product.max_coverage_amount = params.max_coverage_amount;
    product.min_period_days = params.min_period_days;
    product.max_period_days = params.max_period_days;
    product.base_premium_rate = params.base_premium_rate;
    product.risk_adjustment_factor = params.risk_adjustment_factor;
    product.active = true;
    product.creation_date = clock.unix_timestamp;
    product.last_update_date = clock.unix_timestamp;
    product.policies_issued = 0;
    product.total_coverage = 0;
    product.total_premiums = 0;
    product.claims_count = 0;
    product.claims_paid_amount = 0;
    product.loss_ratio = 0;
    product.bump = *ctx.bumps.get("product").unwrap();
    
    // Update program state
    program_state.total_products += 1;
    
    msg!("Insurance product created: {}", product.name);
    Ok(())
}
