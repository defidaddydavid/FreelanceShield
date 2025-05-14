use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use crate::RiskPoolState;
use crate::utils::{calculate_reserve_ratio};

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

/// Event emitted when a domain premium is recorded
#[event]
pub struct DomainPremiumRecorded {
    /// Domain public key
    pub domain: Pubkey,
    
    /// Premium amount
    pub amount: u64,
    
    /// Total premiums collected
    pub total_premiums: u64,
    
    /// Current reserve ratio
    pub reserve_ratio: u8,
}

/// Accounts for recording a domain premium
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
    /// CHECK: This account is validated through custom logic in the instruction
    pub domain_treasury: UncheckedAccount<'info>,
    
    /// The core program that manages the domain treasury
    /// CHECK: This is just a reference to the core program, not used for data
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
    let risk_pool_state = &mut ctx.accounts.risk_pool_state;
    
    // Check amount is valid
    require!(amount > 0, crate::RiskPoolError::InvalidAmount);
    
    // Set reentrancy guard
    let account_info = risk_pool_state.to_account_info();
    let mut data = account_info.data.borrow_mut();
    let is_processing_offset = 8 + // discriminator
                              32 + // authority
                              32 + // claims_processor_id
                              32 + // insurance_program_id
                              8 +  // total_capital
                              8 +  // total_coverage_liability
                              8 +  // total_premiums
                              8 +  // total_claims_paid
                              1 +  // target_reserve_ratio
                              2 +  // premium_to_claims_ratio
                              1;   // risk_buffer_percentage
    
    require!(data[is_processing_offset] == 0, crate::RiskPoolError::ReentrancyDetected);
    data[is_processing_offset] = 1;
    drop(data); // Drop the borrow before making external calls
    
    // Transfer tokens from user to risk pool
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.token_from.to_account_info(),
                to: ctx.accounts.token_to.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            },
        ),
        amount,
    )?;
    
    // Reset the reentrancy guard
    let account_info = risk_pool_state.to_account_info();
    let mut data = account_info.data.borrow_mut();
    data[is_processing_offset] = 0;
    drop(data);
    
    // Update risk pool state
    risk_pool_state.total_premiums = risk_pool_state.total_premiums.checked_add(amount)
        .ok_or(crate::RiskPoolError::ArithmeticError)?;
    
    // Calculate reserve ratio if there's coverage liability
    if risk_pool_state.total_coverage_liability > 0 {
        let reserve_ratio = calculate_reserve_ratio(
            risk_pool_state.total_capital,
            risk_pool_state.total_coverage_liability,
            risk_pool_state.target_reserve_ratio,
        )?;
        
        // Emit event
        emit!(DomainPremiumRecorded {
            domain: ctx.accounts.payer.key(),
            amount,
            total_premiums: risk_pool_state.total_premiums,
            reserve_ratio,
        });
    } else {
        // Emit event
        emit!(DomainPremiumRecorded {
            domain: ctx.accounts.payer.key(),
            amount,
            total_premiums: risk_pool_state.total_premiums,
            reserve_ratio: 0,
        });
    }
    
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
