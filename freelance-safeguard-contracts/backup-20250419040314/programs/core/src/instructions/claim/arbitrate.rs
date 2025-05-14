use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::*;
use crate::utils::arbitration_fees::*;
use crate::FreelanceShieldError;

/// Accounts for arbitrating a disputed or complex claim
#[derive(Accounts)]
pub struct ArbitrateClaim<'info> {
    /// Arbitrator (must be authorized)
    #[account(
        mut, // Arbitrator receives fees
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
    
    /// Risk pool account to receive fees
    #[account(mut)]
    pub risk_pool: AccountInfo<'info>,
    
    /// DAO treasury account to receive fees
    #[account(mut)]
    pub dao_treasury: AccountInfo<'info>,
    
    /// Fee payer (usually the policy owner)
    #[account(mut)]
    pub fee_payer: Signer<'info>,
    
    /// System program
    pub system_program: Program<'info, System>,
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
    
    // Calculate and collect arbitration fee
    let complexity_level = params.complexity_level.unwrap_or_else(|| {
        determine_claim_complexity(
            claim.amount,
            claim.description.len(),
            claim.evidence_hash.is_some(),
            claim.status == ClaimStatus::Disputed
        )
    });
    
    // Calculate arbitration fee
    let arbitration_fee = calculate_arbitration_fee(claim.amount, complexity_level)?;
    
    // Calculate fee shares
    let arbitrator_share = calculate_fee_share(arbitration_fee, ARBITRATOR_FEE_SHARE)?;
    let risk_pool_share = calculate_fee_share(arbitration_fee, RISK_POOL_FEE_SHARE)?;
    let dao_treasury_share = calculate_fee_share(arbitration_fee, DAO_TREASURY_FEE_SHARE)?;
    
    // Transfer fee to arbitrator
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.fee_payer.to_account_info(),
                to: ctx.accounts.arbitrator.to_account_info(),
            },
        ),
        arbitrator_share,
    )?;
    
    // Transfer fee to risk pool
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.fee_payer.to_account_info(),
                to: ctx.accounts.risk_pool.to_account_info(),
            },
        ),
        risk_pool_share,
    )?;
    
    // Transfer fee to DAO treasury
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.fee_payer.to_account_info(),
                to: ctx.accounts.dao_treasury.to_account_info(),
            },
        ),
        dao_treasury_share,
    )?;
    
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
    
    // Update total arbitration fees collected
    program_state.total_arbitration_fees = program_state.total_arbitration_fees
        .checked_add(arbitration_fee)
        .ok_or(FreelanceShieldError::ArithmeticError)?;
    
    claim.last_update_slot = clock.slot;
    
    // Update product statistics if claim is approved
    if params.approved {
        product.claims_count += 1;
    }
    
    msg!("Claim arbitrated: Approved: {}", params.approved);
    msg!("Arbitration fee collected: {} lamports", arbitration_fee);
    msg!("Complexity level: {}", complexity_level);
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
