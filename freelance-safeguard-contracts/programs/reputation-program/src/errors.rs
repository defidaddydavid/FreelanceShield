use anchor_lang::prelude::*;

#[error_code]
pub enum ReputationError {
    #[msg("Caller is not authorized to perform this action")]
    Unauthorized,
    #[msg("Profile not found")]
    ProfileNotFound,
    #[msg("Maximum history exceeded")]
    MaxHistoryExceeded,
}
