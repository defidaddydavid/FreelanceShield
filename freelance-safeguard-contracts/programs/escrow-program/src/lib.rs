use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use solana_program::program::{invoke, invoke_signed};
use solana_program::instruction::Instruction;
use solana_program::system_instruction;

declare_id!("5yWSCq9kvXTeB2JAKSZu7mPPoR7Nw5nFQotVU9ApfsCz");

// Define program IDs for cross-program invocation
pub const INSURANCE_PROGRAM_ID: Pubkey = solana_program::pubkey!("2vFoxWTSRERwtcfwEb6Zgm2iWS3ewU1Y94K224Gw7CJm");
pub const REPUTATION_PROGRAM_ID: Pubkey = solana_program::pubkey!("jq3B5tb6Teg9A1oDqsD2fGnuhb357vceeMrAuYEmz9d");

#[program]
pub mod escrow_program {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        insurance_program_id: Pubkey,
        dispute_resolution_fee: u64,
        auto_release_days: u16,
    ) -> Result<()> {
        let escrow_state = &mut ctx.accounts.escrow_state;
        escrow_state.authority = ctx.accounts.authority.key();
        escrow_state.insurance_program_id = insurance_program_id;
        escrow_state.dispute_resolution_fee = dispute_resolution_fee;
        escrow_state.auto_release_days = auto_release_days;
        escrow_state.total_escrows = 0;
        escrow_state.active_escrows = 0;
        escrow_state.total_volume = 0;
        escrow_state.successful_escrows = 0;
        escrow_state.disputed_escrows = 0;
        escrow_state.average_completion_time = 0;
        escrow_state.is_paused = false;
        escrow_state.last_update_timestamp = 0;
        escrow_state.bump = *ctx.bumps.get("escrow_state").unwrap();
        
        msg!("Escrow program initialized");
        Ok(())
    }

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        amount: u64,
        milestones: Vec<Milestone>,
        description: String,
        deadline: i64,
    ) -> Result<()> {
        let escrow_state = &ctx.accounts.escrow_state;
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;
        
        // Validate parameters
        require!(!escrow_state.is_paused, EscrowError::ProgramPaused);
        require!(amount > 0, EscrowError::InvalidAmount);
        require!(deadline > clock.unix_timestamp, EscrowError::InvalidDeadline);
        require!(!milestones.is_empty(), EscrowError::NoMilestones);
        
        // Validate milestone amounts sum to total
        let milestone_sum: u64 = milestones.iter().map(|m| m.amount).sum();
        require!(milestone_sum == amount, EscrowError::MilestoneAmountMismatch);
        
        // Initialize escrow
        escrow.client = ctx.accounts.client.key();
        escrow.freelancer = ctx.accounts.freelancer.key();
        escrow.amount = amount;
        escrow.description = description;
        escrow.created_at = clock.unix_timestamp;
        escrow.deadline = deadline;
        escrow.status = EscrowStatus::Active;
        escrow.milestones = milestones;
        escrow.completed_milestones = 0;
        escrow.disputed = false;
        escrow.auto_release_date = clock.unix_timestamp + (escrow_state.auto_release_days as i64 * 86400);
        escrow.last_activity_at = clock.unix_timestamp;
        escrow.transaction_signatures = vec![];
        escrow.last_notification_at = 0;
        escrow.client_confirmed_completion = false;
        escrow.freelancer_confirmed_completion = false;
        escrow.bump = *ctx.bumps.get("escrow").unwrap();
        
        // Transfer funds from client to escrow account
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.client_token_account.to_account_info(),
                to: ctx.accounts.escrow_token_account.to_account_info(),
                authority: ctx.accounts.client.to_account_info(),
            },
        );
        
        token::transfer(transfer_ctx, amount)?;
        
        // Record transaction
        let transaction_record = TransactionRecord {
            timestamp: clock.unix_timestamp,
            signature: ctx.accounts.transaction_signature.to_string(),
            transaction_type: TransactionType::Deposit,
            amount,
            milestone_index: None,
        };
        escrow.transaction_signatures.push(transaction_record);
        
        // Update escrow state
        let mut escrow_state_account = ctx.accounts.escrow_state.to_account_info();
        let mut escrow_data = escrow_state_account.try_borrow_mut_data()?;
        let mut state = EscrowState::try_deserialize(&mut &escrow_data[..])?;
        
        state.total_escrows += 1;
        state.active_escrows += 1;
        state.total_volume += amount;
        state.last_update_timestamp = clock.unix_timestamp;
        
        EscrowState::try_serialize(&state, &mut &mut escrow_data[..])?;
        
        // Notify insurance program about the new escrow
        if ctx.accounts.insurance_program.key() == escrow_state.insurance_program_id {
            let insurance_update_ix = Instruction {
                program_id: INSURANCE_PROGRAM_ID,
                accounts: vec![
                    AccountMeta::new(ctx.accounts.client.key(), false),
                    AccountMeta::new(ctx.accounts.freelancer.key(), false),
                    AccountMeta::new_readonly(ctx.accounts.escrow.key(), false),
                ],
                data: [1, 0, 0, 0].to_vec(), // Register escrow instruction
            };
            
            invoke(
                &insurance_update_ix,
                &[
                    ctx.accounts.client.to_account_info(),
                    ctx.accounts.freelancer.to_account_info(),
                    ctx.accounts.escrow.to_account_info(),
                ],
            )?;
        }
        
        msg!("Escrow created successfully");
        Ok(())
    }

    pub fn release_milestone(
        ctx: Context<ReleaseMilestone>,
        milestone_index: u8,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;
        
        // Validate client is signer
        require!(
            ctx.accounts.client.key() == escrow.client,
            EscrowError::Unauthorized
        );
        
        // Validate escrow is active
        require!(
            escrow.status == EscrowStatus::Active,
            EscrowError::EscrowNotActive
        );
        
        // Validate milestone index
        require!(
            (milestone_index as usize) < escrow.milestones.len(),
            EscrowError::InvalidMilestoneIndex
        );
        
        // Validate milestone is not already completed
        require!(
            !escrow.milestones[milestone_index as usize].completed,
            EscrowError::MilestoneAlreadyCompleted
        );
        
        // Mark milestone as completed
        escrow.milestones[milestone_index as usize].completed = true;
        escrow.milestones[milestone_index as usize].completed_at = Some(clock.unix_timestamp);
        escrow.completed_milestones += 1;
        
        // Transfer milestone amount to freelancer
        let milestone_amount = escrow.milestones[milestone_index as usize].amount;
        
        let seeds = &[
            b"escrow".as_ref(),
            escrow.client.as_ref(),
            escrow.freelancer.as_ref(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];
        
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.freelancer_token_account.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            },
            signer,
        );
        
        token::transfer(transfer_ctx, milestone_amount)?;
        
        // Update transaction signatures
        let transaction_record = TransactionRecord {
            timestamp: clock.unix_timestamp,
            signature: ctx.accounts.transaction_signature.to_string(),
            transaction_type: TransactionType::MilestoneRelease,
            amount: milestone_amount,
            milestone_index: Some(milestone_index),
        };
        escrow.transaction_signatures.push(transaction_record);
        
        // Check if all milestones are completed
        if escrow.completed_milestones as usize == escrow.milestones.len() {
            escrow.status = EscrowStatus::Completed;
            escrow.completion_date = Some(clock.unix_timestamp);
            
            // Update escrow state
            let mut escrow_state_account = ctx.accounts.escrow_state.to_account_info();
            let mut escrow_data = escrow_state_account.try_borrow_mut_data()?;
            let mut state = EscrowState::try_deserialize(&mut &escrow_data[..])?;
            
            state.active_escrows -= 1;
            state.successful_escrows += 1;
            state.last_update_timestamp = clock.unix_timestamp;
            
            EscrowState::try_serialize(&state, &mut &mut escrow_data[..])?;
        }
        
        // Update last activity at
        escrow.last_activity_at = clock.unix_timestamp;
        
        // Notify reputation program about the milestone completion
        let reputation_update_ix = Instruction {
            program_id: REPUTATION_PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(ctx.accounts.client.key(), false),
                AccountMeta::new(ctx.accounts.freelancer.key(), false),
                AccountMeta::new_readonly(ctx.accounts.escrow.key(), false),
            ],
            data: [1, 0, 0, 0].to_vec(), // Update contract progress instruction
        };
        
        invoke(
            &reputation_update_ix,
            &[
                ctx.accounts.client.to_account_info(),
                ctx.accounts.freelancer.to_account_info(),
                ctx.accounts.escrow.to_account_info(),
            ],
        )?;
        
        msg!("Milestone released successfully");
        Ok(())
    }

    pub fn dispute_escrow(
        ctx: Context<DisputeEscrow>,
        reason: String,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let escrow_state = &ctx.accounts.escrow_state;
        
        // Validate escrow is active
        require!(
            escrow.status == EscrowStatus::Active,
            EscrowError::EscrowNotActive
        );
        
        // Validate not already disputed
        require!(!escrow.disputed, EscrowError::AlreadyDisputed);
        
        // Validate caller is either client or freelancer
        require!(
            ctx.accounts.disputer.key() == escrow.client || 
            ctx.accounts.disputer.key() == escrow.freelancer,
            EscrowError::Unauthorized
        );
        
        // Pay dispute resolution fee
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.disputer_token_account.to_account_info(),
                to: ctx.accounts.fee_account.to_account_info(),
                authority: ctx.accounts.disputer.to_account_info(),
            },
        );
        
        token::transfer(transfer_ctx, escrow_state.dispute_resolution_fee)?;
        
        // Mark escrow as disputed
        escrow.disputed = true;
        escrow.dispute_details = Some(DisputeDetails {
            initiated_by: ctx.accounts.disputer.key(),
            initiated_at: Clock::get()?.unix_timestamp,
            reason,
            resolution: None,
        });
        
        // Update transaction signatures
        let transaction_record = TransactionRecord {
            timestamp: Clock::get()?.unix_timestamp,
            signature: ctx.accounts.transaction_signature.to_string(),
            transaction_type: TransactionType::DisputeFee,
            amount: escrow_state.dispute_resolution_fee,
            milestone_index: None,
        };
        escrow.transaction_signatures.push(transaction_record);
        
        // Update last activity at
        escrow.last_activity_at = Clock::get()?.unix_timestamp;
        
        msg!("Escrow disputed successfully");
        Ok(())
    }

    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        client_percentage: u8,
        freelancer_percentage: u8,
        resolution_notes: String,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let escrow_state = &ctx.accounts.escrow_state;
        let clock = Clock::get()?;
        
        // Validate authority
        require!(
            ctx.accounts.authority.key() == escrow_state.authority,
            EscrowError::Unauthorized
        );
        
        // Validate escrow is disputed
        require!(escrow.disputed, EscrowError::NotDisputed);
        
        // Validate percentages add up to 100
        require!(
            client_percentage + freelancer_percentage == 100,
            EscrowError::InvalidPercentages
        );
        
        // Calculate remaining amount in escrow
        let mut remaining_amount = escrow.amount;
        for milestone in escrow.milestones.iter() {
            if milestone.completed {
                remaining_amount = remaining_amount.saturating_sub(milestone.amount);
            }
        }
        
        if remaining_amount > 0 {
            // Calculate amounts for each party
            let client_amount = (remaining_amount as u128 * client_percentage as u128 / 100) as u64;
            let freelancer_amount = remaining_amount - client_amount;
            
            let escrow_seeds = &[
                b"escrow".as_ref(),
                escrow.client.as_ref(),
                escrow.freelancer.as_ref(),
                &[escrow.bump],
            ];
            let escrow_signer = &[&escrow_seeds[..]];
            
            // Transfer client portion if any
            if client_amount > 0 {
                let transfer_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_token_account.to_account_info(),
                        to: ctx.accounts.client_token_account.to_account_info(),
                        authority: ctx.accounts.escrow.to_account_info(),
                    },
                    escrow_signer,
                );
                
                token::transfer(transfer_ctx, client_amount)?;
                
                // Update transaction signatures
                let transaction_record = TransactionRecord {
                    timestamp: clock.unix_timestamp,
                    signature: ctx.accounts.transaction_signature.to_string(),
                    transaction_type: TransactionType::DisputeResolution,
                    amount: client_amount,
                    milestone_index: None,
                };
                escrow.transaction_signatures.push(transaction_record);
            }
            
            // Transfer freelancer portion if any
            if freelancer_amount > 0 {
                let transfer_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_token_account.to_account_info(),
                        to: ctx.accounts.freelancer_token_account.to_account_info(),
                        authority: ctx.accounts.escrow.to_account_info(),
                    },
                    escrow_signer,
                );
                
                token::transfer(transfer_ctx, freelancer_amount)?;
                
                // Update transaction signatures
                let transaction_record = TransactionRecord {
                    timestamp: clock.unix_timestamp,
                    signature: ctx.accounts.transaction_signature.to_string(),
                    transaction_type: TransactionType::DisputeResolution,
                    amount: freelancer_amount,
                    milestone_index: None,
                };
                escrow.transaction_signatures.push(transaction_record);
            }
        }
        
        // Update escrow
        escrow.status = EscrowStatus::Resolved;
        escrow.dispute_details.as_mut().unwrap().resolution = Some(DisputeResolution {
            resolved_at: clock.unix_timestamp,
            client_percentage,
            freelancer_percentage,
            resolver: ctx.accounts.authority.key(),
            notes: resolution_notes,
        });
        escrow.resolved_at = Some(clock.unix_timestamp);
        
        // Update escrow state
        let mut escrow_state_account = ctx.accounts.escrow_state.to_account_info();
        let mut escrow_data = escrow_state_account.try_borrow_mut_data()?;
        let mut state = EscrowState::try_deserialize(&mut &escrow_data[..])?;
        
        state.active_escrows -= 1;
        state.disputed_escrows += 1;
        state.last_update_timestamp = clock.unix_timestamp;
        
        EscrowState::try_serialize(&state, &mut &mut escrow_data[..])?;
        
        // Update last activity at
        escrow.last_activity_at = clock.unix_timestamp;
        
        msg!("Dispute resolved successfully");
        Ok(())
    }

    pub fn update_escrow_parameters(
        ctx: Context<UpdateEscrowParameters>,
        dispute_resolution_fee: Option<u64>,
        auto_release_days: Option<u16>,
        is_paused: Option<bool>,
    ) -> Result<()> {
        let escrow_state = &mut ctx.accounts.escrow_state;
        
        // Validate authority
        require!(
            ctx.accounts.authority.key() == escrow_state.authority,
            EscrowError::Unauthorized
        );
        
        // Update parameters if provided
        if let Some(fee) = dispute_resolution_fee {
            escrow_state.dispute_resolution_fee = fee;
        }
        
        if let Some(days) = auto_release_days {
            escrow_state.auto_release_days = days;
        }
        
        if let Some(paused) = is_paused {
            escrow_state.is_paused = paused;
        }
        
        escrow_state.last_update_timestamp = Clock::get()?.unix_timestamp;
        
        msg!("Escrow parameters updated");
        Ok(())
    }

    pub fn complete_escrow(
        ctx: Context<CompleteEscrow>,
        feedback: String,
        rating: u8,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;
        
        // Validate escrow is active
        require!(
            escrow.status == EscrowStatus::Active,
            EscrowError::EscrowNotActive
        );
        
        // Validate all milestones are completed
        require!(
            escrow.completed_milestones as usize == escrow.milestones.len(),
            EscrowError::NotAllMilestonesCompleted
        );
        
        // Validate caller is client
        require!(
            ctx.accounts.client.key() == escrow.client,
            EscrowError::Unauthorized
        );
        
        // Mark escrow as completed
        escrow.status = EscrowStatus::Completed;
        escrow.completion_date = Some(clock.unix_timestamp);
        escrow.client_confirmed_completion = true;
        
        // Calculate completion metrics
        let completion_time = clock.unix_timestamp - escrow.created_at;
        
        // Update escrow state
        let mut escrow_state_account = ctx.accounts.escrow_state.to_account_info();
        let mut escrow_data = escrow_state_account.try_borrow_mut_data()?;
        let mut state = EscrowState::try_deserialize(&mut &escrow_data[..])?;
        
        state.active_escrows -= 1;
        state.successful_escrows += 1;
        
        // Update average completion time
        if state.successful_escrows == 1 {
            state.average_completion_time = completion_time;
        } else {
            let total_time = state.average_completion_time * (state.successful_escrows - 1) as i64;
            state.average_completion_time = (total_time + completion_time) / state.successful_escrows as i64;
        }
        
        state.last_update_timestamp = clock.unix_timestamp;
        EscrowState::try_serialize(&state, &mut &mut escrow_data[..])?;
        
        // Update last activity timestamp
        escrow.last_activity_at = clock.unix_timestamp;
        
        // Notify reputation program about contract completion
        let reputation_update_ix = Instruction {
            program_id: REPUTATION_PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(ctx.accounts.client.key(), false),
                AccountMeta::new(ctx.accounts.freelancer.key(), false),
                AccountMeta::new_readonly(ctx.accounts.escrow.key(), false),
            ],
            data: [2, 0, 0, 0, rating].to_vec(), // Complete contract instruction with rating
        };
        
        invoke(
            &reputation_update_ix,
            &[
                ctx.accounts.client.to_account_info(),
                ctx.accounts.freelancer.to_account_info(),
                ctx.accounts.escrow.to_account_info(),
            ],
        )?;
        
        msg!("Escrow completed successfully with rating {}", rating);
        Ok(())
    }

    pub fn confirm_completion(
        ctx: Context<ConfirmCompletion>,
        feedback: String,
        rating: u8,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;
        
        // Validate caller is freelancer
        require!(
            ctx.accounts.freelancer.key() == escrow.freelancer,
            EscrowError::Unauthorized
        );
        
        // Validate escrow status is appropriate
        require!(
            escrow.status == EscrowStatus::Active || 
            escrow.status == EscrowStatus::Completed,
            EscrowError::InvalidEscrowStatus
        );
        
        // Mark freelancer confirmation
        escrow.freelancer_confirmed_completion = true;
        
        // Update last activity timestamp
        escrow.last_activity_at = clock.unix_timestamp;
        
        // If both parties have confirmed, update status if not already completed
        if escrow.client_confirmed_completion && escrow.freelancer_confirmed_completion && escrow.status != EscrowStatus::Completed {
            escrow.status = EscrowStatus::Completed;
            escrow.completion_date = Some(clock.unix_timestamp);
            
            // Update escrow state
            let mut escrow_state_account = ctx.accounts.escrow_state.to_account_info();
            let mut escrow_data = escrow_state_account.try_borrow_mut_data()?;
            let mut state = EscrowState::try_deserialize(&mut &escrow_data[..])?;
            
            state.active_escrows -= 1;
            state.successful_escrows += 1;
            state.last_update_timestamp = clock.unix_timestamp;
            
            EscrowState::try_serialize(&state, &mut &mut escrow_data[..])?;
        }
        
        // Notify reputation program about the feedback
        let reputation_update_ix = Instruction {
            program_id: REPUTATION_PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(ctx.accounts.client.key(), false),
                AccountMeta::new(ctx.accounts.freelancer.key(), true),
                AccountMeta::new_readonly(ctx.accounts.escrow.key(), false),
            ],
            data: [3, 0, 0, 0, rating].to_vec(), // Submit feedback instruction with rating
        };
        
        invoke(
            &reputation_update_ix,
            &[
                ctx.accounts.client.to_account_info(),
                ctx.accounts.freelancer.to_account_info(),
                ctx.accounts.escrow.to_account_info(),
            ],
        )?;
        
        msg!("Completion confirmation recorded with rating {}", rating);
        Ok(())
    }

    pub fn get_escrow_analytics(
        ctx: Context<GetEscrowAnalytics>,
    ) -> Result<EscrowAnalytics> {
        let escrow_state = &ctx.accounts.escrow_state;
        
        // Calculate success rate
        let success_rate = if escrow_state.total_escrows > 0 {
            (escrow_state.successful_escrows as f64 / escrow_state.total_escrows as f64) * 100.0
        } else {
            0.0
        };
        
        // Calculate dispute rate
        let dispute_rate = if escrow_state.total_escrows > 0 {
            (escrow_state.disputed_escrows as f64 / escrow_state.total_escrows as f64) * 100.0
        } else {
            0.0
        };
        
        // Format average completion time into days, hours, minutes
        let avg_completion_days = escrow_state.average_completion_time / 86400;
        let avg_completion_hours = (escrow_state.average_completion_time % 86400) / 3600;
        let avg_completion_minutes = (escrow_state.average_completion_time % 3600) / 60;
        
        let analytics = EscrowAnalytics {
            total_escrows: escrow_state.total_escrows,
            active_escrows: escrow_state.active_escrows,
            total_volume: escrow_state.total_volume,
            successful_escrows: escrow_state.successful_escrows,
            disputed_escrows: escrow_state.disputed_escrows,
            success_rate: (success_rate * 100.0) as u32, // Store as basis points
            dispute_rate: (dispute_rate * 100.0) as u32, // Store as basis points
            average_completion_time: escrow_state.average_completion_time,
            avg_completion_days,
            avg_completion_hours,
            avg_completion_minutes,
            last_update_timestamp: escrow_state.last_update_timestamp,
        };
        
        msg!("Escrow analytics retrieved");
        Ok(analytics)
    }

    pub fn get_user_escrow_history(
        ctx: Context<GetUserEscrowHistory>,
        user_pubkey: Pubkey,
        role: UserRole,
        limit: u8,
    ) -> Result<Vec<EscrowSummary>> {
        let clock = Clock::get()?;
        
        // Since we can't filter accounts directly in the program,
        // we'll search through accounts provided by the client
        let escrow_accounts = &ctx.remaining_accounts;
        let mut escrow_summaries = Vec::new();
        let mut count = 0;
        
        // Process each account provided
        for account_info in escrow_accounts.iter() {
            if count >= limit as usize {
                break;
            }
            
            // Deserialize the escrow account
            if let Ok(escrow) = Account::<Escrow>::try_from(account_info) {
                // Check if the account belongs to the requested user based on role
                let belongs_to_user = match role {
                    UserRole::Client => escrow.client == user_pubkey,
                    UserRole::Freelancer => escrow.freelancer == user_pubkey,
                    UserRole::Both => escrow.client == user_pubkey || escrow.freelancer == user_pubkey,
                };
                
                if belongs_to_user {
                    // Create and add summary if it belongs to the user
                    let summary = EscrowSummary {
                        escrow_pubkey: account_info.key(),
                        client: escrow.client,
                        freelancer: escrow.freelancer,
                        amount: escrow.amount,
                        status: escrow.status,
                        created_at: escrow.created_at,
                        deadline: escrow.deadline,
                        milestones_count: escrow.milestones.len() as u8,
                        completed_milestones: escrow.completed_milestones,
                        active_time_remaining: if escrow.status == EscrowStatus::Active {
                            escrow.deadline.saturating_sub(clock.unix_timestamp)
                        } else {
                            0
                        },
                        disputed: escrow.disputed,
                        completion_date: escrow.completion_date,
                        last_activity_at: escrow.last_activity_at,
                    };
                    
                    escrow_summaries.push(summary);
                    count += 1;
                }
            }
        }
        
        // Sort by most recent activity first
        escrow_summaries.sort_by(|a, b| b.last_activity_at.cmp(&a.last_activity_at));
        
        msg!("Found {} escrow records for user based on role {:?}", escrow_summaries.len(), role);
        Ok(escrow_summaries)
    }

    pub fn calculate_escrow_risk(
        ctx: Context<CalculateEscrowRisk>,
        escrow_pubkey: Pubkey,
    ) -> Result<EscrowRiskAnalysis> {
        let clock = Clock::get()?;
        
        // Deserialize the escrow account
        let escrow_account = ctx.accounts.escrow.to_account_info();
        let escrow = Account::<Escrow>::try_from(&escrow_account)?;
        
        // 1. Amount Risk - Higher amounts increase risk
        let amount_risk = if escrow.amount > 1_000_000_000 { // 1000 SOL
            RiskLevel::High
        } else if escrow.amount > 100_000_000 { // 100 SOL
            RiskLevel::Medium
        } else {
            RiskLevel::Low
        };
        
        // 2. Time Risk - Longer timeframes increase risk
        let duration = escrow.deadline - escrow.created_at;
        let time_risk = if duration > 60 * 86400 { // 60 days
            RiskLevel::High
        } else if duration > 30 * 86400 { // 30 days
            RiskLevel::Medium
        } else {
            RiskLevel::Low
        };
        
        // 3. Milestone Risk - Fewer milestones increase risk
        let milestone_risk = if escrow.milestones.len() <= 2 {
            RiskLevel::High
        } else if escrow.milestones.len() <= 5 {
            RiskLevel::Medium
        } else {
            RiskLevel::Low
        };
        
        // 4. Progress Risk - Time elapsed vs milestone completion
        let time_elapsed = clock.unix_timestamp - escrow.created_at;
        let time_percentage = if duration > 0 {
            (time_elapsed as f64 / duration as f64) * 100.0
        } else {
            100.0
        };
        
        let milestone_percentage = if escrow.milestones.len() > 0 {
            (escrow.completed_milestones as f64 / escrow.milestones.len() as f64) * 100.0
        } else {
            0.0
        };
        
        let progress_risk = if time_percentage > milestone_percentage + 30.0 {
            RiskLevel::High
        } else if time_percentage > milestone_percentage + 15.0 {
            RiskLevel::Medium
        } else {
            RiskLevel::Low
        };
        
        // 5. Dispute Risk - Based on client and freelancer history from reputation program
        // Note: In a real implementation, this would fetch data from the reputation program
        let dispute_risk = if ctx.accounts.reputation_stats.has_account_info() {
            // Here we would make a cross-program call to get reputation data
            // For now we'll use a placeholder value based on dispute flag
            if escrow.disputed {
                RiskLevel::High
            } else {
                RiskLevel::Low
            }
        } else {
            RiskLevel::Medium // Default if no reputation data available
        };
        
        // Calculate composite risk score (0-100)
        // Weight factors based on the insurance system components from memory
        let amount_weight = 20;
        let time_weight = 15;
        let milestone_weight = 15;
        let progress_weight = 30;
        let dispute_weight = 20;
        
        let risk_score = 
            (risk_level_to_score(amount_risk) * amount_weight +
             risk_level_to_score(time_risk) * time_weight +
             risk_level_to_score(milestone_risk) * milestone_weight +
             risk_level_to_score(progress_risk) * progress_weight +
             risk_level_to_score(dispute_risk) * dispute_weight) / 
            (amount_weight + time_weight + milestone_weight + progress_weight + dispute_weight);
        
        // Create and return risk analysis result
        let risk_analysis = EscrowRiskAnalysis {
            escrow_pubkey,
            risk_score,
            amount_risk,
            time_risk,
            milestone_risk,
            progress_risk,
            dispute_risk,
            analysis_timestamp: clock.unix_timestamp,
            time_percentage: (time_percentage * 100.0) as u32, // Store as basis points
            milestone_percentage: (milestone_percentage * 100.0) as u32, // Store as basis points
            time_elapsed,
            duration,
            amount: escrow.amount,
        };
        
        // Log analysis for transparency and blockchain record
        msg!("Escrow risk analysis completed: Score {}", risk_score);
        
        Ok(risk_analysis)
    }
    
    // Helper function to convert risk level to numerical score
    fn risk_level_to_score(risk: RiskLevel) -> u8 {
        match risk {
            RiskLevel::Low => 25,
            RiskLevel::Medium => 50,
            RiskLevel::High => 100,
        }
    }
}

