use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use anchor_spl::associated_token::AssociatedToken;

mod staking_integration;
mod domain_integration;
mod reputation_integration;
use staking_integration::{distribute_staking_rewards, transfer_premium_share_to_staking, StakingProgram};
use domain_integration::{RecordDomainPremium, validate_domain_treasury, RiskPoolError};
use reputation_integration::*;

declare_id!("FroU966kfvu5RAQxhLfb4mhFdDjY6JewEf41ZfYR3xhm");

// Define the Staking Program ID
pub const STAKING_PROGRAM_ID: Pubkey = anchor_lang::solana_program::pubkey!("StaKe5tXnKjeJC4vRVsnxBrNwUuUXRES2RdMc4MnrSA");

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
        monte_carlo_iterations: u16,
    ) -> Result<()> {
        let risk_pool_state = &mut ctx.accounts.risk_pool_state;
        risk_pool_state.authority = ctx.accounts.authority.key();
        risk_pool_state.insurance_program_id = insurance_program_id;
        risk_pool_state.claims_processor_id = claims_processor_id;
        risk_pool_state.target_reserve_ratio = target_reserve_ratio;
        risk_pool_state.min_capital_requirement = min_capital_requirement;
        risk_pool_state.risk_buffer_percentage = risk_buffer_percentage;
        risk_pool_state.monte_carlo_iterations = monte_carlo_iterations;
        risk_pool_state.total_capital = 0;
        risk_pool_state.total_coverage_liability = 0;
        risk_pool_state.current_reserve_ratio = 0;
        risk_pool_state.total_premiums_collected = 0;
        risk_pool_state.total_claims_paid = 0;
        risk_pool_state.premium_to_claims_ratio = 100; // Default 100% (1:1 ratio)
        risk_pool_state.last_metrics_update = Clock::get()?.unix_timestamp;
        risk_pool_state.is_paused = false;
        risk_pool_state.bump = *ctx.bumps.get("risk_pool_state").unwrap();
        
        msg!("Risk pool initialized");
        Ok(())
    }

    pub fn deposit_capital(
        ctx: Context<DepositCapital>,
        amount: u64,
    ) -> Result<()> {
        let risk_pool_state = &ctx.accounts.risk_pool_state;
        let capital_provider = &mut ctx.accounts.capital_provider;
        
        // Validate program is not paused
        require!(!risk_pool_state.is_paused, RiskPoolError::ProgramPaused);
        
        // Validate deposit amount
        require!(amount > 0, RiskPoolError::InvalidAmount);
        
        // Transfer tokens from provider to risk pool
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.provider_token_account.to_account_info(),
                to: ctx.accounts.risk_pool_token_account.to_account_info(),
                authority: ctx.accounts.provider.to_account_info(),
            },
        );
        
        token::transfer(transfer_ctx, amount)?;
        
        // Initialize or update capital provider account
        let is_new_provider = capital_provider.deposited_amount == 0;
        capital_provider.provider = ctx.accounts.provider.key();
        capital_provider.deposited_amount += amount;
        capital_provider.last_deposit_timestamp = Clock::get()?.unix_timestamp;
        capital_provider.bump = *ctx.bumps.get("capital_provider").unwrap();
        
        // Update risk pool state
        let mut risk_pool_state_account = ctx.accounts.risk_pool_state.to_account_info();
        let mut pool_data = risk_pool_state_account.try_borrow_mut_data()?;
        let mut state = RiskPoolState::try_deserialize(&mut &pool_data[..])?;
        
        state.total_capital += amount;
        
        // Recalculate reserve ratio
        if state.total_coverage_liability > 0 {
            state.current_reserve_ratio = ((state.total_capital as u128 * 100) / state.total_coverage_liability as u128) as u8;
        }
        
        // Update last metrics update timestamp
        state.last_metrics_update = Clock::get()?.unix_timestamp;
        
        RiskPoolState::try_serialize(&state, &mut &mut pool_data[..])?;
        
        msg!("Capital deposited successfully");
        Ok(())
    }

    pub fn withdraw_capital(
        ctx: Context<WithdrawCapital>,
        amount: u64,
    ) -> Result<()> {
        let risk_pool_state = &ctx.accounts.risk_pool_state;
        let capital_provider = &mut ctx.accounts.capital_provider;
        
        // Validate program is not paused
        require!(!risk_pool_state.is_paused, RiskPoolError::ProgramPaused);
        
        // Validate withdrawal amount
        require!(
            amount <= capital_provider.deposited_amount,
            RiskPoolError::InsufficientDepositedAmount
        );
        
        // Calculate new reserve ratio after withdrawal
        let new_total_capital = risk_pool_state.total_capital.saturating_sub(amount);
        let new_reserve_ratio = if risk_pool_state.total_coverage_liability > 0 {
            ((new_total_capital as u128 * 100) / risk_pool_state.total_coverage_liability as u128) as u8
        } else {
            100
        };
        
        // Validate withdrawal doesn't breach minimum reserve requirements
        require!(
            new_reserve_ratio >= risk_pool_state.target_reserve_ratio || 
            risk_pool_state.total_coverage_liability == 0,
            RiskPoolError::WithdrawalWouldBreachReserveRequirements
        );
        
        // Transfer tokens from risk pool to provider
        let seeds = &[
            b"risk_pool_state".as_ref(),
            &[risk_pool_state.bump],
        ];
        let signer = &[&seeds[..]];
        
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.risk_pool_token_account.to_account_info(),
                to: ctx.accounts.provider_token_account.to_account_info(),
                authority: ctx.accounts.risk_pool_state.to_account_info(),
            },
            signer,
        );
        
        token::transfer(transfer_ctx, amount)?;
        
        // Update capital provider account
        capital_provider.deposited_amount -= amount;
        
        // Update risk pool state
        let mut risk_pool_state_account = ctx.accounts.risk_pool_state.to_account_info();
        let mut pool_data = risk_pool_state_account.try_borrow_mut_data()?;
        let mut state = RiskPoolState::try_deserialize(&mut &pool_data[..])?;
        
        state.total_capital -= amount;
        
        // Recalculate reserve ratio
        if state.total_coverage_liability > 0 {
            state.current_reserve_ratio = ((state.total_capital as u128 * 100) / state.total_coverage_liability as u128) as u8;
        } else {
            state.current_reserve_ratio = 100;
        }
        
        // Update metrics timestamp
        state.last_metrics_update = Clock::get()?.unix_timestamp;
        
        RiskPoolState::try_serialize(&state, &mut &mut pool_data[..])?;
        
        msg!("Capital withdrawn successfully");
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
            risk_pool_state.current_reserve_ratio = ((risk_pool_state.total_capital as u128 * 100) / risk_pool_state.total_coverage_liability as u128) as u8;
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
        
        // Validate caller is authorized
        require!(
            ctx.accounts.authority.key() == risk_pool_state.authority || 
            ctx.accounts.authority.key() == risk_pool_state.insurance_program_id,
            RiskPoolError::Unauthorized
        );
        
        // Update total premiums collected
        risk_pool_state.total_premiums_collected += amount;
        
        // If staking is enabled, distribute a portion of premiums to stakers
        if ctx.remaining_accounts.len() >= 3 {
            let staking_state = &ctx.remaining_accounts[0];
            let staking_rewards_pool = &ctx.remaining_accounts[1];
            let premium_share_percent = ctx.remaining_accounts[2].data.borrow()[0]; // First byte contains the percentage
            
            // Validate accounts
            require!(
                staking_rewards_pool.owner == staking_state.key(),
                RiskPoolError::InvalidAccount
            );
            
            // Transfer premium share to staking rewards pool
            if let Ok(staking_rewards_account) = Account::<TokenAccount>::try_from(staking_rewards_pool) {
                if let Ok(risk_pool_token_account) = Account::<TokenAccount>::try_from(&ctx.accounts.risk_pool_token_account) {
                    transfer_premium_share_to_staking(
                        risk_pool_state,
                        &risk_pool_token_account,
                        &staking_rewards_account,
                        &ctx.accounts.token_program,
                        amount,
                        premium_share_percent,
                    )?;
                    
                    // Call the staking program to distribute rewards
                    let staking_program = &ctx.remaining_accounts[3];
                    if let Ok(program) = Program::<StakingProgram>::try_from(staking_program) {
                        distribute_staking_rewards(
                            risk_pool_state,
                            &ctx.accounts.authority,
                            staking_state,
                            &program,
                            amount,
                        )?;
                    }
                }
            }
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
        
        // Update claims paid total
        risk_pool_state.total_claims_paid += amount;
        
        // Update metrics timestamp
        risk_pool_state.last_metrics_update = Clock::get()?.unix_timestamp;
        
        msg!("Claim payment recorded");
        Ok(())
    }

    pub fn run_monte_carlo_simulation(
        ctx: Context<RunMonteCarloSimulation>,
        current_policies: u64,
        avg_claim_frequency: u8,
        avg_claim_severity: u64,
        market_volatility: u8,
    ) -> Result<()> {
        let risk_pool_state = &mut ctx.accounts.risk_pool_state;
        let simulation_result = &mut ctx.accounts.simulation_result;
        
        // Validate caller is authorized
        require!(
            ctx.accounts.authority.key() == risk_pool_state.authority,
            RiskPoolError::Unauthorized
        );
        
        // Run Monte Carlo simulation
        let (expected_loss, var_95, var_99, recommended_capital) = run_simulation(
            current_policies,
            avg_claim_frequency,
            avg_claim_severity,
            market_volatility,
            risk_pool_state.monte_carlo_iterations,
            risk_pool_state.risk_buffer_percentage,
        );
        
        // Initialize simulation result
        simulation_result.run_timestamp = Clock::get()?.unix_timestamp;
        simulation_result.current_policies = current_policies;
        simulation_result.avg_claim_frequency = avg_claim_frequency;
        simulation_result.avg_claim_severity = avg_claim_severity;
        simulation_result.market_volatility = market_volatility;
        simulation_result.expected_loss = expected_loss;
        simulation_result.var_95 = var_95;
        simulation_result.var_99 = var_99;
        simulation_result.recommended_capital = recommended_capital;
        simulation_result.current_capital = risk_pool_state.total_capital;
        simulation_result.capital_adequacy = if risk_pool_state.total_capital >= recommended_capital {
            true
        } else {
            false
        };
        simulation_result.bump = *ctx.bumps.get("simulation_result").unwrap();
        
        msg!("Monte Carlo simulation completed");
        Ok(())
    }

    pub fn update_risk_parameters(
        ctx: Context<UpdateRiskParameters>,
        target_reserve_ratio: Option<u8>,
        min_capital_requirement: Option<u64>,
        risk_buffer_percentage: Option<u8>,
        monte_carlo_iterations: Option<u16>,
        is_paused: Option<bool>,
    ) -> Result<()> {
        let risk_pool_state = &mut ctx.accounts.risk_pool_state;
        
        // Validate authority
        require!(
            ctx.accounts.authority.key() == risk_pool_state.authority,
            RiskPoolError::Unauthorized
        );
        
        // Update parameters if provided
        if let Some(ratio) = target_reserve_ratio {
            risk_pool_state.target_reserve_ratio = ratio;
        }
        
        if let Some(capital) = min_capital_requirement {
            risk_pool_state.min_capital_requirement = capital;
        }
        
        if let Some(buffer) = risk_buffer_percentage {
            risk_pool_state.risk_buffer_percentage = buffer;
        }
        
        if let Some(iterations) = monte_carlo_iterations {
            risk_pool_state.monte_carlo_iterations = iterations;
        }
        
        if let Some(paused) = is_paused {
            risk_pool_state.is_paused = paused;
        }
        
        // Update metrics timestamp
        risk_pool_state.last_metrics_update = Clock::get()?.unix_timestamp;
        
        msg!("Risk parameters updated");
        Ok(())
    }

    // New function to get risk pool metrics without requiring a wallet connection
    pub fn get_public_risk_pool_metrics(ctx: Context<GetPublicRiskPoolMetrics>) -> Result<()> {
        let risk_pool_state = &ctx.accounts.risk_pool_state;
        
        // Log metrics for consumption by client
        msg!("Risk Pool Metrics:");
        msg!("Total Capital: {}", risk_pool_state.total_capital);
        msg!("Total Coverage Liability: {}", risk_pool_state.total_coverage_liability);
        msg!("Current Reserve Ratio: {}", risk_pool_state.current_reserve_ratio);
        msg!("Target Reserve Ratio: {}", risk_pool_state.target_reserve_ratio);
        msg!("Total Premiums Collected: {}", risk_pool_state.total_premiums_collected);
        msg!("Total Claims Paid: {}", risk_pool_state.total_claims_paid);
        msg!("Premium to Claims Ratio: {}", risk_pool_state.premium_to_claims_ratio);
        msg!("Last Update: {}", risk_pool_state.last_metrics_update);
        
        // Calculate solvency metrics
        let buffer_percentage = if risk_pool_state.total_coverage_liability > 0 {
            ((risk_pool_state.total_capital as u128 * 100) / risk_pool_state.total_coverage_liability as u128) as u8
                .saturating_sub(risk_pool_state.target_reserve_ratio)
        } else {
            100
        };
        
        msg!("Buffer Percentage: {}", buffer_percentage);
        msg!("Risk Buffer Target: {}", risk_pool_state.risk_buffer_percentage);
        
        // Return success
        Ok(())
    }

    // New function to update premium to claims ratio
    pub fn update_premium_claims_ratio(ctx: Context<UpdateRiskParameters>) -> Result<()> {
        let risk_pool = &mut ctx.accounts.risk_pool_state;
        
        require!(risk_pool.total_claims_paid > 0, RiskPoolError::DivideByZero);
        
        risk_pool.premium_to_claims_ratio = ((risk_pool.total_premiums_collected as u128)
            .checked_mul(100)
            .unwrap_or(0)
            .checked_div(risk_pool.total_claims_paid as u128)
            .unwrap_or(0)) as u16;
            
        risk_pool.last_metrics_update = Clock::get()?.unix_timestamp;
        Ok(())
    }
    
    /// Record a premium payment received via the FreelanceShield.xyz domain
    pub fn process_domain_premium(ctx: Context<RecordDomainPremium>, amount: u64) -> Result<()> {
        // Validate the domain treasury is authorized to send to this risk pool
        validate_domain_treasury(
            &ctx.accounts.domain_treasury.to_account_info(),
            &ctx.accounts.core_program.key(),
            &ctx.accounts.risk_pool_state.key()
        )?;
        
        // Record the premium in our risk pool
        domain_integration::record_domain_premium(ctx, amount)
    }
}

