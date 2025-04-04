use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use std::convert::TryFrom;

declare_id!("4jnnT3KKDFbWEci229ku4CGeRaiQupYDKxqDjAaQjyWM");

// Define program IDs for cross-program invocation
pub const ENHANCED_COVER_PROGRAM_ID: Pubkey = anchor_lang::solana_program::pubkey!("CvrPgm6dYqzKH5KVvKMiriyts4pVrk6ogLH1KUW3dVnW");
pub const RISK_POOL_PROGRAM_ID: Pubkey = anchor_lang::solana_program::pubkey!("GywN3pRCKVXyAVNxkePotBFEYcFSvULw5qefacsUmsdt");

// Constants for evidence management
pub const MAX_EVIDENCE_DESCRIPTION_LENGTH: usize = 512;
pub const MAX_EVIDENCE_HASH_LENGTH: usize = 64;
pub const MAX_EVIDENCE_ATTACHMENTS: usize = 5;
pub const MAX_REASON_LENGTH: usize = 256;

#[program]
pub mod enhanced_claims {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        cover_program_id: Pubkey,
        risk_pool_id: Pubkey,
        arbitration_threshold: u8,
        auto_claim_limit: u64,
        auto_process_threshold: u8,
        min_votes_required: u8,
        voting_period_days: u8,
    ) -> Result<()> {
        let claims_state = &mut ctx.accounts.claims_state;
        claims_state.authority = ctx.accounts.authority.key();
        claims_state.cover_program_id = cover_program_id;
        claims_state.risk_pool_id = risk_pool_id;
        claims_state.arbitration_threshold = arbitration_threshold;
        claims_state.auto_claim_limit = auto_claim_limit;
        claims_state.auto_process_threshold = auto_process_threshold;
        claims_state.min_votes_required = min_votes_required;
        claims_state.voting_period_days = voting_period_days;
        claims_state.total_claims = 0;
        claims_state.approved_claims = 0;
        claims_state.rejected_claims = 0;
        claims_state.arbitrated_claims = 0;
        claims_state.total_payout_amount = 0;
        claims_state.is_paused = false;
        claims_state.last_update_timestamp = Clock::get()?.unix_timestamp;
        claims_state.bump = *ctx.bumps.get("claims_state").unwrap();
        
        msg!("Enhanced Claims processor initialized");
        Ok(())
    }

    pub fn submit_claim(
        ctx: Context<SubmitClaim>,
        amount: u64,
        evidence_type: String,
        evidence_description: String,
        evidence_hashes: Vec<String>,
        claim_category: ClaimCategory,
    ) -> Result<()> {
        let claims_state = &ctx.accounts.claims_state;
        let claim = &mut ctx.accounts.claim;
        let policy = &ctx.accounts.policy;
        let clock = Clock::get()?;
        
        // Validate evidence
        require!(
            evidence_description.len() <= MAX_EVIDENCE_DESCRIPTION_LENGTH,
            ClaimsError::EvidenceDescriptionTooLong
        );
        
        require!(
            evidence_hashes.len() <= MAX_EVIDENCE_ATTACHMENTS,
            ClaimsError::TooManyEvidenceAttachments
        );
        
        for hash in &evidence_hashes {
            require!(
                hash.len() <= MAX_EVIDENCE_HASH_LENGTH,
                ClaimsError::EvidenceHashTooLong
            );
        }
        
        // Validate policy is active (status = 0 for Active in PolicyStatus enum)
        require!(
            policy.status == 0, // PolicyStatus::Active
            ClaimsError::PolicyNotActive
        );
        
        // Validate claim period
        require!(
            clock.unix_timestamp <= policy.claim_period_end,
            ClaimsError::ClaimPeriodExpired
        );
        
        // Validate claim amount is within policy coverage
        require!(
            amount <= policy.coverage_amount,
            ClaimsError::ClaimAmountExceedsCoverage
        );
        
        // Validate program is not paused
        require!(!claims_state.is_paused, ClaimsError::ProgramPaused);
        
        // Calculate days since policy started
        let policy_age_days = (clock.unix_timestamp - policy.start_date) / 86400;
        
        // Calculate time-based risk factors
        let time_factor = calculate_time_risk_factor(policy_age_days as u16, policy.end_date, policy.claim_period_end);
        
        // Calculate claim amount risk
        let amount_risk = (amount as f64 / policy.coverage_amount as f64 * 100.0) as u8;
        
        // Initialize claim with enhanced data
        claim.policy = ctx.accounts.policy.key();
        claim.owner = ctx.accounts.owner.key();
        claim.amount = amount;
        claim.status = ClaimStatus::Pending;
        claim.evidence_type = evidence_type;
        claim.evidence_description = evidence_description;
        claim.evidence_hashes = evidence_hashes;
        claim.submission_date = clock.unix_timestamp;
        claim.category = claim_category;
        claim.verdict = None;
        claim.votes = Vec::new();
        claim.voting_end_date = clock.unix_timestamp + (claims_state.voting_period_days as i64 * 86400);
        claim.transaction_signature = None;
        claim.creation_slot = clock.slot;
        claim.last_update_slot = clock.slot;
        
        // Calculate enhanced risk score for fraud detection
        claim.risk_score = calculate_initial_risk_score(
            amount,
            policy.coverage_amount,
            policy.claims_count,
            policy_age_days as u64,
            time_factor,
            amount_risk,
            claim_category
        );
        
        claim.bump = *ctx.bumps.get("claim").unwrap();
        
        // Update policy claims count
        let mut policy_account = ctx.accounts.policy.to_account_info();
        let mut policy_data = policy_account.try_borrow_mut_data()?;
        let mut policy_state = Policy::try_deserialize(&mut &policy_data[..])?;
        policy_state.claims_count += 1;
        Policy::try_serialize(&policy_state, &mut &mut policy_data[..])?;
        
        // Update claims state
        let mut claims_state_account = ctx.accounts.claims_state.to_account_info();
        let mut claims_data = claims_state_account.try_borrow_mut_data()?;
        let mut state = ClaimsState::try_deserialize(&mut &claims_data[..])?;
        state.total_claims += 1;
        state.last_update_timestamp = clock.unix_timestamp;
        ClaimsState::try_serialize(&state, &mut &mut claims_data[..])?;
        
        // Auto-process small claims with low risk
        if amount <= claims_state.auto_claim_limit && claim.risk_score <= claims_state.auto_process_threshold {
            claim.status = ClaimStatus::Approved;
            claim.verdict = Some(Verdict {
                approved: true,
                reason: "Auto-approved: Low risk, small claim".to_string(),
                processed_at: clock.unix_timestamp,
                processor: ProcessorType::Automated,
            });
            
            // Process payout (would be implemented in production)
            msg!("Auto-approved claim would trigger payout here");
            
            // Update claims state for approved claim
            let mut claims_data = claims_state_account.try_borrow_mut_data()?;
            let mut state = ClaimsState::try_deserialize(&mut &claims_data[..])?;
            state.approved_claims += 1;
            state.total_payout_amount += amount;
            state.last_update_timestamp = clock.unix_timestamp;
            ClaimsState::try_serialize(&state, &mut &mut claims_data[..])?;
            
            msg!("Claim auto-approved");
        } else if claim.risk_score >= claims_state.arbitration_threshold {
            claim.status = ClaimStatus::UnderReview;
            msg!("Claim submitted for manual review due to high risk score: {}", claim.risk_score);
        } else {
            claim.status = ClaimStatus::PendingVote;
            msg!("Claim submitted for community voting");
        }
        
        // Log claim details for blockchain explorer
        msg!("Claim ID: {}", claim.key());
        msg!("Risk Score: {}", claim.risk_score);
        msg!("Amount: {}", amount);
        msg!("Category: {:?}", claim_category);
        
        Ok(())
    }

    pub fn vote_on_claim(
        ctx: Context<VoteOnClaim>,
        approve: bool,
        reason: String,
    ) -> Result<()> {
        let claim = &mut ctx.accounts.claim;
        let voter = &ctx.accounts.voter;
        let clock = Clock::get()?;
        
        // Validate claim is in voting period
        require!(
            claim.status == ClaimStatus::PendingVote,
            ClaimsError::ClaimNotPendingVote
        );
        
        require!(
            clock.unix_timestamp <= claim.voting_end_date,
            ClaimsError::VotingPeriodEnded
        );
        
        // Validate reason length
        require!(
            reason.len() <= MAX_REASON_LENGTH,
            ClaimsError::ReasonTooLong
        );
        
        // Check if voter has already voted
        for vote in &claim.votes {
            require!(
                vote.voter != voter.key(),
                ClaimsError::AlreadyVoted
            );
        }
        
        // Add vote
        claim.votes.push(Vote {
            voter: voter.key(),
            approve,
            reason: reason.clone(),
            timestamp: clock.unix_timestamp,
            weight: 1, // Default weight, could be based on reputation in future
        });
        
        claim.last_update_slot = clock.slot;
        
        // Check if voting threshold is reached
        let claims_state = &ctx.accounts.claims_state;
        if claim.votes.len() >= claims_state.min_votes_required as usize {
            // Count votes
            let mut approve_count = 0;
            let mut reject_count = 0;
            let mut total_weight = 0;
            
            for vote in &claim.votes {
                if vote.approve {
                    approve_count += vote.weight;
                } else {
                    reject_count += vote.weight;
                }
                total_weight += vote.weight;
            }
            
            // Determine outcome
            if total_weight >= claims_state.min_votes_required as u8 {
                let approved = approve_count > reject_count;
                claim.status = if approved { ClaimStatus::Approved } else { ClaimStatus::Rejected };
                claim.verdict = Some(Verdict {
                    approved,
                    reason: format!("Community vote: {} approve, {} reject", approve_count, reject_count),
                    processed_at: clock.unix_timestamp,
                    processor: ProcessorType::CommunityVote,
                });
                
                // Update claims state
                let mut claims_state_account = ctx.accounts.claims_state.to_account_info();
                let mut claims_data = claims_state_account.try_borrow_mut_data()?;
                let mut state = ClaimsState::try_deserialize(&mut &claims_data[..])?;
                
                if approved {
                    state.approved_claims += 1;
                    state.total_payout_amount += claim.amount;
                    
                    // Process payout (would be implemented in production)
                    msg!("Community approved claim would trigger payout here");
                } else {
                    state.rejected_claims += 1;
                }
                
                state.last_update_timestamp = clock.unix_timestamp;
                ClaimsState::try_serialize(&state, &mut &mut claims_data[..])?;
                
                msg!("Claim voting completed: {}", if approved { "Approved" } else { "Rejected" });
            }
        }
        
        msg!("Vote recorded successfully");
        Ok(())
    }

    pub fn arbitrate_claim(
        ctx: Context<ArbitrateClaim>,
        approved: bool,
        reason: String,
    ) -> Result<()> {
        let claims_state = &ctx.accounts.claims_state;
        let claim = &mut ctx.accounts.claim;
        let arbitrator = &ctx.accounts.arbitrator;
        let clock = Clock::get()?;
        
        // Validate arbitrator authority
        require!(
            arbitrator.key() == claims_state.authority,
            ClaimsError::Unauthorized
        );
        
        // Validate claim is under review or in disputed state
        require!(
            claim.status == ClaimStatus::UnderReview || 
            claim.status == ClaimStatus::Disputed,
            ClaimsError::ClaimNotEligibleForArbitration
        );
        
        // Validate reason length
        require!(
            reason.len() <= MAX_REASON_LENGTH,
            ClaimsError::ReasonTooLong
        );
        
        // Update claim status and verdict
        claim.status = if approved { ClaimStatus::Approved } else { ClaimStatus::Rejected };
        claim.verdict = Some(Verdict {
            approved,
            reason,
            processed_at: clock.unix_timestamp,
            processor: ProcessorType::Arbitrator,
        });
        
        claim.last_update_slot = clock.slot;
        
        // Update claims state
        let mut claims_state_account = ctx.accounts.claims_state.to_account_info();
        let mut claims_data = claims_state_account.try_borrow_mut_data()?;
        let mut state = ClaimsState::try_deserialize(&mut &claims_data[..])?;
        
        if approved {
            state.approved_claims += 1;
            state.total_payout_amount += claim.amount;
            
            // Process payout (would be implemented in production)
            msg!("Arbitrated approved claim would trigger payout here");
        } else {
            state.rejected_claims += 1;
        }
        
        state.arbitrated_claims += 1;
        state.last_update_timestamp = clock.unix_timestamp;
        ClaimsState::try_serialize(&state, &mut &mut claims_data[..])?;
        
        msg!("Claim arbitrated: {}", if approved { "Approved" } else { "Rejected" });
        Ok(())
    }

    pub fn dispute_claim(
        ctx: Context<DisputeClaim>,
        reason: String,
    ) -> Result<()> {
        let claim = &mut ctx.accounts.claim;
        let owner = &ctx.accounts.owner;
        let clock = Clock::get()?;
        
        // Validate owner is the claim owner
        require!(
            owner.key() == claim.owner,
            ClaimsError::Unauthorized
        );
        
        // Validate claim is rejected and can be disputed
        require!(
            claim.status == ClaimStatus::Rejected,
            ClaimsError::ClaimNotRejected
        );
        
        // Validate reason length
        require!(
            reason.len() <= MAX_REASON_LENGTH,
            ClaimsError::ReasonTooLong
        );
        
        // Update claim status
        claim.status = ClaimStatus::Disputed;
        claim.last_update_slot = clock.slot;
        
        // Add dispute information
        claim.dispute_reason = Some(reason);
        claim.dispute_date = Some(clock.unix_timestamp);
        
        msg!("Claim disputed successfully");
        Ok(())
    }
}

