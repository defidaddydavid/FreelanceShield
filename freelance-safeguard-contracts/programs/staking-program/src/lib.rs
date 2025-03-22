use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("HSfx7TmMotfS8ZSpD3cKYKkdnc739xajMFiQCHSkYGAD");

#[program]
pub mod staking_program {
    use super::*;

    /// Initialize the staking program
    pub fn initialize(
        ctx: Context<Initialize>,
        risk_pool_id: Pubkey,
        dao_governance_id: Pubkey,
        min_stake_period_days: u16,
        early_unstake_penalty_percent: u8,
        reward_distribution_interval: u64, // In seconds
        base_reward_rate: u16, // Basis points (e.g., 500 = 5%)
        performance_multiplier_cap: u16, // Basis points (e.g., 200 = 2x)
        max_stake_per_wallet: u64,
        progressive_apy_threshold: u64,
        progressive_apy_decay_rate: u16,
        min_liquidity_reserve_percent: u8,
        auto_compound_enabled: bool,
        epoch_duration_seconds: u64,
    ) -> Result<()> {
        let staking_state = &mut ctx.accounts.staking_state;
        
        // Validate inputs
        require!(early_unstake_penalty_percent <= 50, StakingError::InvalidParameter); // Max 50% penalty
        require!(base_reward_rate <= 5000, StakingError::InvalidParameter); // Max 50% APY
        require!(performance_multiplier_cap <= 500, StakingError::InvalidParameter); // Max 5x multiplier
        
        // Initialize staking state
        staking_state.authority = ctx.accounts.authority.key();
        staking_state.risk_pool_id = risk_pool_id;
        staking_state.dao_governance_id = dao_governance_id;
        staking_state.min_stake_period_days = min_stake_period_days;
        staking_state.early_unstake_penalty_percent = early_unstake_penalty_percent;
        staking_state.reward_distribution_interval = reward_distribution_interval;
        staking_state.base_reward_rate = base_reward_rate;
        staking_state.performance_multiplier_cap = performance_multiplier_cap;
        staking_state.total_staked_amount = 0;
        staking_state.total_stakers = 0;
        staking_state.total_rewards_distributed = 0;
        staking_state.last_reward_distribution = 0;
        staking_state.premium_share_percent = 70; // Default 70% of premiums go to stakers
        staking_state.is_paused = false;
        staking_state.supported_tokens = vec![]; // Initialize empty supported tokens list
        staking_state.max_stake_per_wallet = max_stake_per_wallet;
        staking_state.progressive_apy_threshold = progressive_apy_threshold;
        staking_state.progressive_apy_decay_rate = progressive_apy_decay_rate;
        staking_state.min_liquidity_reserve_percent = min_liquidity_reserve_percent;
        staking_state.last_reward_accrual_time = 0;
        staking_state.reward_accrual_rate_per_epoch = 0;
        staking_state.auto_compound_enabled = auto_compound_enabled;
        staking_state.epoch_duration_seconds = epoch_duration_seconds;
        staking_state.bump = *ctx.bumps.get("staking_state").unwrap();
        
        msg!("Staking program initialized");
        Ok(())
    }

    /// Add a supported token for staking
    pub fn add_supported_token(
        ctx: Context<UpdateStakingConfig>,
        token_mint: Pubkey,
        token_name: String,
        weight: u8, // Weight for reward distribution (higher weight = higher rewards)
        rewards_pool_balance: u64,
        last_epoch_rewards_rate: u16,
    ) -> Result<()> {
        let staking_state = &mut ctx.accounts.staking_state;
        
        // Validate authority
        require!(
            ctx.accounts.authority.key() == staking_state.authority,
            StakingError::Unauthorized
        );
        
        // Check if token already exists
        let token_exists = staking_state.supported_tokens.iter()
            .any(|t| t.mint == token_mint);
        
        require!(!token_exists, StakingError::TokenAlreadySupported);
        
        // Add the token to supported tokens
        staking_state.supported_tokens.push(SupportedToken {
            mint: token_mint,
            name: token_name,
            weight,
            total_staked: 0,
            is_active: true,
            rewards_pool_balance,
            last_epoch_rewards_rate,
        });
        
        msg!("Added supported token: {}", token_mint);
        Ok(())
    }

