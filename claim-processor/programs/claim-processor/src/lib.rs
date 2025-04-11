use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use solana_program::program::invoke_signed;
use solana_program::program_error::ProgramError;

pub mod state;
pub mod fraud_detection;
pub mod utils;

use state::*;
use fraud_detection::*;
use utils::*;

declare_id!("CLAiMrjTR1vkR4KLmRQ4PsHwxq3a3HrwFPqgJbj2gCAg");

#[program]
pub mod claim_processor {
    use super::*;
    
    /// Initialize a new insurance claim
    pub fn initialize_claim(
        ctx: Context<InitializeClaim>,
        claim_type: u8,
        amount: u64,
        description: String,
    ) -> Result<()> {
        let claim = &mut ctx.accounts.claim;
        let policy = &mut ctx.accounts.policy;
        let claimant = &ctx.accounts.claimant;
        let respondent = ctx.accounts.respondent.key();
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;
        
        // Verify the claim type is valid
        let claim_type = ClaimType::from(claim_type);
        
        // Verify the policy exists and is active
        require!(policy.is_active, ClaimError::PolicyInactive);
        require!(policy.owner == claimant.key(), ClaimError::NotPolicyOwner);
        require!(current_time < policy.expiry_time, ClaimError::PolicyExpired);
        require!(current_time >= policy.waiting_period_end, ClaimError::WaitingPeriodActive);
        
        // Verify the claim amount is within policy limits
        require!(amount <= policy.coverage_amount, ClaimError::ExceedsCoverage);
        
        // Get or initialize claimant history
        let claimant_history = &mut ctx.accounts.claimant_history;
        
        // Check if we're within claim limits
        require!(
            claimant_history.claims_last_30_days < 3,
            ClaimError::TooManyRecentClaims
        );
        
        // Set up the claim account
        let bump = ctx.bumps.claim;
        claim.claim_id = ctx.accounts.claim.key();
        claim.claimant = claimant.key();
        claim.respondent = respondent;
        claim.policy_id = policy.key();
        claim.claim_type = claim_type;
        claim.status = ClaimStatus::Filed;
        claim.amount = amount;
        claim.evidence_count = 0;
        claim.approved_by = None;
        claim.rejected_by = None;
        claim.rejection_reason = None;
        claim.created_at = current_time;
        claim.updated_at = current_time;
        claim.paid_at = None;
        claim.fraud_flags = 0;
        claim.fraud_score = 0;
        claim.requires_manual_review = false;
        claim.bump = bump;
        
        // Update the policy to reflect the new claim
        policy.claim_count += 1;
        
        // Update claimant history
        claimant_history.total_claims += 1;
        claimant_history.claims_last_30_days += 1;
        claimant_history.claims_last_90_days += 1;
        claimant_history.claims_last_365_days += 1;
        claimant_history.total_claimed_amount = claimant_history.total_claimed_amount.saturating_add(amount);
        
        // Check if respondent is repeated
        if respondent == claimant_history.user {
            claimant_history.repeated_respondent_count += 1;
            claimant_history.claims_against_current_respondent += 1;
        }
        
        claimant_history.last_updated = current_time;
        
        // Emit an event
        emit!(ClaimCreatedEvent {
            claim_id: claim.key(),
            claimant: claim.claimant,
            respondent: claim.respondent,
            policy_id: claim.policy_id,
            claim_type: claim_type as u8,
            amount,
            timestamp: current_time,
        });
        
        Ok(())
    }
    
