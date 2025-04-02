use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use solana_program::pubkey::Pubkey;

/// Domain state account to store on-chain treasury address data
#[account]
pub struct DomainTreasury {
    /// Authority that can update the treasury address
    pub authority: Pubkey,
    /// Current treasury address for SOL payments
    pub sol_treasury: Pubkey,
    /// Current treasury address for USDC payments
    pub usdc_treasury: Pubkey,
    /// The domain name this treasury is associated with
    pub domain: String,
    /// Last time this account was updated
    pub last_updated: i64,
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl DomainTreasury {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // sol_treasury
        32 + // usdc_treasury
        4 + 64 + // domain (string with max length)
        8 + // last_updated
        1; // bump
}

/// Update the domain treasury accounts with new wallet addresses
#[derive(Accounts)]
pub struct UpdateDomainTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"domain-treasury", domain_treasury.domain.as_bytes()],
        bump = domain_treasury.bump,
        constraint = domain_treasury.authority == authority.key() @ ErrorCode::UnauthorizedAccess
    )]
    pub domain_treasury: Account<'info, DomainTreasury>,
    
    pub system_program: Program<'info, System>,
}

/// Initialize a new domain treasury account
#[derive(Accounts)]
#[instruction(domain: String, bump: u8)]
pub struct InitializeDomainTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = DomainTreasury::LEN,
        seeds = [b"domain-treasury", domain.as_bytes()],
        bump
    )]
    pub domain_treasury: Account<'info, DomainTreasury>,
    
    pub system_program: Program<'info, System>,
}

/// Send funds to the protocol treasury using domain resolution
#[derive(Accounts)]
pub struct SendToTreasury<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        seeds = [b"domain-treasury", domain_treasury.domain.as_bytes()],
        bump = domain_treasury.bump
    )]
    pub domain_treasury: Account<'info, DomainTreasury>,
    
    /// The treasury wallet that will receive the payment
    /// This can be either SOL or USDC treasury depending on the transaction
    #[account(mut)]
    pub treasury_wallet: UncheckedAccount<'info>,
    
    /// Token account to transfer from (for USDC payments)
    #[account(mut)]
    pub token_from: Option<Account<'info, TokenAccount>>,
    
    /// Token account to transfer to (for USDC payments)
    #[account(mut)]
    pub token_to: Option<Account<'info, TokenAccount>>,
    
    pub token_program: Option<Program<'info, Token>>,
    pub system_program: Program<'info, System>,
}

/// Error codes for domain treasury operations
#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access to domain treasury")]
    UnauthorizedAccess,
    #[msg("Invalid treasury address")]
    InvalidTreasuryAddress,
    #[msg("Domain name too long")]
    DomainTooLong,
    #[msg("Treasury address mismatch")]
    TreasuryMismatch,
}

/// Implementation of domain treasury functionality
pub mod domain_treasury {
    use super::*;

    /// Initialize a new domain treasury account
    pub fn initialize_domain_treasury(
        ctx: Context<InitializeDomainTreasury>,
        domain: String,
        sol_treasury: Pubkey,
        usdc_treasury: Pubkey,
        bump: u8,
    ) -> Result<()> {
        if domain.len() > 64 {
            return err!(ErrorCode::DomainTooLong);
        }
        
        let domain_treasury = &mut ctx.accounts.domain_treasury;
        domain_treasury.authority = ctx.accounts.authority.key();
        domain_treasury.sol_treasury = sol_treasury;
        domain_treasury.usdc_treasury = usdc_treasury;
        domain_treasury.domain = domain;
        domain_treasury.last_updated = Clock::get()?.unix_timestamp;
        domain_treasury.bump = bump;
        
        Ok(())
    }
    
    /// Update the domain treasury addresses
    pub fn update_domain_treasury(
        ctx: Context<UpdateDomainTreasury>,
        sol_treasury: Option<Pubkey>,
        usdc_treasury: Option<Pubkey>,
    ) -> Result<()> {
        let domain_treasury = &mut ctx.accounts.domain_treasury;
        
        if let Some(sol_address) = sol_treasury {
            domain_treasury.sol_treasury = sol_address;
        }
        
        if let Some(usdc_address) = usdc_treasury {
            domain_treasury.usdc_treasury = usdc_address;
        }
        
        domain_treasury.last_updated = Clock::get()?.unix_timestamp;
        
        Ok(())
    }
    
    /// Send SOL to the protocol treasury
    pub fn send_sol_to_treasury(ctx: Context<SendToTreasury>, amount: u64) -> Result<()> {
        let payer = &ctx.accounts.payer;
        let treasury_wallet = &ctx.accounts.treasury_wallet;
        let domain_treasury = &ctx.accounts.domain_treasury;
        
        // Verify the treasury wallet matches the one in domain_treasury
        if treasury_wallet.key() != domain_treasury.sol_treasury {
            return err!(ErrorCode::TreasuryMismatch);
        }
        
        // Transfer SOL to treasury
        let ix = solana_program::system_instruction::transfer(
            &payer.key(),
            &treasury_wallet.key(),
            amount,
        );
        
        solana_program::program::invoke(
            &ix,
            &[
                payer.to_account_info(),
                treasury_wallet.to_account_info(),
            ],
        )?;
        
        Ok(())
    }
    
    /// Send USDC to the protocol treasury
    pub fn send_usdc_to_treasury(ctx: Context<SendToTreasury>, amount: u64) -> Result<()> {
        let token_from = ctx.accounts.token_from.as_ref()
            .ok_or(ErrorCode::InvalidTreasuryAddress)?;
        let token_to = ctx.accounts.token_to.as_ref()
            .ok_or(ErrorCode::InvalidTreasuryAddress)?;
        let token_program = ctx.accounts.token_program.as_ref()
            .ok_or(ErrorCode::InvalidTreasuryAddress)?;
        let domain_treasury = &ctx.accounts.domain_treasury;
        
        // Verify the treasury wallet matches the one in domain_treasury
        if token_to.owner != domain_treasury.usdc_treasury {
            return err!(ErrorCode::TreasuryMismatch);
        }
        
        // Transfer USDC to treasury
        let cpi_accounts = Transfer {
            from: token_from.to_account_info(),
            to: token_to.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new(
            token_program.to_account_info(),
            cpi_accounts,
        );
        
        token::transfer(cpi_ctx, amount)?;
        
        Ok(())
    }
}