// Helper functions
fn calculate_time_risk_factor(policy_age_days: u16, policy_end_date: i64, claim_period_end: i64) -> u8 {
    let now = Clock::get().unwrap().unix_timestamp;
    
    // Higher risk for claims made very early or very late in policy lifecycle
    if policy_age_days < 7 {
        // Claims in first week are high risk
        return 90;
    } else if now > policy_end_date {
        // Claims after policy end date but within claim period are higher risk
        let days_after_end = (now - policy_end_date) / 86400;
        return 50 + (days_after_end as u8 * 5).min(40); // Max 90
    } else {
        // Normal risk during policy period
        return 30;
    }
}

fn calculate_initial_risk_score(
    claim_amount: u64,
    coverage_amount: u64,
    previous_claims: u8,
    policy_age_days: u64,
    time_factor: u8,
    amount_risk: u8,
    category: ClaimCategory,
) -> u8 {
    // Base risk from time factor
    let mut risk_score = time_factor;
    
    // Add risk based on claim amount percentage
    risk_score = risk_score.saturating_add(amount_risk / 2);
    
    // Add risk based on previous claims
    risk_score = risk_score.saturating_add(previous_claims * 10);
    
    // Adjust based on claim category
    let category_risk = match category {
        ClaimCategory::ContractBreach => 10,
        ClaimCategory::NonPayment => 15,
        ClaimCategory::WorkNotDelivered => 20,
        ClaimCategory::QualityIssue => 25,
        ClaimCategory::IntellectualPropertyTheft => 30,
        ClaimCategory::Fraud => 40,
        ClaimCategory::Other => 20,
    };
    
    risk_score = risk_score.saturating_add(category_risk);
    
    // Cap at 100
    risk_score.min(100)
}