    /// Add evidence to an existing claim
    pub fn add_evidence(
        ctx: Context<AddEvidence>,
        evidence_type: u8,
        evidence_hash: [u8; 32],
        uri: String,
    ) -> Result<()> {
        let claim = &mut ctx.accounts.claim;
        let evidence = &mut ctx.accounts.evidence;
        let submitter = &ctx.accounts.submitter;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;
        
        // Verify evidence type
        let evidence_type = EvidenceType::from(evidence_type);
        
        // Verify the claim exists and is in a valid state
        require!(
            claim.status == ClaimStatus::Filed || claim.status == ClaimStatus::PendingEvidence,
            ClaimError::InvalidClaimStatus
        );
        
        // Verify the submitter is either the claimant or respondent
        require!(
            submitter.key() == claim.claimant || submitter.key() == claim.respondent,
            ClaimError::UnauthorizedEvidenceSubmission
        );
        
        // Initialize the evidence account
        let bump = ctx.bumps.evidence;
        evidence.claim_id = claim.key();
        evidence.submitter = submitter.key();
        evidence.evidence_hash = evidence_hash;
        evidence.evidence_type = evidence_type;
        evidence.uri = uri;
        evidence.timestamp = current_time;
        evidence.verified = false;
        evidence.verifier = None;
        evidence.verification_timestamp = None;
        evidence.bump = bump;
        
        // Update the claim
        claim.evidence_count += 1;
        claim.updated_at = current_time;
        
        // Update status if needed
        if claim.status == ClaimStatus::Filed {
            claim.status = ClaimStatus::PendingEvidence;
        }
        
        // Emit an event
        emit!(EvidenceAddedEvent {
            evidence_id: evidence.key(),
            claim_id: claim.key(),
            submitter: submitter.key(),
            evidence_type: evidence_type as u8,
            timestamp: current_time,
        });
        
        Ok(())
    }
    
    /// Submit a claim for review - this triggers fraud detection
    pub fn submit_claim_for_review(
        ctx: Context<SubmitClaimForReview>,
    ) -> Result<()> {
        let claim = &mut ctx.accounts.claim;
        let claimant = &ctx.accounts.claimant;
        let policy = &ctx.accounts.policy;
        let claimant_history = &ctx.accounts.claimant_history;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;
        
        // Verify the claim is in a valid state for review
        require!(
            claim.status == ClaimStatus::Filed || claim.status == ClaimStatus::PendingEvidence,
            ClaimError::InvalidClaimStatus
        );
        
        // Verify the submitter is the claimant
        require!(
            claimant.key() == claim.claimant,
            ClaimError::NotClaimOwner
        );
        
        // Verify minimum evidence has been submitted
        require!(
            claim.evidence_count >= 2,
            ClaimError::InsufficientEvidence
        );
        
        // Get all evidence for this claim
        let mut evidence_items = Vec::new();
        
        // In a real implementation, we would use a remaining accounts iterator to pass in evidence
        // For this demonstration, we're simulating evidence retrieval
        // This would actually be done by passing in evidence accounts and iterating through remaining_accounts
        
        // Run fraud detection
        let fraud_result = analyze_claim_for_fraud(
            claim,
            policy,
            claimant_history,
            &evidence_items
        );
        
        // Update the claim with fraud detection results
        claim.fraud_flags = fraud_result.fraud_flags;
        claim.fraud_score = fraud_result.fraud_score;
        claim.requires_manual_review = fraud_result.requires_manual_review;
        
        // Update claim status based on fraud detection
        if let Some(reason) = fraud_result.rejection_reason {
            // Automatic rejection due to high fraud score
            claim.status = ClaimStatus::Rejected;
            claim.rejection_reason = Some(reason);
            claim.rejected_by = Some(ctx.program_id);
            
            // Update claimant history
            update_claimant_history_for_rejected_claim(
                claimant_history,
                claim.amount,
                true // Rejected for fraud
            )?;
            
            emit!(ClaimRejectedEvent {
                claim_id: claim.key(),
                rejected_by: ctx.program_id,
                reason: claim.rejection_reason.clone().unwrap_or_default(),
                fraud_score: claim.fraud_score,
                timestamp: current_time,
            });
        } else if fraud_result.requires_manual_review {
            // Needs manual review
            claim.status = ClaimStatus::UnderReview;
            
            emit!(ClaimUnderReviewEvent {
                claim_id: claim.key(),
                fraud_score: claim.fraud_score,
                flags: claim.fraud_flags,
                timestamp: current_time,
            });
        } else {
            // Low fraud risk - can auto-approve if below threshold
            if claim.fraud_score < 20 && claim.amount <= 100 { // Small claims with very low fraud score
                claim.status = ClaimStatus::ApprovedPending;
                claim.approved_by = Some(ctx.program_id);
                
                emit!(ClaimApprovedEvent {
                    claim_id: claim.key(),
                    approved_by: ctx.program_id,
                    amount: claim.amount,
                    timestamp: current_time,
                });
            } else {
                claim.status = ClaimStatus::UnderReview;
                
                emit!(ClaimUnderReviewEvent {
                    claim_id: claim.key(),
                    fraud_score: claim.fraud_score,
                    flags: claim.fraud_flags,
                    timestamp: current_time,
                });
            }
        }
        
        claim.updated_at = current_time;
        
        Ok(())
    }
    