    /// Stake tokens into the pool
    pub fn stake(
        ctx: Context<Stake>,
        amount: u64,
        lock_period_days: u16,
    ) -> Result<()> {
        let staking_state = &ctx.accounts.staking_state;
        let staker_info = &mut ctx.accounts.staker_info;
        let token_mint = ctx.accounts.token_mint.key();
        
        // Validate program is not paused
        require!(!staking_state.is_paused, StakingError::ProgramPaused);
        
        // Validate amount
        require!(amount > 0, StakingError::InvalidAmount);
        
        // Validate lock period
        require!(
            lock_period_days >= staking_state.min_stake_period_days,
            StakingError::LockPeriodTooShort
        );
        
        // Validate token is supported
        let token_info_opt = staking_state.supported_tokens.iter()
            .find(|t| t.mint == token_mint);
        
        let token_info = match token_info_opt {
            Some(info) if info.is_active => info,
            _ => return Err(StakingError::UnsupportedToken.into()),
        };
        
        // Check staking cap
        require!(staker_info.staked_amount + amount <= staking_state.max_stake_per_wallet, StakingError::StakingCapExceeded);
        
        // Transfer tokens from staker to staking pool
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.staker_token_account.to_account_info(),
                to: ctx.accounts.staking_pool_token_account.to_account_info(),
                authority: ctx.accounts.staker.to_account_info(),
            },
        );
        
        token::transfer(transfer_ctx, amount)?;
        
        // Calculate unlock time
        let now = Clock::get()?.unix_timestamp as u64;
        let unlock_time = now + (lock_period_days as u64 * 24 * 60 * 60);
        
        // Calculate bonus multiplier based on lock period
        // Longer lock periods get higher rewards (up to 2x for 1 year)
        let max_bonus = 100; // 100% bonus (2x) for 365 days
        let bonus_multiplier = std::cmp::min(
            (lock_period_days as u32 * max_bonus) / 365,
            max_bonus
        ) as u16;
        
        // Initialize or update staker info
        let is_new_staker = staker_info.staked_amount == 0;
        
        // Create a new stake position
        let position_id = staker_info.next_position_id;
        staker_info.positions.push(StakePosition {
            id: position_id,
            amount,
            token_mint,
            start_time: now,
            unlock_time,
            lock_period_days,
            bonus_multiplier,
            claimed_rewards: 0,
            is_active: true,
            last_compound_time: now,
            accrued_rewards: 0,
            effective_apy: staking_state.base_reward_rate,
        });
        
        // Update staker info
        staker_info.staker = ctx.accounts.staker.key();
        staker_info.staked_amount += amount;
        staker_info.next_position_id += 1;
        staker_info.last_stake_time = now;
        staker_info.pending_rewards = 0;
        staker_info.last_reward_calculation = now;
        staker_info.auto_compound_preference = staking_state.auto_compound_enabled;
        staker_info.bump = *ctx.bumps.get("staker_info").unwrap();
        
        // Update staking state
        let mut staking_state_account = ctx.accounts.staking_state.to_account_info();
        let mut state_data = staking_state_account.try_borrow_mut_data()?;
        let mut state = StakingState::try_deserialize(&mut &state_data[..])?;
        
        state.total_staked_amount += amount;
        
        if is_new_staker {
            state.total_stakers += 1;
        }
        
        // Update token info
        for token in state.supported_tokens.iter_mut() {
            if token.mint == token_mint {
                token.total_staked += amount;
                break;
            }
        }
        
        StakingState::try_serialize(&state, &mut &mut state_data[..])?;
        
        msg!("Staked {} tokens with position ID {}", amount, position_id);
        Ok(())
    }

    /// Unstake tokens from the pool
    pub fn unstake(
        ctx: Context<Unstake>,
        position_id: u64,
    ) -> Result<()> {
        let staking_state = &ctx.accounts.staking_state;
        let staker_info = &mut ctx.accounts.staker_info;
        
        // Validate program is not paused
        require!(!staking_state.is_paused, StakingError::ProgramPaused);
        
        // Find the stake position
        let position_index = staker_info.positions.iter()
            .position(|p| p.id == position_id && p.is_active)
            .ok_or(StakingError::StakePositionNotFound)?;
        
        let position = &mut staker_info.positions[position_index];
        
        // Check if the position is for the correct token
        require!(
            position.token_mint == ctx.accounts.token_mint.key(),
            StakingError::TokenMismatch
        );
        
        // Get current time
        let now = Clock::get()?.unix_timestamp as u64;
        
        // First, update rewards to ensure we have the latest accrued rewards
        let update_rewards_ctx = Context::new(
            ctx.program_id,
            UpdateRewards {
                staking_state: ctx.accounts.staking_state.clone(),
                staker_info: ctx.accounts.staker_info.clone(),
                staker: ctx.accounts.staker.clone(),
                system_program: ctx.accounts.system_program.clone(),
            },
            ctx.remaining_accounts,
            ctx.bumps.clone(),
        );
        
        update_rewards(update_rewards_ctx)?;
        
        // Calculate unstaking amount and penalty
        let (unstake_amount, penalty_amount) = calculate_unstake_amount(
            position,
            now,
            staking_state.min_stake_period_days,
            staking_state.early_unstake_penalty_percent
        )?;
        
        // Check liquidity reserves before unstaking
        check_liquidity_reserves(
            staking_state,
            position.token_mint,
            unstake_amount
        )?;
        
        // Transfer tokens from staking pool to staker
        let seeds = &[
            b"staking_state",
            &[staking_state.bump]
        ];
        let signer = &[&seeds[..]];
        
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.staking_pool.to_account_info(),
                to: ctx.accounts.staker_token_account.to_account_info(),
                authority: ctx.accounts.staking_state.to_account_info(),
            },
            signer,
        );
        
        token::transfer(transfer_ctx, unstake_amount)?;
        
        // Update staker info
        staker_info.staked_amount = staker_info.staked_amount.saturating_sub(position.amount);
        
        // Update position
        position.is_active = false;
        
        // Update staking state
        let mut staking_state_account = ctx.accounts.staking_state.to_account_info();
        let mut state_data = staking_state_account.try_borrow_mut_data()?;
        let mut state = StakingState::try_deserialize(&mut &state_data[..])?;
        
        state.total_staked_amount = state.total_staked_amount.saturating_sub(position.amount);
        
        // Update token info
        for token in state.supported_tokens.iter_mut() {
            if token.mint == position.token_mint {
                token.total_staked = token.total_staked.saturating_sub(position.amount);
                
                // Update rewards pool balance
                token.rewards_pool_balance = token.rewards_pool_balance.saturating_sub(unstake_amount);
                
                break;
            }
        }
        
        StakingState::try_serialize(&state, &mut &mut state_data[..])?;
        
        msg!("Unstaked {} tokens with penalty of {}", unstake_amount, penalty_amount);
        Ok(())
    }

    /// Distribute rewards to stakers
    pub fn distribute_rewards(
        ctx: Context<DistributeRewards>,
        premium_amount: u64,
    ) -> Result<()> {
        let staking_state = &mut ctx.accounts.staking_state;
        
        // Validate caller is authorized
        require!(
            ctx.accounts.authority.key() == staking_state.authority || 
            ctx.accounts.authority.key() == staking_state.risk_pool_id,
            StakingError::Unauthorized
        );
        
        // Validate amount
        require!(premium_amount > 0, StakingError::InvalidAmount);
        
        // Calculate staker share of premiums
        let staker_share = (premium_amount as u128 * staking_state.premium_share_percent as u128 / 100) as u64;
        
        // Record the distribution
        staking_state.total_rewards_distributed += staker_share;
        staking_state.last_reward_distribution = Clock::get()?.unix_timestamp as u64;
        
        // Transfer tokens from risk pool to staking rewards pool
        // Note: This would be implemented in the risk pool program
        // and would call this function after transferring the tokens
        
        msg!("Distributed {} rewards to staking pool", staker_share);
        Ok(())
    }

    /// Claim rewards for a specific stake position
    pub fn claim_rewards(
        ctx: Context<ClaimRewards>,
        position_id: u64,
        auto_compound: Option<bool>,
    ) -> Result<()> {
        let staking_state = &ctx.accounts.staking_state;
        let staker_info = &mut ctx.accounts.staker_info;
        
        // Validate program is not paused
        require!(!staking_state.is_paused, StakingError::ProgramPaused);
        
        // Find the stake position
        let position_index = staker_info.positions.iter()
            .position(|p| p.id == position_id && p.is_active)
            .ok_or(StakingError::StakePositionNotFound)?;
        
        let position = &mut staker_info.positions[position_index];
        
        // Check if the position is for the correct token
        require!(
            position.token_mint == ctx.accounts.rewards_mint.key(),
            StakingError::TokenMismatch
        );
        
        // First, update rewards to ensure we have the latest accrued rewards
        let update_rewards_ctx = Context::new(
            ctx.program_id,
            UpdateRewards {
                staking_state: ctx.accounts.staking_state.clone(),
                staker_info: ctx.accounts.staker_info.clone(),
                staker: ctx.accounts.staker.clone(),
                system_program: ctx.accounts.system_program.clone(),
            },
            ctx.remaining_accounts,
            ctx.bumps.clone(),
        );
        
        update_rewards(update_rewards_ctx)?;
        
        // Get the accrued rewards for this position
        let rewards_to_claim = position.accrued_rewards;
        
        // Ensure there are rewards to claim
        require!(rewards_to_claim > 0, StakingError::NoRewardsAvailable);
        
        // Check if auto-compound is requested
        let should_auto_compound = auto_compound.unwrap_or(staker_info.auto_compound_preference);
        
        if should_auto_compound {
            // Add compounded rewards to the position amount
            position.amount = position.amount.saturating_add(rewards_to_claim);
            
            // Update staker's total staked amount
            staker_info.staked_amount = staker_info.staked_amount.saturating_add(rewards_to_claim);
            
            // Update staking state
            let mut staking_state_account = ctx.accounts.staking_state.to_account_info();
            let mut state_data = staking_state_account.try_borrow_mut_data()?;
            let mut state = StakingState::try_deserialize(&mut &state_data[..])?;
            
            state.total_staked_amount = state.total_staked_amount.saturating_add(rewards_to_claim);
            
            // Update token info
            for token in state.supported_tokens.iter_mut() {
                if token.mint == position.token_mint {
                    token.total_staked = token.total_staked.saturating_add(rewards_to_claim);
                    break;
                }
            }
            
            StakingState::try_serialize(&state, &mut &mut state_data[..])?;
            
            msg!("Auto-compounded {} rewards for position ID {}", rewards_to_claim, position_id);
        } else {
            // Transfer rewards from rewards pool to staker
            let seeds = &[
                b"staking_state",
                &[staking_state.bump]
            ];
            let signer = &[&seeds[..]];
            
            let transfer_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.rewards_pool.to_account_info(),
                    to: ctx.accounts.staker_token_account.to_account_info(),
                    authority: ctx.accounts.staking_state.to_account_info(),
                },
                signer,
            );
            
            token::transfer(transfer_ctx, rewards_to_claim)?;
            
            // Update token info in staking state
            let mut staking_state_account = ctx.accounts.staking_state.to_account_info();
            let mut state_data = staking_state_account.try_borrow_mut_data()?;
            let mut state = StakingState::try_deserialize(&mut &state_data[..])?;
            
            // Update rewards pool balance
            for token in state.supported_tokens.iter_mut() {
                if token.mint == position.token_mint {
                    token.rewards_pool_balance = token.rewards_pool_balance.saturating_sub(rewards_to_claim);
                    break;
                }
            }
            
            StakingState::try_serialize(&state, &mut &mut state_data[..])?;
            
            msg!("Claimed {} rewards for position ID {}", rewards_to_claim, position_id);
        }
        
        // Update position's claimed rewards and reset accrued rewards
        position.claimed_rewards = position.claimed_rewards.saturating_add(rewards_to_claim);
        position.accrued_rewards = 0;
        position.last_compound_time = Clock::get()?.unix_timestamp as u64;
        
        Ok(())
    }

    /// Update staking configuration parameters
    pub fn update_staking_config(
        ctx: Context<UpdateStakingConfig>,
        min_stake_period_days: Option<u16>,
        early_unstake_penalty_percent: Option<u8>,
        reward_distribution_interval: Option<u64>,
        base_reward_rate: Option<u16>,
        performance_multiplier_cap: Option<u16>,
        premium_share_percent: Option<u8>,
        is_paused: Option<bool>,
        max_stake_per_wallet: Option<u64>,
        progressive_apy_threshold: Option<u64>,
        progressive_apy_decay_rate: Option<u16>,
        min_liquidity_reserve_percent: Option<u8>,
        auto_compound_enabled: Option<bool>,
        epoch_duration_seconds: Option<u64>,
    ) -> Result<()> {
        let staking_state = &mut ctx.accounts.staking_state;
        
        // Validate authority
        require!(
            ctx.accounts.authority.key() == staking_state.authority || 
            ctx.accounts.authority.key() == staking_state.dao_governance_id,
            StakingError::Unauthorized
        );
        
        // Update parameters if provided
        if let Some(min_period) = min_stake_period_days {
            staking_state.min_stake_period_days = min_period;
        }
        
        if let Some(penalty) = early_unstake_penalty_percent {
            require!(penalty <= 50, StakingError::InvalidParameter); // Max 50% penalty
            staking_state.early_unstake_penalty_percent = penalty;
        }
        
        if let Some(interval) = reward_distribution_interval {
            staking_state.reward_distribution_interval = interval;
        }
        
        if let Some(rate) = base_reward_rate {
            require!(rate <= 5000, StakingError::InvalidParameter); // Max 50% APY
            staking_state.base_reward_rate = rate;
        }
        
        if let Some(cap) = performance_multiplier_cap {
            require!(cap <= 500, StakingError::InvalidParameter); // Max 5x multiplier
            staking_state.performance_multiplier_cap = cap;
        }
        
        if let Some(share) = premium_share_percent {
            require!(share <= 100, StakingError::InvalidParameter);
            staking_state.premium_share_percent = share;
        }
        
        if let Some(paused) = is_paused {
            staking_state.is_paused = paused;
        }
        
        if let Some(max_stake) = max_stake_per_wallet {
            staking_state.max_stake_per_wallet = max_stake;
        }
        
        if let Some(threshold) = progressive_apy_threshold {
            staking_state.progressive_apy_threshold = threshold;
        }
        
        if let Some(decay_rate) = progressive_apy_decay_rate {
            staking_state.progressive_apy_decay_rate = decay_rate;
        }
        
        if let Some(reserve_percent) = min_liquidity_reserve_percent {
            staking_state.min_liquidity_reserve_percent = reserve_percent;
        }
        
        if let Some(auto_compound) = auto_compound_enabled {
            staking_state.auto_compound_enabled = auto_compound;
        }
        
        if let Some(epoch_duration) = epoch_duration_seconds {
            staking_state.epoch_duration_seconds = epoch_duration;
        }
        
        msg!("Staking configuration updated");
        Ok(())
    }

    /// Update token parameters
    pub fn update_token_config(
        ctx: Context<UpdateStakingConfig>,
        token_mint: Pubkey,
        weight: Option<u8>,
        is_active: Option<bool>,
        rewards_pool_balance: Option<u64>,
        last_epoch_rewards_rate: Option<u16>,
    ) -> Result<()> {
        let staking_state = &mut ctx.accounts.staking_state;
        
        // Validate authority
        require!(
            ctx.accounts.authority.key() == staking_state.authority || 
            ctx.accounts.authority.key() == staking_state.dao_governance_id,
            StakingError::Unauthorized
        );
        
        // Find the token
        let token_index = staking_state.supported_tokens.iter()
            .position(|t| t.mint == token_mint)
            .ok_or(StakingError::UnsupportedToken)?;
        
        // Update parameters if provided
        if let Some(w) = weight {
            staking_state.supported_tokens[token_index].weight = w;
        }
        
        if let Some(active) = is_active {
            staking_state.supported_tokens[token_index].is_active = active;
        }
        
        if let Some(balance) = rewards_pool_balance {
            staking_state.supported_tokens[token_index].rewards_pool_balance = balance;
        }
        
        if let Some(rate) = last_epoch_rewards_rate {
            staking_state.supported_tokens[token_index].last_epoch_rewards_rate = rate;
        }
        
        msg!("Token configuration updated for {}", token_mint);
        Ok(())
    }

    /// Calculate and update real-time rewards for a staker
    pub fn update_rewards(
        ctx: Context<UpdateRewards>,
    ) -> Result<()> {
        let staking_state = &ctx.accounts.staking_state;
        let staker_info = &mut ctx.accounts.staker_info;
        
        // Validate program is not paused
        require!(!staking_state.is_paused, StakingError::ProgramPaused);
        
        // Get current time
        let now = Clock::get()?.unix_timestamp as u64;
        
        // Calculate time since last reward calculation
        let time_since_last_calculation = now.saturating_sub(staker_info.last_reward_calculation);
        
        // If no time has passed, nothing to do
        if time_since_last_calculation == 0 {
            return Ok(());
        }
        
        // Calculate rewards for each active position
        let mut total_new_rewards = 0u64;
        
        for position in staker_info.positions.iter_mut() {
            if !position.is_active {
                continue;
            }
            
            // Find token info
            let token_info_opt = staking_state.supported_tokens.iter()
                .find(|t| t.mint == position.token_mint && t.is_active);
            
            let token_info = match token_info_opt {
                Some(info) => info,
                None => continue, // Skip if token not found or inactive
            };
            
            // Calculate time since position start or last compound
            let time_since_last_compound = now.saturating_sub(position.last_compound_time);
            
            // Calculate effective APY based on staked amount
            let effective_apy = calculate_effective_apy(
                staking_state.base_reward_rate,
                position.bonus_multiplier,
                token_info.weight,
                staker_info.staked_amount,
                staking_state.progressive_apy_threshold,
                staking_state.progressive_apy_decay_rate
            );
            
            // Update position's effective APY
            position.effective_apy = effective_apy;
            
            // Calculate rewards
            // Formula: amount * (effective_apy * time_since_last_compound / year)
            let seconds_per_year = 365 * 24 * 60 * 60;
            
            let new_rewards = (position.amount as u128 * effective_apy as u128 * time_since_last_compound as u128 / seconds_per_year as u128 / 10000) as u64;
            
            // Update position's accrued rewards
            position.accrued_rewards = position.accrued_rewards.saturating_add(new_rewards);
            
            // Add to total new rewards
            total_new_rewards = total_new_rewards.saturating_add(new_rewards);
        }
        
        // Update staker's pending rewards
        staker_info.pending_rewards = staker_info.pending_rewards.saturating_add(total_new_rewards);
        
        // Update last reward calculation time
        staker_info.last_reward_calculation = now;
        
        msg!("Updated rewards: {} new rewards accrued", total_new_rewards);
        Ok(())
    }
    
    /// Auto-compound rewards for a stake position
    pub fn auto_compound(
        ctx: Context<ClaimRewards>,
        position_id: u64,
    ) -> Result<()> {
        let staking_state = &ctx.accounts.staking_state;
        let staker_info = &mut ctx.accounts.staker_info;
        
        // Validate program is not paused
        require!(!staking_state.is_paused, StakingError::ProgramPaused);
        
        // Validate auto-compound is enabled globally or for this staker
        require!(
            staking_state.auto_compound_enabled || staker_info.auto_compound_preference,
            StakingError::InvalidParameter
        );
        
        // Find the stake position
        let position_index = staker_info.positions.iter()
            .position(|p| p.id == position_id && p.is_active)
            .ok_or(StakingError::StakePositionNotFound)?;
        
        let position = &mut staker_info.positions[position_index];
        
        // Check if the position is for the correct token
        require!(
            position.token_mint == ctx.accounts.rewards_mint.key(),
            StakingError::TokenMismatch
        );
        
        // First, update rewards to ensure we have the latest accrued rewards
        let update_rewards_ctx = Context::new(
            ctx.program_id,
            UpdateRewards {
                staking_state: ctx.accounts.staking_state.clone(),
                staker_info: ctx.accounts.staker_info.clone(),
                staker: ctx.accounts.staker.clone(),
                system_program: ctx.accounts.system_program.clone(),
            },
            ctx.remaining_accounts,
            ctx.bumps.clone(),
        );
        
        update_rewards(update_rewards_ctx)?;
        
        // Get the accrued rewards for this position
        let rewards_to_compound = position.accrued_rewards;
        
        // Ensure there are rewards to compound
        require!(rewards_to_compound > 0, StakingError::NoRewardsAvailable);
        
        // Add compounded rewards to the position amount
        position.amount = position.amount.saturating_add(rewards_to_compound);
        
        // Update staker's total staked amount
        staker_info.staked_amount = staker_info.staked_amount.saturating_add(rewards_to_compound);
        
        // Reset accrued rewards for this position
        position.accrued_rewards = 0;
        
        // Update last compound time
        position.last_compound_time = Clock::get()?.unix_timestamp as u64;
        
        // Update staking state
        let mut staking_state_account = ctx.accounts.staking_state.to_account_info();
        let mut state_data = staking_state_account.try_borrow_mut_data()?;
        let mut state = StakingState::try_deserialize(&mut &state_data[..])?;
        
        state.total_staked_amount = state.total_staked_amount.saturating_add(rewards_to_compound);
        
        // Update token info
        for token in state.supported_tokens.iter_mut() {
            if token.mint == position.token_mint {
                token.total_staked = token.total_staked.saturating_add(rewards_to_compound);
                break;
            }
        }
        
        StakingState::try_serialize(&state, &mut &mut state_data[..])?;
        
        msg!("Auto-compounded {} rewards for position ID {}", rewards_to_compound, position_id);
        Ok(())
    }
    
    /// Set auto-compound preference for a staker
    pub fn set_auto_compound_preference(
        ctx: Context<UpdateStakerPreference>,
        auto_compound: bool,
    ) -> Result<()> {
        let staker_info = &mut ctx.accounts.staker_info;
        
        // Validate staker
        require!(
            ctx.accounts.staker.key() == staker_info.staker,
            StakingError::Unauthorized
        );
        
        // Update preference
        staker_info.auto_compound_preference = auto_compound;
        
        msg!("Auto-compound preference set to: {}", auto_compound);
        Ok(())
    }
    
    /// Fetch all stakes for a staker (for frontend indexing)
    pub fn fetch_all_stakes(
        ctx: Context<FetchStakerInfo>,
    ) -> Result<()> {
        // This function doesn't modify any state, it's just for the frontend to fetch data
        // The actual data fetching happens on the client side using the account data
        
        msg!("Fetched staker info for: {}", ctx.accounts.staker.key());
        Ok(())
    }
    
    /// Update global reward accrual rates
    pub fn update_reward_accrual(
        ctx: Context<UpdateStakingConfig>,
        reward_accrual_rate_per_epoch: u16,
    ) -> Result<()> {
        let staking_state = &mut ctx.accounts.staking_state;
        
        // Validate authority
        require!(
            ctx.accounts.authority.key() == staking_state.authority,
            StakingError::Unauthorized
        );
        
        // Update reward accrual rate
        staking_state.reward_accrual_rate_per_epoch = reward_accrual_rate_per_epoch;
        
        // Update last reward accrual time
        staking_state.last_reward_accrual_time = Clock::get()?.unix_timestamp as u64;
        
        msg!("Updated reward accrual rate to: {}", reward_accrual_rate_per_epoch);
        Ok(())
    }
    
    /// Check liquidity reserves before unstaking
    fn check_liquidity_reserves(
        staking_state: &StakingState,
        token_mint: Pubkey,
        amount_to_unstake: u64,
    ) -> Result<()> {
        // Find token info
        let token_info_opt = staking_state.supported_tokens.iter()
            .find(|t| t.mint == token_mint && t.is_active);
        
        let token_info = match token_info_opt {
            Some(info) => info,
            None => return Err(StakingError::UnsupportedToken.into()),
        };
        
        // Calculate minimum required reserves
        let min_reserves = (token_info.total_staked as u128 * staking_state.min_liquidity_reserve_percent as u128 / 100) as u64;
        
        // Calculate remaining reserves after unstaking
        let remaining_reserves = token_info.rewards_pool_balance.saturating_sub(amount_to_unstake);
        
        // Ensure remaining reserves meet minimum requirement
        require!(
            remaining_reserves >= min_reserves,
            StakingError::InsufficientLiquidityReserves
        );
        
        Ok(())
    }
    
    /// Calculate effective APY based on staked amount and other factors
    fn calculate_effective_apy(
        base_rate: u16,
        bonus_multiplier: u16,
        token_weight: u8,
        staked_amount: u64,
        progressive_threshold: u64,
        decay_rate: u16,
    ) -> u16 {
        // Start with base rate adjusted by bonus multiplier and token weight
        let mut effective_rate = (base_rate as u32 * (100 + bonus_multiplier as u32) / 100) as u32;
        effective_rate = (effective_rate * token_weight as u32 / 10) as u32;
        
        // Apply progressive decay for large stakers
        if staked_amount > progressive_threshold && decay_rate > 0 {
            // Calculate how much the amount exceeds the threshold
            let excess_amount = staked_amount.saturating_sub(progressive_threshold);
            
            // Calculate decay factor (higher excess = higher decay)
            let decay_factor = (excess_amount as u128 * decay_rate as u128 / progressive_threshold as u128) as u32;
            
            // Apply decay, ensuring rate doesn't go below 10% of original
            effective_rate = effective_rate.saturating_sub(
                std::cmp::min(
                    (effective_rate * decay_factor / 10000),
                    (effective_rate * 90 / 100) // Max 90% reduction
                )
            );
        }
        
        // Ensure rate doesn't exceed max value for u16
        std::cmp::min(effective_rate, u16::MAX as u32) as u16
    }

    /// Calculate unstaking amount and penalty
    fn calculate_unstake_amount(
        position: &StakePosition,
        current_time: u64,
        min_stake_period_days: u16,
        base_penalty_percent: u8,
    ) -> Result<(u64, u64)> {
        // Calculate staking duration in seconds
        let staking_duration = current_time.saturating_sub(position.start_time);
        
        // Convert min stake period to seconds
        let min_stake_period_seconds = min_stake_period_days as u64 * 24 * 60 * 60;
        
        // Calculate unlock time in seconds
        let unlock_time = position.unlock_time;
        
        // Check if early unstaking
        let is_early_unstake = current_time < unlock_time;
        
        if !is_early_unstake {
            // No penalty for unstaking after unlock time
            return Ok((position.amount, 0));
        }
        
        // Calculate how early the unstake is (as a percentage of min stake period)
        let remaining_time = unlock_time.saturating_sub(current_time);
        let early_percent = (remaining_time as f64 / min_stake_period_seconds as f64 * 100.0) as u8;
        
        // Calculate progressive penalty (higher if unstaked very early)
        let penalty_percent = std::cmp::min(
            base_penalty_percent + (early_percent / 10), // Increase penalty by 1% for each 10% of remaining time
            90 // Cap at 90% to prevent complete loss
        );
        
        // Calculate penalty amount
        let penalty_amount = (position.amount as u128 * penalty_percent as u128 / 100) as u64;
        
        // Calculate unstake amount after penalty
        let unstake_amount = position.amount.saturating_sub(penalty_amount);
        
        Ok((unstake_amount, penalty_amount))
    }

}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = StakingState::SIZE,
        seeds = [b"staking_state"],
        bump
    )]
    pub staking_state: Account<'info, StakingState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub staker: Signer<'info>,
    
    #[account(
        seeds = [b"staking_state"],
        bump = staking_state.bump,
    )]
    pub staking_state: Account<'info, StakingState>,
    
    #[account(
        init_if_needed,
        payer = staker,
        space = StakerInfo::SIZE,
        seeds = [b"staker_info", staker.key().as_ref()],
        bump
    )]
    pub staker_info: Account<'info, StakerInfo>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = staker_token_account.owner == staker.key(),
        constraint = staker_token_account.mint == token_mint.key()
    )]
    pub staker_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = staking_pool_token_account.mint == token_mint.key(),
        constraint = staking_pool_token_account.owner == staking_state.key()
    )]
    pub staking_pool_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub staker: Signer<'info>,
    
    #[account(
        seeds = [b"staking_state"],
        bump = staking_state.bump,
    )]
    pub staking_state: Account<'info, StakingState>,
    
    #[account(
        mut,
        seeds = [b"staker_info", staker.key().as_ref()],
        bump = staker_info.bump,
        constraint = staker_info.staker == staker.key()
    )]
    pub staker_info: Account<'info, StakerInfo>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = staker_token_account.owner == staker.key(),
        constraint = staker_token_account.mint == token_mint.key()
    )]
    pub staker_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = staking_pool_token_account.mint == token_mint.key(),
        constraint = staking_pool_token_account.owner == staking_state.key()
    )]
    pub staking_pool_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributeRewards<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"staking_state"],
        bump = staking_state.bump,
    )]
    pub staking_state: Account<'info, StakingState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub staker: Signer<'info>,
    
    #[account(
        seeds = [b"staking_state"],
        bump = staking_state.bump,
    )]
    pub staking_state: Account<'info, StakingState>,
    
    #[account(
        mut,
        seeds = [b"staker_info", staker.key().as_ref()],
        bump = staker_info.bump,
        constraint = staker_info.staker == staker.key()
    )]
    pub staker_info: Account<'info, StakerInfo>,
    
    pub rewards_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = staker_rewards_account.owner == staker.key(),
        constraint = staker_rewards_account.mint == rewards_mint.key()
    )]
    pub staker_rewards_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = rewards_pool_account.mint == rewards_mint.key(),
        constraint = rewards_pool_account.owner == staking_state.key()
    )]
    pub rewards_pool_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateStakingConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"staking_state"],
        bump = staking_state.bump,
    )]
    pub staking_state: Account<'info, StakingState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateRewards<'info> {
    #[account(mut)]
    pub staking_state: Account<'info, StakingState>,
    
    #[account(
        mut,
        seeds = [b"staker_info", staker.key().as_ref()],
        bump = staker_info.bump,
    )]
    pub staker_info: Account<'info, StakerInfo>,
    
    pub staker: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateStakerPreference<'info> {
    #[account(
        mut,
        seeds = [b"staker_info", staker.key().as_ref()],
        bump = staker_info.bump,
    )]
    pub staker_info: Account<'info, StakerInfo>,
    
    pub staker: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FetchStakerInfo<'info> {
    pub staking_state: Account<'info, StakingState>,
    
    #[account(
        seeds = [b"staker_info", staker.key().as_ref()],
        bump = staker_info.bump,
    )]
    pub staker_info: Account<'info, StakerInfo>,
    
    pub staker: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct StakingState {
    pub authority: Pubkey,
    pub risk_pool_id: Pubkey,
    pub dao_governance_id: Pubkey,
    pub min_stake_period_days: u16,
    pub early_unstake_penalty_percent: u8,
    pub reward_distribution_interval: u64,
    pub base_reward_rate: u16,
    pub performance_multiplier_cap: u16,
    pub total_staked_amount: u64,
    pub total_stakers: u64,
    pub total_rewards_distributed: u64,
    pub last_reward_distribution: u64,
    pub premium_share_percent: u8,
    pub is_paused: bool,
    pub supported_tokens: Vec<SupportedToken>,
    pub max_stake_per_wallet: u64,
    pub progressive_apy_threshold: u64,
    pub progressive_apy_decay_rate: u16,
    pub min_liquidity_reserve_percent: u8,
    pub last_reward_accrual_time: u64,
    pub reward_accrual_rate_per_epoch: u16,
    pub auto_compound_enabled: bool,
    pub epoch_duration_seconds: u64,
    pub bump: u8,
}

