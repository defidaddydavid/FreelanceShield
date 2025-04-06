use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

mod domain_integration;
mod reputation_integration;
mod utils;

use utils::calculate_reserve_ratio;

declare_id!("4UFr2kyHQmr8efafSRDMT8NL3jsq8tPcx9qFEir3YFVH");

// Constants for calculations
pub const BASIS_POINTS_DIVISOR: u16 = 10000;
pub const PERCENTAGE_DIVISOR: u8 = 100;
pub const DEFAULT_PREMIUM_TO_CLAIMS_RATIO: u16 = 100; // Default 100% (1:1 ratio)
pub const DEFAULT_TARGET_RESERVE_RATIO: u8 = 150; // Default 150% (1.5x coverage)
pub const MAX_RESERVE_RATIO: u8 = 255;

#[program]
pub mod risk_pool_program {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        insurance_program_id: Pubkey,
        claims_processor_id: Pubkey,
        target_reserve_ratio: u8,
        min_capital_requirement: u64,
        risk_buffer_percentage: u8,
    ) -> Result<()> {
        let risk_pool_state = &mut ctx.accounts.risk_pool_state;
        risk_pool_state.authority = ctx.accounts.authority.key();
        risk_pool_state.insurance_program_id = insurance_program_id;
        risk_pool_state.claims_processor_id = claims_processor_id;
        risk_pool_state.target_reserve_ratio = target_reserve_ratio;
        risk_pool_state.min_capital_requirement = min_capital_requirement;
        risk_pool_state.risk_buffer_percentage = risk_buffer_percentage;
        risk_pool_state.total_capital = 0;
        risk_pool_state.total_coverage_liability = 0;
        risk_pool_state.current_reserve_ratio = 0;
        risk_pool_state.total_premiums = 0;
        risk_pool_state.total_claims_paid = 0;
        risk_pool_state.premium_to_claims_ratio = DEFAULT_PREMIUM_TO_CLAIMS_RATIO; // Default 100% (1:1 ratio)
        risk_pool_state.last_metrics_update = Clock::get()?.unix_timestamp;
        risk_pool_state.is_paused = false;
        risk_pool_state.is_processing_external_call = false;
        risk_pool_state.bump = ctx.bumps.risk_pool_state;
        risk_pool_state.expected_loss = 0;
        risk_pool_state.recommended_capital = 0;
        risk_pool_state.capital_adequacy = 0; // Changed from bool to u8
        risk_pool_state.policy_count = 0;
        risk_pool_state.reserved = [0; 31];
        
        msg!("Risk pool initialized");
        Ok(())
    }

    pub fn deposit_capital(
        ctx: Context<DepositCapital>,
        amount: u64,
    ) -> Result<()> {
        let risk_pool_state = &mut ctx.accounts.risk_pool_state;
        let capital_provider = &mut ctx.accounts.capital_provider;
        
        // Validate amount
        require!(amount > 0, RiskPoolError::InvalidAmount);
        
        // Set reentrancy guard
        risk_pool_state.is_processing_external_call = true;
        
        // Update capital provider data
        capital_provider.provider = ctx.accounts.provider.key();
        capital_provider.deposited_amount = capital_provider.deposited_amount.checked_add(amount)
            .ok_or(RiskPoolError::ArithmeticError)?;
        capital_provider.last_deposit_timestamp = Clock::get()?.unix_timestamp;
        capital_provider.bump = ctx.bumps.capital_provider;
        
        // Transfer tokens from provider to risk pool
        let cpi_accounts = Transfer {
            from: ctx.accounts.provider_token_account.to_account_info(),
            to: ctx.accounts.risk_pool_token_account.to_account_info(),
            authority: ctx.accounts.provider.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
        );
        
        token::transfer(cpi_ctx, amount)?;
        
        // Update risk pool state
        risk_pool_state.total_capital = risk_pool_state.total_capital.checked_add(amount)
            .ok_or(RiskPoolError::ArithmeticError)?;
        
        // Calculate new reserve ratio if there's coverage liability
        if risk_pool_state.total_coverage_liability > 0 {
            risk_pool_state.current_reserve_ratio = ((risk_pool_state.total_capital as u128 * 100) / risk_pool_state.total_coverage_liability as u128) as u8;
        }
        
        // Clear reentrancy guard
        risk_pool_state.is_processing_external_call = false;
        
        // Emit event
        emit!(CapitalDeposited {
            provider: ctx.accounts.provider.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("Capital deposited: {}", amount);
        Ok(())
    }

    pub fn withdraw_capital(
        ctx: Context<WithdrawCapital>,
        amount: u64,
    ) -> Result<()> {
        let risk_pool_state = &mut ctx.accounts.risk_pool_state;
        let capital_provider = &mut ctx.accounts.capital_provider;
        
        // Validate amount
        require!(
            amount > 0 && amount <= capital_provider.deposited_amount,
            RiskPoolError::InsufficientCapital
        );
        
        // Set reentrancy guard
        risk_pool_state.is_processing_external_call = true;
        
        // Check if withdrawal would breach reserve requirements
        let new_total_capital = risk_pool_state.total_capital.checked_sub(amount)
            .ok_or(RiskPoolError::ArithmeticError)?;
            
        // If there's coverage liability, ensure we maintain the target reserve ratio
        if risk_pool_state.total_coverage_liability > 0 {
            let new_reserve_ratio = ((new_total_capital as u128 * 100) / risk_pool_state.total_coverage_liability as u128) as u8;
            
            require!(
                new_reserve_ratio >= risk_pool_state.target_reserve_ratio,
                RiskPoolError::InsufficientLiquidity
            );
        }
        
        // Also ensure we maintain the minimum capital requirement
        require!(
            new_total_capital >= risk_pool_state.min_capital_requirement,
            RiskPoolError::InsufficientCapital
        );
        
        // Update capital provider data
        capital_provider.deposited_amount = capital_provider.deposited_amount.checked_sub(amount)
            .ok_or(RiskPoolError::ArithmeticError)?;
        
        // Transfer tokens from risk pool to provider
        let risk_pool_seeds = &[
            b"risk_pool_state".as_ref(),
            &[risk_pool_state.bump],
        ];
        
        let risk_pool_signer = &[&risk_pool_seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.risk_pool_token_account.to_account_info(),
            to: ctx.accounts.provider_token_account.to_account_info(),
            authority: risk_pool_state.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            risk_pool_signer,
        );
        
        token::transfer(cpi_ctx, amount)?;
        
        // Update risk pool state
        risk_pool_state.total_capital = risk_pool_state.total_capital.checked_sub(amount)
            .ok_or(RiskPoolError::ArithmeticError)?;
        
        // Calculate new reserve ratio if there's coverage liability
        if risk_pool_state.total_coverage_liability > 0 {
            risk_pool_state.current_reserve_ratio = ((risk_pool_state.total_capital as u128 * 100) / risk_pool_state.total_coverage_liability as u128) as u8;
        }
        
        // Clear reentrancy guard
        risk_pool_state.is_processing_external_call = false;
        
        // Emit event
        emit!(CapitalWithdrawn {
            provider: ctx.accounts.provider.key(),
            amount,
            timestamp: Clock::get()?.unix_timestamp,
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
            RiskPoolError::Unauthorized
        );
        
        // Update total coverage liability
        if is_increase {
            risk_pool_state.total_coverage_liability += new_liability;
        } else {
            risk_pool_state.total_coverage_liability = risk_pool_state.total_coverage_liability.saturating_sub(new_liability);
        }
        
        // Recalculate reserve ratio
        if risk_pool_state.total_coverage_liability > 0 {
            let reserve_ratio = calculate_reserve_ratio(risk_pool_state.total_capital, risk_pool_state.total_coverage_liability, risk_pool_state.target_reserve_ratio)?;
            risk_pool_state.current_reserve_ratio = reserve_ratio;
        } else {
            risk_pool_state.current_reserve_ratio = 100;
        }
        
        // Update metrics timestamp
        risk_pool_state.last_metrics_update = Clock::get()?.unix_timestamp;
        
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
            ctx.accounts.authority.key() == risk_pool_state.authority,
            RiskPoolError::Unauthorized
        );
        
        // Record premium in risk pool state
        risk_pool_state.total_premiums = risk_pool_state.total_premiums.checked_add(amount)
            .ok_or(RiskPoolError::ArithmeticError)?;
        risk_pool_state.policy_count = risk_pool_state.policy_count.checked_add(1)
            .ok_or(RiskPoolError::ArithmeticError)?;
            
        // Update risk metrics with simplified deterministic model
        let current_policies = risk_pool_state.policy_count;
        let avg_claim_frequency = 5; // Example value: 5% of policies result in claims
        let avg_claim_severity = 1000 * 1_000_000; // Example value: 1000 USDC average claim
        
        // Calculate expected loss
        let expected_loss = current_policies
            .checked_mul(avg_claim_severity)
            .and_then(|result| result.checked_mul(avg_claim_frequency as u64))
            .and_then(|result| result.checked_div(100)) // Convert from percentage
            .ok_or(RiskPoolError::ArithmeticError)?;
        
        // Update risk pool state with calculated metrics
        risk_pool_state.expected_loss = expected_loss;
        risk_pool_state.recommended_capital = expected_loss.saturating_mul(2); // 200% of expected loss
        
        // Calculate capital adequacy (as percentage)
        if expected_loss > 0 {
            risk_pool_state.capital_adequacy = (risk_pool_state.total_capital as u128)
                .checked_mul(100)
                .and_then(|result| result.checked_div(expected_loss as u128))
                .map(|result| if result > 255 { 255 } else { result as u8 })
                .unwrap_or(0);
        }
        
        // Update metrics timestamp
        risk_pool_state.last_metrics_update = Clock::get()?.unix_timestamp;
        
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
            RiskPoolError::Unauthorized
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
        min_capital_requirement: Option<u64>,
        risk_buffer_percentage: Option<u8>,
        is_paused: Option<bool>,
    ) -> Result<()> {
        let risk_pool_state = &mut ctx.accounts.risk_pool_state;
        
        // Validate caller is authorized
        require!(
            ctx.accounts.authority.key() == risk_pool_state.authority,
            RiskPoolError::Unauthorized
        );
        
        // Update parameters if provided
        if let Some(ratio) = target_reserve_ratio {
            require!(ratio > 0 && ratio <= 100, RiskPoolError::InvalidParameter);
            risk_pool_state.target_reserve_ratio = ratio;
        }
        
        if let Some(min_capital) = min_capital_requirement {
            risk_pool_state.min_capital_requirement = min_capital;
        }
        
        if let Some(buffer) = risk_buffer_percentage {
            require!(buffer > 0 && buffer <= 100, RiskPoolError::InvalidParameter);
            risk_pool_state.risk_buffer_percentage = buffer;
        }
        
        if let Some(paused) = is_paused {
            risk_pool_state.is_paused = paused;
        }
        
        msg!("Risk parameters updated");
        Ok(())
    }

    pub fn get_public_risk_pool_metrics(ctx: Context<GetPublicRiskPoolMetrics>) -> Result<()> {
        let risk_pool_state = &ctx.accounts.risk_pool_state;
        
        // Log metrics for consumption by client
        msg!("Risk Pool Metrics:");
        msg!("Total Capital: {}", risk_pool_state.total_capital);
        msg!("Total Coverage Liability: {}", risk_pool_state.total_coverage_liability);
        msg!("Current Reserve Ratio: {}", risk_pool_state.current_reserve_ratio);
        msg!("Target Reserve Ratio: {}", risk_pool_state.target_reserve_ratio);
        msg!("Total Premiums: {}", risk_pool_state.total_premiums);
        msg!("Total Claims Paid: {}", risk_pool_state.total_claims_paid);
        msg!("Premium to Claims Ratio: {}", risk_pool_state.premium_to_claims_ratio);
        msg!("Last Update: {}", risk_pool_state.last_metrics_update);
        msg!("Expected Loss: {}", risk_pool_state.expected_loss);
        msg!("Recommended Capital: {}", risk_pool_state.recommended_capital);
        msg!("Capital Adequacy: {}", risk_pool_state.capital_adequacy);
        
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
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + RiskPoolState::LEN,
        seeds = [b"risk_pool_state"],
        bump
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct DepositCapital<'info> {
    #[account(mut)]
    pub provider: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"risk_pool_state"],
        bump = risk_pool_state.bump,
        constraint = !risk_pool_state.is_processing_external_call @ RiskPoolError::ReentrancyDetected,
        constraint = !risk_pool_state.is_paused @ RiskPoolError::ProgramPaused
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    #[account(
        init_if_needed,
        payer = provider,
        space = 8 + CapitalProvider::LEN,
        seeds = [b"capital_provider", provider.key().as_ref()],
        bump
    )]
    pub capital_provider: Account<'info, CapitalProvider>,
    
    #[account(
        mut,
        constraint = provider_token_account.owner == provider.key() @ RiskPoolError::InvalidAccount,
        constraint = provider_token_account.mint == risk_pool_token_account.mint @ RiskPoolError::InvalidAccount
    )]
    pub provider_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = risk_pool_token_account.owner == risk_pool_state.key() @ RiskPoolError::InvalidAccount
    )]
    pub risk_pool_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct WithdrawCapital<'info> {
    #[account(mut)]
    pub provider: Signer<'info>,
    
    #[account(
        seeds = [b"risk_pool_state"],
        bump = risk_pool_state.bump,
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    #[account(
        mut,
        seeds = [b"capital_provider", provider.key().as_ref()],
        bump = capital_provider.bump,
        constraint = capital_provider.provider == provider.key(),
    )]
    pub capital_provider: Account<'info, CapitalProvider>,
    
    #[account(
        mut,
        constraint = provider_token_account.owner == provider.key()
    )]
    pub provider_token_account: Account<'info, TokenAccount>,
    
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
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"risk_pool_state"],
        bump = risk_pool_state.bump,
        constraint = authority.key() == risk_pool_state.authority || authority.key() == risk_pool_state.insurance_program_id
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordClaimPayment<'info> {
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
pub struct UpdateRiskParameters<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"risk_pool_state"],
        bump = risk_pool_state.bump,
        constraint = authority.key() == risk_pool_state.authority
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
        constraint = !risk_pool_state.is_paused @ RiskPoolError::ProgramPaused
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    /// CHECK: Validated in the function
    pub domain_treasury: AccountInfo<'info>,
    
    /// CHECK: Used for validation only
    pub core_program: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct RiskPoolState {
    pub authority: Pubkey,                // 32 bytes
    pub insurance_program_id: Pubkey,     // 32 bytes
    pub claims_processor_id: Pubkey,      // 32 bytes
    pub target_reserve_ratio: u8,         // 1 byte
    pub min_capital_requirement: u64,     // 8 bytes
    pub risk_buffer_percentage: u8,       // 1 byte
    pub total_capital: u64,               // 8 bytes
    pub total_coverage_liability: u64,    // 8 bytes
    pub current_reserve_ratio: u8,        // 1 byte
    pub total_premiums: u64,              // 8 bytes
    pub total_claims_paid: u64,           // 8 bytes
    pub premium_to_claims_ratio: u16,     // 2 bytes
    pub expected_loss: u64,               // 8 bytes
    pub recommended_capital: u64,         // 8 bytes
    pub capital_adequacy: u8,             // 1 byte
    pub is_paused: bool,                  // 1 byte
    pub is_processing_external_call: bool, // 1 byte
    pub bump: u8,                         // 1 byte
    pub last_metrics_update: i64,         // 8 bytes
    pub policy_count: u64,                // 8 bytes
    pub reserved: [u8; 31],               // 31 bytes for future expansion
}