    /// Manual review of a claim by a verifier
    pub fn review_claim(
        ctx: Context<ReviewClaim>,
        approve: bool,
        comments: String,
        fraud_detected: bool,
        fraud_type: Option<u8>,
    ) -> Result<()> {
        let claim = &mut ctx.accounts.claim;
        let policy = &mut ctx.accounts.policy;
        let verification = &mut ctx.accounts.verification;
        let verifier = &ctx.accounts.verifier;
        let claimant_history = &mut ctx.accounts.claimant_history;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;
        
        // Verify the claim is in a valid state for review
        require!(
            claim.status == ClaimStatus::UnderReview,
            ClaimError::InvalidClaimStatus
        );
        
        // Verify the verifier is authorized
        // In a real implementation, we would check against a verifier registry
        // For now, we'll assume the verifier is authorized if they can create the verification account
        
        // Set up the verification account
        let bump = ctx.bumps.verification;
        verification.claim_id = claim.key();
        verification.verifier = verifier.key();
        verification.verdict = approve;
        verification.comments = comments;
        verification.verified_at = current_time;
        verification.evidence_reviewed = Vec::new(); // In real implementation, would be extracted from remaining_accounts
        verification.fraud_detected = fraud_detected;
        verification.fraud_type = fraud_type;
        verification.bump = bump;
        
        // Update the claim based on verification result
        if approve {
            claim.status = ClaimStatus::ApprovedPending;
            claim.approved_by = Some(verifier.key());
            
            emit!(ClaimApprovedEvent {
                claim_id: claim.key(),
                approved_by: verifier.key(),
                amount: claim.amount,
                timestamp: current_time,
            });
        } else {
            claim.status = ClaimStatus::Rejected;
            claim.rejected_by = Some(verifier.key());
            
            // Create rejection reason
            let base_reason = if fraud_detected {
                format!("Fraud detected during manual review")
            } else {
                format!("Claim rejected during manual review")
            };
            
            claim.rejection_reason = Some(format!("{}: {}", base_reason, comments));
            
            // Update claimant history
            update_claimant_history_for_rejected_claim(
                claimant_history,
                claim.amount,
                fraud_detected
            )?;
            
            emit!(ClaimRejectedEvent {
                claim_id: claim.key(),
                rejected_by: verifier.key(),
                reason: claim.rejection_reason.clone().unwrap_or_default(),
                fraud_score: claim.fraud_score,
                timestamp: current_time,
            });
        }
        
        claim.updated_at = current_time;
        
        Ok(())
    }
    
    /// Process an approved claim payment
    pub fn process_claim_payment(
        ctx: Context<ProcessClaimPayment>,
    ) -> Result<()> {
        let claim = &mut ctx.accounts.claim;
        let policy = &mut ctx.accounts.policy;
        let claimant = &ctx.accounts.claimant;
        let claimant_token_account = &ctx.accounts.claimant_token_account;
        let pool_token_account = &ctx.accounts.pool_token_account;
        let token_program = &ctx.accounts.token_program;
        let claimant_history = &mut ctx.accounts.claimant_history;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;
        
        // Verify the claim is approved and pending payment
        require!(
            claim.status == ClaimStatus::ApprovedPending,
            ClaimError::InvalidClaimStatus
        );
        
        // Verify the claimant matches
        require!(
            claimant.key() == claim.claimant,
            ClaimError::NotClaimOwner
        );
        
        // Transfer tokens from pool to claimant
        let pool_seeds = &[
            b"risk_pool".as_ref(),
            &[ctx.bumps.pool_authority]
        ];
        let pool_signer = &[&pool_seeds[..]];
        
        let transfer_instruction = Transfer {
            from: pool_token_account.to_account_info(),
            to: claimant_token_account.to_account_info(),
            authority: ctx.accounts.pool_authority.to_account_info(),
        };
        
        token::transfer(
            CpiContext::new_with_signer(
                token_program.to_account_info(),
                transfer_instruction,
                pool_signer,
            ),
            claim.amount,
        )?;
        
        // Update the claim
        claim.status = ClaimStatus::Paid;
        claim.paid_at = Some(current_time);
        claim.updated_at = current_time;
        
        // Update the policy
        policy.paid_claim_count += 1;
        policy.total_paid_amount = policy.total_paid_amount.saturating_add(claim.amount);
        
        // Update claimant history
        claimant_history.approved_claims += 1;
        claimant_history.total_paid_amount = claimant_history.total_paid_amount.saturating_add(claim.amount);
        claimant_history.last_updated = current_time;
        
        // Emit an event
        emit!(ClaimPaidEvent {
            claim_id: claim.key(),
            claimant: claim.claimant,
            amount: claim.amount,
            policy_id: policy.key(),
            timestamp: current_time,
        });
        
        Ok(())
    }
    
