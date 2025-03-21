use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use solana_program::program::invoke_signed;

declare_id!("5YQrtSDqiRsVTJ4ZxLEHbcNTibiJrMsYTGNs3kRqKLRW");

#[program]
pub mod freelance_insurance {
    use super::*;

    // Initialize the insurance program with a risk pool
    pub fn initialize_program(ctx: Context<InitializeProgram>) -> Result<()> {
        let risk_pool = &mut ctx.accounts.risk_pool;
        risk_pool.authority = ctx.accounts.authority.key();
        risk_pool.total_staked = 0;
        risk_pool.total_coverage = 0;
        risk_pool.active_policies = 0;
        risk_pool.claims_paid = 0;
        risk_pool.reserve_ratio = 20; // 20% base reserve ratio
        risk_pool.bump = *ctx.bumps.get("risk_pool").unwrap();
        
        Ok(())
    }

    // Create a new insurance policy
    pub fn create_policy(
        ctx: Context<CreatePolicy>,
        coverage_amount: u64,
        premium_amount: u64,
        period_days: u16,
        job_type: String,
        industry: String,
    ) -> Result<()> {
        let policy = &mut ctx.accounts.policy;
        let owner = &ctx.accounts.owner;
        let clock = Clock::get()?;
        
        // Set policy details
        policy.owner = owner.key();
        policy.coverage_amount = coverage_amount;
        policy.premium_amount = premium_amount;
        policy.start_date = clock.unix_timestamp;
        policy.end_date = clock.unix_timestamp + (period_days as i64 * 86400); // Convert days to seconds
        policy.status = PolicyStatus::Active;
        policy.job_type = job_type;
        policy.industry = industry;
        policy.claims_count = 0;
        policy.bump = *ctx.bumps.get("policy").unwrap();
        
        // Transfer premium payment
        let cpi_accounts = Transfer {
            from: ctx.accounts.premium_source.to_account_info(),
            to: ctx.accounts.premium_destination.to_account_info(),
            authority: owner.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, premium_amount)?;
        
        // Update risk pool
        let risk_pool = &mut ctx.accounts.risk_pool;
        risk_pool.total_coverage += coverage_amount;
        risk_pool.active_policies += 1;
        
        Ok(())
    }

    // Submit a claim for an active policy
    pub fn submit_claim(
        ctx: Context<SubmitClaim>,
        amount: u64,
        evidence_type: String,
        evidence_description: String,
        evidence_attachments: Vec<String>,
    ) -> Result<()> {
        let claim = &mut ctx.accounts.claim;
        let policy = &mut ctx.accounts.policy;
        let owner = &ctx.accounts.owner;
        let clock = Clock::get()?;
        
        // Validate policy is active
        require!(
            policy.status == PolicyStatus::Active,
            InsuranceError::PolicyNotActive
        );
        
        // Validate claim amount
        require!(
            amount <= policy.coverage_amount,
            InsuranceError::ClaimExceedsCoverage
        );
        
        // Validate policy hasn't expired
        require!(
            clock.unix_timestamp <= policy.end_date,
            InsuranceError::PolicyExpired
        );
        
        // Set claim details
        claim.policy = policy.key();
        claim.owner = owner.key();
        claim.amount = amount;
        claim.status = ClaimStatus::Pending;
        claim.evidence_type = evidence_type;
        claim.evidence_description = evidence_description;
        claim.evidence_attachments = evidence_attachments;
        claim.submission_date = clock.unix_timestamp;
        claim.verdict = None;
        claim.bump = *ctx.bumps.get("claim").unwrap();
        
        // Update policy claims count
        policy.claims_count += 1;
        
        Ok(())
    }

