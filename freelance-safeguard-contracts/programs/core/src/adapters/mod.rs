pub mod solana_reputation_provider;
pub mod ethos_reputation_provider;
pub mod privy_auth_provider;
pub mod solana_auth_provider;

// Re-export adapters for easier imports
pub use solana_reputation_provider::*;
pub use ethos_reputation_provider::*;
pub use privy_auth_provider::*;
pub use solana_auth_provider::*;

// Factory function to get the appropriate reputation provider based on feature flags
pub fn get_reputation_provider() -> Box<dyn crate::interfaces::reputation::ReputationProvider> {
    // Check program state to determine which provider to use
    if let Ok(program_state) = crate::state::program_state::get_program_state() {
        if program_state.feature_flags.use_ethos_reputation {
            return Box::new(ethos_reputation_provider::EthosReputationProvider);
        }
    }
    
    // Default to on-chain Solana reputation
    Box::new(solana_reputation_provider::SolanaReputationProvider)
}

// Factory function to get the appropriate authentication provider based on feature flags
pub fn get_auth_provider() -> Box<dyn crate::interfaces::authentication::AuthenticationProvider> {
    // Check program state to determine which provider to use
    if let Ok(program_state) = crate::state::program_state::get_program_state() {
        if program_state.feature_flags.use_privy_auth {
            return Box::new(privy_auth_provider::PrivyAuthProvider);
        }
    }
    
    // Default to standard Solana authentication
    Box::new(solana_auth_provider::SolanaAuthProvider)
}
