use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;

mod bayesian_verification;
use bayesian_verification::{BayesianVerificationModel as BayesianModel, ClaimEvidence, ClaimVerificationResult, verify_claim, calculate_claim_legitimacy, initialize_default_model};

declare_id!("9udpCrckMkfKvSzARMAp8njEsoYbkc6GopwTf3PGtiuv");

// Define program IDs for cross-program invocation
pub const INSURANCE_PROGRAM_ID: Pubkey = solana_program::pubkey!("69JEStA6rKXi2y8LaLyNtXv4H2ZG211JFRmg6ES4GWEu");
pub const RISK_POOL_PROGRAM_ID: Pubkey = solana_program::pubkey!("AGNZSGGL9hdWfT76TVFypbPcfsbrRJLDcHmczghbixoM");

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
        claims_state.claims_count = 0;
        claims_state.is_paused = false;
        claims_state.bump = *ctx.bumps.get("claims_state").unwrap();
        
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
        let claim = &mut ctx.accounts.claim;
        let clock = Clock::get()?;
        
        // Get policy data by deserializing the account data
        let policy_data = ctx.accounts.policy.try_borrow_data()?;
        let policy: Policy = Policy::deserialize(&mut &policy_data[..])?;
        
        // Validate policy is active
        require!(
            policy.is_active,
            ClaimsError::PolicyNotActive
        );
        
        // Validate policy hasn't expired
        require!(
            policy.end_time > clock.unix_timestamp,
            ClaimsError::PolicyExpired
        );
        
        // Check if amount is within coverage
        require!(
            amount <= policy.coverage_amount,
            ClaimsError::AmountExceedsCoverage
        );
        
        // Check if program is paused
        require!(!ctx.accounts.claims_state.is_paused, ClaimsError::ProgramPaused);
        
        // Calculate days since policy started
        let policy_age_days = (clock.unix_timestamp - policy.creation_time) / 86400;
        
        // Calculate time-based risk factors
        let time_factor = calculate_time_risk_factor(policy_age_days as u16);
        
        // Calculate amount-based risk factor (percentage of coverage)
        let amount_risk = ((amount as f64 / policy.coverage_amount as f64) * 100f64) as u8;
        
        // Initialize claim with evidence
        claim.owner = ctx.accounts.owner.key();
        claim.policy = ctx.accounts.policy.key();
        claim.amount = amount;
        claim.evidence = ClaimEvidence {
            evidence_type,
            description: evidence_description,
            attachments: evidence_attachments,
        };
        claim.creation_slot = clock.slot;
        claim.last_update_slot = clock.slot;
        claim.category = claim_category;
        claim.status = ClaimStatus::Pending;
        claim.bump = *ctx.bumps.get("claim").unwrap();
        
        // Calculate initial risk score
        claim.risk_score = calculate_initial_risk_score(
            amount,
            policy.coverage_amount,
            policy.claims_count,
            clock.unix_timestamp - policy.creation_time,
            time_factor,
            amount_risk,
            claim_category
        );
        
        msg!("Claim submitted with risk score: {}", claim.risk_score);
        
        // Check if amount is below auto-processing threshold 
        // If so, immediately process the claim
        let claims_state = &ctx.accounts.claims_state;
        
        if amount <= claims_state.auto_claim_limit && claim.risk_score <= claims_state.auto_process_threshold {
            claim.status = ClaimStatus::Approved;
            
            // Process automatic payout
            let signature = process_claim_payout(
                &ctx.accounts.system_program.to_account_info(),
                claims_state,
                &ctx.accounts.owner,
                &claim.policy,
                amount,
            )?;
            
            claim.transaction_signature = Some(signature.clone());
            
            claim.verdict = Some(Verdict {
                approved: true,
                reason: "Auto-approved based on risk score and amount".to_string(),
                timestamp: clock.unix_timestamp,
                processor: ProcessorType::Automated,
                processor_pubkey: ctx.accounts.claims_state.key(),
            });
            
            msg!("Claim auto-approved and processed");
            msg!("Transaction signature: {}", signature);
        }
        
        // Increment claims count on the claims_state
        let mut claims_state = ctx.accounts.claims_state.to_account_info();
        let mut data = claims_state.try_borrow_mut_data()?;
        let mut state = ClaimsState::try_deserialize(&mut &data[..])?;
        state.claims_count += 1;
        ClaimsState::try_serialize(&state, &mut &mut data[..])?;
        
        Ok(())
    }

    pub fn process_claim(
        ctx: Context<ProcessClaim>,
        approved: bool,
        reason: String,
    ) -> Result<()> {
        let claim = &mut ctx.accounts.claim;
        let clock = Clock::get()?;
        
        // Verify claim status
        require!(
            claim.status == ClaimStatus::Pending || claim.status == ClaimStatus::UnderReview,
            ClaimsError::InvalidClaimStatus
        );
        
        if approved {
            claim.status = ClaimStatus::Approved;
            
            // Process payout with risk pool
            let signature = process_claim_payout(
                &ctx.accounts.system_program.to_account_info(),
                &ctx.accounts.claims_state,
                &ctx.accounts.owner,
                &claim.policy,
                claim.amount,
            )?;
            
            claim.transaction_signature = Some(signature.clone());
            
            claim.verdict = Some(Verdict {
                approved: true,
                reason,
                timestamp: clock.unix_timestamp,
                processor: ProcessorType::Manual,
                processor_pubkey: ctx.accounts.processor.key(),
            });
            
            msg!("Claim approved and processed");
            msg!("Transaction signature: {}", signature);
        } else {
            claim.status = ClaimStatus::Rejected;
            
            claim.verdict = Some(Verdict {
                approved: false,
                reason,
                timestamp: clock.unix_timestamp,
                processor: ProcessorType::Manual,
                processor_pubkey: ctx.accounts.processor.key(),
            });
            
            msg!("Claim rejected");
        }
        
        claim.last_update_slot = clock.slot;
        
        Ok(())
    }

    // New function to get claims history for a policy
    pub fn get_claims_history_for_policy(
        ctx: Context<GetClaimsHistoryForPolicy>
    ) -> Result<()> {
        let policy = &ctx.accounts.policy;
        let policy_pubkey = policy.key();
        
        msg!("Claims History for Policy: {}", policy_pubkey);
        
        // For now just log the information
        // In a full implementation, this would create an account with history data
        // or emit events containing the history data
        
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
        msg!("Category: {:?}", claim.category);
        
        // Log verdict if available
        if let Some(verdict) = &claim.verdict {
            msg!("Verdict: {}", if verdict.approved { "Approved" } else { "Rejected" });
            msg!("Reason: {}", verdict.reason);
            msg!("Processed At: {}", verdict.timestamp);
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

    /// Initialize the Bayesian verification model with default or custom parameters
    pub fn initialize_bayesian_model(
        ctx: Context<InitializeBayesianModel>,
        prior_fraud_probability: Option<u16>,
        completion_weight: Option<u16>,
        review_weight: Option<u16>,
        history_weight: Option<u16>,
        time_weight: Option<u16>,
        approve_threshold: Option<u16>,
        deny_threshold: Option<u16>,
    ) -> Result<()> {
        let bayesian_model = &mut ctx.accounts.bayesian_model;
        
        // Set authority
        bayesian_model.authority = ctx.accounts.authority.key();
        
        // Initialize with either provided values or defaults
        let mut model = initialize_default_model();
        model.authority = ctx.accounts.authority.key();
        
        // Override defaults with provided values
        if let Some(prob) = prior_fraud_probability {
            require!(prob <= 10000, ClaimsError::InvalidParameter);
            model.prior_fraud_probability = prob;
        }
        
        if let Some(weight) = completion_weight {
            model.completion_weight = weight;
        }
        
        if let Some(weight) = review_weight {
            model.review_weight = weight;
        }
        
        if let Some(weight) = history_weight {
            model.history_weight = weight;
        }
        
        if let Some(weight) = time_weight {
            model.time_weight = weight;
        }
        
        if let Some(threshold) = approve_threshold {
            require!(threshold <= 10000, ClaimsError::InvalidParameter);
            model.approve_threshold = threshold;
        }
        
        if let Some(threshold) = deny_threshold {
            require!(threshold <= 10000, ClaimsError::InvalidParameter);
            model.deny_threshold = threshold;
        }
        
        // Copy values to account
        bayesian_model.prior_fraud_probability = model.prior_fraud_probability;
        bayesian_model.completion_weight = model.completion_weight;
        bayesian_model.review_weight = model.review_weight;
        bayesian_model.history_weight = model.history_weight;
        bayesian_model.time_weight = model.time_weight;
        bayesian_model.approve_threshold = model.approve_threshold;
        bayesian_model.deny_threshold = model.deny_threshold;
        bayesian_model.total_claims_processed = 0;
        bayesian_model.approved_claims = 0;
        bayesian_model.denied_claims = 0;
        bayesian_model.manual_review_claims = 0;
        bayesian_model.reserved = [0; 64];
        bayesian_model.bump = *ctx.bumps.get("bayesian_model").unwrap();
        
        msg!("Bayesian verification model initialized");
        Ok(())
    }
    
    /// Process a claim using Bayesian verification
    pub fn verify_claim_bayesian(
        ctx: Context<VerifyClaimBayesian>,
        evidence: ClaimEvidence,
    ) -> Result<()> {
        let claim = &mut ctx.accounts.claim;
        let bayesian_model = &mut ctx.accounts.bayesian_model;
        let clock = Clock::get()?;
        
        // Validate claim is pending
        require!(
            claim.status == ClaimStatus::Pending,
            ClaimsError::InvalidClaimStatus
        );
        
        // Convert from Account<BayesianModel> to &BayesianVerificationModel for the model functions
        let model_ref = &*bayesian_model;
        
        // Use Bayesian verification to calculate claim legitimacy and determine result
        let verification_result = verify_claim(model_ref, &evidence);
        
        // Calculate legitimacy score as a number between 0-100
        let legitimacy_score = calculate_claim_legitimacy(model_ref, &evidence);
        
        // Process claim based on verification result
        match verification_result {
            ClaimVerificationResult::Approved => {
                claim.status = ClaimStatus::Approved;
                
                // Process payout with risk pool
                if let Ok(signature) = process_claim_payout(
                    &ctx.accounts.system_program.to_account_info(),
                    &ctx.accounts.claims_state,
                    &ctx.accounts.owner,
                    &claim.policy,
                    claim.amount,
                ) {
                    claim.transaction_signature = Some(signature.clone());
                    claim.verdict = Some(Verdict {
                        approved: true,
                        reason: format!("Automatically approved with score: {}", legitimacy_score),
                        timestamp: clock.unix_timestamp,
                        processor: ProcessorType::Automated,
                        processor_pubkey: ctx.accounts.authority.key(),
                    });
                    
                    // Update model stats
                    bayesian_model.total_claims_processed += 1;
                    bayesian_model.approved_claims += 1;
                }
            },
            ClaimVerificationResult::Denied => {
                claim.status = ClaimStatus::Rejected;
                claim.verdict = Some(Verdict {
                    approved: false,
                    reason: format!("Automatically denied with score: {}", legitimacy_score),
                    timestamp: clock.unix_timestamp,
                    processor: ProcessorType::Automated,
                    processor_pubkey: ctx.accounts.authority.key(),
                });
                
                // Update model stats
                bayesian_model.total_claims_processed += 1;
                bayesian_model.denied_claims += 1;
            },
            ClaimVerificationResult::ManualReview => {
                claim.status = ClaimStatus::UnderReview;
                
                // Update model stats
                bayesian_model.total_claims_processed += 1;
                bayesian_model.manual_review_claims += 1;
            }
        }
        
        claim.last_update_slot = clock.slot;
        
        Ok(())
    }

    pub fn register_arbitrator(
        ctx: Context<RegisterArbitrator>,
    ) -> Result<()> {
        let claims_state = &ctx.accounts.claims_state;
        let arbitrator_account = &mut ctx.accounts.arbitrator_account;
        
        // Validate authority
        require!(
            ctx.accounts.authority.key() == claims_state.authority,
            ClaimsError::Unauthorized
        );
        
        // Initialize arbitrator account
        arbitrator_account.arbitrator = ctx.accounts.arbitrator.key();
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
        let claim = &mut ctx.accounts.claim;
        let arbitrator_account = &mut ctx.accounts.arbitrator_account;
        let clock = Clock::get()?;
        
        // Verify claim status
        require!(
            claim.status == ClaimStatus::UnderReview,
            ClaimsError::InvalidClaimStatus
        );
        
        if approved {
            claim.status = ClaimStatus::Approved;
            
            // Process payout with risk pool
            let signature = process_claim_payout(
                &ctx.accounts.system_program.to_account_info(),
                &ctx.accounts.claims_state,
                &ctx.accounts.owner,
                &claim.policy,
                claim.amount,
            )?;
            
            claim.transaction_signature = Some(signature.clone());
            
            claim.verdict = Some(Verdict {
                approved: true,
                reason,
                timestamp: clock.unix_timestamp,
                processor: ProcessorType::Arbitrator,
                processor_pubkey: ctx.accounts.arbitrator.key(),
            });
            
            msg!("Claim approved by arbitrator");
            msg!("Transaction signature: {}", signature);
        } else {
            claim.status = ClaimStatus::Rejected;
            
            claim.verdict = Some(Verdict {
                approved: false,
                reason,
                timestamp: clock.unix_timestamp,
                processor: ProcessorType::Arbitrator,
                processor_pubkey: ctx.accounts.arbitrator.key(),
            });
            
            msg!("Claim rejected by arbitrator");
        }
        
        // Update arbitrator stats
        arbitrator_account.claims_processed += 1;
        
        // Update claim records
        claim.last_update_slot = clock.slot;
        
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

// Create a generic process_claim_payout function that works for any context
fn process_claim_payout(
    _system_program: &AccountInfo,
    _claims_state: &Account<ClaimsState>,
    recipient: &AccountInfo,
    policy_pubkey: &Pubkey,
    amount: u64,
) -> Result<String> {
    // For now, we'll just simulate a payout
    // In a production system, this would involve transferring tokens from a risk pool
    
    // Simulate transaction signature (in production, this would be the actual signature)
    let transaction_signature = format!("simulated_signature_{}_{}", policy_pubkey.to_string(), amount);
    
    // Log the payout
    msg!("Processing claim payout to owner: {}", recipient.key());
    msg!("Amount: {}", amount);
    msg!("Transaction signature: {}", transaction_signature);
    
    Ok(transaction_signature)
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = ClaimsState::SIZE,
        seeds = [b"claims_state", id().as_ref()],
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
        mut,
        seeds = [b"claims_state", id().as_ref()],
        bump = claims_state.bump,
        constraint = !claims_state.is_paused @ ClaimsError::ProgramPaused
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    /// CHECK: This is the policy account from the insurance program
    pub policy: AccountInfo<'info>,
    
    #[account(
        init,
        payer = owner,
        space = Claim::SIZE,
        seeds = [
            b"claim", 
            policy.key().as_ref(), 
            &Clock::get().unwrap().slot.to_le_bytes()
        ],
        bump
    )]
    pub claim: Account<'info, Claim>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct ProcessClaim<'info> {
    #[account(mut)]
    pub processor: Signer<'info>,
    
    #[account(
        seeds = [b"claims_state", id().as_ref()],
        bump = claims_state.bump,
        constraint = claims_state.is_processor(&processor.key()) || claims_state.authority == processor.key(),
        constraint = !claims_state.is_paused @ ClaimsError::ProgramPaused
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    #[account(
        mut,
        seeds = [b"claim", claim.policy.as_ref(), &claim.creation_slot.to_le_bytes()],
        bump = claim.bump,
        constraint = claim.status == ClaimStatus::Pending || claim.status == ClaimStatus::UnderReview @ ClaimsError::InvalidClaimStatus
    )]
    pub claim: Account<'info, Claim>,
    
    /// CHECK: The policy owner who will receive compensation if claim is approved
    pub owner: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct UpdateProcessorParameters<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"claims_state", id().as_ref()],
        bump = claims_state.bump,
        constraint = authority.key() == claims_state.authority
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeBayesianModel<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [b"claims_state", id().as_ref()],
        bump = claims_state.bump,
        constraint = claims_state.authority == authority.key()
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    #[account(
        init,
        payer = authority,
        space = BayesianModel::SIZE,
        seeds = [b"bayesian_model", claims_state.key().as_ref()],
        bump
    )]
    pub bayesian_model: Account<'info, BayesianModel>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct VerifyClaimBayesian<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [b"claims_state", id().as_ref()],
        bump = claims_state.bump
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    #[account(
        mut,
        seeds = [b"claim", claim.policy.as_ref(), &claim.creation_slot.to_le_bytes()],
        bump = claim.bump
    )]
    pub claim: Account<'info, Claim>,
    
    #[account(
        seeds = [b"bayesian_model", claims_state.key().as_ref()],
        bump = bayesian_model.bump
    )]
    pub bayesian_model: Account<'info, BayesianModel>,
    
    /// CHECK: Required for claim verification
    pub owner: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct RegisterArbitrator<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [b"claims_state", id().as_ref()],
        bump = claims_state.bump,
        constraint = authority.key() == claims_state.authority
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    #[account(
        init,
        payer = authority,
        space = ArbitratorAccount::SIZE,
        seeds = [b"arbitrator", arbitrator.key().as_ref()],
        bump
    )]
    pub arbitrator_account: Account<'info, ArbitratorAccount>,
    
    /// CHECK: The address of the arbitrator being registered
    pub arbitrator: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ArbitrateClaim<'info> {
    #[account(mut)]
    pub arbitrator: Signer<'info>,
    
    #[account(
        seeds = [b"claims_state", id().as_ref()],
        bump = claims_state.bump,
        constraint = !claims_state.is_paused @ ClaimsError::ProgramPaused
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    #[account(
        seeds = [b"arbitrator", arbitrator.key().as_ref()],
        bump = arbitrator_account.bump,
        constraint = arbitrator_account.arbitrator == arbitrator.key() @ ClaimsError::InvalidArbitrator,
        constraint = arbitrator_account.is_active @ ClaimsError::ArbitratorNotActive
    )]
    pub arbitrator_account: Account<'info, ArbitratorAccount>,
    
    #[account(
        mut,
        seeds = [b"claim", claim.policy.as_ref(), &claim.creation_slot.to_le_bytes()],
        bump = claim.bump,
        constraint = claim.status == ClaimStatus::UnderReview @ ClaimsError::InvalidClaimStatus
    )]
    pub claim: Account<'info, Claim>,
    
    /// CHECK: Will be validated against policy data
    pub owner: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct GetClaimDetails<'info> {
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [b"claims_state", id().as_ref()],
        bump = claims_state.bump
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    #[account(
        seeds = [b"claim", policy.key().as_ref(), &claim.creation_slot.to_le_bytes()],
        bump = claim.bump
    )]
    pub claim: Account<'info, Claim>,
    
    /// CHECK: This is the policy account from the insurance program
    pub policy: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetClaimsHistoryForPolicy<'info> {
    pub authority: Signer<'info>,
    
    /// CHECK: This is the policy account from the insurance program
    pub policy: AccountInfo<'info>,
    
    #[account(
        seeds = [b"claims_state", id().as_ref()],
        bump = claims_state.bump
    )]
    pub claims_state: Account<'info, ClaimsState>,
    
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct ClaimsState {
    pub authority: Pubkey,
    pub insurance_program_id: Pubkey,
    pub risk_pool_id: Pubkey,
    pub claims_count: u64,
    pub arbitration_threshold: u8,     // Claim amount percentage of coverage that requires arbitration
    pub auto_claim_limit: u64,         // Maximum amount for auto-processing
    pub auto_process_threshold: u8,    // Fraud score threshold for auto-processing (0-100)
    pub is_paused: bool,               // Emergency pause for claims processing
    pub bump: u8,
    pub processors: Vec<Pubkey>,
}