#[derive(Accounts)]
pub struct CalculateEscrowRisk<'info> {
    pub authority: Signer<'info>,
    
    /// CHECK: Escrow account - deserialized in the instruction
    pub escrow: AccountInfo<'info>,
    
    #[account(
        seeds = [b"escrow_state"],
        bump = escrow_state.bump,
    )]
    pub escrow_state: Account<'info, EscrowState>,
    
    /// CHECK: Optional reputation program account for checking user history
    pub reputation_stats: UncheckedAccount<'info>,
    
    /// CHECK: Insurance program account for risk assessment integration
    #[account(address = INSURANCE_PROGRAM_ID)]
    pub insurance_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + EscrowState::SIZE,
        seeds = [b"escrow_state"],
        bump
    )]
    pub escrow_state: Account<'info, EscrowState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateEscrow<'info> {
    #[account(mut)]
    pub client: Signer<'info>,
    
    /// CHECK: This account is just used as a reference
    pub freelancer: AccountInfo<'info>,
    
    #[account(
        seeds = [b"escrow_state"],
        bump = escrow_state.bump,
    )]
    pub escrow_state: Account<'info, EscrowState>,
    
    #[account(
        init,
        payer = client,
        space = 8 + Escrow::SIZE,
        seeds = [b"escrow", client.key().as_ref(), freelancer.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(
        mut,
        constraint = client_token_account.owner == client.key()
    )]
    pub client_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = client,
        associated_token::mint = mint,
        associated_token::authority = escrow
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    pub mint: Account<'info, token::Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub insurance_program: AccountInfo<'info>,
    /// CHECK: Used to record transaction signature
    pub transaction_signature: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ReleaseMilestone<'info> {
    #[account(mut)]
    pub client: Signer<'info>,
    
    #[account(mut)]
    pub freelancer: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"escrow", client.key().as_ref(), freelancer.key().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(
        mut,
        token::mint = escrow_token_account.mint,
        token::authority = client,
    )]
    pub client_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        token::mint = escrow_token_account.mint,
        token::authority = freelancer,
    )]
    pub freelancer_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"escrow_token", client.key().as_ref(), freelancer.key().as_ref()],
        bump,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"escrow_state"],
        bump = escrow_state.bump,
    )]
    pub escrow_state: Account<'info, EscrowState>,
    
    #[account(address = REPUTATION_PROGRAM_ID)]
    pub reputation_program: AccountInfo<'info>,
    
    /// CHECK: Used to record transaction signature
    pub transaction_signature: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DisputeEscrow<'info> {
    #[account(mut)]
    pub disputer: Signer<'info>,
    
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    
    #[account(
        seeds = [b"escrow_state"],
        bump = escrow_state.bump,
    )]
    pub escrow_state: Account<'info, EscrowState>,
    
    #[account(
        mut,
        token::mint = fee_account.mint,
        token::authority = disputer,
    )]
    pub disputer_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        token::authority = escrow_state.authority,
    )]
    pub fee_account: Account<'info, TokenAccount>,
    
    /// CHECK: Used to record transaction signature
    pub transaction_signature: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"escrow_state"],
        bump = escrow_state.bump,
        constraint = authority.key() == escrow_state.authority
    )]
    pub escrow_state: Account<'info, EscrowState>,
    
    #[account(
        mut,
        seeds = [b"escrow", escrow.client.as_ref(), escrow.freelancer.as_ref()],
        bump = escrow.bump,
        constraint = escrow.disputed,
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(
        mut,
        token::mint = escrow_token_account.mint,
        token::authority = escrow,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        token::mint = escrow_token_account.mint,
        token::authority = escrow.client,
    )]
    pub client_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        token::mint = escrow_token_account.mint,
        token::authority = escrow.freelancer,
    )]
    pub freelancer_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateEscrowParameters<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"escrow_state"],
        bump = escrow_state.bump,
        constraint = authority.key() == escrow_state.authority
    )]
    pub escrow_state: Account<'info, EscrowState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CompleteEscrow<'info> {
    #[account(mut)]
    pub client: Signer<'info>,
    
    #[account(mut)]
    pub freelancer: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"escrow", client.key().as_ref(), freelancer.key().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(
        mut,
        seeds = [b"escrow_state"],
        bump = escrow_state.bump,
    )]
    pub escrow_state: Account<'info, EscrowState>,
    
    #[account(address = REPUTATION_PROGRAM_ID)]
    pub reputation_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ConfirmCompletion<'info> {
    #[account(mut)]
    pub freelancer: Signer<'info>,
    
    #[account(mut)]
    pub client: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"escrow", client.key().as_ref(), freelancer.key().as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,
    
    #[account(
        mut,
        seeds = [b"escrow_state"],
        bump = escrow_state.bump,
    )]
    pub escrow_state: Account<'info, EscrowState>,
    
    #[account(address = REPUTATION_PROGRAM_ID)]
    pub reputation_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct GetEscrowAnalytics<'info> {
    #[account(
        seeds = [b"escrow_state"],
        bump = escrow_state.bump,
    )]
    pub escrow_state: Account<'info, EscrowState>,
}

