// General constants
pub const MAX_NAME_LENGTH: usize = 50;
pub const MAX_DESCRIPTION_LENGTH: usize = 200;
pub const MAX_TERMS_LENGTH: usize = 500;
pub const MAX_REASON_LENGTH: usize = 200;
pub const MAX_PROJECT_DETAILS_LENGTH: usize = 200;
pub const MAX_CLIENT_DETAILS_LENGTH: usize = 200;
pub const MAX_EVIDENCE_HASH_LENGTH: usize = 64;
pub const MAX_EVIDENCE_ATTACHMENTS: usize = 5;
pub const MAX_VOTES: usize = 20;
pub const MAX_CLAIMS_PER_POLICY: usize = 5;

// Default values
pub const DEFAULT_MIN_VOTES_REQUIRED: u8 = 3;
pub const DEFAULT_VOTING_PERIOD_DAYS: u8 = 7;
pub const DEFAULT_CLAIM_PERIOD_DAYS: u16 = 30;
pub const DEFAULT_BASE_PREMIUM_RATE: u16 = 500; // 5% annual rate per 10,000 units of coverage
pub const DEFAULT_RISK_BUFFER_PERCENTAGE: u8 = 20; // 20% buffer for risk calculations
pub const DEFAULT_TARGET_RESERVE_RATIO: u8 = 150; // 150% reserve ratio target
pub const DEFAULT_MIN_COVERAGE_AMOUNT: u64 = 100_000; // 100k minimum coverage
pub const DEFAULT_MAX_COVERAGE_AMOUNT: u64 = 10_000_000; // 10M maximum coverage
pub const DEFAULT_MIN_COVERAGE_PERIOD_DAYS: u16 = 30; // 30 days minimum
pub const DEFAULT_MAX_COVERAGE_PERIOD_DAYS: u16 = 365; // 1 year maximum

// Fee constants
pub const DEFAULT_PROTOCOL_FEE_PERCENTAGE: u8 = 5; // 5% protocol fee
pub const DEFAULT_STAKING_ALLOCATION_PERCENTAGE: u8 = 70; // 70% to stakers
pub const DEFAULT_TREASURY_ALLOCATION_PERCENTAGE: u8 = 30; // 30% to treasury

// Risk constants
pub const DEFAULT_MAX_AUTO_APPROVE_AMOUNT: u64 = 1_000_000; // 1M auto-approve threshold
pub const DEFAULT_CANCELLATION_FEE_PERCENTAGE: u8 = 10; // 10% cancellation fee
