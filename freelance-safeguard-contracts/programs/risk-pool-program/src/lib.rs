use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_spl::token::{self, Token, TokenAccount};
use crate::utils::{calculate_reserve_ratio, calculate_percentage};

mod domain_integration;
mod reputation_integration;
mod utils;

declare_id!("2nxmHdqSuwVoyae1PpKRgJrKPTVPy59crNJZnqXNbVL2");

// Constants for calculations
pub const BASIS_POINTS_DIVISOR: u16 = 10000;
pub const PERCENTAGE_DIVISOR: u8 = 100;
pub const DEFAULT_PREMIUM_TO_CLAIMS_RATIO: u16 = 100; // Default 100% (1:1 ratio)
pub const DEFAULT_TARGET_RESERVE_RATIO: u8 = 150; // Default 150% (1.5x coverage)
pub const MAX_RESERVE_RATIO: u8 = 255;

/// Risk pool program for FreelanceShield
#[program]
pub mod risk_pool_program {
    use super::*;

    /// Initialize a new risk pool
    pub fn initialize_risk_pool(
        ctx: Context<InitializeRiskPool>,
        claims_processor_id: Pubkey,
        insurance_program_id: Pubkey,
        target_reserve_ratio: u8,
        premium_to_claims_ratio: u16,
    ) -> Result<()> {
        let risk_pool_state = &mut ctx.accounts.risk_pool_state;
        
        // Set the authority
        risk_pool_state.authority = ctx.accounts.authority.key();
        
        // Set the secondary authority
        risk_pool_state.secondary_authority = ctx.accounts.authority.key();
        
        // Set the claims processor ID
        risk_pool_state.claims_processor_id = claims_processor_id;
        
        // Set the insurance program ID
        risk_pool_state.insurance_program_id = insurance_program_id;
        
        // Set the target reserve ratio
        require!(target_reserve_ratio > 0 && target_reserve_ratio <= 100, RiskPoolError::InvalidAmount);
        risk_pool_state.target_reserve_ratio = target_reserve_ratio;
        
        // Set the premium to claims ratio
        require!(premium_to_claims_ratio > 0, RiskPoolError::InvalidAmount);
        risk_pool_state.premium_to_claims_ratio = premium_to_claims_ratio;
        
        // Set default values
        risk_pool_state.total_capital = 0;
        risk_pool_state.total_coverage_liability = 0;
        risk_pool_state.total_premiums = 0;
        risk_pool_state.total_claims_paid = 0;
        risk_pool_state.risk_buffer_percentage = 10; // Default 10% buffer
        risk_pool_state.is_paused = false;
        risk_pool_state.is_processing_external_call = false;
        risk_pool_state.is_capital_adequate = true;
        risk_pool_state.capital_adequacy_ratio = 100;
        risk_pool_state.last_adequacy_check = 0;
        
        // Store the bump
        risk_pool_state.bump = ctx.bumps.risk_pool_state;
        
        msg!("Risk pool initialized with target reserve ratio: {}%", target_reserve_ratio);
        
        Ok(())
    }

