use anchor_lang::prelude::*;
use crate::state::*;
use crate::FreelanceShieldError;

/// Accounts for updating an insurance product
#[derive(Accounts)]
pub struct UpdateProduct<'info> {
    /// Program authority
    #[account(
        constraint = (program_state.authority == authority.key() || 
                     product.authority == authority.key()) 
                     @ FreelanceShieldError::Unauthorized
    )]
    pub authority: Signer<'info>,
    
    /// Program state PDA
    #[account(
        seeds = [ProgramState::SEED_PREFIX],
        bump = program_state.bump,
        constraint = !program_state.is_paused @ FreelanceShieldError::ProgramPaused
    )]
    pub program_state: Account<'info, ProgramState>,
    
    /// Product account PDA
    #[account(
        mut,
        seeds = [Product::SEED_PREFIX],
        bump = product.bump
    )]
    pub product: Account<'info, Product>,
}

/// Update an existing insurance product
pub fn handler(ctx: Context<UpdateProduct>, params: UpdateProductParams) -> Result<()> {
    let clock = Clock::get()?;
    let product = &mut ctx.accounts.product;
    
    // Update product fields if provided
    if let Some(product_name) = params.product_name {
        require!(
            product_name.len() <= Product::MAX_NAME_LENGTH,
            FreelanceShieldError::InvalidProductName
        );
        product.product_name = product_name;
    }
    
    if let Some(product_description) = params.product_description {
        require!(
            product_description.len() <= Product::MAX_DESCRIPTION_LENGTH,
            FreelanceShieldError::InvalidProductDescription
        );
        product.product_description = product_description;
    }
    
    if let Some(min_coverage_amount) = params.min_coverage_amount {
        require!(
            min_coverage_amount >= ctx.accounts.program_state.min_coverage_amount,
            FreelanceShieldError::InvalidCoverageAmount
        );
        product.min_coverage_amount = min_coverage_amount;
    }
    
    if let Some(max_coverage_amount) = params.max_coverage_amount {
        require!(
            max_coverage_amount <= ctx.accounts.program_state.max_coverage_amount,
            FreelanceShieldError::InvalidCoverageAmount
        );
        product.max_coverage_amount = max_coverage_amount;
    }
    
    if let Some(min_period_days) = params.min_period_days {
        require!(
            min_period_days >= ctx.accounts.program_state.min_period_days,
            FreelanceShieldError::InvalidPeriod
        );
        product.min_period_days = min_period_days;
    }
    
    if let Some(max_period_days) = params.max_period_days {
        require!(
            max_period_days <= ctx.accounts.program_state.max_period_days,
            FreelanceShieldError::InvalidPeriod
        );
        product.max_period_days = max_period_days;
    }
    
    if let Some(risk_factor) = params.risk_factor {
        product.risk_factor = risk_factor;
    }
    
    if let Some(premium_multiplier) = params.premium_multiplier {
        product.premium_multiplier = premium_multiplier;
    }
    
    if let Some(min_stake_to_capital_ratio) = params.min_stake_to_capital_ratio {
        product.min_stake_to_capital_ratio = min_stake_to_capital_ratio;
    }
    
    if let Some(cover_terms) = params.cover_terms {
        product.cover_terms = cover_terms;
    }
    
    if let Some(active) = params.active {
        product.active = active;
    }
    
    // Update timestamp
    product.last_updated = clock.unix_timestamp;
    
    msg!("Insurance product updated: {}", product.product_name);
    Ok(())
}
