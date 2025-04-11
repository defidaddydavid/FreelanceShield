use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;
use crate::utils::*;

// Initialize a new risk assessment account for a user
pub fn initialize_risk_assessment(
    ctx: Context<InitializeRiskAssessment>,
) -> Result<()> {
    let risk_assessment = &mut ctx.accounts.risk_assessment;
    let user = &ctx.accounts.user;
    let identity = &ctx.accounts.identity;
    let clock = Clock::get()?;
    
    // Set up the risk assessment account
    risk_assessment.user = user.key();
    risk_assessment.overall_risk_score = 0;
    risk_assessment.risk_factors = Vec::new();
    risk_assessment.last_updated = clock.unix_timestamp;
    
    // Default coverage limit based on verification level
    let base_coverage_limit: u64 = match identity.verification_level {
        VerificationLevel::Basic => 100_000,        // 100K token units
        VerificationLevel::Intermediate => 500_000, // 500K token units
        VerificationLevel::Advanced => 1_000_000,   // 1M token units
        VerificationLevel::Premium => 5_000_000,    // 5M token units
    };
    
    risk_assessment.coverage_limit = base_coverage_limit;
    
    // Default waiting period based on verification level
    risk_assessment.waiting_period_days = match identity.verification_level {
        VerificationLevel::Basic => 14,        // 2 weeks
        VerificationLevel::Intermediate => 7,  // 1 week
        VerificationLevel::Advanced => 3,      // 3 days
        VerificationLevel::Premium => 1,       // 1 day
    };
    
    risk_assessment.created_at = clock.unix_timestamp;
    risk_assessment.bump = *ctx.bumps.get("risk_assessment").unwrap();
    
    msg!("Risk assessment initialized for user: {}", user.key());
    Ok(())
}

// Update a user's risk score based on new data
pub fn update_risk_score(
    ctx: Context<UpdateRiskScore>,
    risk_factor: RiskFactor,
    value: i32,
) -> Result<()> {
    let risk_assessment = &mut ctx.accounts.risk_assessment;
    let auth_program = &ctx.accounts.auth_program;
    let clock = Clock::get()?;
    
    // Verify that the calling program is authorized to update risk scores
    if !is_authorized_program(auth_program.key()) {
        return Err(error!(FraudPreventionError::UnauthorizedProgram));
    }
    
    // Find if this risk factor already exists
    let factor_index = risk_assessment.risk_factors.iter()
        .position(|f| f.factor as u8 == risk_factor as u8);
    
    if let Some(index) = factor_index {
        // Update existing risk factor
        risk_assessment.risk_factors[index].score = value;
        risk_assessment.risk_factors[index].last_updated = clock.unix_timestamp;
    } else {
        // Add new risk factor
        if risk_assessment.risk_factors.len() >= RiskAssessment::MAX_RISK_FACTORS {
            return Err(error!(FraudPreventionError::MaxVerificationsReached));
        }
        
        let new_factor = RiskFactorScore {
            factor: risk_factor,
            score: value,
            last_updated: clock.unix_timestamp,
        };
        
        risk_assessment.risk_factors.push(new_factor);
    }
    
    // Recalculate overall risk score
    risk_assessment.overall_risk_score = calculate_overall_risk_score(&risk_assessment.risk_factors);
    
    // Update coverage limit based on new risk score
    risk_assessment.coverage_limit = calculate_coverage_limit(
        risk_assessment.overall_risk_score,
        risk_assessment.coverage_limit // Use current limit as base
    );
    
    // Update waiting period based on new risk score
    risk_assessment.waiting_period_days = calculate_waiting_period(risk_assessment.overall_risk_score);
    
    // Update last updated timestamp
    risk_assessment.last_updated = clock.unix_timestamp;
    
    msg!("Risk factor updated: {:?} = {}", risk_factor, value);
    msg!("New overall risk score: {}", risk_assessment.overall_risk_score);
    Ok(())
}

// Context for initializing a risk assessment
#[derive(Accounts)]
pub struct InitializeRiskAssessment<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        seeds = [b"identity", user.key().as_ref()],
        bump,
    )]
    pub identity: Account<'info, IdentityAccount>,
    
    #[account(
        init,
        payer = user,
        space = RiskAssessment::space(),
        seeds = [b"risk", user.key().as_ref()],
        bump,
    )]
    pub risk_assessment: Account<'info, RiskAssessment>,
    
    pub system_program: Program<'info, System>,
}

// Context for updating risk score
#[derive(Accounts)]
pub struct UpdateRiskScore<'info> {
    /// The program authorized to update risk scores
    pub auth_program: Signer<'info>,
    
    /// CHECK: The user whose risk is being assessed
    pub user: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"risk", user.key().as_ref()],
        bump = risk_assessment.bump,
    )]
    pub risk_assessment: Account<'info, RiskAssessment>,
}