    // Process a claim (approve or reject)
    pub fn process_claim(
        ctx: Context<ProcessClaim>,
        approved: bool,
        reason: String,
    ) -> Result<()> {
        let claim = &mut ctx.accounts.claim;
        let risk_pool = &mut ctx.accounts.risk_pool;
        
        // Only pending claims can be processed
        require!(
            claim.status == ClaimStatus::Pending,
            InsuranceError::ClaimNotPending
        );
        
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
                b"risk_pool".as_ref(),
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

    // Verify payment for a contract
    pub fn verify_payment(
        ctx: Context<VerifyPayment>,
        expected_amount: u64,
        deadline: i64,
    ) -> Result<()> {
        let payment_verification = &mut ctx.accounts.payment_verification;
        let freelancer = &ctx.accounts.freelancer;
        let client = &ctx.accounts.client;
        let clock = Clock::get()?;
        
        payment_verification.freelancer = freelancer.key();
        payment_verification.client = client.key();
        payment_verification.expected_amount = expected_amount;
        payment_verification.deadline = deadline;
        payment_verification.status = PaymentStatus::Pending;
        payment_verification.created_at = clock.unix_timestamp;
        payment_verification.bump = *ctx.bumps.get("payment_verification").unwrap();
        
        Ok(())
    }

    // Confirm payment received
    pub fn confirm_payment(ctx: Context<ConfirmPayment>) -> Result<()> {
        let payment_verification = &mut ctx.accounts.payment_verification;
        let clock = Clock::get()?;
        
        // Only the freelancer can confirm payment
        require!(
            ctx.accounts.freelancer.key() == payment_verification.freelancer,
            InsuranceError::Unauthorized
        );
        
        payment_verification.status = PaymentStatus::Paid;
        payment_verification.paid_at = Some(clock.unix_timestamp);
        
        Ok(())
    }

    // Auto-trigger claim if payment deadline is missed
    pub fn trigger_missed_payment_claim(
        ctx: Context<TriggerMissedPaymentClaim>,
        amount: u64,
    ) -> Result<()> {
        let payment_verification = &mut ctx.accounts.payment_verification;
        let claim = &mut ctx.accounts.claim;
        let policy = &mut ctx.accounts.policy;
        let clock = Clock::get()?;
        
        // Verify payment is still pending and deadline has passed
        require!(
            payment_verification.status == PaymentStatus::Pending,
            InsuranceError::PaymentAlreadyProcessed
        );
        
        require!(
            clock.unix_timestamp > payment_verification.deadline,
            InsuranceError::DeadlineNotPassed
        );
        
        // Verify policy is active
        require!(
            policy.status == PolicyStatus::Active,
            InsuranceError::PolicyNotActive
        );
        
        // Create the claim
        claim.policy = policy.key();
        claim.owner = ctx.accounts.freelancer.key();
        claim.amount = amount;
        claim.status = ClaimStatus::Pending;
        claim.evidence_type = "PAYMENT_BREACH".to_string();
        claim.evidence_description = format!(
            "Client failed to pay {} by deadline {}",
            payment_verification.expected_amount,
            payment_verification.deadline
        );
        claim.evidence_attachments = vec![payment_verification.key().to_string()];
        claim.submission_date = clock.unix_timestamp;
        claim.verdict = None;
        claim.bump = *ctx.bumps.get("claim").unwrap();
        
        // Update policy claims count
        policy.claims_count += 1;
        
        // Mark payment verification as claimed
        payment_verification.status = PaymentStatus::Claimed;
        
        Ok(())
    }
}

// Account structures
#[account]
pub struct RiskPool {
    pub authority: Pubkey,
    pub total_staked: u64,
    pub total_coverage: u64,
    pub active_policies: u32,
    pub claims_paid: u64,
    pub reserve_ratio: u8,
    pub bump: u8,
}

#[account]
pub struct Policy {
    pub owner: Pubkey,
    pub coverage_amount: u64,
    pub premium_amount: u64,
    pub start_date: i64,
    pub end_date: i64,
    pub status: PolicyStatus,
    pub job_type: String,
    pub industry: String,
    pub claims_count: u8,
    pub bump: u8,
}

#[account]
pub struct Claim {
    pub policy: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
    pub status: ClaimStatus,
    pub evidence_type: String,
    pub evidence_description: String,
    pub evidence_attachments: Vec<String>,
    pub submission_date: i64,
    pub verdict: Option<ClaimVerdict>,
    pub bump: u8,
}

#[account]
pub struct PaymentVerification {
    pub freelancer: Pubkey,
    pub client: Pubkey,
    pub expected_amount: u64,
    pub deadline: i64,
    pub status: PaymentStatus,
    pub created_at: i64,
    pub paid_at: Option<i64>,
    pub bump: u8,
}

// Enums and structs
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PolicyStatus {
    Active,
    Expired,
    Terminated,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ClaimStatus {
    Pending,
    Approved,
    Rejected,
    Arbitration,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PaymentStatus {
    Pending,
    Paid,
    Claimed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ClaimVerdict {
    pub approved: bool,
    pub reason: String,
    pub processed_at: i64,
}

// Context structures for instructions
#[derive(Accounts)]
pub struct InitializeProgram<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8 + 4 + 8 + 1 + 1,
        seeds = [b"risk_pool"],
        bump
    )]
    pub risk_pool: Account<'info, RiskPool>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreatePolicy<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 8 + 8 + 8 + 8 + 1 + 32 + 32 + 1 + 1,
        seeds = [b"policy", owner.key().as_ref()],
        bump
    )]
    pub policy: Account<'info, Policy>,
    
    #[account(mut)]
    pub premium_source: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub premium_destination: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub risk_pool: Account<'info, RiskPool>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitClaim<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"policy", owner.key().as_ref()],
        bump = policy.bump,
        constraint = policy.owner == owner.key()
    )]
    pub policy: Account<'info, Policy>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 32 + 8 + 1 + 64 + 256 + 256 + 8 + 64 + 1,
        seeds = [b"claim", policy.key().as_ref(), &[policy.claims_count]],
        bump
    )]
    pub claim: Account<'info, Claim>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessClaim<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        constraint = risk_pool.authority == authority.key()
    )]
    pub risk_pool: Account<'info, RiskPool>,
    
    #[account(mut)]
    pub claim: Account<'info, Claim>,
    
    #[account(mut)]
    pub claim_source: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub claim_destination: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct VerifyPayment<'info> {
    #[account(mut)]
    pub freelancer: Signer<'info>,
    
    /// CHECK: Client account is just used as a reference
    pub client: AccountInfo<'info>,
    
    #[account(
        init,
        payer = freelancer,
        space = 8 + 32 + 32 + 8 + 8 + 1 + 8 + 9 + 1,
        seeds = [b"payment", freelancer.key().as_ref(), client.key().as_ref()],
        bump
    )]
    pub payment_verification: Account<'info, PaymentVerification>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ConfirmPayment<'info> {
    #[account(mut)]
    pub freelancer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"payment", freelancer.key().as_ref(), payment_verification.client.as_ref()],
        bump = payment_verification.bump,
        constraint = payment_verification.freelancer == freelancer.key()
    )]
    pub payment_verification: Account<'info, PaymentVerification>,
}

