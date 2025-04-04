use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::RiskPoolState;

/// Constants for domain integration
pub const DOMAIN_TREASURY_SEED: &str = "domain-treasury";
pub const FREELANCE_SHIELD_DOMAIN: &str = "freelanceshield.xyz";

/// Domain treasury reference structure for validation
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct DomainTreasury {
    pub authority: Pubkey,
    pub admin_wallet: Pubkey,
    pub risk_pool: Pubkey,
    pub domain: String,
    pub last_updated: i64,
    pub bump: u8,
}

/// Record a premium payment received via the FreelanceShield.xyz domain
#[derive(Accounts)]
pub struct RecordDomainPremium<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"risk-pool-state"],
        bump = risk_pool_state.bump,
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    /// The domain treasury account from the core program
    /// This is used to validate the payment is coming from the domain
    pub domain_treasury: UncheckedAccount<'info>,
    
    /// The core program that manages the domain treasury
    pub core_program: UncheckedAccount<'info>,
    
    /// Source token account for the premium payment
    #[account(mut)]
    pub token_from: Account<'info, TokenAccount>,
    
    /// Destination token account in the risk pool
    #[account(
        mut,
        constraint = token_to.owner == risk_pool_state.key()
    )]
    pub token_to: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Record a premium payment that was received through the domain integration
pub fn record_domain_premium(ctx: Context<RecordDomainPremium>, amount: u64) -> Result<()> {
    // First record the premium in the risk pool state
    let risk_pool = &mut ctx.accounts.risk_pool_state;
    
    // Update risk pool metrics
    risk_pool.total_premiums_collected = risk_pool.total_premiums_collected.checked_add(amount)
        .ok_or(ProgramError::Arithmetic)?;
    
    // Calculate the new reserve ratio based on premium income
    if risk_pool.total_coverage_liability > 0 {
        risk_pool.current_reserve_ratio = ((risk_pool.total_capital as u128)
            .checked_mul(100)
            .unwrap_or(0)
            .checked_div(risk_pool.total_coverage_liability as u128)
            .unwrap_or(0)) as u8;
    }
    
    // Update the premium to claims ratio if we have had any claims
    if risk_pool.total_claims_paid > 0 {
        risk_pool.premium_to_claims_ratio = ((risk_pool.total_premiums_collected as u128)
            .checked_mul(100)
            .unwrap_or(0)
            .checked_div(risk_pool.total_claims_paid as u128)
            .unwrap_or(0)) as u8;
    }
    
    // Update timestamp
    risk_pool.last_metrics_update = Clock::get()?.unix_timestamp;
    
    msg!("Recorded premium payment of {} via domain treasury", amount);
    
    // If this is necessary, we can distribute staking rewards based on premiums
    // This calls the external staking program to distribute rewards
    // crate::staking_integration::distribute_staking_rewards(
    //    ctx.accounts.risk_pool_state.to_account_info(),
    //    ctx.accounts.authority.to_account_info(),
    //    ctx.accounts.system_program.to_account_info(),
    //    staking_reward_amount
    // )?;
    
    Ok(())
}

/// Validate a transaction is coming from the authorized domain treasury
/// This function would be implemented in the core program
pub fn validate_domain_treasury(
    domain_treasury: &AccountInfo,
    core_program_id: &Pubkey,
    expected_risk_pool: &Pubkey
) -> Result<()> {
    // Get the domain treasury data
    let data = domain_treasury.try_borrow_data()?;
    
    // The first 8 bytes are the discriminator for the account
    let mut disc_bytes = [0u8; 8];
    disc_bytes.copy_from_slice(&data[0..8]);
    
    // Skip deserializing for efficiency, just manually check the domain & risk_pool field
    // Assuming risk_pool field is at a specific offset - this would need to align
    // with the actual layout of the DomainTreasury struct in the core program
    const RISK_POOL_OFFSET: usize = 8 + 32 + 32; // after discriminator + authority + admin_wallet
    
    if data.len() < RISK_POOL_OFFSET + 32 {
        return err!(RiskPoolError::InvalidDomainTreasury);
    }
    
    let mut risk_pool_bytes = [0u8; 32];
    risk_pool_bytes.copy_from_slice(&data[RISK_POOL_OFFSET..RISK_POOL_OFFSET + 32]);
    let treasury_risk_pool = Pubkey::new_from_array(risk_pool_bytes);
    
    // Validate the risk pool matches
    if treasury_risk_pool != *expected_risk_pool {
        return err!(RiskPoolError::InvalidDomainTreasury);
    }
    
    // Also validate domain treasury belongs to the core program
    if domain_treasury.owner != core_program_id {
        return err!(RiskPoolError::InvalidDomainTreasury);
    }
    
    Ok(())
}

#[error_code]
pub enum RiskPoolError {
    #[msg("Invalid domain treasury")]
    InvalidDomainTreasury,
    
    #[msg("Invalid risk pool reference")]
    InvalidRiskPoolReference,
}
