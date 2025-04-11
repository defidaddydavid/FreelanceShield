use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Token, Transfer};
use crate::state::*;
use crate::error::*;
use crate::utils::*;

// Report fraudulent behavior
pub fn report_fraud(
    ctx: Context<ReportFraud>,
    fraud_type: FraudType,
    evidence_hash: [u8; 32],
    description: String,
    uri: String,
) -> Result<()> {
    let fraud_report = &mut ctx.accounts.fraud_report;
    let reporter = &ctx.accounts.reporter;
    let reported_user = &ctx.accounts.reported_user;
    let clock = Clock::get()?;
    
    // Prevent self-reporting (usually doesn't make sense)
    if reporter.key() == reported_user.key() {
        return Err(error!(FraudPreventionError::SelfReportingNotAllowed));
    }
    
    // Set up the fraud report
    fraud_report.reporter = reporter.key();
    fraud_report.reported_user = reported_user.key();
    fraud_report.fraud_type = fraud_type;
    fraud_report.related_claim = None; // Can be updated later if there's a related claim
    fraud_report.evidence_hash = evidence_hash;
    fraud_report.description = description;
    fraud_report.uri = uri;
    fraud_report.status = FraudReportStatus::Reported;
    fraud_report.investigators = Vec::new();
    fraud_report.created_at = clock.unix_timestamp;
    fraud_report.last_updated = clock.unix_timestamp;
    fraud_report.is_bounty_claimed = false;
    fraud_report.bounty_claimer = None;
    fraud_report.actions_taken = String::new();
    fraud_report.bump = *ctx.bumps.get("fraud_report").unwrap();
    
    msg!("Fraud report created for user: {}", reported_user.key());
    msg!("Fraud type: {:?}", fraud_type);
    Ok(())
}

// Create a new fraud detection bounty
pub fn create_fraud_bounty(
    ctx: Context<CreateFraudBounty>,
    bounty_details: BountyDetails,
    reward_amount: u64,
) -> Result<()> {
    let bounty = &mut ctx.accounts.bounty;
    let creator = &ctx.accounts.creator;
    let creator_token_account = &ctx.accounts.creator_token_account;
    let bounty_token_account = &ctx.accounts.bounty_token_account;
    let clock = Clock::get()?;
    
    // Validate bounty details
    if bounty_details.title.is_empty() || bounty_details.description.is_empty() || bounty_details.criteria.is_empty() {
        return Err(error!(FraudPreventionError::InvalidBountyDetails));
    }
    
    // Check expiry if set
    if let Some(expiry) = bounty_details.expiry {
        if expiry <= clock.unix_timestamp {
            return Err(error!(FraudPreventionError::BountyExpired));
        }
    }
    
    // Transfer tokens from creator to bounty account
    let transfer_accounts = Transfer {
        from: creator_token_account.to_account_info(),
        to: bounty_token_account.to_account_info(),
        authority: creator.to_account_info(),
    };
    
    // Execute the transfer with CPI
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_accounts,
        ),
        reward_amount,
    )?;
    
    // Set up the bounty account
    bounty.creator = creator.key();
    bounty.details = bounty_details;
    bounty.reward_amount = reward_amount;
    bounty.is_claimed = false;
    bounty.claimer = None;
    bounty.related_fraud_report = None;
    bounty.created_at = clock.unix_timestamp;
    bounty.claimed_at = None;
    bounty.bump = *ctx.bumps.get("bounty").unwrap();
    
    msg!("Fraud detection bounty created: {}", bounty_details.title);
    msg!("Reward amount: {}", reward_amount);
    Ok(())
}

// Claim a bounty for detecting fraud
pub fn claim_fraud_bounty(
    ctx: Context<ClaimFraudBounty>,
    fraud_report_id: Pubkey,
    evidence_hash: [u8; 32],
) -> Result<()> {
    let bounty = &mut ctx.accounts.bounty;
    let claimer = &ctx.accounts.claimer;
    let fraud_report = &ctx.accounts.fraud_report;
    let bounty_token_account = &ctx.accounts.bounty_token_account;
    let claimer_token_account = &ctx.accounts.claimer_token_account;
    let clock = Clock::get()?;
    
    // Check if bounty has already been claimed
    if bounty.is_claimed {
        return Err(error!(FraudPreventionError::BountyAlreadyClaimed));
    }
    
    // Check if bounty is expired
    if let Some(expiry) = bounty.details.expiry {
        if clock.unix_timestamp > expiry {
            return Err(error!(FraudPreventionError::BountyExpired));
        }
    }
    
    // Check that the fraud report status is confirmed
    if fraud_report.status != FraudReportStatus::Confirmed {
        return Err(error!(FraudPreventionError::FraudReportNotConfirmed));
    }
    
    // Transfer tokens from bounty account to claimer
    let seeds = &[
        b"bounty".as_ref(),
        bounty.creator.as_ref(),
        bounty.created_at.to_le_bytes().as_ref(),
        &[bounty.bump],
    ];
    let signer_seeds = &[&seeds[..]];
    
    // Create the transfer instruction
    let transfer_accounts = Transfer {
        from: bounty_token_account.to_account_info(),
        to: claimer_token_account.to_account_info(),
        authority: bounty.to_account_info(),
    };
    
    // Execute the transfer with CPI
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_accounts,
            signer_seeds,
        ),
        bounty.reward_amount,
    )?;
    
    // Update bounty status
    bounty.is_claimed = true;
    bounty.claimer = Some(claimer.key());
    bounty.related_fraud_report = Some(fraud_report.key());
    bounty.claimed_at = Some(clock.unix_timestamp);
    
    // Update fraud report status
    // Note: In a real implementation, you would need a separate instruction to update the
    // fraud report status, as it would be a separate account that needs to be mutable
    
    msg!("Bounty claimed successfully by: {}", claimer.key());
    msg!("Reward amount transferred: {}", bounty.reward_amount);
    Ok(())
}

