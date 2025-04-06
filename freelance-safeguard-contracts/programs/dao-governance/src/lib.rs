use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("CFNr5WS1mBkizDCWtQ274jy6ia7AuUmG8FX72ZKHNk1P");

#[program]
pub mod dao_governance {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        voting_token_mint: Pubkey,
        min_stake_amount: u64,
        proposal_threshold: u64,
        voting_period_days: u16,
        execution_delay_days: u16,
    ) -> Result<()> {
        let dao_state = &mut ctx.accounts.dao_state;
        dao_state.authority = ctx.accounts.authority.key();
        dao_state.voting_token_mint = voting_token_mint;
        dao_state.min_stake_amount = min_stake_amount;
        dao_state.proposal_threshold = proposal_threshold;
        dao_state.voting_period_days = voting_period_days;
        dao_state.execution_delay_days = execution_delay_days;
        dao_state.total_proposals = 0;
        dao_state.total_staked = 0;
        dao_state.stakers_count = 0;
        dao_state.is_paused = false;
        dao_state.bump = *ctx.bumps.get("dao_state").unwrap();
        
        msg!("DAO governance initialized");
        Ok(())
    }

    pub fn stake_tokens(
        ctx: Context<StakeTokens>,
        amount: u64,
    ) -> Result<()> {
        let dao_state = &ctx.accounts.dao_state;
        let staker_account = &mut ctx.accounts.staker_account;
        
        // Validate program is not paused
        require!(!dao_state.is_paused, DaoError::ProgramPaused);
        
        // Validate stake amount
        require!(
            amount >= dao_state.min_stake_amount,
            DaoError::InsufficientStakeAmount
        );
        
        // Transfer tokens from user to stake account
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.staker_token_account.to_account_info(),
                to: ctx.accounts.stake_token_account.to_account_info(),
                authority: ctx.accounts.staker.to_account_info(),
            },
        );
        
        token::transfer(transfer_ctx, amount)?;
        
        // Initialize or update staker account
        let is_new_staker = staker_account.staked_amount == 0;
        staker_account.staker = ctx.accounts.staker.key();
        staker_account.staked_amount += amount;
        staker_account.last_stake_timestamp = Clock::get()?.unix_timestamp;
        staker_account.bump = *ctx.bumps.get("staker_account").unwrap();
        
        // Update DAO state
        let mut dao_state_account = ctx.accounts.dao_state.to_account_info();
        let mut dao_data = dao_state_account.try_borrow_mut_data()?;
        let mut state = DaoState::try_deserialize(&mut &dao_data[..])?;
        
        state.total_staked += amount;
        if is_new_staker {
            state.stakers_count += 1;
        }
        
        DaoState::try_serialize(&state, &mut &mut dao_data[..])?;
        
        msg!("Tokens staked successfully");
        Ok(())
    }

    pub fn unstake_tokens(
        ctx: Context<UnstakeTokens>,
        amount: u64,
    ) -> Result<()> {
        let dao_state = &ctx.accounts.dao_state;
        let staker_account = &mut ctx.accounts.staker_account;
        
        // Validate program is not paused
        require!(!dao_state.is_paused, DaoError::ProgramPaused);
        
        // Validate unstake amount
        require!(
            amount <= staker_account.staked_amount,
            DaoError::InsufficientStakedAmount
        );
        
        // Transfer tokens from stake account to user
        let seeds = &[
            b"staker".as_ref(),
            staker_account.staker.as_ref(),
            &[staker_account.bump],
        ];
        let signer = &[&seeds[..]];
        
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.stake_token_account.to_account_info(),
                to: ctx.accounts.staker_token_account.to_account_info(),
                authority: ctx.accounts.staker_account.to_account_info(),
            },
            signer,
        );
        
        token::transfer(transfer_ctx, amount)?;
        
        // Update staker account
        staker_account.staked_amount -= amount;
        let is_unstaked_fully = staker_account.staked_amount == 0;
        
        // Update DAO state
        let mut dao_state_account = ctx.accounts.dao_state.to_account_info();
        let mut dao_data = dao_state_account.try_borrow_mut_data()?;
        let mut state = DaoState::try_deserialize(&mut &dao_data[..])?;
        
        state.total_staked -= amount;
        if is_unstaked_fully {
            state.stakers_count -= 1;
        }
        
        DaoState::try_serialize(&state, &mut &mut dao_data[..])?;
        
        msg!("Tokens unstaked successfully");
        Ok(())
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        program_id: Pubkey,
        instruction_data: Vec<u8>,
        accounts: Vec<ProposalAccount>,
    ) -> Result<()> {
        let dao_state = &ctx.accounts.dao_state;
        let proposal = &mut ctx.accounts.proposal;
        let staker_account = &ctx.accounts.staker_account;
        let clock = Clock::get()?;
        
        // Validate program is not paused
        require!(!dao_state.is_paused, DaoError::ProgramPaused);
        
        // Validate proposer has enough stake
        require!(
            staker_account.staked_amount >= dao_state.proposal_threshold,
            DaoError::InsufficientStakeForProposal
        );
        
        // Initialize proposal
        proposal.proposer = ctx.accounts.proposer.key();
        proposal.title = title;
        proposal.description = description;
        proposal.program_id = program_id;
        proposal.instruction_data = instruction_data;
        proposal.accounts = accounts;
        proposal.created_at = clock.unix_timestamp;
        proposal.voting_ends_at = clock.unix_timestamp + (dao_state.voting_period_days as i64 * 86400);
        proposal.execution_time = proposal.voting_ends_at + (dao_state.execution_delay_days as i64 * 86400);
        proposal.status = ProposalStatus::Active;
        proposal.yes_votes = 0;
        proposal.no_votes = 0;
        proposal.executed = false;
        proposal.bump = *ctx.bumps.get("proposal").unwrap();
        
        // Update DAO state
        let mut dao_state_account = ctx.accounts.dao_state.to_account_info();
        let mut dao_data = dao_state_account.try_borrow_mut_data()?;
        let mut state = DaoState::try_deserialize(&mut &dao_data[..])?;
        
        state.total_proposals += 1;
        
        DaoState::try_serialize(&state, &mut &mut dao_data[..])?;
        
        msg!("Proposal created successfully");
        Ok(())
    }

    pub fn vote_on_proposal(
        ctx: Context<VoteOnProposal>,
        vote: bool,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let staker_account = &ctx.accounts.staker_account;
        let vote_record = &mut ctx.accounts.vote_record;
        let clock = Clock::get()?;
        
        // Validate proposal is active
        require!(
            proposal.status == ProposalStatus::Active,
            DaoError::ProposalNotActive
        );
        
        // Validate voting period hasn't ended
        require!(
            clock.unix_timestamp < proposal.voting_ends_at,
            DaoError::VotingPeriodEnded
        );
        
        // Initialize vote record
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.proposal = ctx.accounts.proposal.key();
        vote_record.vote = vote;
        vote_record.voting_power = staker_account.staked_amount;
        vote_record.timestamp = clock.unix_timestamp;
        vote_record.bump = *ctx.bumps.get("vote_record").unwrap();
        
        // Update proposal vote counts
        if vote {
            proposal.yes_votes += staker_account.staked_amount;
        } else {
            proposal.no_votes += staker_account.staked_amount;
        }
        
        msg!("Vote recorded successfully");
        Ok(())
    }

    pub fn finalize_proposal(
        ctx: Context<FinalizeProposal>,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let clock = Clock::get()?;
        
        // Validate proposal is active
        require!(
            proposal.status == ProposalStatus::Active,
            DaoError::ProposalNotActive
        );
        
        // Validate voting period has ended
        require!(
            clock.unix_timestamp >= proposal.voting_ends_at,
            DaoError::VotingPeriodNotEnded
        );
        
        // Determine if proposal passed
        let total_votes = proposal.yes_votes + proposal.no_votes;
        let passed = total_votes > 0 && proposal.yes_votes > proposal.no_votes;
        
        // Update proposal status
        proposal.status = if passed {
            ProposalStatus::Approved
        } else {
            ProposalStatus::Rejected
        };
        
        msg!("Proposal finalized successfully");
        Ok(())
    }

    pub fn execute_proposal(
        ctx: Context<ExecuteProposal>,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let clock = Clock::get()?;
        
        // Validate proposal is approved
        require!(
            proposal.status == ProposalStatus::Approved,
            DaoError::ProposalNotApproved
        );
        
        // Validate execution delay has passed
        require!(
            clock.unix_timestamp >= proposal.execution_time,
            DaoError::ExecutionDelayNotPassed
        );
        
        // Validate proposal hasn't been executed
        require!(
            !proposal.executed,
            DaoError::ProposalAlreadyExecuted
        );
        
        // Mark proposal as executed
        proposal.executed = true;
        
        // Note: The actual execution of the proposal's instruction would be handled
        // by the client, which would use the proposal's instruction_data and accounts
        // to construct and submit the transaction
        
        msg!("Proposal marked as executed");
        Ok(())
    }

    pub fn update_dao_parameters(
        ctx: Context<UpdateDaoParameters>,
        min_stake_amount: Option<u64>,
        proposal_threshold: Option<u64>,
        voting_period_days: Option<u16>,
        execution_delay_days: Option<u16>,
        is_paused: Option<bool>,
    ) -> Result<()> {
        let dao_state = &mut ctx.accounts.dao_state;
        
        // Validate authority
        require!(
            ctx.accounts.authority.key() == dao_state.authority,
            DaoError::Unauthorized
        );
        
        // Update parameters if provided
        if let Some(amount) = min_stake_amount {
            dao_state.min_stake_amount = amount;
        }
        
        if let Some(threshold) = proposal_threshold {
            dao_state.proposal_threshold = threshold;
        }
        
        if let Some(period) = voting_period_days {
            dao_state.voting_period_days = period;
        }
        
        if let Some(delay) = execution_delay_days {
            dao_state.execution_delay_days = delay;
        }
        
        if let Some(paused) = is_paused {
            dao_state.is_paused = paused;
        }
        
        msg!("DAO parameters updated");
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
        space = 8 + DaoState::SIZE,
        seeds = [b"dao_state"],
        bump
    )]
    pub dao_state: Account<'info, DaoState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakeTokens<'info> {
    #[account(mut)]
    pub staker: Signer<'info>,
    
    #[account(
        seeds = [b"dao_state"],
        bump = dao_state.bump,
    )]
    pub dao_state: Account<'info, DaoState>,
    
    #[account(
        init_if_needed,
        payer = staker,
        space = 8 + StakerAccount::SIZE,
        seeds = [b"staker", staker.key().as_ref()],
        bump
    )]
    pub staker_account: Account<'info, StakerAccount>,
    
    #[account(
        mut,
        constraint = staker_token_account.owner == staker.key(),
        constraint = staker_token_account.mint == dao_state.voting_token_mint
    )]
    pub staker_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = stake_token_account.mint == dao_state.voting_token_mint
    )]
    pub stake_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UnstakeTokens<'info> {
    #[account(mut)]
    pub staker: Signer<'info>,
    
    #[account(
        seeds = [b"dao_state"],
        bump = dao_state.bump,
    )]
    pub dao_state: Account<'info, DaoState>,
    
    #[account(
        mut,
        seeds = [b"staker", staker.key().as_ref()],
        bump = staker_account.bump,
        constraint = staker_account.staker == staker.key(),
    )]
    pub staker_account: Account<'info, StakerAccount>,
    
    #[account(
        mut,
        constraint = staker_token_account.owner == staker.key(),
        constraint = staker_token_account.mint == dao_state.voting_token_mint
    )]
    pub staker_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = stake_token_account.mint == dao_state.voting_token_mint
    )]
    pub stake_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub proposer: Signer<'info>,
    
    #[account(
        seeds = [b"dao_state"],
        bump = dao_state.bump,
    )]
    pub dao_state: Account<'info, DaoState>,
    
    #[account(
        seeds = [b"staker", proposer.key().as_ref()],
        bump = staker_account.bump,
        constraint = staker_account.staker == proposer.key(),
    )]
    pub staker_account: Account<'info, StakerAccount>,
    
    #[account(
        init,
        payer = proposer,
        space = 8 + Proposal::SIZE,
        seeds = [b"proposal", &dao_state.total_proposals.to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VoteOnProposal<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    
    #[account(
        seeds = [b"staker", voter.key().as_ref()],
        bump = staker_account.bump,
        constraint = staker_account.staker == voter.key(),
    )]
    pub staker_account: Account<'info, StakerAccount>,
    
    #[account(
        mut,
        constraint = proposal.status == ProposalStatus::Active,
    )]
    pub proposal: Account<'info, Proposal>,
    
    #[account(
        init,
        payer = voter,
        space = 8 + VoteRecord::SIZE,
        seeds = [b"vote", proposal.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeProposal<'info> {
    #[account(mut)]
    pub finalizer: Signer<'info>,
    
    #[account(
        mut,
        constraint = proposal.status == ProposalStatus::Active,
    )]
    pub proposal: Account<'info, Proposal>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut)]
    pub executor: Signer<'info>,
    
    #[account(
        mut,
        constraint = proposal.status == ProposalStatus::Approved,
        constraint = !proposal.executed,
    )]
    pub proposal: Account<'info, Proposal>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateDaoParameters<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"dao_state"],
        bump = dao_state.bump,
        constraint = authority.key() == dao_state.authority
    )]
    pub dao_state: Account<'info, DaoState>,
    
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct DaoState {
    pub authority: Pubkey,
    pub voting_token_mint: Pubkey,
    pub min_stake_amount: u64,
    pub proposal_threshold: u64,
    pub voting_period_days: u16,
    pub execution_delay_days: u16,
    pub total_proposals: u64,
    pub total_staked: u64,
    pub stakers_count: u64,
    pub is_paused: bool,
    pub bump: u8,
}

