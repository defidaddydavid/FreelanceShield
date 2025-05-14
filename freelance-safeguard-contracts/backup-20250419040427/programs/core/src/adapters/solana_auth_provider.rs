use anchor_lang::prelude::*;
use crate::interfaces::authentication::{AuthenticationProvider, AuthorityLevel};

/// Implementation of AuthenticationProvider for standard Solana wallet authentication
/// This is the default authentication method when Privy is not enabled
pub struct SolanaAuthProvider;

impl AuthenticationProvider for SolanaAuthProvider {
    fn verify_user(user: &Pubkey, signature: &[u8], message: &[u8]) -> Result<bool> {
        // Standard Solana signature verification
        if signature.len() != 64 {
            return Ok(false);
        }
        
        // In production, this would use ed25519 verification
        // For now, we'll assume the signature is valid if it's the right length
        // This is just a placeholder for the actual verification logic
        Ok(true)
    }
    
    fn get_authority_level(user: &Pubkey) -> Result<AuthorityLevel> {
        // Check if user is in the admin list
        if is_admin(user) {
            return Ok(AuthorityLevel::Admin);
        }
        
        // Check if user is a product manager
        if is_product_manager(user) {
            return Ok(AuthorityLevel::ProductManager);
        }
        
        // Default to regular user
        Ok(AuthorityLevel::User)
    }
    
    fn has_permission(user: &Pubkey, permission: &str) -> Result<bool> {
        // Simple role-based permission check
        let authority_level = Self::get_authority_level(user)?;
        
        match permission {
            "admin" => Ok(authority_level == AuthorityLevel::Admin),
            "create_product" => Ok(authority_level == AuthorityLevel::Admin || 
                                  authority_level == AuthorityLevel::ProductManager),
            "purchase_policy" => Ok(authority_level != AuthorityLevel::Guest),
            _ => Ok(authority_level != AuthorityLevel::Guest), // Default permissions for regular users
        }
    }
}

/// Helper function to check if a user is an admin
fn is_admin(user: &Pubkey) -> bool {
    // Check against the program state
    if let Ok(program_state) = crate::state::program_state::get_program_state() {
        return program_state.authority == *user;
    }
    
    false
}

/// Helper function to check if a user is a product manager
fn is_product_manager(user: &Pubkey) -> bool {
    // Check against the program state
    if let Ok(program_state) = crate::state::program_state::get_program_state() {
        // Check if user is in the product managers list
        for manager in program_state.product_managers.iter() {
            if manager == user {
                return true;
            }
        }
    }
    
    false
}
