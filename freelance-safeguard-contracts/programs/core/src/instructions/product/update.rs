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
        seeds = [Product::SEED_PREFIX, &product.product_id.to_bytes()],
        bump = product.bump
    )]
    pub product: Account<'info, Product>,
}

/// Update an existing insurance product
pub fn handler(ctx: Context<UpdateProduct>, params: UpdateProductParams) -> Result<()> {
    let clock = Clock::get()?;
    let product = &mut ctx.accounts.product;
    let program_state = &ctx.accounts.program_state;
    
    // Update product fields if provided
    if let Some(name) = params.name {
        require!(
            name.len() <= Product::MAX_NAME_LENGTH,
            FreelanceShieldError::InvalidProductName
        );
        product.name = name;
    }
    
    if let Some(description) = params.description {
        require!(
            description.len() <= Product::MAX_DESCRIPTION_LENGTH,
            FreelanceShieldError::InvalidProductDescription
        );
        product.description = description;
    }
    
    if let Some(min_coverage_amount) = params.min_coverage_amount {
        require!(
            min_coverage_amount >= program_state.min_coverage_amount,
            FreelanceShieldError::InvalidCoverageAmount
        );
        product.min_coverage_amount = min_coverage_amount;
    }
    
    if let Some(max_coverage_amount) = params.max_coverage_amount {
        require!(
            max_coverage_amount <= program_state.max_coverage_amount,
            FreelanceShieldError::InvalidCoverageAmount
        );
        product.max_coverage_amount = max_coverage_amount;
    }
    
    if let Some(min_period_days) = params.min_period_days {
        require!(
            min_period_days >= program_state.min_period_days,
            FreelanceShieldError::InvalidPeriod
        );
        product.min_period_days = min_period_days;
    }
    
    if let Some(max_period_days) = params.max_period_days {
        require!(
            max_period_days <= program_state.max_period_days,
            FreelanceShieldError::InvalidPeriod
        );
        product.max_period_days = max_period_days;
    }
    
    if let Some(base_premium_rate) = params.base_premium_rate {
        product.base_premium_rate = base_premium_rate;
    }
    
    if let Some(risk_adjustment_factor) = params.risk_adjustment_factor {
        product.risk_adjustment_factor = risk_adjustment_factor;
    }
    
    // Update timestamp
    product.last_update_date = clock.unix_timestamp;
    
    msg!("Insurance product updated: {}", product.name);
    Ok(())
}