impl StakingState {
    pub const SIZE: usize = 32 + // authority
                            32 + // risk_pool_id
                            32 + // dao_governance_id
                            2 +  // min_stake_period_days
                            1 +  // early_unstake_penalty_percent
                            8 +  // reward_distribution_interval
                            2 +  // base_reward_rate
                            2 +  // performance_multiplier_cap
                            8 +  // total_staked_amount
                            8 +  // total_stakers
                            8 +  // total_rewards_distributed
                            8 +  // last_reward_distribution
                            1 +  // premium_share_percent
                            1 +  // is_paused
                            4 + (10 * 74) + // supported_tokens (Vec with max 10 tokens)
                            8 +  // max_stake_per_wallet
                            8 +  // progressive_apy_threshold
                            2 +  // progressive_apy_decay_rate
                            1 +  // min_liquidity_reserve_percent
                            8 +  // last_reward_accrual_time
                            2 +  // reward_accrual_rate_per_epoch
                            1 +  // auto_compound_enabled
                            8 +  // epoch_duration_seconds
                            1 +  // bump
                            64;  // padding
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct SupportedToken {
    pub mint: Pubkey,
    pub name: String,
    pub weight: u8,
    pub total_staked: u64,
    pub is_active: bool,
    pub rewards_pool_balance: u64,
    pub last_epoch_rewards_rate: u16,
}

#[account]
#[derive(Default)]
pub struct StakerInfo {
    pub staker: Pubkey,
    pub staked_amount: u64,
    pub next_position_id: u64,
    pub last_stake_time: u64,
    pub positions: Vec<StakePosition>,
    pub pending_rewards: u64,
    pub last_reward_calculation: u64,
    pub auto_compound_preference: bool,
    pub bump: u8,
}

impl StakerInfo {
    pub const SIZE: usize = 32 + // staker
                            8 +  // staked_amount
                            8 +  // next_position_id
                            8 +  // last_stake_time
                            4 + (20 * 73) + // positions (Vec with max 20 positions)
                            8 +  // pending_rewards
                            8 +  // last_reward_calculation
                            1 +  // auto_compound_preference
                            1 +  // bump
                            64;  // padding
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct StakePosition {
    pub id: u64,
    pub amount: u64,
    pub token_mint: Pubkey,
    pub start_time: u64,
    pub unlock_time: u64,
    pub lock_period_days: u16,
    pub bonus_multiplier: u16,
    pub claimed_rewards: u64,
    pub is_active: bool,
    pub last_compound_time: u64,
    pub accrued_rewards: u64,
    pub effective_apy: u16,
}

#[error_code]
pub enum StakingError {
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Invalid parameter")]
    InvalidParameter,
    
    #[msg("Program is paused")]
    ProgramPaused,
    
    #[msg("Invalid amount")]
    InvalidAmount,
    
    #[msg("Lock period too short")]
    LockPeriodTooShort,
    
    #[msg("Unsupported token")]
    UnsupportedToken,
    
    #[msg("Token already supported")]
    TokenAlreadySupported,
    
    #[msg("Stake position not found")]
    StakePositionNotFound,
    
    #[msg("Token mismatch")]
    TokenMismatch,
    
    #[msg("No rewards available")]
    NoRewardsAvailable,
    
    #[msg("Staking cap exceeded")]
    StakingCapExceeded,
    
    #[msg("Insufficient liquidity reserves")]
    InsufficientLiquidityReserves,
    
    #[msg("Mass unstaking protection triggered")]
    MassUnstakingProtection,
    
    #[msg("Reward pool depleted")]
    RewardPoolDepleted,
}