    /// Initialize claim history for a user
    pub fn initialize_claimant_history(
        ctx: Context<InitializeClaimantHistory>,
    ) -> Result<()> {
        let history = &mut ctx.accounts.claimant_history;
        let user = &ctx.accounts.user;
        let clock = Clock::get()?;
        
        // Set up the history account
        let bump = ctx.bumps.claimant_history;
        history.user = user.key();
        history.total_claims = 0;
        history.approved_claims = 0;
        history.rejected_claims = 0;
        history.fraud_rejected_claims = 0;
        history.total_claimed_amount = 0;
        history.total_paid_amount = 0;
        history.claims_last_30_days = 0;
        history.claims_last_90_days = 0;
        history.claims_last_365_days = 0;
        history.total_projects = 0;
        history.repeated_respondent_count = 0;
        history.claims_against_current_respondent = 0;
        history.transaction_count_with_respondent = 0;
        history.successful_projects_with_respondent = 0;
        history.same_type_claims_last_90_days = 0;
        history.last_updated = clock.unix_timestamp;
        history.bump = bump;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeClaim<'info> {
    #[account(mut)]
    pub claimant: Signer<'info>,
    
    /// CHECK: Validated in instruction logic
    pub respondent: AccountInfo<'info>,
    
    #[account(
        init,
        payer = claimant,
        space = ClaimAccount::space(),
        seeds = [
            b"claim".as_ref(),
            claimant.key().as_ref(),
            &Clock::get()?.unix_timestamp.to_le_bytes()
        ],
        bump
    )]
    pub claim: Account<'info, ClaimAccount>,
    
    #[account(
        mut,
        seeds = [
            b"policy".as_ref(),
            policy.owner.as_ref()
        ],
        bump = policy.bump
    )]
    pub policy: Account<'info, PolicyAccount>,
    
    #[account(
        mut,
        seeds = [
            b"claimant_history".as_ref(),
            claimant.key().as_ref()
        ],
        bump = claimant_history.bump
    )]
    pub claimant_history: Account<'info, ClaimantHistory>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddEvidence<'info> {
    #[account(mut)]
    pub submitter: Signer<'info>,
    
    #[account(
        mut,
        constraint = claim.claimant == submitter.key() || claim.respondent == submitter.key()
    )]
    pub claim: Account<'info, ClaimAccount>,
    
    #[account(
        init,
        payer = submitter,
        space = EvidenceItem::space(),
        seeds = [
            b"evidence".as_ref(),
            claim.key().as_ref(),
            submitter.key().as_ref(),
            &Clock::get()?.unix_timestamp.to_le_bytes()
        ],
        bump
    )]
    pub evidence: Account<'info, EvidenceItem>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitClaimForReview<'info> {
    #[account(mut)]
    pub claimant: Signer<'info>,
    
    #[account(
        mut,
        constraint = claim.claimant == claimant.key(),
        constraint = claim.status == ClaimStatus::Filed || claim.status == ClaimStatus::PendingEvidence
    )]
    pub claim: Account<'info, ClaimAccount>,
    
    #[account(
        seeds = [
            b"policy".as_ref(),
            policy.owner.as_ref()
        ],
        bump = policy.bump
    )]
    pub policy: Account<'info, PolicyAccount>,
    
    #[account(
        seeds = [
            b"claimant_history".as_ref(),
            claimant.key().as_ref()
        ],
        bump = claimant_history.bump
    )]
    pub claimant_history: Account<'info, ClaimantHistory>,
}