    pub fn deposit_capital(ctx: Context<DepositCapital>, amount: u64) -> Result<()> {
        // Validate the amount
        require!(amount > 0, RiskPoolError::InvalidAmount);
        
        // Store account info first to avoid borrow conflicts
        let risk_pool_account_info = ctx.accounts.risk_pool_state.to_account_info();
        let risk_pool_token_account_info = ctx.accounts.risk_pool_token_account.to_account_info();
        let depositor_token_account_info = ctx.accounts.depositor_token_account.to_account_info();
        let token_program_info = ctx.accounts.token_program.to_account_info();
        let depositor_key = ctx.accounts.depositor.key();
        
        // Now get the mutable reference to risk pool state
        let risk_pool_state = &mut ctx.accounts.risk_pool_state;
        
        // Transfer tokens from depositor to risk pool
        token::transfer(
            CpiContext::new(
                token_program_info,
                token::Transfer {
                    from: depositor_token_account_info,
                    to: risk_pool_token_account_info,
                    authority: ctx.accounts.depositor.to_account_info(),
                },
            ),
            amount,
        )?;
        
        // Calculate the new total capital
        let new_total_capital = risk_pool_state.total_capital
            .checked_add(amount)
            .ok_or(RiskPoolError::ArithmeticError)?;
        
        // Update the risk pool state
        risk_pool_state.total_capital = new_total_capital;
        
        // Calculate the reserve ratio if there's coverage liability
        let has_liability = risk_pool_state.total_coverage_liability > 0;
        let total_coverage_liability = risk_pool_state.total_coverage_liability;
        let target_reserve_ratio = risk_pool_state.target_reserve_ratio;
        
        let reserve_ratio = if has_liability {
            calculate_reserve_ratio(
                risk_pool_state.total_capital,
                total_coverage_liability,
                target_reserve_ratio,
            )?
        } else {
            100 // No liability means 100% reserve ratio
        };
        
        // Emit the event
        emit!(CapitalDeposited {
            depositor: depositor_key,
            amount,
            total_capital: risk_pool_state.total_capital,
            reserve_ratio,
        });
        
        msg!("Capital deposited: {}", amount);
        
        Ok(())
    }

    pub fn withdraw_capital(ctx: Context<WithdrawCapital>, amount: u64) -> Result<()> {
        // Validate the amount
        require!(amount > 0, RiskPoolError::InvalidAmount);
        
        // Store account info first to avoid borrow conflicts
        let risk_pool_account_info = ctx.accounts.risk_pool_state.to_account_info();
        let risk_pool_token_account_info = ctx.accounts.risk_pool_token_account.to_account_info();
        let withdrawer_token_account_info = ctx.accounts.withdrawer_token_account.to_account_info();
        let token_program_info = ctx.accounts.token_program.to_account_info();
        let withdrawer_key = ctx.accounts.withdrawer.key();
        
        // Now get the mutable reference to risk pool state
        let risk_pool_state = &mut ctx.accounts.risk_pool_state;
        
        // Check if there's enough capital to withdraw
        require!(
            risk_pool_state.total_capital >= amount,
            RiskPoolError::InsufficientCapital
        );
        
        // Calculate the new total capital
        let new_total_capital = risk_pool_state.total_capital
            .checked_sub(amount)
            .ok_or(RiskPoolError::ArithmeticError)?;
        
        // Check if the withdrawal would violate the reserve ratio
        let has_liability = risk_pool_state.total_coverage_liability > 0;
        let total_coverage_liability = risk_pool_state.total_coverage_liability;
        let target_reserve_ratio = risk_pool_state.target_reserve_ratio;
        
        if has_liability {
            // Calculate the minimum capital required based on the target reserve ratio
            let min_required_capital = calculate_percentage(
                total_coverage_liability,
                target_reserve_ratio as u16,
            )?;
            
            // Add the risk buffer
            let buffer_amount = calculate_percentage(
                min_required_capital,
                risk_pool_state.risk_buffer_percentage as u16,
            )?;
            
            let min_capital_with_buffer = min_required_capital
                .checked_add(buffer_amount)
                .ok_or(RiskPoolError::ArithmeticError)?;
            
            // Check if the new total capital would be below the minimum required
            require!(
                new_total_capital >= min_capital_with_buffer,
                RiskPoolError::ReserveRatioViolation
            );
            
            // Calculate the new reserve ratio
            let _reserve_ratio = calculate_reserve_ratio(
                new_total_capital,
                total_coverage_liability,
                target_reserve_ratio,
            )?;
        }
        
        // Update the risk pool state first to avoid reentrancy issues
        risk_pool_state.total_capital = new_total_capital;
        
        // Store the bump for later use
        let bump = risk_pool_state.bump;
        
        // Transfer tokens from risk pool to withdrawer
        token::transfer(
            CpiContext::new_with_signer(
                token_program_info,
                token::Transfer {
                    from: risk_pool_token_account_info,
                    to: withdrawer_token_account_info,
                    authority: risk_pool_account_info,
                },
                &[&[
                    b"risk-pool-state",
                    &[bump],
                ]],
            ),
            amount,
        )?;
        
        // Calculate the reserve ratio for the event
        let reserve_ratio = if has_liability {
            calculate_reserve_ratio(
                new_total_capital,
                total_coverage_liability,
                target_reserve_ratio,
            )?
        } else {
            100 // No liability means 100% reserve ratio
        };
        
        // Emit the event
        emit!(CapitalWithdrawn {
            withdrawer: withdrawer_key,
            amount,
            total_capital: new_total_capital,
            reserve_ratio,
        });
        
        msg!("Capital withdrawn: {}", amount);
        
        Ok(())
    }

