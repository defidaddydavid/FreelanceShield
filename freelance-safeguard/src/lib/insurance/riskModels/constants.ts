import { RISK_WEIGHTS } from '@/lib/solana/constants';

// Weighted Reputation Index (WRI) calculation constants
export const WRI_WEIGHTS = {
  TRANSACTION_FREQUENCY: 0.3,
  WALLET_AGE: 0.2,
  CLIENT_VERIFICATIONS: 0.2,
  ESCROW_USAGE: 0.15,
  DISPUTE_RESOLUTION: 0.1,
  ACTIVITY_TREND: 0.05
};

// Time-based decay constants for risk factors
export const TIME_DECAY_CONSTANTS = {
  HALF_LIFE_DAYS: 180, // 6 months half-life for negative factors
  MAX_DECAY_FACTOR: 0.8 // Maximum amount that can be decayed (20% minimum impact)
};

// Stable Reserve-to-Premium Ratio thresholds
export const SRPR_THRESHOLDS = {
  MIN_THRESHOLD: 1.2,
  MAX_THRESHOLD: 1.5,
  CRITICAL_THRESHOLD: 1.1, // Emergency threshold for solvency protection
  TARGET_RATIO: 1.35 // Ideal ratio for system stability
};

// Freelancer Income Volatility Factor constants
export const FIVF_CONSTANTS = {
  BASE_VOLATILITY: 1.0,
  HIGH_VOLATILITY_THRESHOLD: 0.3,
  LOW_VOLATILITY_THRESHOLD: 0.1,
  HIGH_VOLATILITY_MULTIPLIER: 1.3,
  LOW_VOLATILITY_MULTIPLIER: 0.9,
  TREND_WEIGHT: 0.25 // Weight for trend analysis vs. absolute volatility
};

// Monte Carlo simulation constants
export const MONTE_CARLO_CONSTANTS = {
  HIGH_RISK_DECILE_MULTIPLIER: 1.3,
  LOW_RISK_DECILE_MULTIPLIER: 0.8,
  SIMULATION_COUNT: 10000,
  VARIANCE_WEIGHT_FACTORS: {
    JOB_TYPE: 0.25,
    INDUSTRY: 0.20,
    WALLET_AGE: 0.15,
    TRANSACTION_HISTORY: 0.20,
    REPUTATION: 0.20
  },
  CORRELATION_MATRIX: {
    // Correlation coefficients between risk factors (-1 to 1)
    WALLET_AGE_VS_REPUTATION: 0.6,
    TRANSACTION_COUNT_VS_CLAIM_RISK: -0.4,
    ESCROW_USAGE_VS_CLAIM_RISK: -0.5
  },
  SIMULATION_HISTORY_WEIGHT: 0.3 // Weight for historical simulation results
};

// Market sentiment analysis constants
export const MARKET_SENTIMENT_CONSTANTS = {
  NEUTRAL_SENTIMENT: 0.0,
  MAX_NEGATIVE_ADJUSTMENT: 0.2,
  MAX_POSITIVE_ADJUSTMENT: -0.1,
  CRYPTO_MARKET_CORRELATION: 0.4, // Correlation with broader crypto market
  FREELANCE_MARKET_CORRELATION: 0.6 // Correlation with freelance market trends
};

// On-Chain Solana Risk Index constants
export const OSRI_CONSTANTS = {
  BASE_RISK: 1.0,
  LIQUIDITY_WEIGHT: 0.4,
  TRANSACTION_FAILURE_WEIGHT: 0.3,
  NETWORK_CONGESTION_WEIGHT: 0.3,
  MAX_ADJUSTMENT: 0.25,
  CRITICAL_LIQUIDITY_THRESHOLD: 0.2 // Threshold for emergency risk adjustments
};

// Social Risk Pooling constants
export const SOCIAL_RISK_POOL_CONSTANTS = {
  POOL_SIZE: 10,
  MAX_COHORT_ADJUSTMENT: 0.15,
  COHORT_SIMILARITY_THRESHOLD: 0.7, // Minimum similarity score for pooling
  MAX_POOLS_PER_FREELANCER: 3 // Maximum number of risk pools a freelancer can belong to
};

// Escrow discount constants
export const ESCROW_DISCOUNT_CONSTANTS = {
  BASE_DISCOUNT: 0.1,
  VERIFIED_TRANSACTIONS_THRESHOLD: 5,
  MAX_DISCOUNT: 0.3,
  CONSECUTIVE_USAGE_MULTIPLIER: 1.5 // Bonus multiplier for consecutive escrow usage
};

// Conditional probability segmentation thresholds
export const CONDITIONAL_PROBABILITY_THRESHOLDS = {
  HIGH_VALUE_PROJECT: 5000, // USDC threshold for high-value projects
  LOW_RISK_THRESHOLD: 30, // Risk score below this is considered low risk
  HIGH_RISK_THRESHOLD: 70, // Risk score above this is considered high risk
  PERSONAL_RISK_WEIGHT: 0.6, // Weight for personal risk factors
  INDUSTRY_RISK_WEIGHT: 0.4 // Weight for industry risk factors
};

// Loyalty and retention constants
export const LOYALTY_CONSTANTS = {
  BASE_LOYALTY_DISCOUNT: 0.05, // 5% discount for loyal customers
  MAX_LOYALTY_DISCOUNT: 0.15, // Maximum 15% discount for loyalty
  MONTHS_PER_TIER: 6, // Number of months to reach each loyalty tier
  NO_CLAIM_BONUS_RATE: 0.02 // 2% discount per 6 months without claims
};