impl DaoState {
    pub const SIZE: usize = 32 + // authority
                            32 + // voting_token_mint
                            8 +  // min_stake_amount
                            8 +  // proposal_threshold
                            2 +  // voting_period_days
                            2 +  // execution_delay_days
                            8 +  // total_proposals
                            8 +  // total_staked
                            8 +  // stakers_count
                            1 +  // is_paused
                            1;   // bump
}

#[account]
#[derive(Default)]
pub struct StakerAccount {
    pub staker: Pubkey,
    pub staked_amount: u64,
    pub last_stake_timestamp: i64,
    pub bump: u8,
}

impl StakerAccount {
    pub const SIZE: usize = 32 + // staker
                            8 +  // staked_amount
                            8 +  // last_stake_timestamp
                            1;   // bump
}

#[account]
#[derive(Default)]
pub struct Proposal {
    pub proposer: Pubkey,
    pub title: String,
    pub description: String,
    pub program_id: Pubkey,
    pub instruction_data: Vec<u8>,
    pub accounts: Vec<ProposalAccount>,
    pub created_at: i64,
    pub voting_ends_at: i64,
    pub execution_time: i64,
    pub status: ProposalStatus,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub executed: bool,
    pub bump: u8,
}

impl Proposal {
    pub const SIZE: usize = 32 + // proposer
                            64 + // title (max length)
                            256 + // description (max length)
                            32 + // program_id
                            256 + // instruction_data (max size)
                            512 + // accounts (max size for vector)
                            8 +  // created_at
                            8 +  // voting_ends_at
                            8 +  // execution_time
                            1 +  // status
                            8 +  // yes_votes
                            8 +  // no_votes
                            1 +  // executed
                            1;   // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ProposalAccount {
    pub pubkey: Pubkey,
    pub is_signer: bool,
    pub is_writable: bool,
}

