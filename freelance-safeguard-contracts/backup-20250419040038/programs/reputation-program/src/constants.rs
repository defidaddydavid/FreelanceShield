use anchor_lang::prelude::*;

// Define program IDs for cross-program invocation (originally in lib.rs)
pub const INSURANCE_PROGRAM_ID: Pubkey = anchor_lang::solana_program::pubkey!("2vFoxWTSRERwtcfwEb6Zgm2iWS3ewU1Y94K224Gw7CJm");
pub const ESCROW_PROGRAM_ID: Pubkey = anchor_lang::solana_program::pubkey!("EcThA7tgAKLgjQnXQBgf7mBFXKRbLbCMPqggTSvVZdHU");

// Constants for reputation calculations
pub const MIN_REPUTATION_SCORE: u8 = 0;
pub const MAX_REPUTATION_SCORE: u8 = 100;
pub const DEFAULT_INITIAL_SCORE: u8 = 70;

// Constants for reputation factor calculations
pub const MIN_REPUTATION_FACTOR: u8 = 70;
pub const MAX_REPUTATION_FACTOR: u8 = 100;

// Constants for history size limitations
pub const MAX_HISTORY_ENTRIES: usize = 10;
pub const MAX_ACTIVITY_ENTRIES: usize = 5;

// Weights for different components in reputation calculation
pub const SUCCESSFUL_CONTRACT_WEIGHT: f32 = 0.5;
pub const DISPUTED_CONTRACT_WEIGHT: f32 = 0.2;
pub const CLAIMS_SUBMITTED_WEIGHT: f32 = 0.1;
pub const CLAIMS_APPROVED_WEIGHT: f32 = 0.1;
pub const CLAIMS_REJECTED_WEIGHT: f32 = 0.1;

