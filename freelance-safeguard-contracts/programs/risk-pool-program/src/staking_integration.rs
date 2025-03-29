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

// CPI instruction to distribute rewards to stakers
pub fn distribute_staking_rewards(
    risk_pool_state: &Account<RiskPoolState>,
    authority: &Signer,
    staking_state: &AccountInfo,
    staking_program: &Program<StakingProgram>,
    premium_amount: u64,
) -> Result<()> {
    let ix = anchor_lang::anchor_lang::solana_program::instruction::Instruction {
        program_id: staking_program.key(),
        accounts: vec![
            AccountMeta::new_readonly(*authority.key, true),
            AccountMeta::new(*staking_state.key, false),
            AccountMeta::new_readonly(anchor_lang::anchor_lang::solana_program::system_program::ID, false),
        ],
        data: anchor_lang::InstructionData::new(
            anchor_lang::anchor_lang::solana_program::hash::hash("global:distribute_rewards".as_bytes()),
            premium_amount,
        ).data.to_vec(),
    };

    anchor_lang::anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            authority.to_account_info(),
            staking_state.clone(),
            staking_program.to_account_info(),
        ],
    )?;

    Ok(())
}

// Transfer tokens from risk pool to staking rewards pool
pub fn transfer_premium_share_to_staking(
    risk_pool_state: &Account<RiskPoolState>,
    risk_pool_token_account: &Account<TokenAccount>,
    staking_rewards_pool: &Account<TokenAccount>,
    token_program: &Program<Token>,
    premium_amount: u64,
    premium_share_percent: u8,
) -> Result<()> {
    // Calculate staker share
    let staker_share = (premium_amount as u128 * premium_share_percent as u128 / 100) as u64;
    
    // Only proceed if there's a share to transfer
    if staker_share > 0 {
        // Create signer seeds
        let seeds = &[
            b"risk_pool_state".as_ref(),
            &[risk_pool_state.bump],
        ];
        let signer = &[&seeds[..]];
        
        // Transfer tokens
        let transfer_ctx = CpiContext::new_with_signer(
            token_program.to_account_info(),
            Transfer {
                from: risk_pool_token_account.to_account_info(),
                to: staking_rewards_pool.to_account_info(),
                authority: risk_pool_state.to_account_info(),
            },
            signer,
        );
        
        token::transfer(transfer_ctx, staker_share)?;
        
        msg!("Transferred {} tokens to staking rewards pool", staker_share);
    }
    
    Ok(())
}

