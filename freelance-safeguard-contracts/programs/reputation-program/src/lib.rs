use anchor_lang::prelude::*;

// Import modules
mod constants;
mod errors;
mod instructions;
mod state;
mod utils;
mod bayesian_scoring;

// Re-export public items
pub use constants::*;
pub use errors::*;
pub use instructions::*;
pub use state::*;
pub use utils::*;
pub use bayesian_scoring::{BayesianParameters, BayesianEvidence, calculate_bayesian_reputation, calculate_premium_discount};

declare_id!("62pv98Ymg4E4WpvZqrxtGA5kHSGwX3VxmKqsSjARAMhc");

#[program]
pub mod reputation_program {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        insurance_program_id: Pubkey,
        escrow_program_id: Pubkey,
        initial_reputation_score: u8,
    ) -> Result<()> {
        let reputation_state = &mut ctx.accounts.reputation_state;
        reputation_state.authority = ctx.accounts.authority.key();
        reputation_state.insurance_program_id = insurance_program_id;
        reputation_state.escrow_program_id = escrow_program_id;
        reputation_state.initial_reputation_score = initial_reputation_score;
        reputation_state.total_profiles = 0;
        reputation_state.average_score = initial_reputation_score;
        reputation_state.last_update_timestamp = Clock::get()?.unix_timestamp;
        reputation_state.bump = *ctx.bumps.get("reputation_state").unwrap();
        
        msg!("Reputation program initialized");
        msg!("Authority: {}", reputation_state.authority);
        msg!("Insurance Program ID: {}", reputation_state.insurance_program_id);
        msg!("Escrow Program ID: {}", reputation_state.escrow_program_id);
        msg!("Initial Reputation Score: {}", reputation_state.initial_reputation_score);
        Ok(())
    }

    pub fn create_profile(
        ctx: Context<CreateProfile>,
    ) -> Result<()> {
        let reputation_state = &mut ctx.accounts.reputation_state;
        let user_profile = &mut ctx.accounts.user_profile;
        let clock = Clock::get()?;
        
        user_profile.user = ctx.accounts.user.key();
        user_profile.reputation_score = reputation_state.initial_reputation_score;
        user_profile.completed_contracts = 0;
        user_profile.successful_contracts = 0;
        user_profile.disputed_contracts = 0;
        user_profile.claims_submitted = 0;
        user_profile.claims_approved = 0;
        user_profile.claims_rejected = 0;
        user_profile.last_update_timestamp = clock.unix_timestamp;
        user_profile.creation_slot = clock.slot;
        user_profile.history = vec![];
        user_profile.recent_activities = vec![];
        user_profile.bump = *ctx.bumps.get("user_profile").unwrap();
        
        // Update global reputation state
        reputation_state.total_profiles += 1;
        
        // Recalculate average score
        let total_score = reputation_state.average_score as u64 * (reputation_state.total_profiles - 1) 
                         + reputation_state.initial_reputation_score as u64;
        reputation_state.average_score = (total_score / reputation_state.total_profiles) as u8;
        reputation_state.last_update_timestamp = clock.unix_timestamp;
        
        msg!("User profile created for {}", ctx.accounts.user.key());
        msg!("Initial reputation score: {}", user_profile.reputation_score);
        msg!("Creation timestamp: {}", user_profile.last_update_timestamp);
        msg!("Creation slot: {}", user_profile.creation_slot);
        Ok(())
    }

    pub fn update_contract_completion(
        ctx: Context<UpdateContractCompletion>,
        successful: bool,
        disputed: bool,
        contract_id: String,
        contract_details: Option<String>,
    ) -> Result<()> {
        let reputation_state = &mut ctx.accounts.reputation_state;
        let user_profile = &mut ctx.accounts.user_profile;
        let clock = Clock::get()?;
        
        // Verify caller is authorized
        require!(
            ctx.accounts.caller.key() == reputation_state.authority || 
            ctx.accounts.caller.key() == reputation_state.escrow_program_id,
            ReputationError::Unauthorized
        );
        
        // Record previous score for history
        let previous_score = user_profile.reputation_score;
        
        // Update profile statistics
        user_profile.completed_contracts += 1;
        
        if successful {
            user_profile.successful_contracts += 1;
        }
        
        if disputed {
            user_profile.disputed_contracts += 1;
        }
        
        // Calculate new reputation score
        user_profile.reputation_score = calculate_reputation_score(
            user_profile.completed_contracts,
            user_profile.successful_contracts,
            user_profile.disputed_contracts,
            user_profile.claims_submitted,
            user_profile.claims_approved,
            user_profile.claims_rejected,
        );
        
        // Add to history
        user_profile.history.push(ReputationHistory {
            timestamp: clock.unix_timestamp,
            previous_score,
            new_score: user_profile.reputation_score,
            reason: if successful {
                "Contract completed successfully".to_string()
            } else if disputed {
                "Contract completed with dispute".to_string()
            } else {
                "Contract completed unsuccessfully".to_string()
            },
        });
        
        // Keep history limited to last 10 entries
        if user_profile.history.len() > MAX_HISTORY_ENTRIES {
            user_profile.history.remove(0);
        }
        
        // Add to recent activities
        let previous_score = user_profile.reputation_score;
        user_profile.recent_activities.push(Activity {
            timestamp: clock.unix_timestamp,
            activity_type: ActivityType::ContractCompletion,
            details: format!(
                "Contract {} completed. Success: {}, Disputed: {}", 
                contract_id, successful, disputed
            ),
            related_id: Some(contract_id.clone()),
            score_change: user_profile.reputation_score as i8 - previous_score as i8,
        });
        
        // Keep activities limited to last 5 entries
        if user_profile.recent_activities.len() > MAX_ACTIVITY_ENTRIES {
            user_profile.recent_activities.remove(0);
        }
        
        user_profile.last_update_timestamp = clock.unix_timestamp;
        
        // Update global reputation state
        let old_total = reputation_state.average_score as u64 * reputation_state.total_profiles;
        let new_total = old_total - previous_score as u64 + user_profile.reputation_score as u64;
        reputation_state.average_score = (new_total / reputation_state.total_profiles) as u8;
        reputation_state.last_update_timestamp = clock.unix_timestamp;
        
        msg!("Contract completion updated for {}", user_profile.user);
        msg!("Contract ID: {}", contract_id);
        msg!("New reputation score: {} (change: {})", 
            user_profile.reputation_score, 
            user_profile.reputation_score as i8 - previous_score as i8
        );
        
        Ok(())
    }

    pub fn update_claims_history(
        ctx: Context<UpdateClaimsHistory>,
        claim_submitted: bool,
        claim_approved: bool,
        claim_rejected: bool,
        claim_id: String,
        claim_details: Option<String>,
    ) -> Result<()> {
        let reputation_state = &mut ctx.accounts.reputation_state;
        let user_profile = &mut ctx.accounts.user_profile;
        let clock = Clock::get()?;
        
        // Verify caller is authorized
        require!(
            ctx.accounts.caller.key() == reputation_state.authority || 
            ctx.accounts.caller.key() == reputation_state.insurance_program_id,
            ReputationError::Unauthorized
        );
        
        // Record previous score for history
        let previous_score = user_profile.reputation_score;
        
        // Update profile statistics
        if claim_submitted {
            user_profile.claims_submitted += 1;
        }
        
        if claim_approved {
            user_profile.claims_approved += 1;
        }
        
        if claim_rejected {
            user_profile.claims_rejected += 1;
        }
        
        // Calculate new reputation score
        user_profile.reputation_score = calculate_reputation_score(
            user_profile.completed_contracts,
            user_profile.successful_contracts,
            user_profile.disputed_contracts,
            user_profile.claims_submitted,
            user_profile.claims_approved,
            user_profile.claims_rejected,
        );
        
        // Add to history
        user_profile.history.push(ReputationHistory {
            timestamp: clock.unix_timestamp,
            previous_score,
            new_score: user_profile.reputation_score,
            reason: if claim_submitted && !claim_approved && !claim_rejected {
                "New claim submitted".to_string()
            } else if claim_approved {
                "Claim approved".to_string()
            } else if claim_rejected {
                "Claim rejected".to_string()
            } else {
                "Claim status updated".to_string()
            },
        });
        
        // Keep history limited to last 10 entries
        if user_profile.history.len() > MAX_HISTORY_ENTRIES {
            user_profile.history.remove(0);
        }
        
        // Add to recent activities
        let stored_previous_score = previous_score;
        user_profile.recent_activities.push(Activity {
            timestamp: clock.unix_timestamp,
            activity_type: if claim_submitted {
                ActivityType::ClaimSubmission
            } else if claim_approved {
                ActivityType::ClaimActivity
            } else if claim_rejected {
                ActivityType::ClaimRejection
            } else {
                ActivityType::Other
            },
            details: format!(
                "Claim {}. Submitted: {}, Approved: {}, Rejected: {}", 
                claim_id, claim_submitted, claim_approved, claim_rejected
            ),
            related_id: Some(claim_id.clone()),
            score_change: user_profile.reputation_score as i8 - stored_previous_score as i8,
        });
        
        // Keep activities limited to last 5 entries
        if user_profile.recent_activities.len() > MAX_ACTIVITY_ENTRIES {
            user_profile.recent_activities.remove(0);
        }
        
        user_profile.last_update_timestamp = clock.unix_timestamp;
        
        // Update global reputation state
        let old_total = reputation_state.average_score as u64 * reputation_state.total_profiles;
        let new_total = old_total - previous_score as u64 + user_profile.reputation_score as u64;
        reputation_state.average_score = (new_total / reputation_state.total_profiles) as u8;
        reputation_state.last_update_timestamp = clock.unix_timestamp;
        
        msg!("Claims history updated for {}", user_profile.user);
        msg!("Claim ID: {}", claim_id);
        msg!("New reputation score: {} (change: {})", 
            user_profile.reputation_score, 
            user_profile.reputation_score as i8 - previous_score as i8
        );
        
        Ok(())
    }

    pub fn get_reputation_factor(
        ctx: Context<GetReputationFactor>,
    ) -> Result<u8> {
        let user_profile = &ctx.accounts.user_profile;
        
        // Calculate reputation factor (70-100) based on reputation score (0-100)
        let reputation_factor = calculate_reputation_factor(user_profile.reputation_score);
        
        msg!("Reputation factor for {}: {}", user_profile.user, reputation_factor);
        Ok(reputation_factor)
    }

    // New function to get detailed reputation analytics
    pub fn get_reputation_analytics(
        ctx: Context<GetReputationAnalytics>,
    ) -> Result<ReputationAnalytics> {
        let reputation_state = &ctx.accounts.reputation_state;
        let user_profile = &ctx.accounts.user_profile;
        
        // Calculate reputation factor
        let reputation_factor = calculate_reputation_factor(user_profile.reputation_score);
        
        // Calculate success rate (0-100)
        let successful_rate = if user_profile.completed_contracts > 0 {
            ((user_profile.successful_contracts as f32 / user_profile.completed_contracts as f32) * 100.0) as u8
        } else {
            0
        };
        
        // Calculate dispute rate (0-100)
        let disputed_rate = if user_profile.completed_contracts > 0 {
            ((user_profile.disputed_contracts as f32 / user_profile.completed_contracts as f32) * 100.0) as u8
        } else {
            0
        };
        
        // Calculate claims approved rate (0-100)
        let claims_approved_rate = if user_profile.claims_submitted > 0 {
            ((user_profile.claims_approved as f32 / user_profile.claims_submitted as f32) * 100.0) as u8
        } else {
            0
        };
        
        // Calculate activity score based on contract completion and claims
        let activity_score = if user_profile.completed_contracts > 10 {
            100
        } else {
            (user_profile.completed_contracts * 10) as u8
        };
        
        // Calculate reliability score based on successful contracts and approved claims
        let reliability_score = (successful_rate as u16 * 7 + claims_approved_rate as u16 * 3) as u8 / 10;
        
        let analytics = ReputationAnalytics {
            user: user_profile.user,
            current_score: user_profile.reputation_score,
            reputation_factor,
            completed_contracts: user_profile.completed_contracts,
            successful_rate,
            disputed_rate,
            claims_approved_rate,
            activity_score,
            reliability_score,
            last_update_timestamp: user_profile.last_update_timestamp,
        };
        
        msg!("Reputation analytics generated for {}", user_profile.user);
        msg!("Current score: {}", analytics.current_score);
        msg!("Reputation factor: {}", analytics.reputation_factor);
        msg!("Successful rate: {}%", analytics.successful_rate);
        msg!("Disputed rate: {}%", analytics.disputed_rate);
        
        Ok(analytics)
    }

    // New function to get detailed history
    pub fn get_reputation_history(
        ctx: Context<GetReputationHistory>,
    ) -> Result<()> {
        let user_profile = &ctx.accounts.user_profile;
        
        msg!("Reputation history for {}", user_profile.user);
        msg!("Current score: {}", user_profile.reputation_score);
        msg!("Completed contracts: {}", user_profile.completed_contracts);
        msg!("Successful contracts: {}", user_profile.successful_contracts);
        msg!("Disputed contracts: {}", user_profile.disputed_contracts);
        msg!("Claims submitted: {}", user_profile.claims_submitted);
        msg!("Claims approved: {}", user_profile.claims_approved);
        msg!("Claims rejected: {}", user_profile.claims_rejected);
        
        // Log history entries
        msg!("History entries: {}", user_profile.history.len());
        for (i, entry) in user_profile.history.iter().enumerate() {
            msg!(
                "Entry {}: {} -> {} ({}) - {}", 
                i, 
                entry.previous_score, 
                entry.new_score, 
                entry.new_score as i16 - entry.previous_score as i16,
                entry.reason
            );
        }
        
        Ok(())
    }

    /// Initialize the Bayesian reputation parameters
    pub fn initialize_bayesian_params(
        ctx: Context<InitializeBayesianParams>,
        prior_mean: Option<u16>,
        prior_strength: Option<u16>,
        contract_completion_weight: Option<u16>,
        contract_dispute_weight: Option<u16>,
        claim_approval_weight: Option<u16>,
        claim_rejection_weight: Option<u16>,
        time_decay_factor: Option<u16>,
        min_discount: Option<u16>,
        max_discount: Option<u16>,
        discount_curve_factor: Option<u16>,
    ) -> Result<()> {
        let params = &mut ctx.accounts.bayesian_params;
        params.authority = ctx.accounts.authority.key();
        
        // Start with default parameters
        let mut default_params = bayesian_scoring::initialize_default_parameters();
        
        // Override with any provided parameters
        if let Some(value) = prior_mean {
            require!(value <= 10000, ReputationError::InvalidParameter);
            default_params.prior_mean = value;
        }
        
        if let Some(value) = prior_strength {
            default_params.prior_strength = value;
        }
        
        if let Some(value) = contract_completion_weight {
            default_params.contract_completion_weight = value;
        }
        
        if let Some(value) = contract_dispute_weight {
            default_params.contract_dispute_weight = value;
        }
        
        if let Some(value) = claim_approval_weight {
            default_params.claim_approval_weight = value;
        }
        
        if let Some(value) = claim_rejection_weight {
            default_params.claim_rejection_weight = value;
        }
        
        if let Some(value) = time_decay_factor {
            default_params.time_decay_factor = value;
        }
        
        if let Some(value) = min_discount {
            require!(value <= 10000, ReputationError::InvalidParameter);
            default_params.min_discount = value;
        }
        
        if let Some(value) = max_discount {
            require!(value <= 10000, ReputationError::InvalidParameter);
            default_params.max_discount = value;
        }
        
        if let Some(value) = discount_curve_factor {
            default_params.discount_curve_factor = value;
        }
        
        // Copy values to account
        params.prior_mean = default_params.prior_mean;
        params.prior_strength = default_params.prior_strength;
        params.contract_completion_weight = default_params.contract_completion_weight;
        params.contract_dispute_weight = default_params.contract_dispute_weight;
        params.claim_approval_weight = default_params.claim_approval_weight;
        params.claim_rejection_weight = default_params.claim_rejection_weight;
        params.time_decay_factor = default_params.time_decay_factor;
        params.min_discount = default_params.min_discount;
        params.max_discount = default_params.max_discount;
        params.discount_curve_factor = default_params.discount_curve_factor;
        params.bump = *ctx.bumps.get("bayesian_params").unwrap();
        
        msg!("Bayesian reputation parameters initialized");
        Ok(())
    }
    
    /// Calculate premium discount based on Bayesian reputation score
    pub fn calculate_premium_discount(
        ctx: Context<CalculatePremiumDiscount>,
    ) -> Result<u16> {
        let user_profile = &ctx.accounts.user_profile;
        let bayesian_params = &ctx.accounts.bayesian_params;
        
        // Convert standard reputation data to Bayesian evidence
        let evidence = BayesianEvidence {
            completed_contracts: user_profile.completed_contracts,
            successful_contracts: user_profile.successful_contracts,
            disputed_contracts: user_profile.disputed_contracts,
            claims_submitted: user_profile.claims_submitted,
            claims_approved: user_profile.claims_approved,
            claims_rejected: user_profile.claims_rejected,
            days_since_first_activity: ((Clock::get()?.unix_timestamp - user_profile.last_update_timestamp) / 86400) as u32,
            contract_completion_ratio: if user_profile.completed_contracts > 0 {
                ((user_profile.successful_contracts as u64 * 10000) / user_profile.completed_contracts as u64) as u16
            } else {
                5000 // Neutral if no contracts
            },
            claim_approval_ratio: if user_profile.claims_submitted > 0 {
                ((user_profile.claims_approved as u64 * 10000) / user_profile.claims_submitted as u64) as u16
            } else {
                5000 // Neutral if no claims
            },
        };
        
        // Calculate Bayesian reputation score
        let reputation_score = calculate_bayesian_reputation(bayesian_params, &evidence);
        
        // Calculate discount based on reputation score
        let discount = bayesian_scoring::calculate_premium_discount(bayesian_params, reputation_score);
        
        // Log for transparency
        msg!("User: {}", user_profile.user);
        msg!("Bayesian reputation score: {}", reputation_score);
        msg!("Premium discount: {}%", discount as f32 / 100.0);
        
        // Return discount (scaled by 100)
        Ok(discount)
    }
}