// Helper function to run Monte Carlo simulation
fn run_simulation(
    current_policies: u64,
    avg_claim_frequency: u8,
    avg_claim_severity: u64,
    market_volatility: u8,
    iterations: u16,
    risk_buffer_percentage: u8,
) -> (u64, u64, u64, u64) {
    // This is a simplified simulation for demonstration
    // In a real implementation, this would use more sophisticated statistical methods
    
    // Expected loss = policies * frequency * severity
    let expected_loss = (current_policies as u128 * avg_claim_frequency as u128 * avg_claim_severity as u128 / 100) as u64;
    
    // Value at Risk calculations (simplified)
    // Higher market volatility increases the tail risk
    let volatility_factor = 1.0 + (market_volatility as f64 / 100.0);
    
    // VaR 95% = expected loss * volatility factor * 1.645 (normal distribution 95% confidence)
    let var_95 = (expected_loss as f64 * volatility_factor * 1.645) as u64;
    
    // VaR 99% = expected loss * volatility factor * 2.326 (normal distribution 99% confidence)
    let var_99 = (expected_loss as f64 * volatility_factor * 2.326) as u64;
    
    // Recommended capital = VaR 99% * (1 + risk buffer)
    let recommended_capital = (var_99 as u128 * (100 + risk_buffer_percentage as u128) / 100) as u64;
    
    (expected_loss, var_95, var_99, recommended_capital)
}