    pub fn update_coverage_liability(
        ctx: Context<UpdateCoverageLiability>,
        new_liability: u64,
        is_increase: bool,
    ) -> Result<()> {
        let risk_pool_state = &mut ctx.accounts.risk_pool_state;
        
        // Validate caller is authorized
        require!(
            ctx.accounts.authority.key() == risk_pool_state.authority || 
            ctx.accounts.authority.key() == risk_pool_state.insurance_program_id,
            RiskPoolError::InvalidAccount
        );
        
        // Update total coverage liability
        if is_increase {
            risk_pool_state.total_coverage_liability += new_liability;
        } else {
            risk_pool_state.total_coverage_liability = risk_pool_state.total_coverage_liability.saturating_sub(new_liability);
        }
        
        // Recalculate reserve ratio
        if risk_pool_state.total_coverage_liability > 0 {
            let _reserve_ratio = calculate_reserve_ratio(risk_pool_state.total_capital, risk_pool_state.total_coverage_liability, risk_pool_state.target_reserve_ratio)?;
        }
        
        msg!("Coverage liability updated");
        Ok(())
    }

    pub fn record_premium(
        ctx: Context<RecordPremium>,
        amount: u64,
    ) -> Result<()> {
        let risk_pool_state = &mut ctx.accounts.risk_pool_state;
        
        // Validate amount
        require!(amount > 0, RiskPoolError::InvalidAmount);
        
        // Validate authority
        require!(
            ctx.accounts.payer.key() == risk_pool_state.authority,
            RiskPoolError::InvalidAccount
        );
        
        // Record premium in risk pool state
        risk_pool_state.total_premiums = risk_pool_state.total_premiums.checked_add(amount)
            .ok_or(RiskPoolError::ArithmeticError)?;
        
        msg!("Premium recorded: {}", amount);
        Ok(())
    }

    pub fn record_claim_payment(
        ctx: Context<RecordClaimPayment>,
        amount: u64,
    ) -> Result<()> {
        let risk_pool_state = &mut ctx.accounts.risk_pool_state;
        
        // Validate caller is authorized
        require!(
            ctx.accounts.authority.key() == risk_pool_state.authority || 
            ctx.accounts.authority.key() == risk_pool_state.claims_processor_id,
            RiskPoolError::InvalidAccount
        );
        
        // Update total claims paid
        risk_pool_state.total_claims_paid = risk_pool_state.total_claims_paid.checked_add(amount)
            .ok_or(RiskPoolError::ArithmeticError)?;
        
        msg!("Claim payment recorded: {}", amount);
        Ok(())
    }