impl RiskPoolState {
    pub const LEN: usize = 32 + // authority
                            32 + // insurance_program_id
                            32 + // claims_processor_id
                            1 +  // target_reserve_ratio
                            8 +  // min_capital_requirement
                            1 +  // risk_buffer_percentage
                            8 +  // total_capital
                            8 +  // total_coverage_liability
                            1 +  // current_reserve_ratio
                            8 +  // total_premiums
                            8 +  // total_claims_paid
                            2 +  // premium_to_claims_ratio
                            8 +  // expected_loss
                            8 +  // recommended_capital
                            1 +  // capital_adequacy
                            1 +  // is_paused
                            1 +  // is_processing_external_call
                            1 +  // bump
                            8 +  // last_metrics_update
                            8 +  // policy_count
                            31;  // reserved
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
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Invalid parameter")]
    InvalidParameter,
    
    #[msg("Arithmetic error")]
    ArithmeticError,
    
    #[msg("Invalid account")]
    InvalidAccount,
    
    #[msg("Insufficient funds")]
    InsufficientFunds,
    
    #[msg("Insufficient capital")]
    InsufficientCapital,
    
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    
    #[msg("Program paused")]
    ProgramPaused,
    
    #[msg("Reentrancy detected")]
    ReentrancyDetected,
    
    #[msg("Invalid domain")]
    InvalidDomain,
    
    #[msg("Invalid amount")]
    InvalidAmount,
    
    #[msg("Divide by zero")]
    DivideByZero,
}

#[event]
pub struct CapitalDeposited {
    pub provider: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct CapitalWithdrawn {
    pub provider: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}
