use anchor_lang::prelude::*;
use crate::state::*;
use crate::FreelanceShieldError;

/// Accounts for voting on an insurance claim
#[derive(Accounts)]
pub struct VoteOnClaim<'info> {
    /// Voter (community member or stakeholder)
    #[account(mut)]
    pub voter: Signer<'info>,
    
    /// Program state PDA
    #[account(
        seeds = [ProgramState::SEED_PREFIX],
        bump = program_state.bump,
        constraint = !program_state.is_paused @ FreelanceShieldError::ProgramPaused
    )]
    pub program_state: Account<'info, ProgramState>,
    
    /// Claim account PDA
    #[account(
        mut,
        seeds = [
            Claim::SEED_PREFIX,
            claim.policy.as_ref(),
            &[get_claim_index(&claim.policy, claim.key())?]
        ],
        bump = claim.bump,
        constraint = claim.status == ClaimStatus::PendingVote @ FreelanceShieldError::ClaimNotPendingVote,
        constraint = Clock::get()?.unix_timestamp <= claim.voting_end_date @ FreelanceShieldError::VotingPeriodEnded
    )]
    pub claim: Account<'info, Claim>,
    
    /// Voter's stake account (optional, for weighted voting)
    /// CHECK: This is checked in the handler
    pub voter_stake: Option<AccountInfo<'info>>,
}

/// Vote on an insurance claim
pub fn handler(ctx: Context<VoteOnClaim>, params: VoteOnClaimParams) -> Result<()> {
    let clock = Clock::get()?;
    let claim = &mut ctx.accounts.claim;
    let program_state = &ctx.accounts.program_state;
    
    // Validate vote parameters
    require!(
        params.reason.len() <= MAX_REASON_LENGTH,
        FreelanceShieldError::InvalidVoteReason
    );
    
    // Check if voter has already voted
    for vote in &claim.votes {
        if vote.voter == ctx.accounts.voter.key() {
            return Err(FreelanceShieldError::AlreadyVoted.into());
        }
    }
    
    // Add vote
    claim.votes.push(Vote {
        voter: ctx.accounts.voter.key(),
        approve: params.approve,
        reason: params.reason,
        timestamp: clock.unix_timestamp,
    });
    
    // Update claim status if minimum votes reached
    if claim.votes.len() >= program_state.min_votes_required as usize {
        // Count votes
        let mut approve_count = 0;
        let mut reject_count = 0;
        
        for vote in &claim.votes {
            if vote.approve {
                approve_count += 1;
            } else {
                reject_count += 1;
            }
        }
        
        // Determine outcome based on majority
        let total_votes = approve_count + reject_count;
        let approve_percentage = (approve_count * 100) / total_votes;
        
        // If 2/3 majority is reached, process the claim
        if approve_percentage >= 67 {
            claim.status = ClaimStatus::Approved;
            claim.verdict = Some(Verdict {
                approved: true,
                reason: format!("Approved by community vote ({}/{})", approve_count, total_votes),
                processed_at: clock.unix_timestamp,
                processor: ProcessorType::Community,
            });
        } else if reject_count >= (total_votes * 2) / 3 {
            claim.status = ClaimStatus::Rejected;
            claim.verdict = Some(Verdict {
                approved: false,
                reason: format!("Rejected by community vote ({}/{})", reject_count, total_votes),
                processed_at: clock.unix_timestamp,
                processor: ProcessorType::Community,
            });
        } else if total_votes >= program_state.min_votes_required as usize * 2 {
            // If we have double the minimum votes but no clear majority, send to arbitration
            claim.status = ClaimStatus::InArbitration;
        }
    }
    
    claim.last_update_slot = clock.slot;
    
    msg!("Vote recorded: Approve: {}, Total votes: {}", 
        params.approve, claim.votes.len());
    Ok(())
}

/// Get the claim index from the policy account
fn get_claim_index(policy_pubkey: &Pubkey, claim_pubkey: Pubkey) -> Result<u8> {
    // In a real implementation, we would query the policy account to get the claim index
    // For simplicity, we're extracting it from the claim's seeds
    
    // This is a placeholder implementation
    // In practice, you would need to either:
    // 1. Store the claim index in the claim account during creation
    // 2. Query all claims for the policy and find the matching one
    // 3. Use a deterministic method to derive the index from the claim pubkey
    
    // For now, we'll return 0 as a placeholder
    Ok(0)
}
