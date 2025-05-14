use anchor_lang::prelude::*;

/// AuthenticationProvider trait defines the interface for wallet authentication systems
/// This abstraction allows switching between different authentication implementations
/// (e.g., standard Solana wallet adapter or Privy)
pub trait AuthenticationProvider {
    /// Verify a user's identity
    fn verify_user(user: &Pubkey, signature: &[u8], message: &[u8]) -> Result<bool>;
    
    /// Get the authority level for a user
    fn get_authority_level(user: &Pubkey) -> Result<AuthorityLevel>;
    
    /// Check if a user has permissions for a specific action
    fn has_permission(user: &Pubkey, permission: &str) -> Result<bool>;
}

/// Authority levels in the system
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum AuthorityLevel {
    /// System administrator with full access
    Admin,
    /// Product manager who can create and manage products
    ProductManager,
    /// Regular user with standard permissions
    User,
    /// Guest with limited access
    Guest,
}

/// Authentication context for instruction handlers
#[derive(Clone)]
pub struct AuthContext<'info> {
    /// The authenticated user
    pub user: &'info Signer<'info>,
    /// The authority level of the user
    pub authority_level: AuthorityLevel,
    /// Additional authentication metadata
    pub metadata: Option<AuthMetadata>,
}

/// Additional authentication metadata
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct AuthMetadata {
    /// Authentication provider (e.g., "privy", "solana-wallet")
    pub provider: String,
    /// User identifier in the provider's system
    pub provider_user_id: String,
    /// Whether the user is using an embedded wallet
    pub is_embedded_wallet: bool,
    /// Authentication method used (e.g., "social", "wallet", "email")
    pub auth_method: String,
    /// Timestamp of authentication
    pub auth_time: i64,
}