#[derive(Accounts)]
pub struct GetUserEscrowHistory<'info> {
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [b"escrow_state"],
        bump = escrow_state.bump,
    )]
    pub escrow_state: Account<'info, EscrowState>,
}

#[account]
#[derive(Default)]
pub struct EscrowState {
    pub authority: Pubkey,
    pub insurance_program_id: Pubkey,
    pub dispute_resolution_fee: u64,
    pub auto_release_days: u16,
    pub total_escrows: u64,
    pub active_escrows: u64,
    pub total_volume: u64,
    pub successful_escrows: u64,
    pub disputed_escrows: u64,
    pub average_completion_time: i64,
    pub is_paused: bool,
    pub last_update_timestamp: i64,
    pub bump: u8,
}

impl EscrowState {
    pub const SIZE: usize = 32 + // authority
                            32 + // insurance_program_id
                            8 +  // dispute_resolution_fee
                            2 +  // auto_release_days
                            8 +  // total_escrows
                            8 +  // active_escrows
                            8 +  // total_volume
                            8 +  // successful_escrows
                            8 +  // disputed_escrows
                            8 +  // average_completion_time
                            1 +  // is_paused
                            8 +  // last_update_timestamp
                            1;   // bump
}

#[account]
#[derive(Default)]
pub struct Escrow {
    pub client: Pubkey,
    pub freelancer: Pubkey,
    pub amount: u64,
    pub description: String,
    pub created_at: i64,
    pub deadline: i64,
    pub status: EscrowStatus,
    pub milestones: Vec<Milestone>,
    pub completed_milestones: u8,
    pub disputed: bool,
    pub auto_release_date: i64,
    pub dispute_details: Option<DisputeDetails>,
    pub completion_date: Option<i64>,
    pub last_activity_at: i64,
    pub transaction_signatures: Vec<TransactionRecord>,
    pub last_notification_at: i64,
    pub client_confirmed_completion: bool,
    pub freelancer_confirmed_completion: bool,
    pub bump: u8,
}

