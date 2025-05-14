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
        seeds = [Product::SEED_PREFIX],
        bump
    )]
    pub product: Account<'info, Product>,
    
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
        params.product_name.len() <= MAX_PRODUCT_NAME_LENGTH,
        FreelanceShieldError::InvalidProductName
    );
    
    require!(
        params.product_description.len() <= MAX_PRODUCT_DESCRIPTION_LENGTH,
        FreelanceShieldError::InvalidProductDescription
    );
    
    // Initialize product
    product.authority = ctx.accounts.authority.key();
    product.product_name = params.product_name;
    product.product_description = params.product_description;
    product.product_type = params.product_type;
    product.risk_factor = params.risk_factor;
    product.premium_multiplier = params.premium_multiplier;
    product.min_stake_to_capital_ratio = params.min_stake_to_capital_ratio;
    product.cover_terms = params.cover_terms;
    product.active = true;
    product.min_period_days = 30; // Set reasonable default values
    product.max_period_days = 365; // Set reasonable default values
    product.base_premium_rate = 100; // Set reasonable default values
    product.risk_adjustment_factor = 100; // Set reasonable default values
    product.active_policies = 0;
    product.total_coverage = 0;
    product.total_premiums = 0;
    product.claims_count = 0;
    product.claims_paid_amount = 0;
    product.loss_ratio = 0;
    product.min_coverage_amount = 100; // Set reasonable default minimum
    product.max_coverage_amount = 10000000; // Set reasonable default maximum
    product.created_at = clock.unix_timestamp;
    product.last_updated = clock.unix_timestamp;
    product.bump = *ctx.bumps.get("product").unwrap();
    
    // Update program state
    program_state.total_products += 1;
    
    msg!("Insurance product created: {}", product.product_name);
    Ok(())
}
