use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use anchor_spl::associated_token::AssociatedToken;
use std::convert::TryFrom;

declare_id!("9TsZshBaMxUnCHeSfvqAZQdKKXWWXQ6sd4Z6S4YvGcxv");

// Define program IDs for cross-program invocation
pub const RISK_POOL_PROGRAM_ID: Pubkey = anchor_lang::solana_program::pubkey!("GywN3pRCKVXyAVNxkePotBFEYcFSvULw5qefacsUmsdt");
// Fix the pubkey length issue by providing a valid 32-byte pubkey
pub const POLICY_NFT_PROGRAM_ID: Pubkey = anchor_lang::solana_program::pubkey!("NFTpLcy1UQCJcZBEYzgHNUaehDQoqTuNFWJJdT9eLLR");
pub const STAKING_PROGRAM_ID: Pubkey = anchor_lang::solana_program::pubkey!("StaKe5tXnKjeJC4vRVsnxBrNwUuUXRES2RdMc4MnrSA");

// Constants for cover product management
pub const MAX_PRODUCT_NAME_LENGTH: usize = 64;
pub const MAX_PRODUCT_DESCRIPTION_LENGTH: usize = 256;
pub const MAX_COVER_TERMS_LENGTH: usize = 1024;

#[program]
pub mod enhanced_cover {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        base_reserve_ratio: u8,
        min_coverage_amount: u64,
        max_coverage_amount: u64,
        min_period_days: u16,
        max_period_days: u16,
        grace_period_days: u8,
        claim_period_days: u8,
    ) -> Result<()> {
        let cover_state = &mut ctx.accounts.cover_state;
        cover_state.authority = ctx.accounts.authority.key();
        cover_state.base_reserve_ratio = base_reserve_ratio;
        cover_state.min_coverage_amount = min_coverage_amount;
        cover_state.max_coverage_amount = max_coverage_amount;
        cover_state.min_period_days = min_period_days;
        cover_state.max_period_days = max_period_days;
        cover_state.grace_period_days = grace_period_days;
        cover_state.claim_period_days = claim_period_days;
        cover_state.total_products = 0;
        cover_state.total_policies = 0;
        cover_state.active_policies = 0;
        cover_state.total_coverage = 0;
        cover_state.total_premiums = 0;
        cover_state.is_paused = false;
        cover_state.last_update_timestamp = Clock::get()?.unix_timestamp;
        cover_state.bump = *ctx.bumps.get("cover_state").unwrap();
        
        msg!("Enhanced Cover program initialized");
        Ok(())
    }

    pub fn create_cover_product(
        ctx: Context<CreateCoverProduct>,
        product_name: String,
        product_description: String,
        product_type: ProductType,
        risk_factor: u8,
        premium_multiplier: u16,
        min_stake_to_capital_ratio: u8,
        cover_terms: String,
    ) -> Result<()> {
        // Validate input parameters
        require!(
            product_name.len() <= MAX_PRODUCT_NAME_LENGTH,
            CoverError::ProductNameTooLong
        );
        
        require!(
            product_description.len() <= MAX_PRODUCT_DESCRIPTION_LENGTH,
            CoverError::ProductDescriptionTooLong
        );
        
        require!(
            cover_terms.len() <= MAX_COVER_TERMS_LENGTH,
            CoverError::CoverTermsTooLong
        );
        
        require!(
            risk_factor <= 100,
            CoverError::InvalidRiskFactor
        );
        
        require!(
            premium_multiplier > 0 && premium_multiplier <= 1000,
            CoverError::InvalidPremiumMultiplier
        );
        
        // Initialize cover product
        let cover_product = &mut ctx.accounts.cover_product;
        cover_product.authority = ctx.accounts.authority.key();
        cover_product.product_name = product_name;
        cover_product.product_description = product_description;
        cover_product.product_type = product_type;
        cover_product.risk_factor = risk_factor;
        cover_product.premium_multiplier = premium_multiplier;
        cover_product.min_stake_to_capital_ratio = min_stake_to_capital_ratio;
        cover_product.cover_terms = cover_terms;
        cover_product.active_policies = 0;
        cover_product.total_coverage = 0;
        cover_product.total_premiums = 0;
        cover_product.is_active = true;
        cover_product.created_at = Clock::get()?.unix_timestamp;
        cover_product.last_updated = Clock::get()?.unix_timestamp;
        cover_product.bump = *ctx.bumps.get("cover_product").unwrap();
        
        // Update cover state
        let mut cover_state_account = ctx.accounts.cover_state.to_account_info();
        let mut state_data = cover_state_account.try_borrow_mut_data()?;
        let mut state = CoverState::try_deserialize(&mut &state_data[..])?;
        state.total_products += 1;
        state.last_update_timestamp = Clock::get()?.unix_timestamp;
        CoverState::try_serialize(&state, &mut &mut state_data[..])?;
        
        msg!("Cover product created successfully");
        msg!("Product ID: {}", cover_product.key());
        msg!("Product Name: {}", product_name);
        msg!("Product Type: {:?}", product_type);
        
        Ok(())
    }

    pub fn update_cover_product(
        ctx: Context<UpdateCoverProduct>,
        product_description: Option<String>,
        risk_factor: Option<u8>,
        premium_multiplier: Option<u16>,
        min_stake_to_capital_ratio: Option<u8>,
        cover_terms: Option<String>,
        is_active: Option<bool>,
    ) -> Result<()> {
        let cover_product = &mut ctx.accounts.cover_product;
        
        // Update product description if provided
        if let Some(description) = product_description {
            require!(
                description.len() <= MAX_PRODUCT_DESCRIPTION_LENGTH,
                CoverError::ProductDescriptionTooLong
            );
            cover_product.product_description = description;
        }
        
        // Update risk factor if provided
        if let Some(risk) = risk_factor {
            require!(
                risk <= 100,
                CoverError::InvalidRiskFactor
            );
            cover_product.risk_factor = risk;
        }
        
        // Update premium multiplier if provided
        if let Some(multiplier) = premium_multiplier {
            require!(
                multiplier > 0 && multiplier <= 1000,
                CoverError::InvalidPremiumMultiplier
            );
            cover_product.premium_multiplier = multiplier;
        }
        
        // Update min stake to capital ratio if provided
        if let Some(ratio) = min_stake_to_capital_ratio {
            cover_product.min_stake_to_capital_ratio = ratio;
        }
        
        // Update cover terms if provided
        if let Some(terms) = cover_terms {
            require!(
                terms.len() <= MAX_COVER_TERMS_LENGTH,
                CoverError::CoverTermsTooLong
            );
            cover_product.cover_terms = terms;
        }
        
        // Update active status if provided
        if let Some(active) = is_active {
            cover_product.is_active = active;
        }
        
        // Update last updated timestamp
        cover_product.last_updated = Clock::get()?.unix_timestamp;
        
        msg!("Cover product updated successfully");
        msg!("Product ID: {}", cover_product.key());
        
        Ok(())
    }

    pub fn buy_cover(
        ctx: Context<BuyCover>,
        product_id: Pubkey,
        coverage_amount: u64,
        period_days: u16,
        premium_amount: u64,
        metadata: Option<String>,
        mint_nft: bool,
    ) -> Result<()> {
        let cover_state = &ctx.accounts.cover_state;
        let cover_product = &ctx.accounts.cover_product;
        let policy = &mut ctx.accounts.policy;
        let clock = Clock::get()?;
        
        // Validate parameters
        require!(
            coverage_amount >= cover_state.min_coverage_amount && 
            coverage_amount <= cover_state.max_coverage_amount,
            CoverError::InvalidCoverageAmount
        );
        
        require!(
            period_days >= cover_state.min_period_days && 
            period_days <= cover_state.max_period_days,
            CoverError::InvalidPeriodDays
        );
        
        require!(cover_product.is_active, CoverError::ProductNotActive);
        require!(!cover_state.is_paused, CoverError::ProgramPaused);
        
        // Initialize policy
        policy.owner = ctx.accounts.owner.key();
        policy.product_id = product_id;
        policy.coverage_amount = coverage_amount;
        policy.premium_amount = premium_amount;
        policy.start_date = clock.unix_timestamp;
        policy.end_date = clock.unix_timestamp + (period_days as i64 * 86400); // days to seconds
        policy.grace_period_end = policy.end_date + (cover_state.grace_period_days as i64 * 86400);
        policy.claim_period_end = policy.grace_period_end + (cover_state.claim_period_days as i64 * 86400);
        policy.status = PolicyStatus::Active;
        policy.metadata = metadata.unwrap_or_default();
        policy.claims_count = 0;
        policy.creation_slot = clock.slot;
        policy.last_update_slot = clock.slot;
        policy.bump = *ctx.bumps.get("policy").unwrap();
        
        // Transfer premium from user to risk pool
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.owner_token_account.to_account_info(),
                to: ctx.accounts.risk_pool_token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        );
        
        token::transfer(transfer_ctx, premium_amount)?;
        
        // Update cover product
        let mut cover_product_account = ctx.accounts.cover_product.to_account_info();
        let mut product_data = cover_product_account.try_borrow_mut_data()?;
        let mut product = CoverProduct::try_deserialize(&mut &product_data[..])?;
        product.active_policies += 1;
        product.total_coverage += coverage_amount;
        product.total_premiums += premium_amount;
        CoverProduct::try_serialize(&product, &mut &mut product_data[..])?;
        
        // Update cover state
        let mut cover_state_account = ctx.accounts.cover_state.to_account_info();
        let mut state_data = cover_state_account.try_borrow_mut_data()?;
        let mut state = CoverState::try_deserialize(&mut &state_data[..])?;
        state.total_policies += 1;
        state.active_policies += 1;
        state.total_coverage += coverage_amount;
        state.total_premiums += premium_amount;
        state.last_update_timestamp = clock.unix_timestamp;
        CoverState::try_serialize(&state, &mut &mut state_data[..])?;
        
        // Notify risk pool of increased coverage (via CPI call)
        // This would be implemented in production
        
        // Mint NFT if requested
        if mint_nft {
            // This would be a CPI call to the policy_nft program
            msg!("NFT minting would be triggered here via CPI");
        }
        
        msg!("Cover policy created successfully");
        msg!("Policy ID: {}", policy.key());
        msg!("Owner: {}", policy.owner);
        msg!("Coverage: {}", policy.coverage_amount);
        msg!("Premium: {}", policy.premium_amount);
        msg!("Start Date: {}", policy.start_date);
        msg!("End Date: {}", policy.end_date);
        msg!("Grace Period End: {}", policy.grace_period_end);
        msg!("Claim Period End: {}", policy.claim_period_end);
        
        Ok(())
    }
}