impl Escrow {
    pub const SIZE: usize = 32 + // client
                           32 + // freelancer
                           8 +  // amount
                           200 + // description (max length)
                           8 +  // created_at
                           8 +  // deadline
                           1 +  // status
                           (1 + 10 * Milestone::SIZE) + // milestones vector with max 10 items
                           1 +  // completed_milestones
                           1 +  // disputed
                           8 +  // auto_release_date
                           (1 + DisputeDetails::SIZE) + // dispute_details (optional)
                           (1 + 8) + // completion_date (optional)
                           8 +  // last_activity_at
                           (1 + 5 * TransactionRecord::SIZE) + // transaction signatures with max 5 items
                           8 +  // last_notification_at
                           1 +  // client_confirmed_completion
                           1 +  // freelancer_confirmed_completion
                           1;   // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum EscrowStatus {
    Active,
    Disputed,
    Completed,
    Cancelled,
}

impl Default for EscrowStatus {
    fn default() -> Self {
        EscrowStatus::Active
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Default)]
pub struct Milestone {
    pub title: String,
    pub description: String,
    pub amount: u64,
    pub deadline: i64,
    pub completed: bool,
    pub completed_at: Option<i64>,
    pub feedback: Option<String>,
}

impl Milestone {
    pub const SIZE: usize = 50 + // title (max length)
                           100 + // description (max length)
                           8 +   // amount
                           8 +   // deadline
                           1 +   // completed
                           (1 + 8) + // completed_at (optional)
                           (1 + 100); // feedback (optional)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct DisputeDetails {
    pub initiated_by: Pubkey,
    pub initiated_at: i64,
    pub reason: String,
    pub resolution: Option<DisputeResolution>,
}

