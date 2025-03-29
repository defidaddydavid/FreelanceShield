use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("5pQBQ2oz7RWJVrcjVzCocbzZsqcAPokwn4Fs3UtPEtda");

// Define program IDs for cross-program invocation
pub const INSURANCE_PROGRAM_ID: Pubkey = anchor_lang::solana_program::pubkey!("2vFoxWTSRERwtcfwEb6Zgm2iWS3ewU1Y94K224Gw7CJm");
pub const RISK_POOL_PROGRAM_ID: Pubkey = anchor_lang::solana_program::pubkey!("HC1TQHR6kVqtq48UbTYGwHwHTUYom9W3ovNVgjPgNcFg");

#[program]
pub mod claims_processor {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        insurance_program_id: Pubkey,
        risk_pool_id: Pubkey,
        arbitration_threshold: u8,
        auto_claim_limit: u64,
        auto_process_threshold: u8,
    ) -> Result<()> {
        let claims_state = &mut ctx.accounts.claims_state;
        claims_state.authority = ctx.accounts.authority.key();
        claims_state.insurance_program_id = insurance_program_id;
        claims_state.risk_pool_id = risk_pool_id;
        claims_state.arbitration_threshold = arbitration_threshold;
        claims_state.auto_claim_limit = auto_claim_limit;
        claims_state.auto_process_threshold = auto_process_threshold;
        claims_state.total_claims = 0;
        claims_state.approved_claims = 0;
        claims_state.rejected_claims = 0;
        claims_state.arbitrated_claims = 0;
        claims_state.total_payout_amount = 0;
        claims_state.is_paused = false;
        claims_state.last_update_timestamp = Clock::get()?.unix_timestamp;
        claims_state.bump = *ctx.bumps.get("claims_state").unwrap();
        
        msg!("Claims processor initialized");
        Ok(())
    }

    pub fn submit_claim(
        ctx: Context<SubmitClaim>,
        amount: u64,
        evidence_type: String,
        evidence_description: String,
        evidence_attachments: Vec<String>,
        claim_category: ClaimCategory,
    ) -> Result<()> {
        let claims_state = &ctx.accounts.claims_state;
        let claim = &mut ctx.accounts.claim;
        let policy = &ctx.accounts.policy;
        let clock = Clock::get()?;
        
        // Validate policy is active
        require!(
            policy.status == 1, // PolicyStatus::Active
            ClaimsError::PolicyNotActive
        );
        
        // Validate policy hasn't expired
        require!(
            policy.end_date > clock.unix_timestamp,
            ClaimsError::PolicyExpired
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
        let time_factor = calculate_time_risk_factor(policy_age_days as u16);
        
        // Calculate claim amount risk
        let amount_risk = (amount as f64 / policy.coverage_amount as f64 * 100.0) as u8;
        
        // Initialize claim with enhanced data
        claim.policy = ctx.accounts.policy.key();
        claim.owner = ctx.accounts.owner.key();
        claim.amount = amount;
        claim.status = ClaimStatus::Pending;
        claim.evidence_type = evidence_type;
        claim.evidence_description = evidence_description;
        claim.evidence_attachments = evidence_attachments;
        claim.submission_date = clock.unix_timestamp;
        claim.category = claim_category;
        claim.verdict = None;
        claim.transaction_signature = None;
        claim.creation_slot = clock.slot;
        claim.last_update_slot = clock.slot;
        
        // Calculate enhanced risk score for fraud detection
        claim.risk_score = calculate_initial_risk_score(
            amount,
            policy.coverage_amount,
            policy.claims_count,
            clock.unix_timestamp - policy.start_date,
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
            
            // Process payout
            let signature = process_claim_payout(ctx, amount)?;
            claim.transaction_signature = Some(signature);
            
            // Update claims state for approved claim
            let mut claims_data = claims_state_account.try_borrow_mut_data()?;
            let mut state = ClaimsState::try_deserialize(&mut &claims_data[..])?;
            state.approved_claims += 1;
            state.total_payout_amount += amount;
            state.last_update_timestamp = clock.unix_timestamp;
            ClaimsState::try_serialize(&state, &mut &mut claims_data[..])?;
            
            msg!("Claim auto-approved and processed");
            msg!("Transaction signature: {}", signature);
        } else if claim.risk_score >= claims_state.arbitration_threshold {
            claim.status = ClaimStatus::UnderReview;
            msg!("Claim submitted for manual review due to high risk score: {}", claim.risk_score);
        } else {
            msg!("Claim submitted successfully");
        }
        
        // Log claim details for blockchain explorer
        msg!("Claim ID: {}", claim.key());
        msg!("Risk Score: {}", claim.risk_score);
        msg!("Amount: {}", amount);
        msg!("Category: {:?}", claim_category);
        
        Ok(())
    }

    pub fn process_claim(
        ctx: Context<ProcessClaim>,
        approved: bool,
        reason: String,
    ) -> Result<()> {
        let claims_state = &ctx.accounts.claims_state;
        let claim = &mut ctx.accounts.claim;
        let clock = Clock::get()?;
        
        // Validate authority
        require!(
            ctx.accounts.authority.key() == claims_state.authority,
            ClaimsError::Unauthorized
        );
        
        // Validate claim is pending or under review
        require!(
            claim.status == ClaimStatus::Pending || claim.status == ClaimStatus::UnderReview,
            ClaimsError::InvalidClaimStatus
        );
        
        // Update claim status and verdict
        claim.status = if approved { ClaimStatus::Approved } else { ClaimStatus::Rejected };
        claim.verdict = Some(Verdict {
            approved,
            reason,
            processed_at: clock.unix_timestamp,
            processor: ProcessorType::Manual,
        });
        
        claim.last_update_slot = clock.slot;
        
        // Update claims state
        let mut claims_state_account = ctx.accounts.claims_state.to_account_info();
        let mut claims_data = claims_state_account.try_borrow_mut_data()?;
        let mut state = ClaimsState::try_deserialize(&mut &claims_data[..])?;
        
        if approved {
            state.approved_claims += 1;
            state.total_payout_amount += claim.amount;
            state.last_update_timestamp = clock.unix_timestamp;
            
            // Process payout
            let signature = process_claim_payout(ctx, claim.amount)?;
            claim.transaction_signature = Some(signature);
            
            msg!("Claim approved and processed");
            msg!("Transaction signature: {}", signature);
        } else {
            state.rejected_claims += 1;
            state.last_update_timestamp = clock.unix_timestamp;
            msg!("Claim rejected");
        }
        
        ClaimsState::try_serialize(&state, &mut &mut claims_data[..])?;
        
        Ok(())
    }

    // New function to get claims history for a policy
    pub fn get_claims_history_for_policy(ctx: Context<GetClaimsHistory>) -> Result<()> {
        let policy = &ctx.accounts.policy;
        
        // Log policy information
        msg!("Claims History for Policy: {}", policy.key());
        msg!("Policy Owner: {}", policy.owner);
        msg!("Claims Count: {}", policy.claims_count);
        
        // If there are claims, loop through and log them
        if policy.claims_count > 0 {
            msg!("Claims Found: {}", policy.claims_count);
        } else {
            msg!("No claims found for this policy");
        }
        
        Ok(())
    }

    pub fn get_claim_details(ctx: Context<GetClaimDetails>) -> Result<()> {
        let claim = &ctx.accounts.claim;
        
        // Log detailed claim information
        msg!("Claim Details:");
        msg!("Claim ID: {}", claim.key());
        msg!("Policy: {}", claim.policy);
        msg!("Owner: {}", claim.owner);
        msg!("Amount: {}", claim.amount);
        msg!("Status: {:?}", claim.status);
        msg!("Submission Date: {}", claim.submission_date);
        msg!("Risk Score: {}", claim.risk_score);
        msg!("Category: {:?}", claim.category);
        
        // Log verdict if available
        if let Some(verdict) = &claim.verdict {
            msg!("Verdict: {}", if verdict.approved { "Approved" } else { "Rejected" });
            msg!("Reason: {}", verdict.reason);
            msg!("Processed At: {}", verdict.processed_at);
            msg!("Processor Type: {:?}", verdict.processor);
        }
        
        // Log transaction signature if available
        if let Some(signature) = &claim.transaction_signature {
            msg!("Transaction Signature: {}", signature);
        }
        
        Ok(())
    }

    pub fn update_processor_parameters(
        ctx: Context<UpdateProcessorParameters>,
        arbitration_threshold: Option<u8>,
        auto_claim_limit: Option<u64>,
        auto_process_threshold: Option<u8>,
        is_paused: Option<bool>,
    ) -> Result<()> {
        let claims_state = &mut ctx.accounts.claims_state;
        
        // Validate authority
        require!(
            ctx.accounts.authority.key() == claims_state.authority,
            ClaimsError::Unauthorized
        );
        
        // Update parameters if provided
        if let Some(threshold) = arbitration_threshold {
            claims_state.arbitration_threshold = threshold;
        }
        
        if let Some(limit) = auto_claim_limit {
            claims_state.auto_claim_limit = limit;
        }
        
        if let Some(threshold) = auto_process_threshold {
            claims_state.auto_process_threshold = threshold;
        }
        
        if let Some(paused) = is_paused {
            claims_state.is_paused = paused;
        }
        
        msg!("Claims processor parameters updated");
        Ok(())
    }

    pub fn add_arbitrator(
        ctx: Context<AddArbitrator>,
        arbitrator: Pubkey,
    ) -> Result<()> {
        let claims_state = &ctx.accounts.claims_state;
        let arbitrator_account = &mut ctx.accounts.arbitrator_account;
        
        // Validate authority
        require!(
            ctx.accounts.authority.key() == claims_state.authority,
            ClaimsError::Unauthorized
        );
        
        // Initialize arbitrator account
        arbitrator_account.arbitrator = arbitrator;
        arbitrator_account.is_active = true;
        arbitrator_account.claims_processed = 0;
        arbitrator_account.bump = *ctx.bumps.get("arbitrator_account").unwrap();
        
        msg!("Arbitrator added successfully");
        Ok(())
    }

    pub fn arbitrate_claim(
        ctx: Context<ArbitrateClaim>,
        approved: bool,
        reason: String,
    ) -> Result<()> {
        let claims_state = &ctx.accounts.claims_state;
        let claim = &mut ctx.accounts.claim;
        let arbitrator_account = &mut ctx.accounts.arbitrator_account;
        let clock = Clock::get()?;
        
        // Validate arbitrator is active
        require!(
            arbitrator_account.is_active,
            ClaimsError::ArbitratorNotActive
        );
        
        // Validate claim is under review
        require!(
            claim.status == ClaimStatus::UnderReview,
            ClaimsError::InvalidClaimStatus
        );
        
        // Update claim status and verdict
        claim.status = if approved { ClaimStatus::Approved } else { ClaimStatus::Rejected };
        claim.verdict = Some(Verdict {
            approved,
            reason,
            processed_at: clock.unix_timestamp,
            processor: ProcessorType::Manual,
        });
        
        // Update arbitrator stats
        arbitrator_account.claims_processed += 1;
        
        // Update claims state
        let mut claims_state_account = ctx.accounts.claims_state.to_account_info();
        let mut claims_data = claims_state_account.try_borrow_mut_data()?;
        let mut state = ClaimsState::try_deserialize(&mut &claims_data[..])?;
        
        if approved {
            state.approved_claims += 1;
            state.total_payout_amount += claim.amount;
            state.arbitrated_claims += 1;
            state.last_update_timestamp = clock.unix_timestamp;
            
            // Process payout
            let signature = process_claim_payout(ctx, claim.amount)?;
            claim.transaction_signature = Some(signature);
            
            msg!("Claim arbitrated and approved");
            msg!("Transaction signature: {}", signature);
        } else {
            state.rejected_claims += 1;
            state.last_update_timestamp = clock.unix_timestamp;
            msg!("Claim arbitrated and rejected");
        }
        
        ClaimsState::try_serialize(&state, &mut &mut claims_data[..])?;
        
        Ok(())
    }
}