// Account structures
#[account]
#[derive(Default)]
pub struct ClaimsState {
    pub authority: Pubkey,
    pub cover_program_id: Pubkey,
    pub risk_pool_id: Pubkey,
    pub arbitration_threshold: u8,
    pub auto_claim_limit: u64,
    pub auto_process_threshold: u8,
    pub min_votes_required: u8,
    pub voting_period_days: u8,
    pub total_claims: u64,
    pub approved_claims: u64,
    pub rejected_claims: u64,
    pub arbitrated_claims: u64,
    pub total_payout_amount: u64,
    pub is_paused: bool,
    pub last_update_timestamp: i64,
    pub bump: u8,
}

impl ClaimsState {
    pub const SIZE: usize = 32 + // authority
                            32 + // cover_program_id
                            32 + // risk_pool_id
                            1 +  // arbitration_threshold
                            8 +  // auto_claim_limit
                            1 +  // auto_process_threshold
                            1 +  // min_votes_required
                            1 +  // voting_period_days
                            8 +  // total_claims
                            8 +  // approved_claims
                            8 +  // rejected_claims
                            8 +  // arbitrated_claims
                            8 +  // total_payout_amount
                            1 +  // is_paused
                            8 +  // last_update_timestamp
                            1;   // bump
}

#[account]
#[derive(Default)]
pub struct Claim {
    pub policy: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
    pub status: ClaimStatus,
    pub evidence_type: String,
    pub evidence_description: String,
    pub evidence_hashes: Vec<String>,
    pub submission_date: i64,
    pub category: ClaimCategory,
    pub risk_score: u8,
    pub verdict: Option<Verdict>,
    pub votes: Vec<Vote>,
    pub voting_end_date: i64,
    pub dispute_reason: Option<String>,
    pub dispute_date: Option<i64>,
    pub transaction_signature: Option<String>,
    pub creation_slot: u64,
    pub last_update_slot: u64,
    pub bump: u8,
}

