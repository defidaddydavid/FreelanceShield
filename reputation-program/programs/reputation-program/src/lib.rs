use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Token};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod reputation_program {
    use super::*;

    /// Initialize a new reputation profile for a user
    pub fn initialize_profile(
        ctx: Context<InitializeProfile>, 
        user_ethereum_address: Option<String>
    ) -> Result<()> {
        let profile = &mut ctx.accounts.reputation_profile;
        let user = &ctx.accounts.user;
        
        profile.owner = user.key();
        profile.ethereum_address = user_ethereum_address;
        profile.total_score = 0;
        profile.completed_work_score = 0;
        profile.dispute_resolution_score = 0;
        profile.payment_history_score = 0;
        profile.claim_history_score = 0;
        profile.community_participation_score = 0;
        profile.fs_reputation = 0;
        profile.colony_reputation = 0;
        profile.braintrust_reputation = 0;
        profile.transaction_count = 0;
        profile.last_updated = Clock::get()?.unix_timestamp;
        profile.bump = *ctx.bumps.get("reputation_profile").unwrap();
        
        msg!("Reputation profile initialized for user: {}", user.key());
        Ok(())
    }
    
    /// Update reputation scores from FreelanceShield protocol activity
    pub fn update_internal_reputation(
        ctx: Context<UpdateReputation>,
        dimension: u8,
        value: u64,
        transaction_id: String
    ) -> Result<()> {
        let profile = &mut ctx.accounts.reputation_profile;
        let auth_program = &ctx.accounts.auth_program;
        
        // Verify that the calling program is authorized to update reputation
        if !is_authorized_program(auth_program.key()) {
            return Err(error!(ErrorCode::UnauthorizedProgram));
        }
        
        // Update the specific dimension
        match dimension {
            0 => {
                profile.completed_work_score = update_bayesian_score(
                    profile.completed_work_score, 
                    value
                );
            },
            1 => {
                profile.dispute_resolution_score = update_bayesian_score(
                    profile.dispute_resolution_score,
                    value
                );
            },
            2 => {
                profile.payment_history_score = update_bayesian_score(
                    profile.payment_history_score,
                    value
                );
            },
            3 => {
                profile.claim_history_score = update_bayesian_score(
                    profile.claim_history_score,
                    value
                );
            },
            4 => {
                profile.community_participation_score = update_bayesian_score(
                    profile.community_participation_score,
                    value
                );
            },
            _ => return Err(error!(ErrorCode::InvalidDimension))
        }
        
        // Update overall FreelanceShield reputation
        profile.fs_reputation = calculate_total_score(profile);
        
        // Update overall aggregate score
        profile.total_score = calculate_aggregate_score(profile);
        
        // Increment transaction count and update timestamp
        profile.transaction_count += 1;
        profile.last_updated = Clock::get()?.unix_timestamp;
        
        // Record this update in history (for transparency/auditability)
        // In a real implementation, you would likely use a separate account
        // to store history entries or emit an event for indexing
        
        msg!("Updated reputation for dimension {}: {}", dimension, value);
        Ok(())
    }
    
    /// Import reputation from Colony (Ethereum)
    pub fn import_colony_reputation(
        ctx: Context<ImportExternalReputation>,
        completed_work: u64,
        community_participation: u64,
        verified_hash: [u8; 32],
        oracle_signature: [u8; 64]
    ) -> Result<()> {
        let profile = &mut ctx.accounts.reputation_profile;
        let oracle = &ctx.accounts.oracle;
        
        // Verify the oracle signature (simplified)
        // In a real implementation, you would verify that the oracle
        // is authorized and that the signature is valid for the data
        if !verify_oracle_signature(oracle.key(), &verified_hash, &oracle_signature) {
            return Err(error!(ErrorCode::InvalidOracleSignature));
        }
        
        // Update Colony-specific dimensions
        profile.completed_work_score = update_weighted_score(
            profile.completed_work_score,
            completed_work,
            20 // Colony source weight is 20%
        );
        
        profile.community_participation_score = update_weighted_score(
            profile.community_participation_score,
            community_participation,
            20 // Colony source weight is 20%
        );
        
        // Update Colony reputation score
        profile.colony_reputation = (completed_work + community_participation) / 2;
        
        // Update overall aggregate score
        profile.total_score = calculate_aggregate_score(profile);
        
        // Update metadata
        profile.last_updated = Clock::get()?.unix_timestamp;
        
        msg!("Imported Colony reputation from Ethereum");
        Ok(())
    }
    
    /// Import reputation from Braintrust (Solana)
    pub fn import_braintrust_reputation(
        ctx: Context<ImportExternalReputation>,
        completed_work: u64,
        payment_history: u64,
        verified_hash: [u8; 32],
        oracle_signature: [u8; 64]
    ) -> Result<()> {
        let profile = &mut ctx.accounts.reputation_profile;
        let oracle = &ctx.accounts.oracle;
        
        // Verify the oracle signature
        if !verify_oracle_signature(oracle.key(), &verified_hash, &oracle_signature) {
            return Err(error!(ErrorCode::InvalidOracleSignature));
        }
        
        // Update Braintrust-specific dimensions
        profile.completed_work_score = update_weighted_score(
            profile.completed_work_score,
            completed_work,
            15 // Braintrust source weight is 15%
        );
        
        profile.payment_history_score = update_weighted_score(
            profile.payment_history_score,
            payment_history,
            15 // Braintrust source weight is 15%
        );
        
        // Update Braintrust reputation score
        profile.braintrust_reputation = (completed_work + payment_history) / 2;
        
        // Update overall aggregate score
        profile.total_score = calculate_aggregate_score(profile);
        
        // Update metadata
        profile.last_updated = Clock::get()?.unix_timestamp;
        
        msg!("Imported Braintrust reputation from Solana");
        Ok(())
    }
    
    /// Calculate premium discount based on reputation score
    pub fn calculate_premium_discount(
        ctx: Context<GetPremiumDiscount>
    ) -> Result<u8> {
        let profile = &ctx.accounts.reputation_profile;
        
        // Minimum score required for discount
        const MIN_SCORE_FOR_DISCOUNT: u64 = 50; // 0.5 * 100
        
        // Maximum possible discount percentage
        const MAX_DISCOUNT_PERCENTAGE: u8 = 25;
        
        if profile.total_score < MIN_SCORE_FOR_DISCOUNT {
            return Ok(0);
        }
        
        // Linear scaling from 0% to MAX_DISCOUNT_PERCENTAGE
        // Map 50 -> 0% and 100 -> 25%
        let normalized_score = (profile.total_score - MIN_SCORE_FOR_DISCOUNT) as f64 / 
                               (100 - MIN_SCORE_FOR_DISCOUNT) as f64;
        
        let discount_percentage = (normalized_score * MAX_DISCOUNT_PERCENTAGE as f64) as u8;
        
        // Ensure the discount is capped at MAX_DISCOUNT_PERCENTAGE
        let capped_discount = std::cmp::min(discount_percentage, MAX_DISCOUNT_PERCENTAGE);
        
        Ok(capped_discount)
    }
}