// Account structures
#[account]
#[derive(Default)]
pub struct CoverState {
    pub authority: Pubkey,
    pub base_reserve_ratio: u8,
    pub min_coverage_amount: u64,
    pub max_coverage_amount: u64,
    pub min_period_days: u16,
    pub max_period_days: u16,
    pub grace_period_days: u8,
    pub claim_period_days: u8,
    pub total_products: u64,
    pub total_policies: u64,
    pub active_policies: u64,
    pub total_coverage: u64,
    pub total_premiums: u64,
    pub is_paused: bool,
    pub last_update_timestamp: i64,
    pub bump: u8,
}

impl CoverState {
    pub const SIZE: usize = 32 + // authority
                            1 +  // base_reserve_ratio
                            8 +  // min_coverage_amount
                            8 +  // max_coverage_amount
                            2 +  // min_period_days
                            2 +  // max_period_days
                            1 +  // grace_period_days
                            1 +  // claim_period_days
                            8 +  // total_products
                            8 +  // total_policies
                            8 +  // active_policies
                            8 +  // total_coverage
                            8 +  // total_premiums
                            1 +  // is_paused
                            8 +  // last_update_timestamp
                            1;   // bump
}

#[account]
#[derive(Default)]
pub struct CoverProduct {
    pub authority: Pubkey,
    pub product_name: String,
    pub product_description: String,
    pub product_type: ProductType,
    pub risk_factor: u8,
    pub premium_multiplier: u16,
    pub min_stake_to_capital_ratio: u8,
    pub cover_terms: String,
    pub active_policies: u64,
    pub total_coverage: u64,
    pub total_premiums: u64,
    pub is_active: bool,
    pub created_at: i64,
    pub last_updated: i64,
    pub bump: u8,
}

