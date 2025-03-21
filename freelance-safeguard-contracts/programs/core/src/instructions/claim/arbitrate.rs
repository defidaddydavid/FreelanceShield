use anchor_lang::prelude::*;
use crate::state::*;
use crate::FreelanceShieldError;

/// Accounts for arbitrating a disputed or complex claim
#[derive(Accounts)]
pub struct ArbitrateClaim<'info> {
    /// Arbitrator (must be authorized)
    #[account(
        constraint = program_state.authority == arbitrator.key() @ FreelanceShieldError::Unauthorized
    )]
    pub arbitrator: Signer<'info>,
    
    /// Program state PDA
    #[account(
        mut,
        seeds = [ProgramState::SEED_PREFIX],
        bump = program_state.bump,
        constraint = !program_state.is_paused @ FreelanceShieldError::ProgramPaused
    )]
    pub program_state: Account<'info, ProgramState>,
    
    /// Policy account PDA
    #[account(
        mut,
        seeds = [
            Policy::SEED_PREFIX, 
            policy.owner.as_ref(),
            policy.product_id.as_ref()
        ],
        bump = policy.bump
    )]
    pub policy: Account<'info, Policy>,
    
    /// Product account PDA
    #[account(
        mut,
        seeds = [Product::SEED_PREFIX, &policy.product_id.to_bytes()],
        bump
    )]
    pub product: Account<'info, Product>,
    
    /// Claim account PDA
    #[account(
        mut,
        seeds = [
            Claim::SEED_PREFIX,
            policy.key().as_ref(),
            &[get_claim_index(&policy.key(), claim.key())?]
        ],
        bump = claim.bump,
        constraint = (claim.status == ClaimStatus::Disputed || 
                     claim.status == ClaimStatus::InArbitration) 
                     @ FreelanceShieldError::ClaimNotInArbitration
    )]
    pub claim: Account<'info, Claim>,
}

/// Arbitrate a disputed or complex claim
pub fn handler(ctx: Context<ArbitrateClaim>, params: ArbitrateClaimParams) -> Result<()> {
    let clock = Clock::get()?;
    let claim = &mut ctx.accounts.claim;
    let policy = &mut ctx.accounts.policy;
    let product = &mut ctx.accounts.product;
    let program_state = &mut ctx.accounts.program_state;
    
    // Validate reason
    require!(
        params.reason.len() <= MAX_REASON_LENGTH,
        FreelanceShieldError::InvalidReason
    );
    
    // Update claim status based on arbitration decision
    if params.approved {
        claim.status = ClaimStatus::Approved;
        program_state.approved_claims += 1;
    } else {
        claim.status = ClaimStatus::Rejected;
        program_state.rejected_claims += 1;
        
        // Update policy status back to active if claim is rejected
        policy.status = PolicyStatus::Active;
    }
    
    // Set verdict
    claim.verdict = Some(Verdict {
        approved: params.approved,
        reason: params.reason,
        processed_at: clock.unix_timestamp,
        processor: ProcessorType::Arbitration,
    });
    
    // Update arbitration counter
    program_state.arbitrated_claims += 1;
    
    claim.last_update_slot = clock.slot;
    
    // Update product statistics if claim is approved
    if params.approved {
        product.claims_count += 1;
    }
    
    msg!("Claim arbitrated: Approved: {}", params.approved);
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
