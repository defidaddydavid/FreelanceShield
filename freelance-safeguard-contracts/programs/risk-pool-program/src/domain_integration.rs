use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::RiskPoolState;
use crate::utils::{calculate_reserve_ratio, checked_percentage_of};

/// Constants for domain integration
pub const DOMAIN_TREASURY_SEED: &str = "domain-treasury";
pub const FREELANCE_SHIELD_DOMAIN: &str = "freelanceshield.xyz";

/// Domain treasury reference structure for validation
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct DomainTreasury {
    pub domain: Pubkey,
    pub treasury: Pubkey,
    pub bump: u8,
}

/// Record a premium payment received via the FreelanceShield.xyz domain
#[derive(Accounts)]
pub struct DomainPremiumRecord<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"risk_pool_state"],
        bump = risk_pool_state.bump,
        constraint = !risk_pool_state.is_processing_external_call @ crate::RiskPoolError::ReentrancyDetected
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    /// The domain treasury account from the core program
    /// This is used to validate the payment is coming from the domain
    pub domain_treasury: UncheckedAccount<'info>,
    
    /// The core program that manages the domain treasury
    pub core_program: UncheckedAccount<'info>,
    
    /// Source token account for the premium payment
    #[account(
        mut,
        constraint = token_from.owner == payer.key() @ crate::RiskPoolError::InvalidAccount
    )]
    pub token_from: Account<'info, TokenAccount>,
    
    /// Destination token account in the risk pool
    #[account(
        mut,
        constraint = token_to.owner == risk_pool_state.key() @ crate::RiskPoolError::InvalidAccount,
        constraint = token_to.mint == token_from.mint @ crate::RiskPoolError::InvalidAccount
    )]
    pub token_to: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Record a premium payment from the domain
pub fn record_domain_premium(ctx: Context<DomainPremiumRecord>, amount: u64) -> Result<()> {
    // Validate the domain treasury
    // This is a simplified validation - in production, you would validate the domain treasury
    // is actually associated with the FreelanceShield domain
    require!(
        *ctx.accounts.domain_treasury.owner == ctx.accounts.core_program.key(),
        crate::RiskPoolError::InvalidAccount
    );
    
    // Set the reentrancy guard
    let risk_pool_state = ctx.accounts.risk_pool_state.to_account_info();
    let mut data = risk_pool_state.data.borrow_mut();
    let is_processing_offset = 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 1; // Offset to is_processing_external_call
    data[is_processing_offset] = 1;
    
    // Transfer tokens from user to risk pool
    let cpi_accounts = Transfer {
        from: ctx.accounts.token_from.to_account_info(),
        to: ctx.accounts.token_to.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };
    
    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
    );
    
    token::transfer(cpi_ctx, amount)?;
    
    // Reset the reentrancy guard
    data[is_processing_offset] = 0;
    
    // Update risk pool state
    let risk_pool_state = &mut ctx.accounts.risk_pool_state;
    risk_pool_state.total_premiums = risk_pool_state.total_premiums.checked_add(amount)
        .ok_or(crate::RiskPoolError::ArithmeticError)?;
    
    // Calculate the new reserve ratio based on premium income
    if risk_pool_state.total_coverage_liability > 0 {
        risk_pool_state.current_reserve_ratio = calculate_reserve_ratio(
            risk_pool_state.total_capital,
            risk_pool_state.total_coverage_liability,
            risk_pool_state.target_reserve_ratio
        )?;
    }
    
    // Update the premium to claims ratio if we have had any claims
    if risk_pool_state.total_claims_paid > 0 {
        risk_pool_state.premium_to_claims_ratio = checked_percentage_of(
            risk_pool_state.total_premiums,
            risk_pool_state.total_claims_paid
        )?;
    }
    
    // Update timestamp
    risk_pool_state.last_metrics_update = Clock::get()?.unix_timestamp;
    
    msg!("Recorded premium payment of {} via domain treasury", amount);
    
    Ok(())
}

/// Validate a transaction is coming from the authorized domain treasury
/// This function would be implemented in the core program
pub fn validate_domain_treasury(
    domain_treasury: &AccountInfo,
    core_program_id: &Pubkey,
    expected_risk_pool: &Pubkey
) -> Result<()> {
    // Validate domain treasury belongs to the core program
    require!(
        domain_treasury.owner == core_program_id,
        DomainRiskPoolError::InvalidDomainTreasury
    );
    
    // Safely deserialize the domain treasury account
    let domain_treasury_data = domain_treasury.try_borrow_data()?;
    
    // Ensure there's enough data to deserialize
    require!(
        domain_treasury_data.len() >= 8, // At least discriminator
        DomainRiskPoolError::InvalidDomainTreasury
    );
    
    // Try to properly deserialize the account
    let mut data_slice: &[u8] = &domain_treasury_data;
    let domain_treasury_account = DomainTreasury::deserialize(&mut data_slice)?;
    
    // Validate the risk pool matches
    require!(
        domain_treasury_account.treasury == *expected_risk_pool,
        DomainRiskPoolError::InvalidRiskPoolReference
    );
    
    Ok(())
}

#[error_code]
pub enum DomainRiskPoolError {
    #[msg("Invalid domain treasury")]
    InvalidDomainTreasury,
    
    #[msg("Invalid risk pool reference")]
    InvalidRiskPoolReference,
    
    #[msg("Arithmetic operation failed")]
    ArithmeticError,
    
    #[msg("Invalid parameter")]
    InvalidParameter,
    
    #[msg("Reentrancy detected")]
    ReentrancyDetected,
    
    #[msg("Invalid account")]
    InvalidAccount,
    
    #[msg("Divide by zero")]
    DivideByZero,
    
    #[msg("Program is paused")]
    ProgramPaused,
    
    #[msg("Invalid amount")]
    InvalidAmount,
}