    pub fn update_risk_parameters(
        ctx: Context<UpdateRiskParameters>,
        target_reserve_ratio: Option<u8>,
        risk_buffer_percentage: Option<u8>,
        is_paused: Option<bool>,
    ) -> Result<()> {
        let risk_pool_state = &mut ctx.accounts.risk_pool_state;
        
        // Validate primary authority is authorized
        require!(
            ctx.accounts.authority.key() == risk_pool_state.authority,
            RiskPoolError::InvalidAccount
        );
        
        // Validate secondary authority is authorized
        require!(
            ctx.accounts.secondary_authority.key() == risk_pool_state.secondary_authority,
            RiskPoolError::InvalidSecondaryAuthority
        );
        
        // Update parameters if provided
        if let Some(ratio) = target_reserve_ratio {
            require!(ratio > 0 && ratio <= 100, RiskPoolError::InvalidReserveRatio);
            risk_pool_state.target_reserve_ratio = ratio;
        }
        
        if let Some(buffer) = risk_buffer_percentage {
            require!(buffer > 0 && buffer <= 100, RiskPoolError::InvalidAmount);
            risk_pool_state.risk_buffer_percentage = buffer;
        }
        
        if let Some(paused) = is_paused {
            risk_pool_state.is_paused = paused;
        }
        
        msg!("Risk parameters updated with multi-signature approval");
        Ok(())
    }

    pub fn get_public_risk_pool_metrics(ctx: Context<GetPublicRiskPoolMetrics>) -> Result<()> {
        let risk_pool_state = &ctx.accounts.risk_pool_state;
        
        // Log metrics for consumption by client
        msg!("Risk Pool Metrics:");
        msg!("Total Capital: {}", risk_pool_state.total_capital);
        msg!("Total Coverage Liability: {}", risk_pool_state.total_coverage_liability);
        msg!("Target Reserve Ratio: {}", risk_pool_state.target_reserve_ratio);
        msg!("Total Premiums: {}", risk_pool_state.total_premiums);
        msg!("Total Claims Paid: {}", risk_pool_state.total_claims_paid);
        msg!("Premium to Claims Ratio: {}", risk_pool_state.premium_to_claims_ratio);
        
        // Return success
        Ok(())
    }

    pub fn process_domain_premium(ctx: Context<RecordDomainPremium>, amount: u64) -> Result<()> {
        let risk_pool_state = &mut ctx.accounts.risk_pool_state;
        
        // Validate amount
        require!(amount > 0, RiskPoolError::InvalidAmount);
        
        // Record premium in risk pool state
        risk_pool_state.total_premiums = risk_pool_state.total_premiums.checked_add(amount)
            .ok_or(RiskPoolError::ArithmeticError)?;
        
        // Validate the domain treasury is owned by the core program
        require!(
            *ctx.accounts.domain_treasury.owner == ctx.accounts.core_program.key(),
            RiskPoolError::InvalidAccount
        );
        
        msg!("Domain premium recorded: {}", amount);
        Ok(())
    }

