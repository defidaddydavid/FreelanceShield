/// Constants for FreelanceShield domain integration
/// To be included in various programs as needed

/// FreelanceShield protocol domain - used for treasury and payments
pub const PROTOCOL_DOMAIN: &str = "freelanceshield.xyz";

/// Seeds used to derive the domain validation PDA
pub const DOMAIN_VALIDATION_SEED: &str = "domain-validation";

/// Seeds used to derive the treasury PDA
pub const TREASURY_SEED: &str = "treasury";

/// Maximum domain length to validate against
pub const MAX_DOMAIN_LENGTH: usize = 64;

/// Treasury wallet address (for development and testing)
/// This should match the address configured on freelanceshield.xyz
pub const TREASURY_WALLET_ADDRESS: &str = "5dDo2hJ2PKH1XhRzzCgZhX5SDKBypr3crrx3TfwjPosE";
