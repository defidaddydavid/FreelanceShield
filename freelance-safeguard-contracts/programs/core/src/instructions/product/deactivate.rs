use anchor_lang::prelude::*;
use crate::state::*;
use crate::FreelanceShieldError;

/// Accounts for deactivating an insurance product
#[derive(Accounts)]
pub struct DeactivateProduct<'info> {
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
        bump = product.bump,
        constraint = product.active @ FreelanceShieldError::ProductAlreadyInactive
    )]
    pub product: Account<'info, Product>,
}

/// Deactivate an insurance product
pub fn handler(ctx: Context<DeactivateProduct>) -> Result<()> {
    let clock = Clock::get()?;
    let product = &mut ctx.accounts.product;
    
    // Deactivate the product
    product.active = false;
    product.last_update_date = clock.unix_timestamp;
    
    msg!("Insurance product deactivated: {}", product.name);
    Ok(())
}