// Helper function to calculate reputation score (0-100)
fn calculate_reputation_score(
    completed_contracts: u32,
    successful_contracts: u32,
    disputed_contracts: u32,
    claims_submitted: u32,
    claims_approved: u32,
    claims_rejected: u32,
) -> u8 {
    // Base score starts at 50
    let mut score: i32 = 50;
    
    // Contract completion impact (max +30)
    if completed_contracts > 0 {
        let success_rate = (successful_contracts as f64 / completed_contracts as f64) * 100.0;
        score += (success_rate / 100.0 * 30.0) as i32;
    }
    
    // Dispute impact (max -20)
    if completed_contracts > 0 {
        let dispute_rate = (disputed_contracts as f64 / completed_contracts as f64) * 100.0;
        score -= (dispute_rate / 100.0 * 20.0) as i32;
    }
    
    // Claims impact (max +/-20)
    if claims_submitted > 0 {
        // Positive impact for approved claims
        let approval_rate = (claims_approved as f64 / claims_submitted as f64) * 100.0;
        score += (approval_rate / 100.0 * 10.0) as i32;
        
        // Negative impact for rejected claims
        let rejection_rate = (claims_rejected as f64 / claims_submitted as f64) * 100.0;
        score -= (rejection_rate / 100.0 * 20.0) as i32;
    }
    
    // Ensure score is within 0-100 range
    score = score.max(0).min(100);
    
    score as u8
}