#[derive(Accounts)]
pub struct Initialize<'info> {
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
}

#[derive(Accounts)]
pub struct DepositCapital<'info> {
    #[account(mut)]
    pub provider: Signer<'info>,
    
    #[account(
        seeds = [b"risk_pool_state"],
        bump = risk_pool_state.bump,
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    #[account(
        init_if_needed,
        payer = provider,
        space = 8 + CapitalProvider::SIZE,
        seeds = [b"capital_provider", provider.key().as_ref()],
        bump
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
    
    #[account(mut)]
    pub risk_pool_token_account: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
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
pub struct RunMonteCarloSimulation<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [b"risk_pool_state"],
        bump = risk_pool_state.bump,
    )]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + SimulationResult::SIZE,
        seeds = [b"simulation", &Clock::get()?.unix_timestamp.to_le_bytes()],
        bump
    )]
    pub simulation_result: Account<'info, SimulationResult>,
    
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
pub struct RecordDomainPremium<'info> {
    #[account(mut)]
    pub domain_treasury: AccountInfo<'info>,
    #[account(mut)]
    pub risk_pool_state: Account<'info, RiskPoolState>,
    pub core_program: Program<'info, System>,
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
    pub monte_carlo_iterations: u16,      // 2 bytes
    pub total_capital: u64,               // 8 bytes
    pub total_coverage_liability: u64,    // 8 bytes
    pub current_reserve_ratio: u8,        // 1 byte
    pub total_premiums_collected: u64,    // 8 bytes
    pub total_claims_paid: u64,           // 8 bytes
    pub premium_to_claims_ratio: u8,      // 1 byte (New field)
    pub last_metrics_update: i64,         // 8 bytes (New field)
    pub is_paused: bool,                  // 1 byte
    pub bump: u8,                         // 1 byte
    // Added padding for future fields
    pub reserved: [u8; 32],               // 32 bytes for future expansion
}

