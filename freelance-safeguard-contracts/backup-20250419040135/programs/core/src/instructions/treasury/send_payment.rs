use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::domain_treasury::DomainTreasury;
use anchor_lang::solana_program::program::invoke;

#[derive(Accounts)]
pub struct SendSolPayment<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        seeds = [
            DomainTreasury::DOMAIN_TREASURY_SEED.as_bytes(),
            domain_treasury.domain.as_bytes()
        ],
        bump = domain_treasury.bump
    )]
    pub domain_treasury: Account<'info, DomainTreasury>,
    
    /// The actual treasury wallet that will receive SOL
    #[account(
        mut,
        constraint = treasury_wallet.key() == domain_treasury.sol_treasury @ FreelanceShieldError::TreasuryAddressMismatch
    )]
    pub treasury_wallet: SystemAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SendPremiumToRiskPool<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        seeds = [
            DomainTreasury::DOMAIN_TREASURY_SEED.as_bytes(),
            domain_treasury.domain.as_bytes()
        ],
        bump = domain_treasury.bump
    )]
    pub domain_treasury: Account<'info, DomainTreasury>,
    
    /// The risk pool account that will receive the premium payment
    #[account(mut)]
    pub risk_pool_account: UncheckedAccount<'info>,
    
    /// USDC token account of the payer
    #[account(mut)]
    pub token_from: Account<'info, TokenAccount>,
    
    /// USDC token account of the risk pool
    #[account(
        mut,
        constraint = token_to.owner == risk_pool_account.key() @ FreelanceShieldError::InvalidTokenAccount
    )]
    pub token_to: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Send SOL to the protocol treasury at freelanceshield.xyz
pub fn send_sol_payment(ctx: Context<SendSolPayment>, amount: u64) -> Result<()> {
    let payer = &ctx.accounts.payer;
    let treasury_wallet = &ctx.accounts.treasury_wallet;
    
    msg!("Sending {} SOL to protocol treasury at {}", 
        amount as f64 / 1_000_000_000.0, 
        ctx.accounts.domain_treasury.domain
    );
    
    // Create transfer instruction
    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &payer.key(),
        &treasury_wallet.key(),
        amount,
    );
    
    // Execute the transfer
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            payer.to_account_info(),
            treasury_wallet.to_account_info(),
        ],
    )?;
    
    msg!("Payment of {} SOL sent to treasury", amount as f64 / 1_000_000_000.0);
    
    Ok(())
}

/// Send a premium payment to the risk pool program using the domain integration
/// This routes the payment through the domain.xyz resolver to the appropriate risk pool program
pub fn send_premium_payment(ctx: Context<SendPremiumToRiskPool>, amount: u64) -> Result<()> {
    let payer = &ctx.accounts.payer;
    let domain_treasury = &ctx.accounts.domain_treasury;
    let token_from = &ctx.accounts.token_from;
    let token_to = &ctx.accounts.token_to;
    
    // Verify the risk pool account matches the one in domain_treasury
    require!(
        ctx.accounts.risk_pool_account.key() == domain_treasury.risk_pool,
        FreelanceShieldError::InvalidRiskPoolAccount
    );
    
    msg!("Sending {} USDC premium payment to FreelanceShield risk pool via {}", 
        amount as f64 / 1_000_000.0, 
        domain_treasury.domain
    );
    
    // Create the CPI context for token transfer
    let cpi_accounts = Transfer {
        from: token_from.to_account_info(),
        to: token_to.to_account_info(),
        authority: payer.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    // Execute the transfer
    token::transfer(cpi_ctx, amount)?;
    
    msg!("Premium payment of {} USDC sent to risk pool", amount as f64 / 1_000_000.0);
    
    Ok(())
}