#[derive(Accounts)]
pub struct ReviewClaim<'info> {
    #[account(mut)]
    pub verifier: Signer<'info>,
    
    #[account(
        mut,
        constraint = claim.status == ClaimStatus::UnderReview
    )]
    pub claim: Account<'info, ClaimAccount>,
    
    #[account(
        mut,
        seeds = [
            b"policy".as_ref(),
            policy.owner.as_ref()
        ],
        bump = policy.bump
    )]
    pub policy: Account<'info, PolicyAccount>,
    
    #[account(
        init,
        payer = verifier,
        space = ClaimVerification::space(),
        seeds = [
            b"verification".as_ref(),
            claim.key().as_ref(),
            verifier.key().as_ref()
        ],
        bump
    )]
    pub verification: Account<'info, ClaimVerification>,
    
    #[account(
        mut,
        seeds = [
            b"claimant_history".as_ref(),
            claim.claimant.as_ref()
        ],
        bump = claimant_history.bump
    )]
    pub claimant_history: Account<'info, ClaimantHistory>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessClaimPayment<'info> {
    #[account(mut)]
    pub claimant: Signer<'info>,
    
    #[account(
        mut,
        constraint = claim.claimant == claimant.key(),
        constraint = claim.status == ClaimStatus::ApprovedPending
    )]
    pub claim: Account<'info, ClaimAccount>,
    
    #[account(
        mut,
        seeds = [
            b"policy".as_ref(),
            policy.owner.as_ref()
        ],
        bump = policy.bump
    )]
    pub policy: Account<'info, PolicyAccount>,
    
    #[account(
        mut,
        constraint = claimant_token_account.owner == claimant.key()
    )]
    pub claimant_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: PDA that acts as the pool authority
    #[account(
        seeds = [b"risk_pool".as_ref()],
        bump
    )]
    pub pool_authority: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [
            b"claimant_history".as_ref(),
            claimant.key().as_ref()
        ],
        bump = claimant_history.bump
    )]
    pub claimant_history: Account<'info, ClaimantHistory>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeClaimantHistory<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        init,
        payer = user,
        space = ClaimantHistory::space(),
        seeds = [
            b"claimant_history".as_ref(),
            user.key().as_ref()
        ],
        bump
    )]
    pub claimant_history: Account<'info, ClaimantHistory>,
    
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ClaimError {
    #[msg("Policy is not active")]
    PolicyInactive,
    
    #[msg("Not the policy owner")]
    NotPolicyOwner,
    
    #[msg("Policy has expired")]
    PolicyExpired,
    
    #[msg("Policy waiting period is still active")]
    WaitingPeriodActive,
    
    #[msg("Claim amount exceeds policy coverage")]
    ExceedsCoverage,
    
    #[msg("Too many recent claims")]
    TooManyRecentClaims,
    
    #[msg("Invalid claim status for this operation")]
    InvalidClaimStatus,
    
    #[msg("Unauthorized evidence submission")]
    UnauthorizedEvidenceSubmission,
    
    #[msg("Not the claim owner")]
    NotClaimOwner,
    
    #[msg("Insufficient evidence submitted")]
    InsufficientEvidence,
    
    #[msg("Insufficient funds in risk pool")]
    InsufficientPoolFunds,
}

// Events
#[event]
pub struct ClaimCreatedEvent {
    pub claim_id: Pubkey,
    pub claimant: Pubkey,
    pub respondent: Pubkey,
    pub policy_id: Pubkey,
    pub claim_type: u8,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct EvidenceAddedEvent {
    pub evidence_id: Pubkey,
    pub claim_id: Pubkey,
    pub submitter: Pubkey,
    pub evidence_type: u8,
    pub timestamp: i64,
}

#[event]
pub struct ClaimUnderReviewEvent {
    pub claim_id: Pubkey,
    pub fraud_score: u8,
    pub flags: u8,
    pub timestamp: i64,
}

#[event]
pub struct ClaimApprovedEvent {
    pub claim_id: Pubkey,
    pub approved_by: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct ClaimRejectedEvent {
    pub claim_id: Pubkey,
    pub rejected_by: Pubkey,
    pub reason: String,
    pub fraud_score: u8,
    pub timestamp: i64,
}

#[event]
pub struct ClaimPaidEvent {
    pub claim_id: Pubkey,
    pub claimant: Pubkey,
    pub amount: u64,
    pub policy_id: Pubkey,
    pub timestamp: i64,
}