impl CoverProduct {
    pub const SIZE: usize = 32 + // authority
                            (4 + MAX_PRODUCT_NAME_LENGTH) + // product_name
                            (4 + MAX_PRODUCT_DESCRIPTION_LENGTH) + // product_description
                            1 +  // product_type (enum)
                            1 +  // risk_factor
                            2 +  // premium_multiplier
                            1 +  // min_stake_to_capital_ratio
                            (4 + MAX_COVER_TERMS_LENGTH) + // cover_terms
                            8 +  // active_policies
                            8 +  // total_coverage
                            8 +  // total_premiums
                            1 +  // is_active
                            8 +  // created_at
                            8 +  // last_updated
                            1;   // bump
}

#[account]
#[derive(Default)]
pub struct Policy {
    pub owner: Pubkey,
    pub product_id: Pubkey,
    pub coverage_amount: u64,
    pub premium_amount: u64,
    pub start_date: i64,
    pub end_date: i64,
    pub grace_period_end: i64,
    pub claim_period_end: i64,
    pub status: PolicyStatus,
    pub metadata: String,
    pub claims_count: u8,
    pub creation_slot: u64,
    pub last_update_slot: u64,
    pub bump: u8,
}

impl Policy {
    pub const SIZE: usize = 32 + // owner
                            32 + // product_id
                            8 +  // coverage_amount
                            8 +  // premium_amount
                            8 +  // start_date
                            8 +  // end_date
                            8 +  // grace_period_end
                            8 +  // claim_period_end
                            1 +  // status (enum)
                            (4 + 256) + // metadata (assuming max 256 chars)
                            1 +  // claims_count
                            8 +  // creation_slot
                            8 +  // last_update_slot
                            1;   // bump
}