#[account]
#[derive(Default)]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub proposal: Pubkey,
    pub vote: bool,
    pub voting_power: u64,
    pub timestamp: i64,
    pub bump: u8,
}

impl VoteRecord {
    pub const SIZE: usize = 32 + // voter
                            32 + // proposal
                            1 +  // vote
                            8 +  // voting_power
                            8 +  // timestamp
                            1;   // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum ProposalStatus {
    Active,
    Approved,
    Rejected,
    Executed,
}

impl Default for ProposalStatus {
    fn default() -> Self {
        ProposalStatus::Active
    }
}

#[error_code]
pub enum DaoError {
    #[msg("Program is paused")]
    ProgramPaused,
    
    #[msg("Insufficient stake amount")]
    InsufficientStakeAmount,
    
    #[msg("Insufficient staked amount")]
    InsufficientStakedAmount,
    
    #[msg("Insufficient stake for proposal")]
    InsufficientStakeForProposal,
    
    #[msg("Proposal is not active")]
    ProposalNotActive,
    
    #[msg("Proposal is not approved")]
    ProposalNotApproved,
    
    #[msg("Voting period has ended")]
    VotingPeriodEnded,
    
    #[msg("Voting period has not ended")]
    VotingPeriodNotEnded,
    
    #[msg("Execution delay has not passed")]
    ExecutionDelayNotPassed,
    
    #[msg("Proposal has already been executed")]
    ProposalAlreadyExecuted,
    
    #[msg("Unauthorized access")]
    Unauthorized,
}