impl Claim {
    pub const SIZE: usize = 32 + // policy
                           32 + // owner
                           8 +  // amount
                           1 +  // status (enum)
                           (4 + 32) + // evidence_type (assuming max 32 chars)
                           (4 + MAX_EVIDENCE_DESCRIPTION_LENGTH) + // evidence_description
                           (4 + (MAX_EVIDENCE_ATTACHMENTS * (4 + MAX_EVIDENCE_HASH_LENGTH))) + // evidence_hashes
                           8 +  // submission_date
                           1 +  // category (enum)
                           1 +  // risk_score
                           (1 + Verdict::SIZE) + // verdict (Option)
                           (4 + (10 * Vote::SIZE)) + // votes (Vec with max 10 votes)
                           8 +  // voting_end_date
                           (1 + (4 + MAX_REASON_LENGTH)) + // dispute_reason (Option<String>)
                           (1 + 8) + // dispute_date (Option<i64>)
                           (1 + (4 + 88)) + // transaction_signature (Option<String>)
                           8 +  // creation_slot
                           8 +  // last_update_slot
                           1;   // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Verdict {
    pub approved: bool,
    pub reason: String,
    pub processed_at: i64,
    pub processor: ProcessorType,
}

impl Verdict {
    pub const SIZE: usize = 1 + // approved
                           (4 + MAX_REASON_LENGTH) + // reason
                           8 + // processed_at
                           1;  // processor (enum)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Vote {
    pub voter: Pubkey,
    pub approve: bool,
    pub reason: String,
    pub timestamp: i64,
    pub weight: u8,
}

