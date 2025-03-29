use anchor_lang::prelude::*;
use crate::state::*;
use crate::FreelanceShieldError;

/// Accounts for disputing a claim decision
#[derive(Accounts)]
pub struct DisputeClaim<'info> {
    /// Policy owner (claimant)
    #[account(
        constraint = policy.owner == claimant.key() @ FreelanceShieldError::Unauthorized
    )]
    pub claimant: Signer<'info>,
    
    /// Program state PDA
    #[account(
        seeds = [ProgramState::SEED_PREFIX],
        bump = program_state.bump,
        constraint = !program_state.is_paused @ FreelanceShieldError::ProgramPaused
    )]
    pub program_state: Account<'info, ProgramState>,
    
    /// Policy account PDA
    #[account(
        seeds = [
            Policy::SEED_PREFIX, 
            policy.owner.as_ref(),
            policy.product_id.as_ref()
        ],
        bump = policy.bump
    )]
    pub policy: Account<'info, Policy>,
    
    /// Claim account PDA
    #[account(
        mut,
        seeds = [
            Claim::SEED_PREFIX,
            policy.key().as_ref(),
            &[get_claim_index(&policy.key(), claim.key())?]
        ],
        bump = claim.bump,
        constraint = claim.status == ClaimStatus::Rejected @ FreelanceShieldError::ClaimNotRejected,
        // Can only dispute within 7 days of rejection
        constraint = (Clock::get()?.unix_timestamp - claim.verdict.as_ref().unwrap().processed_at) <= 7 * 86400 
                    @ FreelanceShieldError::DisputePeriodEnded
    )]
    pub claim: Account<'info, Claim>,
}

/// Dispute a claim decision
pub fn handler(ctx: Context<DisputeClaim>, reason: String, new_evidence: Option<Vec<String>>) -> Result<()> {
    let clock = Clock::get()?;
    let claim = &mut ctx.accounts.claim;
    
    // Validate reason
    require!(
        reason.len() <= MAX_REASON_LENGTH,
        FreelanceShieldError::InvalidReason
    );
    
    // Validate new evidence if provided
    if let Some(evidence) = &new_evidence {
        require!(
            evidence.len() + claim.evidence_hashes.len() <= MAX_EVIDENCE_ATTACHMENTS,
            FreelanceShieldError::TooManyEvidenceAttachments
        );
        
        for hash in evidence {
            require!(
                hash.len() <= MAX_EVIDENCE_HASH_LENGTH,
                FreelanceShieldError::InvalidEvidenceHash
            );
            
            // Add new evidence to the claim
            claim.evidence_hashes.push(hash.clone());
        }
    }
    
    // Update claim status
    claim.status = ClaimStatus::Disputed;
    
    // Add dispute information to the verdict
    if let Some(verdict) = &mut claim.verdict {
        verdict.reason = format!("DISPUTED: {} | Original reason: {}", reason, verdict.reason);
    }
    
    claim.last_update_slot = clock.slot;
    
    msg!("Claim disputed: Reason: {}", reason);
    Ok(())
}

/// Get the claim index from the policy account
fn get_claim_index(_policy_pubkey: &Pubkey, _claim_pubkey: Pubkey) -> Result<u8> {
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