// Helper function to calculate initial risk score
fn calculate_initial_risk_score(
    claim_amount: u64,
    coverage_amount: u64,
    previous_claims: u8,
    policy_age_seconds: i64,
    _time_factor: u8,
    _amount_risk: u8,
    category: ClaimCategory,
) -> u8 {
    // Base risk is the ratio of claim to coverage (0-100)
    let base_risk = (claim_amount as f64 / coverage_amount as f64 * 100.0) as u8;
    
    // Previous claims impact
    let claims_factor = match previous_claims {
        0 => 0,   // First claim, no historical risk
        1 => 10,  // Second claim, some risk
        2 => 25,  // Third claim, moderate risk
        _ => 40,  // Multiple claims, high risk
    };
    
    // Time factor (early claims are riskier)
    let policy_age_days = policy_age_seconds / 86400;
    let time_impact = match policy_age_days {
        0..=7 => 40,    // First week, very high risk
        8..=30 => 30,   // First month, high risk
        31..=90 => 15,  // 1-3 months, moderate risk
        _ => 0,         // More than 3 months, low risk
    };
    
    // Category risk factor
    let category_risk = match category {
        ClaimCategory::NonDelivery => 30,
        ClaimCategory::QualityIssue => 20,
        ClaimCategory::DeadlineMissed => 15,
        ClaimCategory::ContractDispute => 35,
        ClaimCategory::Other => 25,
    };
    
    // Calculate weighted risk score
    let weighted_risk = (
        (base_risk as u16 * 25) +
        (claims_factor as u16 * 20) +
        (time_impact as u16 * 30) +
        (category_risk as u16 * 25)
    ) / 100;
    
    // Ensure risk score is between 0-100
    std::cmp::min(weighted_risk as u8, 100)
}

