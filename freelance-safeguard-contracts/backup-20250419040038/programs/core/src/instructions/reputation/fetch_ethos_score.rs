use anchor_lang::prelude::*;
use crate::state::*;
use crate::FreelanceShieldError;
use crate::interfaces::reputation::ReputationScore;
use crate::adapters::ethos_reputation_provider::EthosReputationProvider;

/// Accounts required for fetching a user's Ethos reputation score
#[derive(Accounts)]
pub struct FetchEthosScore<'info> {
    /// The user whose reputation score is being fetched
    pub user: Signer<'info>,
    
    /// Program state PDA
    #[account(
        seeds = [ProgramState::SEED_PREFIX],
        bump = program_state.bump,
    )]
    pub program_state: Account<'info, ProgramState>,
    
    /// System program
    pub system_program: Program<'info, System>,
}

/// Parameters for fetching an Ethos reputation score
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct FetchEthosScoreParams {
    /// Optional external user ID (for Privy integration)
    pub external_user_id: Option<String>,
}

/// Handler for fetching a user's Ethos reputation score
pub fn handler(ctx: Context<FetchEthosScore>, params: FetchEthosScoreParams) -> Result<()> {
    let user = &ctx.accounts.user;
    let program_state = &ctx.accounts.program_state;
    
    // Check if Ethos reputation feature is enabled
    require!(
        program_state.feature_flags.use_ethos_reputation,
        FreelanceShieldError::FeatureNotEnabled
    );
    
    // Convert Solana pubkey to Ethos userKey format
    let ethos_user_key = if let Some(external_id) = params.external_user_id {
        // If external user ID is provided (e.g., from Privy), use that
        format!("privy:{}", external_id)
    } else {
        // Otherwise use the wallet address
        format!("address:{}", user.key())
    };
    
    // Log the Ethos user key for client-side processing
    msg!("Ethos user key: {}", ethos_user_key);
    
    // Fetch the reputation score from Ethos
    // In a real implementation, this would make a cross-chain call to Ethos Network
    // For now, we'll use our adapter's simulate_ethos_score function
    let score = EthosReputationProvider::get_reputation_score(&user.key())?;
    
    // Log the score for client-side processing
    msg!("Ethos reputation score: {}", score);
    
    // In a production implementation, you would also fetch and log additional reputation data
    // such as score components, history, etc.
    
    Ok(())
}
