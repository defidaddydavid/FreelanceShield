use anchor_lang::prelude::*;
use crate::state::domain_treasury::DomainTreasury;

#[derive(Accounts)]
#[instruction(domain: String, bump: u8)]
pub struct InitializeDomainTreasury<'info> {
    /// The authority that will control this domain mapping (initially the deployer)
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// The domain treasury PDA that will store the protocol address mapping
    #[account(
        init,
        payer = authority,
        space = DomainTreasury::LEN,
        seeds = [DomainTreasury::DOMAIN_TREASURY_SEED.as_bytes(), domain.as_bytes()],
        bump
    )]
    pub domain_treasury: Account<'info, DomainTreasury>,
    
    pub system_program: Program<'info, System>,
}

/// Initialize domain mapping between freelanceshield.xyz and protocol addresses
/// This allows users to interact with the protocol using the domain name
pub fn handler(
    ctx: Context<InitializeDomainTreasury>,
    domain: String,
    admin_wallet: Pubkey,
    risk_pool_program_id: Pubkey,
    bump: u8,
) -> Result<()> {
    // Validate domain length
    require!(
        domain.len() <= DomainTreasury::MAX_DOMAIN_LENGTH,
        FreelanceShieldError::DomainTooLong
    );
    
    // Validate that domain matches our protocol domain
    require!(
        domain == DomainTreasury::PROTOCOL_DOMAIN,
        FreelanceShieldError::InvalidProtocolDomain
    );
    
    let domain_treasury = &mut ctx.accounts.domain_treasury;
    domain_treasury.authority = ctx.accounts.authority.key();
    domain_treasury.admin_wallet = admin_wallet;
    domain_treasury.risk_pool = risk_pool_program_id;
    domain_treasury.domain = domain;
    domain_treasury.last_updated = Clock::get()?.unix_timestamp;
    domain_treasury.bump = bump;
    
    msg!("Initialized domain mapping for {} to risk pool program {}", domain, risk_pool_program_id);
    
    Ok(())
}
