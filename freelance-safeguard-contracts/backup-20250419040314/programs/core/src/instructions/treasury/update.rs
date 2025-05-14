use anchor_lang::prelude::*;
use crate::state::domain_treasury::DomainTreasury;

#[derive(Accounts)]
pub struct UpdateDomainTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [
            DomainTreasury::DOMAIN_TREASURY_SEED.as_bytes(),
            domain_treasury.domain.as_bytes()
        ],
        bump = domain_treasury.bump,
        constraint = domain_treasury.authority == authority.key() @ FreelanceShieldError::Unauthorized
    )]
    pub domain_treasury: Account<'info, DomainTreasury>,
    
    pub system_program: Program<'info, System>,
}

/// Update the domain treasury addresses for SOL and/or USDC
/// This allows the protocol to change treasury addresses while keeping the domain consistent
pub fn handler(
    ctx: Context<UpdateDomainTreasury>,
    sol_treasury: Option<Pubkey>,
    usdc_treasury: Option<Pubkey>,
) -> Result<()> {
    let domain_treasury = &mut ctx.accounts.domain_treasury;
    
    // Update SOL treasury if provided
    if let Some(sol_address) = sol_treasury {
        msg!("Updating SOL treasury address to {}", sol_address);
        domain_treasury.sol_treasury = sol_address;
    }
    
    // Update USDC treasury if provided
    if let Some(usdc_address) = usdc_treasury {
        msg!("Updating USDC treasury address to {}", usdc_address);
        domain_treasury.usdc_treasury = usdc_address;
    }
    
    // Update the last_updated timestamp
    domain_treasury.last_updated = Clock::get()?.unix_timestamp;
    
    msg!("Updated domain treasury for {}", domain_treasury.domain);
    
    Ok(())
}