// Helper function to calculate reputation factor (70-100)
fn calculate_reputation_factor(reputation_score: u8) -> u8 {
    // Map reputation score (0-100) to reputation factor (70-100)
    70 + ((reputation_score as u16 * 30) / 100) as u8
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = ReputationState::SIZE,
        seeds = [b"reputation_state"],
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
        init,
        payer = user,
        space = UserProfile::SIZE,
        seeds = [b"user_profile", user.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(
        seeds = [b"reputation_state"],
        bump = reputation_state.bump
    )]
    pub reputation_state: Account<'info, ReputationState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateContractCompletion<'info> {
    // Only authorized callers can update
    #[account(mut)]
    pub caller: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"user_profile", user_profile.user.as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(
        mut,
        seeds = [b"reputation_state"],
        bump = reputation_state.bump
    )]
    pub reputation_state: Account<'info, ReputationState>,
}

#[derive(Accounts)]
pub struct UpdateClaimsHistory<'info> {
    // Only authorized callers can update
    #[account(mut)]
    pub caller: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"user_profile", user_profile.user.as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(
        mut,
        seeds = [b"reputation_state"],
        bump = reputation_state.bump
    )]
    pub reputation_state: Account<'info, ReputationState>,
}

#[derive(Accounts)]
pub struct GetReputationFactor<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,
    
    #[account(
        seeds = [b"user_profile", user_profile.user.as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
}