    pub fn verify_capital_adequacy(
        ctx: Context<VerifyCapitalAdequacy>,
    ) -> Result<()> {
        let risk_pool_state = &mut ctx.accounts.risk_pool_state;
        let clock = Clock::get()?;
        
        // Calculate required capital based on total coverage liability and target reserve ratio
        let required_capital = (risk_pool_state.total_coverage_liability)
            .checked_mul(risk_pool_state.target_reserve_ratio as u64)
            .ok_or(RiskPoolError::ArithmeticError)?
            .checked_div(PERCENTAGE_DIVISOR as u64)
            .ok_or(RiskPoolError::ArithmeticError)?;
        
        // Check if current capital is sufficient
        let is_capital_adequate = risk_pool_state.total_capital >= required_capital;
        
        // Calculate capital adequacy ratio (scaled by 100 for percentage)
        let capital_adequacy_ratio = if required_capital > 0 {
            (risk_pool_state.total_capital)
                .checked_mul(100)
                .ok_or(RiskPoolError::ArithmeticError)?
                .checked_div(required_capital)
                .ok_or(RiskPoolError::ArithmeticError)?
        } else {
            // If no liability, capital is more than adequate
            100
        };
        
        // Update capital adequacy status
        risk_pool_state.is_capital_adequate = is_capital_adequate;
        risk_pool_state.capital_adequacy_ratio = capital_adequacy_ratio as u16;
        risk_pool_state.last_adequacy_check = clock.unix_timestamp;
        
        // Emit event with capital adequacy status
        emit!(CapitalAdequacyChecked {
            is_adequate: is_capital_adequate,
            capital_adequacy_ratio: capital_adequacy_ratio as u16,
            total_capital: risk_pool_state.total_capital,
            required_capital,
            timestamp: clock.unix_timestamp,
        });
        
        // Return error if capital is inadequate
        if !is_capital_adequate {
            msg!("Capital adequacy check failed: Current capital {} is less than required capital {}", 
                 risk_pool_state.total_capital, required_capital);
            return Err(error!(RiskPoolError::InsufficientCapital));
        }
        
        msg!("Capital adequacy verified: Ratio {}%", capital_adequacy_ratio);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeRiskPool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + RiskPoolState::SIZE,
        seeds = [b"risk_pool_state"],
        bump
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct DepositCapital<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"risk_pool_state"],
        bump = risk_pool_state.bump,
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    #[account(
        init_if_needed,
        payer = depositor,
        space = CapitalProvider::LEN,
        seeds = [b"capital_provider", depositor.key().as_ref()],
        bump
    )]
    pub capital_provider: Account<'info, CapitalProvider>,
    
    #[account(
        mut,
        constraint = depositor_token_account.owner == depositor.key() @ RiskPoolError::InvalidAccount,
        constraint = depositor_token_account.mint == risk_pool_token_account.mint @ RiskPoolError::InvalidAccount
    )]
    pub depositor_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"risk_pool_token_account"],
        bump,
    )]
    pub risk_pool_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct WithdrawCapital<'info> {
    #[account(mut)]
    pub withdrawer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"risk_pool_state"],
        bump = risk_pool_state.bump,
        constraint = !risk_pool_state.is_processing_external_call @ RiskPoolError::ReentrancyDetected
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    #[account(
        mut,
        seeds = [b"capital_provider", withdrawer.key().as_ref()],
        bump = capital_provider.bump,
        constraint = capital_provider.provider == withdrawer.key() @ RiskPoolError::InvalidAccount
    )]
    pub capital_provider: Account<'info, CapitalProvider>,
    
    #[account(
        mut,
        constraint = withdrawer_token_account.owner == withdrawer.key()
    )]
    pub withdrawer_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub risk_pool_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateCoverageLiability<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"risk_pool_state"],
        bump = risk_pool_state.bump,
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct RecordPremium<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"risk_pool_state"],
        bump = risk_pool_state.bump,
        constraint = !risk_pool_state.is_processing_external_call @ RiskPoolError::ReentrancyDetected
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    #[account(mut)]
    pub risk_pool_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RecordClaimPayment<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"risk_pool_state"],
        bump = risk_pool_state.bump,
        constraint = authority.key() == risk_pool_state.authority || authority.key() == risk_pool_state.claims_processor_id
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    #[account(mut)]
    pub risk_pool_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateRiskParameters<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub secondary_authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"risk_pool_state"],
        bump = risk_pool_state.bump,
        constraint = !risk_pool_state.is_paused @ RiskPoolError::InvalidAccount
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetPublicRiskPoolMetrics<'info> {
    #[account(mut)]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct RecordDomainPremium<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"risk_pool_state"],
        bump = risk_pool_state.bump,
        constraint = !risk_pool_state.is_processing_external_call @ RiskPoolError::ReentrancyDetected,
        constraint = !risk_pool_state.is_paused @ RiskPoolError::InvalidAccount
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    /// CHECK: Validated in the function
    pub domain_treasury: AccountInfo<'info>,
    
    /// CHECK: Used for validation only
    pub core_program: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyCapitalAdequacy<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"risk_pool_state"],
        bump = risk_pool_state.bump,
        constraint = !risk_pool_state.is_paused @ RiskPoolError::InvalidAccount
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct RiskPoolState {
    /// Authority allowed to manage the risk pool
    pub authority: Pubkey,
    
    /// Secondary authority for multi-sig operations
    pub secondary_authority: Pubkey,
    
    /// Claims processor program ID
    pub claims_processor_id: Pubkey,
    
    /// Insurance program ID
    pub insurance_program_id: Pubkey,
    
    /// Total capital in the risk pool
    pub total_capital: u64,
    
    /// Total coverage liability
    pub total_coverage_liability: u64,
    
    /// Total premiums collected
    pub total_premiums: u64,
    
    /// Total claims paid
    pub total_claims_paid: u64,
    
    /// Target reserve ratio (percentage)
    pub target_reserve_ratio: u8,
    
    /// Premium to claims ratio (percentage)
    pub premium_to_claims_ratio: u16,
    
    /// Risk buffer percentage
    pub risk_buffer_percentage: u8,
    
    /// Is the program paused
    pub is_paused: bool,
    
    /// Reentrancy guard
    pub is_processing_external_call: bool,
    
    /// Capital adequacy status
    pub is_capital_adequate: bool,
    
    /// Capital adequacy ratio (percentage * 100)
    pub capital_adequacy_ratio: u16,
    
    /// Last capital adequacy check timestamp
    pub last_adequacy_check: i64,
    
    /// PDA bump
    pub bump: u8,
}

