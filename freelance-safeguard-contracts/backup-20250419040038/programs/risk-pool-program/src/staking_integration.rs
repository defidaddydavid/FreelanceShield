use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::RiskPoolState;

// Define the staking program interface for CPI calls
#[derive(Clone)]
pub struct StakingProgram;

impl anchor_lang::Id for StakingProgram {
    fn id() -> Pubkey {
        crate::STAKING_PROGRAM_ID
    }
}

// Transfer tokens from risk pool to staking rewards pool
/// Transfer a share of premium to the staking rewards pool
pub fn transfer_premium_share_to_staking<'a>(
    risk_pool_state: &Account<'a, RiskPoolState>,
    risk_pool_token_account: &Account<'a, TokenAccount>,
    staking_rewards_pool: &Account<'a, TokenAccount>,
    token_program: &Program<'a, Token>,
    amount: u64,
) -> Result<()> {
    // Validate amount
    if amount == 0 {
        msg!("Zero amount transfer skipped");
        return Ok(());
    }
    
    // Calculate PDA seeds for signing
    let risk_pool_seeds = [
        b"risk_pool_state".as_ref(),
        &[risk_pool_state.bump],
    ];
    
    // Create the transfer instruction
    let cpi_accounts = Transfer {
        from: risk_pool_token_account.to_account_info(),
        to: staking_rewards_pool.to_account_info(),
        authority: risk_pool_state.to_account_info(),
    };
    
    // Create the CPI context with fixed lifetime issues
    let binding = [&risk_pool_seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(
        token_program.to_account_info(),
        cpi_accounts,
        &binding,
    );
    
    // Execute the transfer
    token::transfer(cpi_ctx, amount)?;
    
    msg!("Transferred {} tokens to staking rewards pool", amount);
    Ok(())
}