#[derive(Accounts)]
pub struct GetReputationAnalytics<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,
    
    #[account(
        seeds = [b"user_profile", user_profile.user.as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(
        seeds = [b"reputation_state"],
        bump = reputation_state.bump
    )]
    pub reputation_state: Account<'info, ReputationState>,
}

#[derive(Accounts)]
pub struct GetReputationHistory<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,
    
    #[account(
        seeds = [b"user_profile", user_profile.user.as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
}

#[derive(Accounts)]
pub struct InitializeBayesianParams<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = BayesianParams::SIZE,
        seeds = [b"bayesian_params"],
        bump
    )]
    pub bayesian_params: Account<'info, BayesianParams>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CalculatePremiumDiscount<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,
    
    #[account(
        seeds = [b"user_profile", user_profile.user.as_ref()],
        bump = user_profile.bump
    )]
    pub user_profile: Account<'info, UserProfile>,
    
    #[account(
        seeds = [b"bayesian_params"],
        bump = bayesian_params.bump
    )]
    pub bayesian_params: Account<'info, BayesianParams>,
}

#[account]
#[derive(Default)]
pub struct ReputationState {
    pub authority: Pubkey,
    pub insurance_program_id: Pubkey,
    pub escrow_program_id: Pubkey,
    pub initial_reputation_score: u8,
    pub total_profiles: u64,
    pub average_score: u8,
    pub last_update_timestamp: i64,
    pub bump: u8,
}

