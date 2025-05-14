use anchor_lang::prelude::*;

#[error_code]
pub enum FreelanceShieldError {
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Invalid parameters")]
    InvalidParameters,
    
    #[msg("Insufficient funds")]
    InsufficientFunds,
    
    #[msg("Policy not active")]
    PolicyNotActive,
    
    #[msg("Policy expired")]
    PolicyExpired,
    
    #[msg("Policy already exists")]
    PolicyAlreadyExists,
    
    #[msg("Claim not found")]
    ClaimNotFound,
    
    #[msg("Claim already processed")]
    ClaimAlreadyProcessed,
    
    #[msg("Invalid claim status")]
    InvalidClaimStatus,
    
    #[msg("Invalid product status")]
    InvalidProductStatus,
    
    #[msg("Product not found")]
    ProductNotFound,
    
    #[msg("Risk pool not found")]
    RiskPoolNotFound,
    
    #[msg("Insufficient risk pool funds")]
    InsufficientRiskPoolFunds,
    
    #[msg("Invalid risk parameters")]
    InvalidRiskParameters,
    
    #[msg("Timelock not expired")]
    TimelockNotExpired,
    
    #[msg("Reentrancy detected")]
    ReentrancyDetected,
    
    #[msg("Item already exists")]
    AlreadyExists,
    
    #[msg("Item not found")]
    NotFound,
    
    #[msg("Invalid feature flag")]
    InvalidFeature,
    
    #[msg("Feature not enabled")]
    FeatureNotEnabled,
    
    #[msg("Invalid authentication")]
    InvalidAuthentication,
    
    #[msg("Unsupported authentication provider")]
    UnsupportedAuthProvider,
    
    #[msg("Invalid reputation provider")]
    InvalidReputationProvider,
    
    #[msg("External service error")]
    ExternalServiceError,
    
    #[msg("Cross-program invocation error")]
    CrossProgramInvocationError,
    
    #[msg("Serialization error")]
    SerializationError,
    
    #[msg("Deserialization error")]
    DeserializationError,
    
    #[msg("Invalid coverage amount")]
    InvalidCoverageAmount,
    
    #[msg("Insufficient premium amount")]
    InsufficientPremiumAmount,
    
    #[msg("Invalid risk parameter")]
    InvalidRiskParameter,
    
    #[msg("Cross-program invocation failed")]
    CrossProgramInvocationFailed,
}

/// Helper function to create a custom error for Borsh serialization failures
pub fn borsh_serialization_error() -> Error {
    error!(FreelanceShieldError::SerializationError)
}

/// Helper function to create a custom error for Borsh deserialization failures
pub fn borsh_deserialization_error() -> Error {
    error!(FreelanceShieldError::DeserializationError)
}

/// Helper function to create a custom error for CPI failures
pub fn cpi_error(msg: &str) -> Error {
    msg!("CPI Error: {}", msg);
    error!(FreelanceShieldError::CrossProgramInvocationFailed)
}

/// Helper function to validate risk calculation parameters
pub fn validate_risk_params(
    coverage_amount: u64, 
    premium_amount: u64, 
    risk_factor: u8
) -> Result<()> {
    if coverage_amount == 0 {
        return Err(error!(FreelanceShieldError::InvalidCoverageAmount));
    }
    
    if premium_amount == 0 {
        return Err(error!(FreelanceShieldError::InsufficientPremiumAmount));
    }
    
    if risk_factor > 100 {
        return Err(error!(FreelanceShieldError::InvalidRiskParameter));
    }
    
    Ok(())
}

/// Helper function to calculate risk metrics
pub fn calculate_risk_metrics(
    total_capital: u64,
    total_coverage_liability: u64,
    total_premiums_collected: u64,
    total_claims_paid: u64,
) -> Result<(u64, u16)> {
    // Prevent division by zero
    if total_coverage_liability == 0 {
        return Ok((100, 0));
    }
    
    // Calculate reserve ratio (total_capital / total_coverage_liability) * 100
    let reserve_ratio = if total_coverage_liability > 0 {
        ((total_capital as u128 * 100) / total_coverage_liability as u128) as u64
    } else {
        100 // Default to 100% if no liabilities
    };
    
    // Calculate premium to claims ratio
    let premium_to_claims_ratio = if total_claims_paid > 0 && total_premiums_collected > 0 {
        ((total_premiums_collected as u128 * 100) / total_claims_paid as u128) as u16
    } else {
        100 // Default to 100% if no claims or premiums
    };
    
    Ok((reserve_ratio, premium_to_claims_ratio))
}