// Helper function to calculate time-based risk factor
fn calculate_time_risk_factor(policy_age_days: u16) -> u8 {
    match policy_age_days {
        0..=7 => 100,   // First week, very high risk
        8..=30 => 80,   // First month, high risk
        31..=90 => 50,  // 1-3 months, moderate risk
        91..=180 => 30, // 3-6 months, moderate-low risk
        _ => 10,        // More than 6 months, low risk
    }
}

// Helper function to process claim payout (integrates with risk pool program)
fn process_claim_payout(
    ctx: &Context<ProcessClaim>,
    amount: u64,
) -> Result<String> {
    // Get risk pool program from claims state
    let risk_pool_id = ctx.accounts.claims_state.risk_pool_id;
    
    // Get current clock for slot information
    let clock = Clock::get()?;
    
    // Prepare CPI call to risk pool program
    let risk_pool_program = ctx.accounts.risk_pool_program.to_account_info();
    
    // Create account infos for CPI
    let accounts = vec![
        AccountMeta::new(ctx.accounts.risk_pool.key(), false),
        AccountMeta::new(ctx.accounts.policy.key(), false),
        AccountMeta::new(ctx.accounts.claim.key(), false),
        AccountMeta::new_readonly(ctx.accounts.claims_state.key(), true),
        AccountMeta::new(ctx.accounts.owner_token_account.key(), false),
        AccountMeta::new(ctx.accounts.treasury_token_account.key(), false),
        AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
    ];
    
    // Build instruction for risk pool program to process payout
    let instruction = Instruction {
        program_id: risk_pool_id,
        accounts,
        data: process_payout_data(amount),
    };
    
    // Prepare seeds for PDA signing
    let claims_state = &ctx.accounts.claims_state;
    let seeds = &[
        b"claims_state".as_ref(),
        &[claims_state.bump],
    ];
    let signer_seeds = &[&seeds[..]];
    
    // Execute CPI call
    anchor_lang::anchor_lang::anchor_lang::solana_program::program::invoke_signed(
        &instruction,
        &[
            ctx.accounts.risk_pool.to_account_info(),
            ctx.accounts.policy.to_account_info(),
            ctx.accounts.claim.to_account_info(),
            ctx.accounts.claims_state.to_account_info(),
            ctx.accounts.owner_token_account.to_account_info(),
            ctx.accounts.treasury_token_account.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
        ],
        signer_seeds,
    )?;
    
    // Construct a signature-like string from the claim key and current slot
    let signature_base = format!("{}:{}", ctx.accounts.claim.key(), clock.slot);
    let signature = anchor_lang::anchor_lang::anchor_lang::solana_program::hash::hash(signature_base.as_bytes()).to_string();
    
    msg!("Processing payout of {} lamports for claim: {}", amount, ctx.accounts.claim.key());
    msg!("Transaction signature: {}", signature);
    
    Ok(signature)
}