impl ReputationState {
    pub const SIZE: usize = 8 +  // discriminator
                           32 + // authority
                           32 + // insurance_program_id
                           32 + // escrow_program_id
                           1 +  // initial_reputation_score
                           8 +  // total_profiles
                           1 +  // average_score
                           8 +  // last_update_timestamp
                           1;   // bump
}

#[account]
#[derive(Default)]
pub struct UserProfile {
    pub user: Pubkey,
    pub reputation_score: u8,
    pub completed_contracts: u32,
    pub successful_contracts: u32,
    pub disputed_contracts: u32,
    pub claims_submitted: u32,
    pub claims_approved: u32,
    pub claims_rejected: u32,
    pub last_update_timestamp: i64,
    pub creation_slot: u64,
    pub history: Vec<ReputationHistory>,
    pub recent_activities: Vec<Activity>,
    pub bump: u8,
}

impl UserProfile {
    pub const SIZE: usize = 8 +  // discriminator
                           32 + // user
                           1 +  // reputation_score
                           4 +  // completed_contracts
                           4 +  // successful_contracts
                           4 +  // disputed_contracts
                           4 +  // claims_submitted
                           4 +  // claims_approved
                           4 +  // claims_rejected
                           8 +  // last_update_timestamp
                           8 +  // creation_slot
                           (1 + 10 * ReputationHistory::SIZE) + // history vector with 10 items
                           (1 + 5 * Activity::SIZE) + // recent_activities vector with 5 items
                           1;   // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct ReputationHistory {
    pub timestamp: i64,
    pub previous_score: u8,
    pub new_score: u8,
    pub reason: String,
}

