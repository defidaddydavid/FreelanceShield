use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;
use crate::utils::*;

// Initialize a new identity verification account for a user
pub fn initialize_identity(
    ctx: Context<InitializeIdentity>,
    verification_level: u8,
    user_info: UserInfo,
) -> Result<()> {
    let identity_account = &mut ctx.accounts.identity_account;
    let user = &ctx.accounts.user;
    let clock = Clock::get()?;
    
    // Set up the identity account
    identity_account.user = user.key();
    identity_account.verification_level = VerificationLevel::from(verification_level);
    identity_account.kyc_verifications = Vec::new();
    identity_account.social_verifications = Vec::new();
    identity_account.vouchers = Vec::new();
    identity_account.created_at = clock.unix_timestamp;
    identity_account.last_updated = clock.unix_timestamp;
    
    // Default expiry is 1 year from now for basic verifications
    identity_account.verification_expiry = clock.unix_timestamp + 31_536_000; // 1 year in seconds
    identity_account.is_active = true;
    identity_account.bump = *ctx.bumps.get("identity_account").unwrap();
    
    msg!("Identity account initialized for user: {}", user.key());
    Ok(())
}

// Update a user's identity verification level
pub fn update_verification_level(
    ctx: Context<UpdateVerificationLevel>,
    new_level: u8,
    verification_data: VerificationData,
) -> Result<()> {
    let identity_account = &mut ctx.accounts.identity_account;
    let verifier = &ctx.accounts.verifier;
    let clock = Clock::get()?;
    
    // Verify that the verifier is authorized to update verification levels
    // In a production system, you would check that the verifier is in a whitelist
    // or has the appropriate credentials
    
    // Get the new verification level
    let new_verification_level = VerificationLevel::from(new_level);
    
    // Check that the new level is valid (cannot downgrade)
    if new_verification_level as u8 <= identity_account.verification_level as u8 {
        return Err(error!(FraudPreventionError::InvalidVerificationLevel));
    }
    
    // Update the verification level
    identity_account.verification_level = new_verification_level;
    
    // Add KYC verification if this is coming from a KYC provider
    if identity_account.kyc_verifications.len() < IdentityAccount::MAX_KYC_VERIFICATIONS {
        identity_account.kyc_verifications.push(verifier.key());
    }
    
    // Update the expiry based on the verification level
    match new_verification_level {
        VerificationLevel::Basic => {
            // 1 year expiry for basic level
            identity_account.verification_expiry = clock.unix_timestamp + 31_536_000;
        },
        VerificationLevel::Intermediate => {
            // 2 years for intermediate
            identity_account.verification_expiry = clock.unix_timestamp + 63_072_000;
        },
        VerificationLevel::Advanced | VerificationLevel::Premium => {
            // 3 years for advanced and premium
            identity_account.verification_expiry = clock.unix_timestamp + 94_608_000;
        }
    }
    
    // Update the last updated timestamp
    identity_account.last_updated = clock.unix_timestamp;
    
    msg!("Identity verification level updated to: {}", new_level);
    Ok(())
}

// Add KYC verification from an authorized provider
pub fn add_kyc_verification(
    ctx: Context<AddVerification>,
    verification_data: VerificationData,
) -> Result<()> {
    let identity_account = &mut ctx.accounts.identity_account;
    let verifier = &ctx.accounts.verifier;
    let clock = Clock::get()?;
    
    // Check if we've reached the maximum number of KYC verifications
    if identity_account.kyc_verifications.len() >= IdentityAccount::MAX_KYC_VERIFICATIONS {
        return Err(error!(FraudPreventionError::MaxVerificationsReached));
    }
    
    // Check if this verifier has already been added
    if identity_account.kyc_verifications.contains(&verifier.key()) {
        return Err(error!(FraudPreventionError::DuplicateVoucher));
    }
    
    // Add the KYC verification
    identity_account.kyc_verifications.push(verifier.key());
    
    // Update the last updated timestamp
    identity_account.last_updated = clock.unix_timestamp;
    
    msg!("KYC verification added from: {}", verifier.key());
    Ok(())
}

