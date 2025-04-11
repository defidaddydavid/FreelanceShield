use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Token, Transfer};
use crate::state::*;
use crate::error::*;
use crate::utils::*;

// Initialize a new verifier for the system
pub fn initialize_verifier(
    ctx: Context<InitializeVerifier>,
    verifier_type: VerifierType,
    expertise_areas: Vec<ExpertiseArea>,
) -> Result<()> {
    let verifier_account = &mut ctx.accounts.verifier_account;
    let user = &ctx.accounts.user;
    let clock = Clock::get()?;
    
    // Check that the number of expertise areas is within limits
    if expertise_areas.len() > Verifier::MAX_EXPERTISE_AREAS {
        return Err(error!(FraudPreventionError::MaxExpertiseAreasReached));
    }
    
    // Set up the verifier account
    verifier_account.user = user.key();
    verifier_account.verifier_type = verifier_type;
    verifier_account.expertise = expertise_areas;
    verifier_account.reputation_score = 50; // Start with neutral reputation
    verifier_account.successful_verifications = 0;
    verifier_account.stake_amount = 0; // Will be updated when staking
    verifier_account.is_active = false; // Not active until staked
    verifier_account.created_at = clock.unix_timestamp;
    verifier_account.last_updated = clock.unix_timestamp;
    verifier_account.bump = *ctx.bumps.get("verifier_account").unwrap();
    
    msg!("Verifier account initialized for user: {}", user.key());
    msg!("Verifier type: {:?}", verifier_type);
    Ok(())
}

// Stake tokens to become an active verifier
pub fn stake_for_verification(
    ctx: Context<StakeForVerification>,
    amount: u64,
) -> Result<()> {
    let verifier_account = &mut ctx.accounts.verifier_account;
    let user = &ctx.accounts.user;
    let user_token_account = &ctx.accounts.user_token_account;
    let verifier_stake_account = &ctx.accounts.verifier_stake_account;
    let clock = Clock::get()?;
    
    // Minimum stake amount required based on verifier type
    let min_stake = match verifier_account.verifier_type {
        VerifierType::General => 1_000,
        VerifierType::Expert => 5_000,
        VerifierType::Automated => 10_000,
        VerifierType::Oracle => 25_000,
        VerifierType::Arbitrator => 50_000,
    };
    
    // Check that the stake amount is sufficient
    if amount < min_stake {
        return Err(error!(FraudPreventionError::InsufficientStake));
    }
    
    // Transfer tokens from user to stake account
    let transfer_accounts = Transfer {
        from: user_token_account.to_account_info(),
        to: verifier_stake_account.to_account_info(),
        authority: user.to_account_info(),
    };
    
    let seeds = &[
        b"verifier".as_ref(),
        user.key().as_ref(),
        &[verifier_account.bump],
    ];
    let signer_seeds = &[&seeds[..]];
    
    // Execute the transfer with CPI
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_accounts,
        ),
        amount,
    )?;
    
    // Update verifier account
    verifier_account.stake_amount = amount;
    verifier_account.is_active = true;
    verifier_account.last_updated = clock.unix_timestamp;
    
    msg!("Staked {} tokens for verification", amount);
    Ok(())
}

// Update verifier reputation based on performance
pub fn update_verifier_reputation(
    ctx: Context<UpdateVerifierReputation>,
    reputation_change: i32,
    verification_id: Pubkey,
) -> Result<()> {
    let verifier_account = &mut ctx.accounts.verifier_account;
    let auth_program = &ctx.accounts.auth_program;
    let clock = Clock::get()?;
    
    // Verify that the calling program is authorized
    if !is_authorized_program(auth_program.key()) {
        return Err(error!(FraudPreventionError::UnauthorizedProgram));
    }
    
    // Update reputation score (ensure it stays within 0-100 range)
    let new_score = verifier_account.reputation_score as i64 + reputation_change as i64;
    verifier_account.reputation_score = new_score.max(0).min(100) as u64;
    
    // If this was a successful verification, increment the counter
    if reputation_change > 0 {
        verifier_account.successful_verifications += 1;
    }
    
    // Update last updated timestamp
    verifier_account.last_updated = clock.unix_timestamp;
    
    msg!("Verifier reputation updated to: {}", verifier_account.reputation_score);
    Ok(())
}

// Context for initializing a verifier
#[derive(Accounts)]
pub struct InitializeVerifier<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        init,
        payer = user,
        space = Verifier::space(),
        seeds = [b"verifier", user.key().as_ref()],
        bump,
    )]
    pub verifier_account: Account<'info, Verifier>,
    
    pub system_program: Program<'info, System>,
}

// Context for staking tokens to become an active verifier
#[derive(Accounts)]
pub struct StakeForVerification<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"verifier", user.key().as_ref()],
        bump = verifier_account.bump,
        constraint = verifier_account.user == user.key()
    )]
    pub verifier_account: Account<'info, Verifier>,
    
    #[account(
        mut,
        constraint = user_token_account.owner == user.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"stake", user.key().as_ref()],
        bump,
    )]
    pub verifier_stake_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

// Context for updating verifier reputation
#[derive(Accounts)]
pub struct UpdateVerifierReputation<'info> {
    /// The program authorized to update verifier reputation
    pub auth_program: Signer<'info>,
    
    /// CHECK: The user whose verifier reputation is being updated
    pub user: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"verifier", user.key().as_ref()],
        bump = verifier_account.bump,
    )]
    pub verifier_account: Account<'info, Verifier>,
}
