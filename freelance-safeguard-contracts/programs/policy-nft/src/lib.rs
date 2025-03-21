use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_spl::metadata::{
    create_metadata_accounts_v3, 
    CreateMetadataAccountsV3,
    Metadata,
    MetadataProgram
};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::state::{Creator, DataV2, Collection};
use solana_program::program::invoke_signed;

declare_id!("NFTpLcy1UQCJcZBEYzgHNUaehDQoqTuNFWJJdT9eLLRW");

// Define the Insurance Program ID
pub const INSURANCE_PROGRAM_ID: Pubkey = solana_program::pubkey!("37dpkWEmajidF7PKS9v43m2QfTxo7kxxYaEQcAh5c9uD");

#[program]
pub mod policy_nft {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        collection_name: String,
        collection_symbol: String,
        collection_uri: String,
        royalty_basis_points: u16,
    ) -> Result<()> {
        let policy_nft_state = &mut ctx.accounts.policy_nft_state;
        policy_nft_state.authority = ctx.accounts.authority.key();
        policy_nft_state.insurance_program_id = INSURANCE_PROGRAM_ID;
        policy_nft_state.collection_mint = ctx.accounts.collection_mint.key();
        policy_nft_state.total_minted = 0;
        policy_nft_state.royalty_basis_points = royalty_basis_points;
        policy_nft_state.is_paused = false;
        policy_nft_state.bump = *ctx.bumps.get("policy_nft_state").unwrap();
        policy_nft_state.collection_bump = *ctx.bumps.get("collection_mint").unwrap();
        
        // Create collection NFT
        let seeds = &[
            b"policy_nft_state".as_ref(),
            &[policy_nft_state.bump],
        ];
        let signer = &[&seeds[..]];
        
        // Create metadata for collection
        let creators = vec![
            Creator {
                address: policy_nft_state.authority,
                verified: true,
                share: 100,
            }
        ];
        
        let data_v2 = DataV2 {
            name: collection_name,
            symbol: collection_symbol,
            uri: collection_uri,
            seller_fee_basis_points: royalty_basis_points,
            creators: Some(creators),
            collection: None,
            uses: None,
        };
        
        let cpi_accounts = CreateMetadataAccountsV3 {
            metadata: ctx.accounts.collection_metadata.to_account_info(),
            mint: ctx.accounts.collection_mint.to_account_info(),
            mint_authority: ctx.accounts.policy_nft_state.to_account_info(),
            payer: ctx.accounts.authority.to_account_info(),
            update_authority: ctx.accounts.policy_nft_state.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_metadata_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        create_metadata_accounts_v3(
            cpi_ctx,
            data_v2,
            true, // is_mutable
            true, // update_authority_is_signer
            None, // collection_details
        )?;
        
        msg!("Policy NFT program initialized with collection");
        Ok(())
    }

    pub fn mint_policy_nft(
        ctx: Context<MintPolicyNFT>,
        policy_id: Pubkey,
        metadata_name: String,
        metadata_symbol: String,
        metadata_uri: String,
    ) -> Result<()> {
        let policy_nft_state = &ctx.accounts.policy_nft_state;
        let policy_token_account = &mut ctx.accounts.policy_token_account;
        
        // Validate program is not paused
        require!(!policy_nft_state.is_paused, PolicyNFTError::ProgramPaused);
        
        // Validate policy exists and is active (would be a CPI call to insurance program)
        // For now, we'll just log this step
        msg!("Validating policy ID: {}", policy_id);
        
        // Mint NFT to the user
        let seeds = &[
            b"policy_nft_state".as_ref(),
            &[policy_nft_state.bump],
        ];
        let signer = &[&seeds[..]];
        
        // Create metadata for policy NFT
        let creators = vec![
            Creator {
                address: policy_nft_state.authority,
                verified: true,
                share: 100,
            }
        ];
        
        // Create collection info
        let collection = Collection {
            verified: false, // Will be verified in a separate step
            key: policy_nft_state.collection_mint,
        };
        
        let data_v2 = DataV2 {
            name: metadata_name,
            symbol: metadata_symbol,
            uri: metadata_uri,
            seller_fee_basis_points: policy_nft_state.royalty_basis_points,
            creators: Some(creators),
            collection: Some(collection),
            uses: None,
        };
        
        let cpi_accounts = CreateMetadataAccountsV3 {
            metadata: ctx.accounts.metadata.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            mint_authority: ctx.accounts.policy_nft_state.to_account_info(),
            payer: ctx.accounts.owner.to_account_info(),
            update_authority: ctx.accounts.policy_nft_state.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_metadata_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        create_metadata_accounts_v3(
            cpi_ctx,
            data_v2,
            true, // is_mutable
            true, // update_authority_is_signer
            None, // collection_details
        )?;
        
        // Create policy token record
        let policy_token = &mut ctx.accounts.policy_token;
        policy_token.owner = ctx.accounts.owner.key();
        policy_token.policy_id = policy_id;
        policy_token.mint = ctx.accounts.mint.key();
        policy_token.metadata = ctx.accounts.metadata.key();
        policy_token.token_account = policy_token_account.key();
        policy_token.is_active = true;
        policy_token.created_at = Clock::get()?.unix_timestamp;
        policy_token.bump = *ctx.bumps.get("policy_token").unwrap();
        
        // Update state
        let mut policy_nft_state_account = ctx.accounts.policy_nft_state.to_account_info();
        let mut state_data = policy_nft_state_account.try_borrow_mut_data()?;
        let mut state = PolicyNFTState::try_deserialize(&mut &state_data[..])?;
        state.total_minted += 1;
        PolicyNFTState::try_serialize(&state, &mut &mut state_data[..])?;
        
        msg!("Policy NFT minted successfully");
        msg!("NFT Mint: {}", ctx.accounts.mint.key());
        msg!("Policy ID: {}", policy_id);
        
        Ok(())
    }

    pub fn transfer_policy_nft(
        ctx: Context<TransferPolicyNFT>,
    ) -> Result<()> {
        let policy_token = &mut ctx.accounts.policy_token;
        
        // Validate policy token is active
        require!(policy_token.is_active, PolicyNFTError::PolicyTokenInactive);
        
        // Update policy token record with new owner
        policy_token.owner = ctx.accounts.new_owner.key();
        
        // Transfer NFT to new owner
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.from_token_account.to_account_info(),
                to: ctx.accounts.to_token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        );
        
        token::transfer(transfer_ctx, 1)?;
        
        msg!("Policy NFT transferred successfully");
        msg!("New owner: {}", ctx.accounts.new_owner.key());
        
        Ok(())
    }

    pub fn burn_policy_nft(
        ctx: Context<BurnPolicyNFT>,
    ) -> Result<()> {
        let policy_token = &mut ctx.accounts.policy_token;
        
        // Mark policy token as inactive
        policy_token.is_active = false;
        
        // Burn NFT (would implement token burning here)
        // For now, we'll just mark it as inactive
        
        msg!("Policy NFT burned successfully");
        Ok(())
    }

    pub fn update_program_parameters(
        ctx: Context<UpdateProgramParameters>,
        royalty_basis_points: Option<u16>,
        is_paused: Option<bool>,
    ) -> Result<()> {
        let policy_nft_state = &mut ctx.accounts.policy_nft_state;
        
        // Update royalty basis points if provided
        if let Some(royalty) = royalty_basis_points {
            require!(royalty <= 10000, PolicyNFTError::InvalidRoyaltyBasisPoints); // Max 100%
            policy_nft_state.royalty_basis_points = royalty;
        }
        
        // Update pause state if provided
        if let Some(paused) = is_paused {
            policy_nft_state.is_paused = paused;
        }
        
        msg!("Program parameters updated");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + PolicyNFTState::SIZE,
        seeds = [b"policy_nft_state"],
        bump
    )]
    pub policy_nft_state: Account<'info, PolicyNFTState>,
    
    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = policy_nft_state,
        seeds = [b"collection_mint", policy_nft_state.key().as_ref()],
        bump
    )]
    pub collection_mint: Account<'info, Mint>,
    
    /// CHECK: This account is initialized by the metadata program
    #[account(mut)]
    pub collection_metadata: UncheckedAccount<'info>,
    
    pub token_program: Program<'info, Token>,
    /// CHECK: Metaplex Token Metadata Program
    pub token_metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintPolicyNFT<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"policy_nft_state"],
        bump = policy_nft_state.bump
    )]
    pub policy_nft_state: Account<'info, PolicyNFTState>,
    
    #[account(
        init,
        payer = owner,
        mint::decimals = 0,
        mint::authority = policy_nft_state,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = owner,
    )]
    pub policy_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: This account is initialized by the metadata program
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    
    #[account(
        init,
        payer = owner,
        space = 8 + PolicyToken::SIZE,
        seeds = [b"policy_token", mint.key().as_ref()],
        bump
    )]
    pub policy_token: Account<'info, PolicyToken>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: Metaplex Token Metadata Program
    pub token_metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TransferPolicyNFT<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(mut)]
    pub new_owner: SystemAccount<'info>,
    
    #[account(
        mut,
        constraint = policy_token.owner == owner.key(),
    )]
    pub policy_token: Account<'info, PolicyToken>,
    
    #[account(
        mut,
        constraint = from_token_account.mint == policy_token.mint,
        constraint = from_token_account.owner == owner.key(),
    )]
    pub from_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = policy_token.mint,
        associated_token::authority = new_owner,
    )]
    pub to_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BurnPolicyNFT<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        constraint = policy_token.owner == owner.key(),
    )]
    pub policy_token: Account<'info, PolicyToken>,
    
    #[account(
        mut,
        constraint = token_account.mint == policy_token.mint,
        constraint = token_account.owner == owner.key(),
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProgramParameters<'info> {
    #[account(
        constraint = authority.key() == policy_nft_state.authority,
    )]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"policy_nft_state"],
        bump = policy_nft_state.bump
    )]
    pub policy_nft_state: Account<'info, PolicyNFTState>,
    
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(Default)]
pub struct PolicyNFTState {
    pub authority: Pubkey,
    pub insurance_program_id: Pubkey,
    pub collection_mint: Pubkey,
    pub total_minted: u64,
    pub royalty_basis_points: u16,
    pub is_paused: bool,
    pub bump: u8,
    pub collection_bump: u8,
}

impl PolicyNFTState {
    pub const SIZE: usize = 32 + // authority
                            32 + // insurance_program_id
                            32 + // collection_mint
                            8 +  // total_minted
                            2 +  // royalty_basis_points
                            1 +  // is_paused
                            1 +  // bump
                            1;   // collection_bump
}

#[account]
#[derive(Default)]
pub struct PolicyToken {
    pub owner: Pubkey,
    pub policy_id: Pubkey,
    pub mint: Pubkey,
    pub metadata: Pubkey,
    pub token_account: Pubkey,
    pub is_active: bool,
    pub created_at: i64,
    pub bump: u8,
}

impl PolicyToken {
    pub const SIZE: usize = 32 + // owner
                            32 + // policy_id
                            32 + // mint
                            32 + // metadata
                            32 + // token_account
                            1 +  // is_active
                            8 +  // created_at
                            1;   // bump
}

#[error_code]
pub enum PolicyNFTError {
    #[msg("Program is paused")]
    ProgramPaused,
    
    #[msg("Policy token is inactive")]
    PolicyTokenInactive,
    
    #[msg("Invalid royalty basis points")]
    InvalidRoyaltyBasisPoints,
}