impl RiskPoolState {
    pub const SIZE: usize = 32 + // authority
                            32 + // insurance_program_id
                            32 + // claims_processor_id
                            1 +  // target_reserve_ratio
                            8 +  // min_capital_requirement
                            1 +  // risk_buffer_percentage
                            2 +  // monte_carlo_iterations
                            8 +  // total_capital
                            8 +  // total_coverage_liability
                            1 +  // current_reserve_ratio
                            8 +  // total_premiums_collected
                            8 +  // total_claims_paid
                            1 +  // premium_to_claims_ratio
                            8 +  // last_metrics_update
                            1 +  // is_paused
                            1 +  // bump
                            32;  // reserved
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
    pub const SIZE: usize = 32 + // provider
                            8 +  // deposited_amount
                            8 +  // last_deposit_timestamp
                            1;   // bump
}

#[account]
#[derive(Default)]
pub struct SimulationResult {
    pub run_timestamp: i64,
    pub current_policies: u64,
    pub avg_claim_frequency: u8,
    pub avg_claim_severity: u64,
    pub market_volatility: u8,
    pub expected_loss: u64,
    pub var_95: u64,
    pub var_99: u64,
    pub recommended_capital: u64,
    pub current_capital: u64,
    pub capital_adequacy: bool,
    pub bump: u8,
}

impl SimulationResult {
    pub const SIZE: usize = 8 +  // run_timestamp
                            8 +  // current_policies
                            1 +  // avg_claim_frequency
                            8 +  // avg_claim_severity
                            1 +  // market_volatility
                            8 +  // expected_loss
                            8 +  // var_95
                            8 +  // var_99
                            8 +  // recommended_capital
                            8 +  // current_capital
                            1 +  // capital_adequacy
                            1;   // bump
}

#[error_code]
pub enum RiskPoolError {
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Program is paused")]
    ProgramPaused,
    
    #[msg("Invalid amount")]
    InvalidAmount,
    
    #[msg("Insufficient deposited amount")]
    InsufficientDepositedAmount,
    
    #[msg("Withdrawal would breach reserve requirements")]
    WithdrawalWouldBreachReserveRequirements,
    
    #[msg("Invalid account")]
    InvalidAccount,
    
    #[msg("Cannot divide by zero")]
    DivideByZero,
}