impl Vote {
    pub const SIZE: usize = 32 + // voter
                           1 +  // approve
                           (4 + MAX_REASON_LENGTH) + // reason
                           8 +  // timestamp
                           1;   // weight
}

// External account structures
#[account]
#[derive(Default)]
pub struct Policy {
    pub owner: Pubkey,
    pub product_id: Pubkey,
    pub coverage_amount: u64,
    pub premium_amount: u64,
    pub start_date: i64,
    pub end_date: i64,
    pub grace_period_end: i64,
    pub claim_period_end: i64,
    pub status: u8, // PolicyStatus enum
    pub metadata: String,
    pub claims_count: u8,
    pub creation_slot: u64,
    pub last_update_slot: u64,
    pub bump: u8,
}

// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum ClaimStatus {
    Pending,
    PendingVote,
    UnderReview,
    Approved,
    Rejected,
    Disputed,
    Expired,
}

impl Default for ClaimStatus {
    fn default() -> Self {
        ClaimStatus::Pending
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum ClaimCategory {
    ContractBreach,
    NonPayment,
    WorkNotDelivered,
    QualityIssue,
    IntellectualPropertyTheft,
    Fraud,
    Other,
}

impl Default for ClaimCategory {
    fn default() -> Self {
        ClaimCategory::Other
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum ProcessorType {
    Automated,
    Manual,
    CommunityVote,
    Arbitrator,
}

// Context structures
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + ClaimsState::SIZE,
        seeds = [b"claims_state"],
        bump
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct SubmitClaim<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        seeds = [b"claims_state"],
        bump = claims_state.bump
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    /// CHECK: This is the policy account from the enhanced cover program
    #[account(mut)]
    pub policy: AccountInfo<'info>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + Claim::SIZE,
        seeds = [b"claim", policy.key().as_ref(), owner.key().as_ref()],
        bump
    )]
    pub claim: Account<'info, Claim>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct VoteOnClaim<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    
    #[account(
        seeds = [b"claims_state"],
        bump = claims_state.bump
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    #[account(mut)]
    pub claim: Account<'info, Claim>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ArbitrateClaim<'info> {
    #[account(
        constraint = arbitrator.key() == claims_state.authority,
    )]
    pub arbitrator: Signer<'info>,
    