// Update fraud report status
pub fn update_fraud_report_status(
    ctx: Context<UpdateFraudReport>,
    new_status: FraudReportStatus,
    actions_taken: Option<String>,
) -> Result<()> {
    let fraud_report = &mut ctx.accounts.fraud_report;
    let investigator = &ctx.accounts.investigator;
    let clock = Clock::get()?;
    
    // Check if the investigator is authorized
    let is_authorized = fraud_report.investigators.contains(&investigator.key());
    if !is_authorized {
        // In a real implementation, you would check if the investigator has sufficient permissions
        // For now, we'll add them as an investigator if there's room
        if fraud_report.investigators.len() < FraudReport::MAX_INVESTIGATORS {
            fraud_report.investigators.push(investigator.key());
        } else {
            return Err(error!(FraudPreventionError::MaxInvestigatorsReached));
        }
    }
    
    // Update the fraud report status
    fraud_report.status = new_status;
    
    // Update actions taken if provided
    if let Some(actions) = actions_taken {
        fraud_report.actions_taken = actions;
    }
    
    // Update the last updated timestamp
    fraud_report.last_updated = clock.unix_timestamp;
    
    // If status is changed to bounty awarded, update the is_bounty_claimed flag
    if new_status == FraudReportStatus::BountyAwarded {
        fraud_report.is_bounty_claimed = true;
    }
    
    msg!("Fraud report status updated to: {:?}", new_status);
    Ok(())
}

// Context for reporting fraud
#[derive(Accounts)]
pub struct ReportFraud<'info> {
    #[account(mut)]
    pub reporter: Signer<'info>,
    
    /// CHECK: The user being reported for fraud
    pub reported_user: AccountInfo<'info>,
    
    #[account(
        init,
        payer = reporter,
        space = FraudReport::space(),
        seeds = [
            b"fraud_report",
            reporter.key().as_ref(),
            reported_user.key().as_ref(),
            &Clock::get()?.unix_timestamp.to_le_bytes()
        ],
        bump,
    )]
    pub fraud_report: Account<'info, FraudReport>,
    
    pub system_program: Program<'info, System>,
}

// Context for creating a fraud detection bounty
#[derive(Accounts)]
pub struct CreateFraudBounty<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        init,
        payer = creator,
        space = FraudBounty::space(),
        seeds = [
            b"bounty",
            creator.key().as_ref(),
            &Clock::get()?.unix_timestamp.to_le_bytes()
        ],
        bump,
    )]
    pub bounty: Account<'info, FraudBounty>,
    
    #[account(
        mut,
        constraint = creator_token_account.owner == creator.key()
    )]
    pub creator_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = creator,
        seeds = [
            b"bounty_token",
            bounty.key().as_ref()
        ],
        bump,
        token::mint = token_mint,
        token::authority = bounty,
    )]
    pub bounty_token_account: Account<'info, TokenAccount>,
    
    pub token_mint: Account<'info, token::Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// Context for claiming a fraud bounty
#[derive(Accounts)]
pub struct ClaimFraudBounty<'info> {
    #[account(mut)]
    pub claimer: Signer<'info>,
    
    #[account(
        mut,
        seeds = [
            b"bounty",
            bounty.creator.as_ref(),
            &bounty.created_at.to_le_bytes()
        ],
        bump = bounty.bump,
    )]
    pub bounty: Account<'info, FraudBounty>,
    
    #[account(
        seeds = [
            b"fraud_report",
            fraud_report.reporter.as_ref(),
            fraud_report.reported_user.as_ref(),
            &fraud_report.created_at.to_le_bytes()
        ],
        bump = fraud_report.bump,
    )]
    pub fraud_report: Account<'info, FraudReport>,
    
    #[account(
        mut,
        seeds = [
            b"bounty_token",
            bounty.key().as_ref()
        ],
        bump,
    )]
    pub bounty_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = claimer_token_account.owner == claimer.key()
    )]
    pub claimer_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

// Context for updating a fraud report
#[derive(Accounts)]
pub struct UpdateFraudReport<'info> {
    #[account(mut)]
    pub investigator: Signer<'info>,
    
    #[account(
        mut,
        seeds = [
            b"fraud_report",
            fraud_report.reporter.as_ref(),
            fraud_report.reported_user.as_ref(),
            &fraud_report.created_at.to_le_bytes()
        ],
        bump = fraud_report.bump,
    )]
    pub fraud_report: Account<'info, FraudReport>,
}