// Add social verification (linking social accounts for credibility)
pub fn add_social_verification(
    ctx: Context<AddVerification>,
    social_data: SocialData,
) -> Result<()> {
    let identity_account = &mut ctx.accounts.identity_account;
    let user = &ctx.accounts.user;
    let clock = Clock::get()?;
    
    // Check if we've reached the maximum number of social verifications
    if identity_account.social_verifications.len() >= IdentityAccount::MAX_SOCIAL_VERIFICATIONS {
        return Err(error!(FraudPreventionError::MaxVerificationsReached));
    }
    
    // Check that the user isn't adding the same social account twice
    if identity_account.social_verifications.iter()
        .any(|sv| sv.platform == social_data.platform && sv.account_hash == social_data.account_hash) {
        return Err(error!(FraudPreventionError::InvalidSocialData));
    }
    
    // Add the social verification
    let mut social_verification = social_data;
    social_verification.verification_timestamp = clock.unix_timestamp;
    
    identity_account.social_verifications.push(social_verification);
    
    // If this is the first social verification and the user is at Basic level,
    // upgrade them to Intermediate
    if identity_account.social_verifications.len() == 1 && 
       identity_account.verification_level == VerificationLevel::Basic {
        identity_account.verification_level = VerificationLevel::Intermediate;
    }
    
    // Update the last updated timestamp
    identity_account.last_updated = clock.unix_timestamp;
    
    msg!("Social verification added for platform: {}", social_data.platform);
    Ok(())
}

// Add a trusted voucher to increase a user's credibility
pub fn add_social_vouching(
    ctx: Context<AddSocialVouching>,
    vouching_statement: String,
) -> Result<()> {
    let identity_account = &mut ctx.accounts.identity_account;
    let voucher = &ctx.accounts.voucher;
    let voucher_identity = &ctx.accounts.voucher_identity;
    let clock = Clock::get()?;
    
    // Check if we've reached the maximum number of vouchers
    if identity_account.vouchers.len() >= IdentityAccount::MAX_VOUCHERS {
        return Err(error!(FraudPreventionError::MaxVouchersReached));
    }
    
    // Prevent self-vouching
    if voucher.key() == identity_account.user {
        return Err(error!(FraudPreventionError::SelfVouchingNotAllowed));
    }
    
    // Check if this voucher has already vouched for this user
    if identity_account.vouchers.iter().any(|v| v.voucher == voucher.key()) {
        return Err(error!(FraudPreventionError::DuplicateVoucher));
    }
    
    // Check that the voucher has sufficient reputation
    // In a real system, you would get this from the reputation program
    let voucher_reputation = 70; // Replace with actual reputation from reputation program
    
    // Minimum reputation required to vouch
    let min_voucher_reputation = 50;
    if voucher_reputation < min_voucher_reputation {
        return Err(error!(FraudPreventionError::VoucherReputationTooLow));
    }
    
    // Hash the vouching statement
    let statement_bytes = vouching_statement.as_bytes();
    let statement_hash: [u8; 32] = if statement_bytes.len() >= 32 {
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&statement_bytes[0..32]);
        hash
    } else {
        // Simple padding for demonstration
        let mut hash = [0u8; 32];
        hash[..statement_bytes.len()].copy_from_slice(statement_bytes);
        hash
    };
    
    // Create the voucher info
    let voucher_info = VoucherInfo {
        voucher: voucher.key(),
        timestamp: clock.unix_timestamp,
        statement_hash,
        voucher_reputation: voucher_reputation,
    };
    
    // Add the voucher
    identity_account.vouchers.push(voucher_info);
    
    // Update the last updated timestamp
    identity_account.last_updated = clock.unix_timestamp;
    
    msg!("Social vouching added from: {}", voucher.key());
    Ok(())
}

// Context for initializing an identity account
#[derive(Accounts)]
pub struct InitializeIdentity<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        init,
        payer = user,
        space = IdentityAccount::space(),
        seeds = [b"identity", user.key().as_ref()],
        bump,
    )]
    pub identity_account: Account<'info, IdentityAccount>,
    
    pub system_program: Program<'info, System>,
}

// Context for updating verification level
#[derive(Accounts)]
pub struct UpdateVerificationLevel<'info> {
    #[account(mut)]
    pub verifier: Signer<'info>,
    
    /// CHECK: This is the user whose identity is being verified
    pub user: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"identity", user.key().as_ref()],
        bump = identity_account.bump,
    )]
    pub identity_account: Account<'info, IdentityAccount>,
}

// Context for adding a verification (KYC or social)
#[derive(Accounts)]
pub struct AddVerification<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"identity", user.key().as_ref()],
        bump = identity_account.bump,
        constraint = identity_account.user == user.key()
    )]
    pub identity_account: Account<'info, IdentityAccount>,
    
    /// CHECK: This is the verifier entity
    pub verifier: AccountInfo<'info>,
}

// Context for social vouching
#[derive(Accounts)]
pub struct AddSocialVouching<'info> {
    #[account(mut)]
    pub voucher: Signer<'info>,
    
    /// CHECK: This is the user being vouched for
    pub user: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"identity", user.key().as_ref()],
        bump = identity_account.bump,
    )]
    pub identity_account: Account<'info, IdentityAccount>,
    
    #[account(
        seeds = [b"identity", voucher.key().as_ref()],
        bump,
    )]
    pub voucher_identity: Account<'info, IdentityAccount>,
}