    #[account(
        seeds = [b"claims_state"],
        bump = claims_state.bump
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    #[account(mut)]
    pub claim: Account<'info, Claim>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DisputeClaim<'info> {
    #[account(
        constraint = owner.key() == claim.owner,
    )]
    pub owner: Signer<'info>,
    
    #[account(mut)]
    pub claim: Account<'info, Claim>,
    
    pub system_program: Program<'info, System>,
}

// Error codes
#[error_code]
pub enum ClaimsError {
    #[msg("Policy is not active")]
    PolicyNotActive,
    
    #[msg("Policy has expired")]
    PolicyExpired,
    
    #[msg("Claim period has expired")]
    ClaimPeriodExpired,
    
    #[msg("Claim amount exceeds policy coverage")]
    ClaimAmountExceedsCoverage,
    
    #[msg("Program is paused")]
    ProgramPaused,
    
    #[msg("Evidence description too long")]
    EvidenceDescriptionTooLong,
    
    #[msg("Evidence hash too long")]
    EvidenceHashTooLong,
    
    #[msg("Too many evidence attachments")]
    TooManyEvidenceAttachments,
    
    #[msg("Reason too long")]
    ReasonTooLong,
    
    #[msg("Claim is not pending vote")]
    ClaimNotPendingVote,
    
    #[msg("Voting period has ended")]
    VotingPeriodEnded,
    
    #[msg("Already voted on this claim")]
    AlreadyVoted,
    
    #[msg("Unauthorized")]
    Unauthorized,
    
    #[msg("Claim is not eligible for arbitration")]
    ClaimNotEligibleForArbitration,
    
    #[msg("Claim is not rejected")]
    ClaimNotRejected,
}

