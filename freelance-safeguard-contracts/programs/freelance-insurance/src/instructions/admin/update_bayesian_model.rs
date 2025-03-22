use anchor_lang::prelude::*;
use crate::state::*;
use crate::utils::math;
use crate::InsuranceError;

#[derive(Accounts)]
pub struct UpdateBayesianModel<'info> {
    #[account(
        mut,
        constraint = insurance_state.authority == authority.key() @ InsuranceError::Unauthorized
    )]
    pub insurance_state: Account<'info, InsuranceState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

/// Updates the Bayesian model parameters based on claims data
/// This instruction should be called periodically to improve the risk model
pub fn handler(ctx: Context<UpdateBayesianModel>) -> Result<()> {
    let insurance_state = &mut ctx.accounts.insurance_state;
    let clock = Clock::get()?;
    
    // Only allow updates if enough time has passed since the last update (at least 1 day)
    let min_update_interval = 86400; // 1 day in seconds
    let time_since_last_update = clock.unix_timestamp - insurance_state.bayesian_parameters.last_update_timestamp;
    
    require!(
        time_since_last_update >= min_update_interval || 
        insurance_state.bayesian_parameters.last_update_timestamp == 0,
        InsuranceError::TooFrequentUpdate
    );
    
    // Initialize Bayesian parameters if this is the first update
    if insurance_state.bayesian_parameters.last_update_timestamp == 0 {
        initialize_bayesian_parameters(&mut insurance_state.bayesian_parameters);
    }
    
    // Update the last update timestamp
    insurance_state.bayesian_parameters.last_update_timestamp = clock.unix_timestamp;
    
    Ok(())
}

/// Initializes Bayesian parameters with reasonable defaults
fn initialize_bayesian_parameters(bayesian_parameters: &mut BayesianParameters) {
    // Set default prior probabilities for each job type and industry combination
    for i in 0..JOB_TYPES_COUNT {
        for j in 0..INDUSTRIES_COUNT {
            let index = i * INDUSTRIES_COUNT + j;
            
            // Set default prior probability based on job type and industry
            // Higher risk combinations get higher prior probabilities
            let base_probability = 100; // 1.00%
            let job_risk_factor = match i {
                0 => 0.8,  // SoftwareDevelopment (lower risk)
                1 => 0.9,  // Design
                2 => 0.9,  // Writing
                3 => 1.1,  // Marketing
                4 => 1.2,  // Consulting
                _ => 1.2,  // Other (higher risk)
            };
            
            let industry_risk_factor = match j {
                0 => 0.9,  // Technology (lower risk)
                1 => 1.2,  // Healthcare
                2 => 1.3,  // Finance
                3 => 0.9,  // Education
                4 => 1.1,  // Retail
                5 => 1.1,  // Entertainment
                _ => 1.2,  // Other (higher risk)
            };
            
            // Calculate combined risk factor
            let combined_factor = job_risk_factor * industry_risk_factor;
            
            // Set prior probability
            bayesian_parameters.prior_probabilities[index] = (base_probability as f64 * combined_factor) as u16;
        }
    }
    
    // Set default likelihood parameters for different claims history buckets
    bayesian_parameters.likelihood_parameters[0] = 50;  // 0 claims: 0.50% (low risk)
    bayesian_parameters.likelihood_parameters[1] = 100; // 1 claim: 1.00%
    bayesian_parameters.likelihood_parameters[2] = 200; // 2 claims: 2.00%
    bayesian_parameters.likelihood_parameters[3] = 400; // 3-4 claims: 4.00%
    bayesian_parameters.likelihood_parameters[4] = 800; // 5+ claims: 8.00% (high risk)
    
    // Initialize counters
    bayesian_parameters.total_policies_processed = 0;
    bayesian_parameters.total_claims_processed = 0;
}