// Helper function to create process payout instruction data
fn process_payout_data(amount: u64) -> Vec<u8> {
    let mut data = vec![0]; // Discriminator for the instruction
    data.extend_from_slice(&amount.to_le_bytes());
    data
}

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
}

#[derive(Accounts)]
pub struct SubmitClaim<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        seeds = [b"claims_state"],
        bump = claims_state.bump,
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    #[account(
        mut,
        constraint = policy.owner == owner.key(),
    )]
    /// CHECK: This account is validated in the instruction
    pub policy: AccountInfo<'info>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + Claim::SIZE,
        seeds = [b"claim", policy.key().as_ref(), &claims_state.total_claims.to_le_bytes()],
        bump
    )]
    pub claim: Account<'info, Claim>,
    
    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key()
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = risk_pool_token_account.owner == claims_state.risk_pool_id
    )]
    pub risk_pool_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessClaim<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [b"claims_state"],
        bump = claims_state.bump,
        constraint = authority.key() == claims_state.authority
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    #[account(
        mut,
        seeds = [b"claim", claim.policy.as_ref(), claim_index.key().as_ref()],
        bump = claim.bump
    )]
    pub claim: Account<'info, Claim>,
    
    #[account(mut)]
    /// CHECK: This account is validated in the instruction
    pub owner: AccountInfo<'info>,
    
    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key()
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = risk_pool_token_account.owner == claims_state.risk_pool_id
    )]
    pub risk_pool_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = treasury_token_account.owner == claims_state.risk_pool_id
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub risk_pool_program: Program<'info, System>,
    pub system_program: Program<'info, System>,
    
    /// CHECK: The claim index is just used for PDA derivation
    pub claim_index: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct UpdateProcessorParameters<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"claims_state"],
        bump = claims_state.bump,
        constraint = authority.key() == claims_state.authority
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddArbitrator<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [b"claims_state"],
        bump = claims_state.bump,
        constraint = authority.key() == claims_state.authority
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + ArbitratorAccount::SIZE,
        seeds = [b"arbitrator", arbitrator.key().as_ref()],
        bump
    )]
    pub arbitrator_account: Account<'info, ArbitratorAccount>,
    
    /// CHECK: This account is just used as a reference for the PDA
    pub arbitrator: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ArbitrateClaim<'info> {
    #[account(mut)]
    pub arbitrator: Signer<'info>,
    
    #[account(
        seeds = [b"claims_state"],
        bump = claims_state.bump
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    #[account(
        seeds = [b"arbitrator", arbitrator.key().as_ref()],
        bump = arbitrator_account.bump,
        constraint = arbitrator_account.arbitrator == arbitrator.key()
    )]
    pub arbitrator_account: Account<'info, ArbitratorAccount>,
    
    #[account(
        mut,
        seeds = [b"claim", claim.policy.as_ref(), claim_index.key().as_ref()],
        bump = claim.bump
    )]
    pub claim: Account<'info, Claim>,
    
    #[account(mut)]
    /// CHECK: This account is validated in the instruction
    pub owner: AccountInfo<'info>,
    
    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key()
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = risk_pool_token_account.owner == claims_state.risk_pool_id
    )]
    pub risk_pool_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = treasury_token_account.owner == claims_state.risk_pool_id
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub risk_pool_program: Program<'info, System>,
    pub system_program: Program<'info, System>,
    
    /// CHECK: The claim index is just used for PDA derivation
    pub claim_index: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct GetClaimsHistory<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        constraint = policy.owner == authority.key(),
    )]
    pub policy: Account<'info, Policy>,
}

