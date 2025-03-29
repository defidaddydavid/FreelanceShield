use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::metadata::{
    create_metadata_accounts_v3,
    CreateMetadataAccountsV3,
    Metadata,
};
use crate::state::*;
use crate::FreelanceShieldError;

/// Accounts for tokenizing an insurance policy as an NFT
#[derive(Accounts)]
pub struct TokenizePolicy<'info> {
    /// Policy owner
    #[account(
        mut,
        constraint = policy.owner == owner.key() @ FreelanceShieldError::Unauthorized
    )]
    pub owner: Signer<'info>,
    
    /// Program state PDA
    #[account(
        seeds = [ProgramState::SEED_PREFIX],
        bump = program_state.bump,
        constraint = !program_state.is_paused @ FreelanceShieldError::ProgramPaused
    )]
    pub program_state: Account<'info, ProgramState>,
    
    /// Product account PDA
    #[account(
        seeds = [Product::SEED_PREFIX, &policy.product_id.to_bytes()],
        bump
    )]
    pub product: Account<'info, Product>,
    
    /// Policy account PDA
    #[account(
        mut,
        seeds = [
            Policy::SEED_PREFIX, 
            policy.owner.as_ref(),
            policy.product_id.as_ref()
        ],
        bump = policy.bump,
        constraint = policy.status == PolicyStatus::Active @ FreelanceShieldError::PolicyNotActive,
        constraint = policy.nft_mint.is_none() @ FreelanceShieldError::PolicyAlreadyTokenized
    )]
    pub policy: Account<'info, Policy>,
    
    /// NFT mint account
    #[account(
        init,
        payer = owner,
        mint::decimals = 0,
        mint::authority = policy_authority,
        mint::freeze_authority = policy_authority
    )]
    pub nft_mint: Account<'info, Mint>,
    
    /// Policy authority PDA
    #[account(
        seeds = [
            b"policy_authority",
            policy.key().as_ref()
        ],
        bump
    )]
    /// CHECK: This is a PDA used as the mint authority
    pub policy_authority: AccountInfo<'info>,
    
    /// Owner's token account for the NFT
    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = nft_mint,
        associated_token::authority = owner
    )]
    pub owner_token_account: Account<'info, TokenAccount>,
    
    /// Metadata account for the NFT
    /// CHECK: Account will be created via CPI to token metadata program
    pub metadata_account: AccountInfo<'info>,
    
    /// Token metadata program
    /// CHECK: This is the token metadata program
    pub token_metadata_program: AccountInfo<'info>,
    
    /// Token program
    pub token_program: Program<'info, Token>,
    
    /// Associated token program
    pub associated_token_program: Program<'info, AssociatedToken>,
    
    /// System program
    pub system_program: Program<'info, System>,
    
    /// Rent sysvar
    pub rent: Sysvar<'info, Rent>,
}

/// Tokenize an insurance policy as an NFT
pub fn handler(ctx: Context<TokenizePolicy>) -> Result<()> {
    let policy = &mut ctx.accounts.policy;
    let product = &ctx.accounts.product;
    
    // Create metadata for the NFT
    let seeds = &[
        b"policy_authority".as_ref(),
        policy.key().as_ref(),
        &[*ctx.bumps.get("policy_authority").unwrap()]
    ];
    let signer = &[&seeds[..]];
    
    // Create policy metadata
    let name = format!("FreelanceShield Policy #{}", policy.key().to_string()[0..8].to_string());
    let symbol = "FSPOL".to_string();
    let uri = format!("https://freelanceshield.io/policy/{}", policy.key());
    
    // Create metadata accounts via CPI
    let cpi_accounts = CreateMetadataAccountsV3 {
        metadata: ctx.accounts.metadata_account.to_account_info(),
        mint: ctx.accounts.nft_mint.to_account_info(),
        mint_authority: ctx.accounts.policy_authority.to_account_info(),
        payer: ctx.accounts.owner.to_account_info(),
        update_authority: ctx.accounts.policy_authority.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        rent: ctx.accounts.rent.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_metadata_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
    create_metadata_accounts_v3(
        cpi_ctx,
        name,
        symbol,
        uri,
        None,                // creators
        0,                   // seller fee basis points
        true,                // update authority is signer
        true,                // is mutable
        None,                // collection
        None,                // uses
        None,                // collection details
    )?;
    
    // Mint one token to the owner
    let cpi_accounts = token::MintTo {
        mint: ctx.accounts.nft_mint.to_account_info(),
        to: ctx.accounts.owner_token_account.to_account_info(),
        authority: ctx.accounts.policy_authority.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
    token::mint_to(cpi_ctx, 1)?;
    
    // Update policy with NFT mint
    policy.nft_mint = Some(ctx.accounts.nft_mint.key());
    
    msg!("Policy tokenized as NFT: {}", ctx.accounts.nft_mint.key());
    Ok(())
}

