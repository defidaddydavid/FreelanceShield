use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};
use anchor_spl::associated_token::AssociatedToken;

// Module for integrating with Pump.fun minted governance tokens and Meteora liquidity pools

/// Constants for token integration
pub const GOVERNANCE_TOKEN_NAME: &str = "FreelanceShield Governance";
pub const GOVERNANCE_TOKEN_SYMBOL: &str = "FSGOV";

/// Types of liquidity pools supported
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Debug)]
pub enum LiquidityPoolType {
    Meteora,
    Raydium,
    Orca,
    Custom
}

/// Liquidity pool information
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct LiquidityPoolInfo {
    pub pool_type: LiquidityPoolType,
    pub pool_address: Pubkey,
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub total_liquidity: u64,
    pub last_updated: i64,
    pub fee_rate: u16,  // Scaled by 10000 (e.g., 30 = 0.3%)
    pub token_price_usd: u64, // Scaled by 1000000 (6 decimals)
}

/// Metadata for governance token
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct GovernanceTokenMetadata {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub total_supply: u64,
    pub decimals: u8,
    pub pump_fun_id: Option<String>, // Pump.fun token ID if minted there
}

/// Register a new liquidity pool for the governance token
pub fn register_liquidity_pool(
    ctx: Context<RegisterLiquidityPool>, 
    pool_info: &LiquidityPoolInfo
) -> Result<()> {
    let token_registry = &mut ctx.accounts.token_registry;
    
    // Only allow governance authority to register pools
    require!(
        ctx.accounts.authority.key() == token_registry.authority,
        DaoError::Unauthorized
    );
    
    // Check that the token mint matches governance token
    require!(
        pool_info.token_a_mint == token_registry.governance_token_mint || 
        pool_info.token_b_mint == token_registry.governance_token_mint,
        DaoError::InvalidTokenMint
    );
    
    // Add pool to registry
    token_registry.liquidity_pools.push(pool_info.clone());
    token_registry.last_updated = Clock::get()?.unix_timestamp;
    
    msg!("Liquidity pool registered: {}", pool_info.pool_address);
    
    Ok(())
}

/// Update token price from liquidity pool data
pub fn update_token_price(
    ctx: Context<UpdateTokenPrice>,
    new_price: u64,
    pool_index: u8,
) -> Result<()> {
    let token_registry = &mut ctx.accounts.token_registry;
    
    // Only authorized price oracles or admin can update price
    require!(
        ctx.accounts.authority.key() == token_registry.authority || 
        token_registry.price_oracles.contains(&ctx.accounts.authority.key()),
        DaoError::Unauthorized
    );
    
    // Check pool index is valid
    require!(
        pool_index as usize <= token_registry.liquidity_pools.len(),
        DaoError::InvalidPoolIndex
    );
    
    // Update price
    if pool_index as usize == token_registry.liquidity_pools.len() {
        // Update global price (weighted average of all pools)
        token_registry.token_price_usd = new_price;
    } else {
        // Update specific pool price
        token_registry.liquidity_pools[pool_index as usize].token_price_usd = new_price;
    }
    
    token_registry.last_updated = Clock::get()?.unix_timestamp;
    
    msg!("Token price updated: ${}.{:06}", new_price / 1_000_000, new_price % 1_000_000);
    
    Ok(())
}

/// Add a price oracle that can update token prices
pub fn add_price_oracle(
    ctx: Context<ManageOracles>,
    oracle: Pubkey,
) -> Result<()> {
    let token_registry = &mut ctx.accounts.token_registry;
    
    // Only admin can add oracles
    require!(
        ctx.accounts.authority.key() == token_registry.authority,
        DaoError::Unauthorized
    );
    
    // Check if oracle already exists
    require!(
        !token_registry.price_oracles.contains(&oracle),
        DaoError::OracleAlreadyExists
    );
    
    // Add oracle
    token_registry.price_oracles.push(oracle);
    token_registry.last_updated = Clock::get()?.unix_timestamp;
    
    msg!("Price oracle added: {}", oracle);
    
    Ok(())
}

/// Create accounts context for registering liquidity pools
#[derive(Accounts)]
pub struct RegisterLiquidityPool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"token_registry"],
        bump = token_registry.bump
    )]
    pub token_registry: Account<'info, TokenRegistry>,
    
    pub system_program: Program<'info, System>,
}

/// Create accounts context for updating token price
#[derive(Accounts)]
pub struct UpdateTokenPrice<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"token_registry"],
        bump = token_registry.bump
    )]
    pub token_registry: Account<'info, TokenRegistry>,
}

/// Create accounts context for managing price oracles
#[derive(Accounts)]
pub struct ManageOracles<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"token_registry"],
        bump = token_registry.bump
    )]
    pub token_registry: Account<'info, TokenRegistry>,
}

/// Initialize a token registry
#[derive(Accounts)]
pub struct InitializeTokenRegistry<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + TokenRegistry::SIZE,
        seeds = [b"token_registry"],
        bump
    )]
    pub token_registry: Account<'info, TokenRegistry>,
    
    pub governance_token_mint: Account<'info, Mint>,
    
    pub system_program: Program<'info, System>,
}

/// Token registry account structure
#[account]
#[derive(Default)]
pub struct TokenRegistry {
    pub authority: Pubkey,
    pub governance_token_mint: Pubkey,
    pub liquidity_pools: Vec<LiquidityPoolInfo>,
    pub price_oracles: Vec<Pubkey>,
    pub token_price_usd: u64,
    pub metadata: Option<GovernanceTokenMetadata>,
    pub last_updated: i64,
    pub bump: u8,
}

impl TokenRegistry {
    pub const SIZE: usize = 32 + // authority
                           32 + // governance_token_mint
                           4 + (10 * (32 + 32 + 32 + 32 + 8 + 8 + 2 + 8)) + // liquidity_pools (vec with capacity for 10 pools)
                           4 + (5 * 32) + // price_oracles (vec with capacity for 5 oracles)
                           8 + // token_price_usd
                           1 + (32 + 8 + 8 + 200 + 8 + 1) + // metadata (option)
                           8 + // last_updated
                           1; // bump
}

#[error_code]
pub enum DaoError {
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    
    #[msg("Invalid pool index")]
    InvalidPoolIndex,
    
    #[msg("Oracle already exists")]
    OracleAlreadyExists,
    
    #[msg("Invalid price update")]
    InvalidPriceUpdate,
}