impl RiskPoolState {
    pub const SIZE: usize = 32 + // authority
                            32 + // secondary_authority
                            32 + // claims_processor_id
                            32 + // insurance_program_id
                            8 +  // total_capital
                            8 +  // total_coverage_liability
                            8 +  // total_premiums
                            8 +  // total_claims_paid
                            1 +  // target_reserve_ratio
                            2 +  // premium_to_claims_ratio
                            1 +  // risk_buffer_percentage
                            1 +  // is_paused
                            1 +  // is_processing_external_call
                            1 +  // is_capital_adequate
                            2 +  // capital_adequacy_ratio
                            8 +  // last_adequacy_check
                            1;   // bump
}

#[account]
#[derive(Default)]
pub struct CapitalProvider {
    pub provider: Pubkey,
    pub deposited_amount: u64,
    pub last_deposit_timestamp: i64,
    pub bump: u8,
}

impl CapitalProvider {
    pub const LEN: usize = 32 + // provider
                            8 +  // deposited_amount
                            8 +  // last_deposit_timestamp
                            1;   // bump
}

#[error_code]
pub enum RiskPoolError {
    #[msg("Invalid amount")]
    InvalidAmount,
    
    #[msg("Insufficient capital")]
    InsufficientCapital,
    
    #[msg("Insufficient reserve ratio")]
    InsufficientReserveRatio,
    
    #[msg("Invalid account")]
    InvalidAccount,
    
    #[msg("Arithmetic error")]
    ArithmeticError,
    
    #[msg("Invalid risk pool state")]
    InvalidRiskPoolState,
    
    #[msg("Invalid reserve ratio")]
    InvalidReserveRatio,
    
    #[msg("Invalid premium to claims ratio")]
    InvalidPremiumToClaimsRatio,
    
    #[msg("Reentrancy detected")]
    ReentrancyDetected,
    
    #[msg("Reserve ratio violation")]
    ReserveRatioViolation,
    
    #[msg("Invalid secondary authority")]
    InvalidSecondaryAuthority,
}

#[event]
pub struct CapitalDeposited {
    pub depositor: Pubkey,
    pub amount: u64,
    pub total_capital: u64,
    pub reserve_ratio: u8,
}

#[event]
pub struct CapitalWithdrawn {
    pub withdrawer: Pubkey,
    pub amount: u64,
    pub total_capital: u64,
    pub reserve_ratio: u8,
}

#[event]
pub struct CapitalAdequacyChecked {
    pub is_adequate: bool,
    pub capital_adequacy_ratio: u16,
    pub total_capital: u64,
    pub required_capital: u64,
    pub timestamp: i64,
}