#[derive(Accounts)]
pub struct GetClaimDetails<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"claim", claim.policy.as_ref(), claim_index.key().as_ref()],
        bump = claim.bump
    )]
    pub claim: Account<'info, Claim>,
    
    /// CHECK: The claim index is just used for PDA derivation
    pub claim_index: AccountInfo<'info>,
}

#[account]
#[derive(Default)]
pub struct ClaimsState {
    pub authority: Pubkey,
    pub insurance_program_id: Pubkey,
    pub risk_pool_id: Pubkey,
    pub arbitration_threshold: u8,
    pub auto_claim_limit: u64,
    pub auto_process_threshold: u8,
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
                            32 + // insurance_program_id
                            32 + // risk_pool_id
                            1 +  // arbitration_threshold
                            8 +  // auto_claim_limit
                            1 +  // auto_process_threshold
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
    pub evidence_attachments: Vec<String>,
    pub submission_date: i64,
    pub category: ClaimCategory,
    pub verdict: Option<Verdict>,
    pub transaction_signature: Option<String>,
    pub creation_slot: u64,
    pub last_update_slot: u64,
    pub risk_score: u8,
    pub bump: u8,
}

impl Claim {
    pub const SIZE: usize = 32 + // policy
                           32 + // owner
                           8 +  // amount
                           1 +  // status
                           64 + // evidence_type (max length)
                           256 + // evidence_description (max length)
                           256 + // evidence_attachments (max length for all combined)
                           8 +   // submission_date
                           1 +   // category
                           (1 + 1 + 128 + 8) + // verdict (Option<Verdict>)
                           (1 + 32) + // transaction_signature (Option<String>)
                           8 +   // creation_slot
                           8 +   // last_update_slot
                           1 +   // risk_score
                           1;    // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum ClaimStatus {
    Pending,
    UnderReview,
    Approved,
    Rejected,
    Disputed,
    Paid,
    InArbitration,
    Expired,
}

