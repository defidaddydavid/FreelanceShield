use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;
use crate::constants::*;
use crate::utils::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = ReputationState::SIZE,
        seeds = [b"reputation_state", authority.key().as_ref()],
        bump
    )]
    pub reputation_state: Account<'info, ReputationState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProfile<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        seeds = [b"reputation_state", reputation_state.authority.as_ref()],
        bump = reputation_state.bump
    )]
    pub reputation_state: Account<'info, ReputationState>,
    
    #[account(
        init,
        payer = user,
        space = UserProfile::SIZE,
        seeds = [b"user_profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateContractCompletion<'info> {
    pub caller: Signer<'info>,
    
    #[account(mut)]
    pub user: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"reputation_state", reputation_state.authority.as_ref()],
        bump = reputation_state.bump
    )]
    pub reputation_state: Account<'info, ReputationState>,
    
    #[account(
        mut,
        seeds = [b"user_profile", user.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
}

#[derive(Accounts)]
pub struct UpdateClaimsHistory<'info> {
    pub caller: Signer<'info>,
    
    #[account(mut)]
    pub user: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"reputation_state", reputation_state.authority.as_ref()],
        bump = reputation_state.bump
    )]
    pub reputation_state: Account<'info, ReputationState>,
    
    #[account(
        mut,
        seeds = [b"user_profile", user.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
}

#[derive(Accounts)]
pub struct GetReputationFactor<'info> {
    #[account()]
    pub user: AccountInfo<'info>,
    
    #[account(
        seeds = [b"user_profile", user.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
}

#[derive(Accounts)]
pub struct GetReputationAnalytics<'info> {
    #[account()]
    pub user: AccountInfo<'info>,
    
    #[account(
        seeds = [b"reputation_state", reputation_state.authority.as_ref()],
        bump = reputation_state.bump
    )]
    pub reputation_state: Account<'info, ReputationState>,
    
    #[account(
        seeds = [b"user_profile", user.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
}

#[derive(Accounts)]
pub struct GetReputationHistory<'info> {
    #[account()]
    pub user: AccountInfo<'info>,
    
    #[account(
        seeds = [b"user_profile", user.key().as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
}

