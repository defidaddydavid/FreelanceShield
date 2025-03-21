use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::FreelanceShieldError;

/// Accounts for paying an approved insurance claim
#[derive(Accounts)]
pub struct PayClaim<'info> {
    /// Program authority
    #[account(
        constraint = program_state.authority == authority.key() @ FreelanceShieldError::Unauthorized
    )]
    pub authority: Signer<'info>,
    
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
        bump = policy.bump,
        constraint = policy.status == PolicyStatus::ClaimPending @ FreelanceShieldError::PolicyNotInClaimPending
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
        constraint = claim.status == ClaimStatus::Approved @ FreelanceShieldError::ClaimNotApproved
    )]
    pub claim: Account<'info, Claim>,
    
    /// Risk pool account
    #[account(
        mut,
        seeds = [RiskPool::SEED_PREFIX],
        bump
    )]
    pub risk_pool: Account<'info, RiskPool>,
    
    /// Program's token account for payment
    #[account(mut)]
    pub program_token_account: Account<'info, TokenAccount>,
    
    /// Claimant's token account for receiving payment
    #[account(
        mut,
        constraint = claimant_token_account.owner == policy.owner @ FreelanceShieldError::InvalidTokenAccount
    )]
    pub claimant_token_account: Account<'info, TokenAccount>,
    
    /// Token program
    pub token_program: Program<'info, Token>,
}

/// Pay an approved insurance claim
pub fn handler(ctx: Context<PayClaim>, transaction_signature: Option<String>) -> Result<()> {
    let clock = Clock::get()?;
    let claim = &mut ctx.accounts.claim;
    let policy = &mut ctx.accounts.policy;
    let product = &mut ctx.accounts.product;
    let program_state = &mut ctx.accounts.program_state;
    let risk_pool = &mut ctx.accounts.risk_pool;
    
    // Transfer claim amount
    let seeds = &[
        RiskPool::SEED_PREFIX,
        &[*ctx.bumps.get("risk_pool").unwrap()]
    ];
    let signer = &[&seeds[..]];
    
    let cpi_accounts = Transfer {
        from: ctx.accounts.program_token_account.to_account_info(),
        to: ctx.accounts.claimant_token_account.to_account_info(),
        authority: ctx.accounts.risk_pool.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
    token::transfer(cpi_ctx, claim.amount)?;
    
    // Update claim status
    claim.status = ClaimStatus::Paid;
    if let Some(sig) = transaction_signature {
        claim.transaction_signature = Some(sig);
    }
    claim.last_update_slot = clock.slot;
    
    // Update policy status
    policy.status = PolicyStatus::ClaimPaid;
    
    // Update product statistics
    product.claims_paid_amount += claim.amount;
    
    // Calculate loss ratio (claims paid / premiums collected) * 100
    if product.total_premiums > 0 {
        product.loss_ratio = ((product.claims_paid_amount * 100) / product.total_premiums) as u16;
    }
    
    // Update program state statistics
    program_state.total_claims_paid += claim.amount;
    program_state.total_coverage_liability -= policy.coverage_amount;
    
    // Calculate program-wide premium to claims ratio
    if program_state.total_premiums > 0 {
        program_state.premium_to_claims_ratio = 
            ((program_state.total_premiums * 100) / program_state.total_claims_paid) as u16;
    }
    
    // Update risk pool
    risk_pool.total_claims_paid += claim.amount;
    risk_pool.total_coverage_liability -= policy.coverage_amount;
    
    // Recalculate reserve ratio
    if risk_pool.total_coverage_liability > 0 {
        risk_pool.current_reserve_ratio = ((risk_pool.total_capital * 100) / risk_pool.total_coverage_liability) as u8;
    } else {
        risk_pool.current_reserve_ratio = 100; // Default to 100% if no liability
    }
    
    // Calculate premium to claims ratio for risk pool
    if risk_pool.total_premiums_collected > 0 {
        risk_pool.premium_to_claims_ratio = 
            ((risk_pool.total_premiums_collected * 100) / risk_pool.total_claims_paid) as u16;
    }
    
    msg!("Claim paid: Amount: {}", claim.amount);
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