impl ClaimsState {
    pub const SIZE: usize = 32 + // authority
                            32 + // insurance_program_id
                            32 + // risk_pool_id
                            8 +  // claims_count
                            1 +  // arbitration_threshold
                            8 +  // auto_claim_limit
                            1 +  // auto_process_threshold
                            1 +  // is_paused
                            1 +  // bump
                            100 + // processors (estimated)
                            1;   // reserved

    // Check if a pubkey is in the processors list
    pub fn is_processor(&self, pubkey: &Pubkey) -> bool {
        self.processors.contains(pubkey)
    }
}

#[account]
#[derive(Default)]
pub struct Claim {
    pub policy: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
    pub status: ClaimStatus,
    pub evidence: bayesian_verification::ClaimEvidence,
    pub creation_slot: u64,
    pub last_update_slot: u64,
    pub category: ClaimCategory,
    pub verdict: Option<Verdict>,
    pub transaction_signature: Option<String>,
    pub risk_score: u8,
    pub bump: u8,
}

impl Claim {
    pub const SIZE: usize = 8 +     // discriminator
                            32 +    // policy pubkey
                            32 +    // owner pubkey
                            8 +     // amount
                            1 +     // status
                            100 +   // evidence (estimated size)
                            8 +     // creation_slot
                            8 +     // last_update_slot
                            1 +     // category
                            100 +   // verdict option (estimate)
                            100 +   // transaction_signature option (estimate)
                            1 +     // risk_score
                            1;      // bump
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub struct Verdict {
    pub approved: bool,
    pub reason: String,
    pub timestamp: i64,
    pub processor: ProcessorType,
    pub processor_pubkey: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum ProcessorType {
    Automated,
    Manual,
    Arbitrator,
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Policy {
    pub owner: Pubkey,
    pub is_active: bool,
    pub coverage_amount: u64,
    pub premium_amount: u64,
    pub creation_time: i64,
    pub end_time: i64,
    pub claims_count: u8,
    pub policy_type: u8,
    pub extra_data: Vec<u8>,
}

#[error_code]
pub enum ClaimsError {
    #[msg("Policy is not active")]
    PolicyNotActive,
    #[msg("Policy has expired")]
    PolicyExpired,
    #[msg("Claim amount exceeds policy coverage")]
    AmountExceedsCoverage,
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Invalid claim status")]
    InvalidClaimStatus,
    #[msg("Arbitrator is not active")]
    ArbitratorNotActive,
    #[msg("Program is paused")]
    ProgramPaused,
    #[msg("Invalid parameter")]
    InvalidParameter,
    #[msg("Invalid arbitrator")]
    InvalidArbitrator,
    #[msg("Arbitrator already registered")]
    ArbitratorAlreadyRegistered,
}

#[account]
#[derive(Default)]
pub struct ClaimsHistory {
    pub policy: Pubkey,        // The policy this history is for
    pub claim_list: Vec<Pubkey>, // List of claim account addresses
    pub bump: u8,
}

impl ClaimsHistory {
    // Maximum size for serialized ClaimsHistory
    pub const MAX_SIZE: usize = 32 + // policy
                                4 + (32 * 20) + // claim_list vector with up to 20 claims (4 for vec len + 32 bytes per claim pubkey)
                                1; // bump
    
    pub fn add_claim(&mut self, claim_pubkey: Pubkey) {
        self.claim_list.push(claim_pubkey);
    }
    
    pub fn get_claims_count(&self) -> usize {
        self.claim_list.len()
    }
}