impl Default for ClaimStatus {
    fn default() -> Self {
        ClaimStatus::Pending
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Verdict {
    pub approved: bool,
    pub reason: String,
    pub processed_at: i64,
    pub processor: ProcessorType,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum ProcessorType {
    Automated,
    Manual,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum ClaimCategory {
    NonDelivery,
    QualityIssue,
    DeadlineMissed,
    ContractDispute,
    Other,
}

impl Default for ClaimCategory {
    fn default() -> Self {
        ClaimCategory::Other
    }
}

#[account]
#[derive(Default)]
pub struct ArbitratorAccount {
    pub arbitrator: Pubkey,
    pub is_active: bool,
    pub claims_processed: u64,
    pub bump: u8,
}

impl ArbitratorAccount {
    pub const SIZE: usize = 32 + // arbitrator
                            1 +  // is_active
                            8 +  // claims_processed
                            1;   // bump
}

#[account]
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Policy {
    pub owner: Pubkey,
    pub coverage_amount: u64,
    pub premium_amount: u64,
    pub start_date: i64,
    pub end_date: i64,
    pub status: u8,
    pub job_type: u8,
    pub industry: u8,
    pub claims_count: u8,
    pub bump: u8,
}

#[error_code]
pub enum ClaimsError {
    #[msg("Policy is not active")]
    PolicyNotActive,
    
    #[msg("Policy has expired")]
    PolicyExpired,
    
    #[msg("Claim amount exceeds policy coverage")]
    ClaimAmountExceedsCoverage,
    
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Invalid claim status")]
    InvalidClaimStatus,
    
    #[msg("Arbitrator is not active")]
    ArbitratorNotActive,
    
    #[msg("Program is paused")]
    ProgramPaused,
}