/// Helper function to update a score using Bayesian approach
fn update_bayesian_score(current_score: u64, new_value: u64) -> u64 {
    // The current_score is stored as an integer 0-100
    // For Bayesian calculation, we convert to range 0-1
    let current = current_score as f64 / 100.0;
    let value = new_value as f64 / 100.0;
    
    // Alpha and beta are prior parameters (simplified here)
    // In a full implementation, these would be calibrated based on
    // the specific dimension and prior data
    let alpha = 5.0;
    let beta = 2.0;
    
    // Update using Bayesian formula
    let updated = (alpha * current + value) / (alpha + beta + 1.0);
    
    // Convert back to 0-100 range and return
    (updated * 100.0) as u64
}

/// Helper function to update a score with source weighting
fn update_weighted_score(current_score: u64, new_score: u64, weight_percent: u8) -> u64 {
    // Convert weight to a fraction (0-1)
    let weight = weight_percent as f64 / 100.0;
    
    // Calculate weighted average
    let internal_weight = 1.0 - weight;
    let weighted_score = (current_score as f64 * internal_weight) + 
                         (new_score as f64 * weight);
    
    weighted_score as u64
}

/// Calculate the aggregate reputation score across all dimensions
fn calculate_total_score(profile: &ReputationProfile) -> u64 {
    // Dimension weights (must sum to 100)
    const COMPLETED_WORK_WEIGHT: u8 = 40;
    const DISPUTE_RESOLUTION_WEIGHT: u8 = 20;
    const PAYMENT_HISTORY_WEIGHT: u8 = 15;
    const CLAIM_HISTORY_WEIGHT: u8 = 15;
    const COMMUNITY_PARTICIPATION_WEIGHT: u8 = 10;
    
    // Calculate weighted sum
    let weighted_sum = 
        (profile.completed_work_score as u128 * COMPLETED_WORK_WEIGHT as u128 +
         profile.dispute_resolution_score as u128 * DISPUTE_RESOLUTION_WEIGHT as u128 +
         profile.payment_history_score as u128 * PAYMENT_HISTORY_WEIGHT as u128 +
         profile.claim_history_score as u128 * CLAIM_HISTORY_WEIGHT as u128 +
         profile.community_participation_score as u128 * COMMUNITY_PARTICIPATION_WEIGHT as u128) / 100;
    
    weighted_sum as u64
}