impl DisputeDetails {
    pub const SIZE: usize = 32 + // initiated_by
                           8 +  // initiated_at
                           200 + // reason (max length)
                           (1 + DisputeResolution::SIZE); // resolution (optional)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct DisputeResolution {
    pub resolved_at: i64,
    pub client_percentage: u8,
    pub freelancer_percentage: u8,
    pub resolver: Pubkey,
    pub notes: String,
}

impl DisputeResolution {
    pub const SIZE: usize = 8 + // resolved_at
                          1 + // client_percentage
                          1 + // freelancer_percentage
                          32 + // resolver
                          200; // notes (max length)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct TransactionRecord {
    pub timestamp: i64,
    pub signature: String,
    pub transaction_type: TransactionType,
    pub amount: u64,
    pub milestone_index: Option<u8>,
}

impl TransactionRecord {
    pub const SIZE: usize = 8 + // timestamp
                          88 + // signature (max length)
                          1 +  // transaction_type
                          8 +  // amount
                          (1 + 1); // milestone_index (optional)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum TransactionType {
    Deposit,
    MilestoneRelease,
    Refund,
    DisputeFee,
    DisputeResolution,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct EscrowAnalytics {
    pub total_escrows: u64,
    pub active_escrows: u64,
    pub total_volume: u64,
    pub successful_escrows: u64,
    pub disputed_escrows: u64,
    pub success_rate: u32, // Basis points (e.g., 9500 = 95.00%)
    pub dispute_rate: u32, // Basis points
    pub average_completion_time: i64, // In seconds
    pub avg_completion_days: i64,
    pub avg_completion_hours: i64,
    pub avg_completion_minutes: i64,
    pub last_update_timestamp: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct EscrowSummary {
    pub escrow_pubkey: Pubkey,
    pub client: Pubkey,
    pub freelancer: Pubkey,
    pub amount: u64,
    pub status: EscrowStatus,
    pub created_at: i64,
    pub deadline: i64,
    pub milestones_count: u8,
    pub completed_milestones: u8,
    pub active_time_remaining: i64,
    pub disputed: bool,
    pub completion_date: Option<i64>,
    pub last_activity_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum UserRole {
    Client,
    Freelancer,
    Both,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct EscrowRiskAnalysis {
    pub escrow_pubkey: Pubkey,
    pub risk_score: u8,                // 0-100 composite risk score
    pub amount_risk: RiskLevel,
    pub time_risk: RiskLevel,
    pub milestone_risk: RiskLevel,
    pub progress_risk: RiskLevel,
    pub dispute_risk: RiskLevel,
    pub analysis_timestamp: i64,
    pub time_percentage: u32,          // Basis points
    pub milestone_percentage: u32,     // Basis points
    pub time_elapsed: i64,
    pub duration: i64,
    pub amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
}

#[error_code]
pub enum EscrowError {
    #[msg("Program is paused")]
    ProgramPaused,
    
    #[msg("Invalid amount")]
    InvalidAmount,
    
    #[msg("Invalid deadline")]
    InvalidDeadline,
    
    #[msg("No milestones specified")]
    NoMilestones,
    
    #[msg("Milestone amounts don't match total escrow amount")]
    MilestoneAmountMismatch,
    
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Escrow is not active")]
    EscrowNotActive,
    
    #[msg("Invalid milestone index")]
    InvalidMilestoneIndex,
    
    #[msg("Milestone already completed")]
    MilestoneAlreadyCompleted,
    
    #[msg("Escrow is already disputed")]
    AlreadyDisputed,
    
    #[msg("Escrow is not disputed")]
    NotDisputed,
    
    #[msg("Client and freelancer percentages must sum to 100")]
    InvalidPercentages,
    
    #[msg("Not all milestones have been completed")]
    NotAllMilestonesCompleted,
    
    #[msg("Invalid escrow status for this operation")]
    InvalidEscrowStatus,
    
    #[msg("Cross-program invocation failed")]
    CrossProgramInvocationFailed,
}
