use anchor_lang::prelude::*;
use crate::state::common::*;

/// Maximum length for product name
pub const MAX_PRODUCT_NAME_LENGTH: usize = 64;
/// Maximum length for product description
pub const MAX_PRODUCT_DESCRIPTION_LENGTH: usize = 256;
/// Maximum length for cover terms
pub const MAX_COVER_TERMS_LENGTH: usize = 1024;

/// Insurance product definition
#[account]
#[derive(Default)]
pub struct Product {
    /// Authority that manages this product
    pub authority: Pubkey,
    /// Product name
    pub product_name: String,
    /// Product description
    pub product_description: String,
    /// Type of product
    pub product_type: ProductType,
    /// Risk factor (0-100)
    pub risk_factor: u8,
    /// Premium multiplier (x100)
    pub premium_multiplier: u16,
    /// Minimum stake to capital ratio required for this product
    pub min_stake_to_capital_ratio: u8,
    /// Detailed insurance terms and conditions
    pub cover_terms: String,
    /// Number of active policies using this product
    pub active_policies: u64,
    /// Total coverage amount for this product
    pub total_coverage: u64,
    /// Total premiums collected for this product
    pub total_premiums: u64,
    /// Whether the product is active
    pub is_active: bool,
    /// Creation timestamp
    pub created_at: i64,
    /// Last updated timestamp
    pub last_updated: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl Product {
    pub const SEED_PREFIX: &'static [u8] = b"product";
    
    pub const SIZE: usize = 8 + // discriminator
        32 + // authority
        (4 + MAX_PRODUCT_NAME_LENGTH) + // product_name (string)
        (4 + MAX_PRODUCT_DESCRIPTION_LENGTH) + // product_description (string)
        1 + // product_type (enum)
        1 + // risk_factor
        2 + // premium_multiplier
        1 + // min_stake_to_capital_ratio
        (4 + MAX_COVER_TERMS_LENGTH) + // cover_terms (string)
        8 + // active_policies
        8 + // total_coverage
        8 + // total_premiums
        1 + // is_active
        8 + // created_at
        8 + // last_updated
        1;  // bump
}

/// Parameters for creating a new insurance product
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateProductParams {
    /// Product name
    pub product_name: String,
    /// Product description
    pub product_description: String,
    /// Type of product
    pub product_type: ProductType,
    /// Risk factor (0-100)
    pub risk_factor: u8,
    /// Premium multiplier (x100)
    pub premium_multiplier: u16,
    /// Minimum stake to capital ratio required for this product
    pub min_stake_to_capital_ratio: u8,
    /// Detailed insurance terms and conditions
    pub cover_terms: String,
}

/// Parameters for updating an insurance product
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateProductParams {
    /// Optional updated product description
    pub product_description: Option<String>,
    /// Optional updated risk factor
    pub risk_factor: Option<u8>,
    /// Optional updated premium multiplier
    pub premium_multiplier: Option<u16>,
    /// Optional updated minimum stake to capital ratio
    pub min_stake_to_capital_ratio: Option<u8>,
    /// Optional updated cover terms
    pub cover_terms: Option<String>,
    /// Optional updated active status
    pub is_active: Option<bool>,
}