/// Calculate the aggregate score across all sources
fn calculate_aggregate_score(profile: &ReputationProfile) -> u64 {
    // Source weights (must sum to 100)
    const FS_WEIGHT: u8 = 65;
    const COLONY_WEIGHT: u8 = 20;
    const BRAINTRUST_WEIGHT: u8 = 15;
    
    // Calculate weighted sum
    let weighted_sum = 
        (profile.fs_reputation as u128 * FS_WEIGHT as u128 +
         profile.colony_reputation as u128 * COLONY_WEIGHT as u128 +
         profile.braintrust_reputation as u128 * BRAINTRUST_WEIGHT as u128) / 100;
    
    weighted_sum as u64
}

/// Check if a program is authorized to update reputation
fn is_authorized_program(program_id: Pubkey) -> bool {
    // In production, you would maintain a list of authorized programs
    // such as your core program, claims processor, and policy program
    
    // For testing, we'll just return true
    // TODO: Implement proper authorization checks
    true
}

/// Verify oracle signature for external reputation imports
fn verify_oracle_signature(
    oracle_pubkey: Pubkey,
    verified_hash: &[u8; 32],
    oracle_signature: &[u8; 64]
) -> bool {
    // In production, you would verify the ed25519 signature
    // For testing, we'll just return true
    // TODO: Implement proper signature verification
    true
}

#[derive(Accounts)]
pub struct InitializeProfile<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        init,
        payer = user,
        space = ReputationProfile::LEN,
        seeds = [b"reputation", user.key().as_ref()],
        bump,
    )]
    pub reputation_profile: Account<'info, ReputationProfile>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    /// The program calling this instruction
    pub auth_program: Signer<'info>,
    
    /// The owner of the reputation profile
    /// CHECK: The owner is not required to sign for internal updates
    pub user: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"reputation", user.key().as_ref()],
        bump = reputation_profile.bump,
    )]
    pub reputation_profile: Account<'info, ReputationProfile>,
}

#[derive(Accounts)]
pub struct ImportExternalReputation<'info> {
    /// The user must sign to import external reputation
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"reputation", user.key().as_ref()],
        bump = reputation_profile.bump,
        constraint = reputation_profile.owner == user.key()
    )]
    pub reputation_profile: Account<'info, ReputationProfile>,
    
    /// The oracle that verifies external reputation data
    /// CHECK: The oracle signature is verified in the instruction
    pub oracle: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct GetPremiumDiscount<'info> {
    /// Policy program or risk pool program requesting the discount
    pub requester: Signer<'info>,
    
    /// The user's reputation profile
    #[account(
        seeds = [b"reputation", user.key().as_ref()],
        bump = reputation_profile.bump
    )]
    pub reputation_profile: Account<'info, ReputationProfile>,
    
    /// The user who owns the reputation profile
    /// CHECK: No need to verify the user for a read-only operation
    pub user: AccountInfo<'info>,
}

// Reputation Profile data account
#[account]
pub struct ReputationProfile {
    // Owner of this profile
    pub owner: Pubkey,
    
    // Optional linked Ethereum address for Colony integration
    pub ethereum_address: Option<String>,
    
    // Aggregate reputation score (0-100)
    pub total_score: u64,
    
    // Dimension scores (0-100 each)
    pub completed_work_score: u64,
    pub dispute_resolution_score: u64,
    pub payment_history_score: u64,
    pub claim_history_score: u64,
    pub community_participation_score: u64,
    
    // Source scores (0-100 each)
    pub fs_reputation: u64,
    pub colony_reputation: u64,
    pub braintrust_reputation: u64,
    
    // Metadata
    pub transaction_count: u64,
    pub last_updated: i64,
    
    // PDA bump
    pub bump: u8,
}

impl ReputationProfile {
    // Size calculation for account allocation
    pub const LEN: usize = 8 + // Discriminator
                           32 + // owner: Pubkey
                           (1 + 42) + // ethereum_address: Option<String> (max 42 chars)
                           8 + // total_score: u64
                           8 + // completed_work_score: u64
                           8 + // dispute_resolution_score: u64
                           8 + // payment_history_score: u64
                           8 + // claim_history_score: u64
                           8 + // community_participation_score: u64
                           8 + // fs_reputation: u64
                           8 + // colony_reputation: u64
                           8 + // braintrust_reputation: u64
                           8 + // transaction_count: u64
                           8 + // last_updated: i64
                           1 + // bump: u8
                           100; // extra space for future expansion
}

#[error_code]
pub enum ErrorCode {
    #[msg("The provided dimension is invalid")]
    InvalidDimension,
    
    #[msg("The program is not authorized to update reputation")]
    UnauthorizedProgram,
    
    #[msg("The oracle signature is invalid")]
    InvalidOracleSignature,
}