impl ReputationHistory {
    pub const SIZE: usize = 8 + // timestamp
                           1 + // previous_score
                           1 + // new_score
                           40; // reason (max string length)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct Activity {
    pub timestamp: i64,
    pub activity_type: ActivityType,
    pub details: String,
    pub related_id: Option<String>,
    pub score_change: i8,
}

impl Activity {
    pub const SIZE: usize = 8 + // timestamp
                           1 + // activity_type enum
                           64 + // details (max string length)
                           (1 + 32) + // related_id optional string
                           1; // score_change
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum ActivityType {
    ContractCompletion,
    ClaimSubmission,
    ClaimApproval,
    ClaimRejection,
    Other,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct ReputationAnalytics {
    pub user: Pubkey,
    pub current_score: u8,
    pub reputation_factor: u8,
    pub completed_contracts: u32,
    pub successful_rate: u8,
    pub disputed_rate: u8,
    pub claims_approved_rate: u8,
    pub activity_score: u8,
    pub reliability_score: u8,
    pub last_update_timestamp: i64,
}

#[account]
#[derive(Default)]
pub struct BayesianParams {
    pub authority: Pubkey,
    pub prior_mean: u16,
    pub prior_strength: u16,
    pub contract_completion_weight: u16,
    pub contract_dispute_weight: u16,
    pub claim_approval_weight: u16,
    pub claim_rejection_weight: u16,
    pub time_decay_factor: u16,
    pub min_discount: u16,
    pub max_discount: u16,
    pub discount_curve_factor: u16,
    pub bump: u8,
}

impl BayesianParams {
    pub const SIZE: usize = 8 +  // discriminator
                           32 + // authority
                           2 +  // prior_mean
                           2 +  // prior_strength
                           2 +  // contract_completion_weight
                           2 +  // contract_dispute_weight
                           2 +  // claim_approval_weight
                           2 +  // claim_rejection_weight
                           2 +  // time_decay_factor
                           2 +  // min_discount
                           2 +  // max_discount
                           2 +  // discount_curve_factor
                           1;   // bump
}

#[error_code]
pub enum ReputationError {
    #[msg("Caller is not authorized to perform this action")]
    Unauthorized,
    #[msg("Invalid input parameters")]
    InvalidParameter,
}
