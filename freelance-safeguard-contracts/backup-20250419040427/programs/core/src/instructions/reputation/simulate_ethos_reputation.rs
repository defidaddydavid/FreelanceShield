use anchor_lang::prelude::*;
use crate::state::*;
use crate::FreelanceShieldError;
use crate::interfaces::reputation::ReputationScore;

/// Accounts required for simulating Ethos reputation changes
#[derive(Accounts)]
pub struct SimulateEthosReputation<'info> {
    /// The user whose reputation is being simulated
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

/// Parameters for simulating Ethos reputation changes
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct SimulateEthosReputationParams {
    /// Number of successful transactions to simulate
    pub successful_transactions: u32,
    
    /// Total transaction volume to simulate (in lamports)
    pub transaction_volume: u64,
    
    /// Number of disputes to simulate
    pub disputes: u32,
    
    /// Number of disputes where user was at fault to simulate
    pub disputes_at_fault: u32,
    
    /// Number of claims submitted to simulate
    pub claims_submitted: u32,
    
    /// Number of claims approved to simulate
    pub claims_approved: u32,
    
    /// Optional Privy user ID for Ethos integration
    pub privy_user_id: Option<String>,
}

/// Handler for simulating Ethos reputation changes
pub fn handler(ctx: Context<SimulateEthosReputation>, params: SimulateEthosReputationParams) -> Result<()> {
    let user = &ctx.accounts.user;
    let program_state = &ctx.accounts.program_state;
    
    // Check if Ethos reputation feature is enabled
    require!(
        program_state.feature_flags.use_ethos_reputation,
        FreelanceShieldError::FeatureNotEnabled
    );
    
    // Convert Solana pubkey to Ethos userKey format
    let ethos_user_key = if let Some(privy_id) = &params.privy_user_id {
        // If Privy user ID is provided, use that (aligns with Privy integration)
        format!("privy:{}", privy_id)
    } else {
        // Otherwise use the wallet address
        format!("address:{}", user.key())
    };
    
    // Log the Ethos user key for client-side processing
    msg!("Ethos user key: {}", ethos_user_key);
    
    // Create a simulated reputation score based on the parameters
    let simulated_score = calculate_simulated_score(
        params.successful_transactions,
        params.transaction_volume,
        params.disputes,
        params.disputes_at_fault,
        params.claims_submitted,
        params.claims_approved,
    );
    
    // Log the simulated score components for client-side processing
    msg!("Simulated Ethos reputation score: {}", simulated_score.score);
    msg!("Successful transactions: {}", simulated_score.successful_transactions);
    msg!("Transaction volume: {}", simulated_score.transaction_volume);
    msg!("Disputes: {}", simulated_score.disputes);
    msg!("Disputes at fault: {}", simulated_score.disputes_at_fault);
    msg!("Claims submitted: {}", simulated_score.claims_submitted);
    msg!("Claims approved: {}", simulated_score.claims_approved);
    
    // In a production implementation, this would send the simulated data to Ethos Network
    // for testing purposes
    
    Ok(())
}

/// Calculate a simulated reputation score based on input parameters
fn calculate_simulated_score(
    successful_transactions: u32,
    transaction_volume: u64,
    disputes: u32,
    disputes_at_fault: u32,
    claims_submitted: u32,
    claims_approved: u32,
) -> ReputationScore {
    // Start with a base score of 50
    let mut score = 50;
    
    // Adjust for successful transactions (up to +20 points)
    let tx_factor = successful_transactions.min(100) as u8 / 5;
    score += tx_factor;
    
    // Adjust for transaction volume (up to +10 points)
    let volume_factor = (transaction_volume / 1_000_000).min(10) as u8;
    score += volume_factor;
    
    // Adjust for disputes (negative factor, up to -20 points)
    if disputes > 0 {
        let dispute_ratio = disputes_at_fault as f32 / disputes as f32;
        let dispute_penalty = (dispute_ratio * 20.0) as u8;
        score = score.saturating_sub(dispute_penalty);
    }
    
    // Adjust for claims (up to +10 points if all claims approved, negative if mostly rejected)
    if claims_submitted > 0 {
        let claims_ratio = claims_approved as f32 / claims_submitted as f32;
        let claims_factor = ((claims_ratio * 20.0) - 10.0) as i8; // Range: -10 to +10
        
        if claims_factor > 0 {
            score += claims_factor as u8;
        } else {
            score = score.saturating_sub(claims_factor.abs() as u8);
        }
    }
    
    // Create the reputation score object
    ReputationScore {
        score,
        successful_transactions,
        transaction_volume,
        disputes,
        disputes_at_fault,
        claims_submitted,
        claims_approved,
        account_creation_time: Clock::get().unwrap().unix_timestamp,
        last_update_time: Clock::get().unwrap().unix_timestamp,
    }
}