// Enums and structs
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum ProductType {
    FreelanceContract,
    DigitalAsset,
    IntellectualProperty,
    ProfessionalService,
    SoftwareDevelopment,
    ContentCreation,
    DataProtection,
    Custom,
}

impl Default for ProductType {
    fn default() -> Self {
        ProductType::FreelanceContract
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Copy, Debug)]
pub enum PolicyStatus {
    Active,
    Expired,
    Claimed,
    Cancelled,
}

impl Default for PolicyStatus {
    fn default() -> Self {
        PolicyStatus::Active
    }
}

// Context structures for instructions
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + CoverState::SIZE,
        seeds = [b"cover_state"],
        bump
    )]
    pub cover_state: Account<'info, CoverState>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateCoverProduct<'info> {
    #[account(
        constraint = authority.key() == cover_state.authority,
    )]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [b"cover_state"],
        bump = cover_state.bump
    )]
    pub cover_state: Account<'info, CoverState>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + CoverProduct::SIZE,
        seeds = [b"cover_product", authority.key().as_ref()],
        bump
    )]
    pub cover_product: Account<'info, CoverProduct>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateCoverProduct<'info> {
    #[account(
        constraint = authority.key() == cover_product.authority,
    )]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"cover_product", authority.key().as_ref()],
        bump = cover_product.bump
    )]
    pub cover_product: Account<'info, CoverProduct>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyCover<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        seeds = [b"cover_state"],
        bump = cover_state.bump
    )]
    pub cover_state: Account<'info, CoverState>,
    
    #[account(
        constraint = cover_product.is_active,
    )]
    pub cover_product: Account<'info, CoverProduct>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + Policy::SIZE,
        seeds = [b"policy", owner.key().as_ref(), cover_product.key().as_ref()],
        bump
    )]
    pub policy: Account<'info, Policy>,
    
    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key(),
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub risk_pool_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// Error codes
#[error_code]
pub enum CoverError {
    #[msg("Program is paused")]
    ProgramPaused,
    
    #[msg("Invalid coverage amount")]
    InvalidCoverageAmount,
    
    #[msg("Invalid period days")]
    InvalidPeriodDays,
    
    #[msg("Product not active")]
    ProductNotActive,
    
    #[msg("Product name too long")]
    ProductNameTooLong,
    
    #[msg("Product description too long")]
    ProductDescriptionTooLong,
    
    #[msg("Cover terms too long")]
    CoverTermsTooLong,
    
    #[msg("Invalid risk factor")]
    InvalidRiskFactor,
    
    #[msg("Invalid premium multiplier")]
    InvalidPremiumMultiplier,
}
