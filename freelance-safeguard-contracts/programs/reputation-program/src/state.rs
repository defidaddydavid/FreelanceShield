use anchor_lang::prelude::*;
use std::collections::HashMap;

// Program state account that stores global reputation system configuration
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

// User reputation profile account
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
                           4 + 10 * ReputationHistory::SIZE + // history (max 10 entries)
                           4 + 5 * Activity::SIZE +  // recent_activities (max 5 entries)
                           1;   // bump
}

// Reputation history entry
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
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
                           4 + 50; // reason (max string length 50)
}

// User activity types
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ActivityType {
    ContractCreation,
    ContractCompletion,
    ClaimSubmission,
    ClaimApproval,
    ClaimRejection,
    Other,
}

impl Default for ActivityType {
    fn default() -> Self {
        ActivityType::Other
    }
}

// User activity entry
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
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
                           4 + 60 + // details (max string length 60)
                           1 + 4 + 20 + // related_id (Option<String> max length 20)
                           1;  // score_change
}

// Analytics return data structure
#[derive(AnchorSerialize, AnchorDeserialize)]
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
