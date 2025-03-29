use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::InsuranceError;

#[derive(Accounts)]
pub struct ProcessClaim<'info> {
    #[account(
        mut,
        constraint = authority.key() == risk_pool.authority @ InsuranceError::OnlyAdmin
    )]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        constraint = claim.status == ClaimStatus::Pending @ InsuranceError::ClaimNotPending
    )]
    pub claim: Account<'info, Claim>,
    
    #[account(mut)]
    pub risk_pool: Account<'info, RiskPool>,
    
    #[account(mut)]
    pub claim_source: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub claim_destination: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<ProcessClaim>,
    approved: bool,
    reason: String,
) -> Result<()> {
    let claim = &mut ctx.accounts.claim;
    let risk_pool = &mut ctx.accounts.risk_pool;
    
    // Only pending claims can be processed (constraint already checked)
    
    if approved {
        // Update claim status
        claim.status = ClaimStatus::Approved;
        claim.verdict = Some(ClaimVerdict {
            approved,
            reason: reason.clone(),
            processed_at: Clock::get()?.unix_timestamp,
        });
        
        // Transfer funds to claimant
        let seeds = &[
            RISK_POOL_SEED.as_bytes(),
            &[risk_pool.bump],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.claim_source.to_account_info(),
            to: ctx.accounts.claim_destination.to_account_info(),
            authority: ctx.accounts.risk_pool.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts,
            signer,
        );
        
        token::transfer(cpi_ctx, claim.amount)?;
        
        // Update risk pool metrics
        risk_pool.claims_paid += claim.amount;
    } else {
        // Reject the claim
        claim.status = ClaimStatus::Rejected;
        claim.verdict = Some(ClaimVerdict {
            approved,
            reason,
            processed_at: Clock::get()?.unix_timestamp,
        });
    }
    
    Ok(())
}