#[derive(Accounts)]
pub struct TriggerMissedPaymentClaim<'info> {
    #[account(mut)]
    pub freelancer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"payment", freelancer.key().as_ref(), payment_verification.client.as_ref()],
        bump = payment_verification.bump,
        constraint = payment_verification.freelancer == freelancer.key()
    )]
    pub payment_verification: Account<'info, PaymentVerification>,
    
    #[account(
        mut,
        seeds = [b"policy", freelancer.key().as_ref()],
        bump = policy.bump,
        constraint = policy.owner == freelancer.key()
    )]
    pub policy: Account<'info, Policy>,
    
    #[account(
        init,
        payer = freelancer,
        space = 8 + 32 + 32 + 8 + 1 + 64 + 256 + 256 + 8 + 64 + 1,
        seeds = [b"claim", policy.key().as_ref(), &[policy.claims_count]],
        bump
    )]
    pub claim: Account<'info, Claim>,
    
    pub system_program: Program<'info, System>,
}

// Error codes
#[error_code]
pub enum InsuranceError {
    #[msg("Policy is not active")]
    PolicyNotActive,
    
    #[msg("Claim amount exceeds policy coverage")]
    ClaimExceedsCoverage,
    
    #[msg("Policy has expired")]
    PolicyExpired,
    
    #[msg("Claim is not in pending status")]
    ClaimNotPending,
    
    #[msg("Unauthorized operation")]
    Unauthorized,
    
    #[msg("Payment has already been processed")]
    PaymentAlreadyProcessed,
    
    #[msg("Payment deadline has not passed yet")]
    DeadlineNotPassed,
}
