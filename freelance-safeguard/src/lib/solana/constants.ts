import { PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Program IDs - Devnet program IDs
export const INSURANCE_PROGRAM_ID = new PublicKey('2vFoxWTSRERwtcfwEb6Zgm2iWS3ewU1Y94K224Gw7CJm');
export const RISK_POOL_PROGRAM_ID = new PublicKey('HC1TQHR6kVqtq48UbTYGwHwHTUYom9W3ovNVgjPgNcFg');
export const CLAIMS_PROCESSOR_PROGRAM_ID = new PublicKey('G68SRT1pHmagT9xiM6oFe4pqZE2SmKuLGVY8WZX29NW4');
export const ESCROW_PROGRAM_ID = new PublicKey('DxrfCm3YYBdAkeUBz64yvYKGANZhvhRqpxCa8ghpHe3z');
export const DAO_GOVERNANCE_PROGRAM_ID = new PublicKey('EGfjaXd2EtVwUk92tFRGhZJammxM7sJ3vyrmZ4eafHFY');
export const REPUTATION_PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
export const STAKING_PROGRAM_ID = new PublicKey('BPFLoader2111111111111111111111111111111111');

// USDC Token Mint Address (mainnet)
export const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

// USDC decimals (6 for USDC on Solana)
export const USDC_DECIMALS = 6;
export const USDC_MULTIPLIER = 10 ** USDC_DECIMALS; // 1 USDC = 1,000,000 units

// Network Configuration
export const NETWORK_CONFIG = {
  // Network will be determined by the connected wallet
  name: 'solana',
  // Use devnet for development and testing
  endpoint: clusterApiUrl('devnet'),
  // Business logic constants
  baseReserveRatio: 0.2, // 20% base reserve ratio
  recommendedBuffer: 0.5, // 50% recommended buffer
  // All values in USDC
  minCoverageAmount: 25, // 25 USDC
  maxCoverageAmount: 25000, // 25,000 USDC
  minPeriodDays: 7,
  maxPeriodDays: 365,
  arbitrationThreshold: 70, // Risk score threshold for arbitration
  autoClaimLimit: 250, // Maximum USDC for auto-processing claims
  autoProcessThreshold: 50, // Risk score threshold for auto-processing
  lamportsPerSol: LAMPORTS_PER_SOL, // Still needed for SOL gas fees
  lamportsPerUSDC: USDC_MULTIPLIER, // Conversion factor for USDC to lamports
  // Risk pool program ID - directly exposed for RiskPoolDashboard
  riskPoolProgramId: RISK_POOL_PROGRAM_ID.toString(),
  insuranceProgramId: INSURANCE_PROGRAM_ID.toString(),
  // Program IDs
  programIds: {
    insuranceProgram: INSURANCE_PROGRAM_ID.toString(),
    riskPoolProgram: RISK_POOL_PROGRAM_ID.toString(),
    claimsProcessor: CLAIMS_PROCESSOR_PROGRAM_ID.toString(),
    escrowProgram: ESCROW_PROGRAM_ID.toString(),
    daoGovernance: DAO_GOVERNANCE_PROGRAM_ID.toString(),
    reputationProgram: REPUTATION_PROGRAM_ID.toString(),
    stakingProgram: STAKING_PROGRAM_ID.toString(),
    riskPoolAddress: RISK_POOL_PROGRAM_ID.toString(),
    yieldPoolAddress: CLAIMS_PROCESSOR_PROGRAM_ID.toString()
  },
  connectionConfig: {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000
  }
};

// Risk Weights
export const RISK_WEIGHTS = {
  jobTypes: {
    "web_development": 0.9,
    "mobile_development": 0.95,
    "design": 0.9,
    "content_writing": 0.85,
    "marketing": 1.0,
    "consulting": 1.1,
    "data_analysis": 0.95,
    "blockchain_development": 1.2,
    "ai_development": 1.15,
    "video_production": 1.05,
    "translation": 0.85,
    "other": 1.0
  },
  industries: {
    "technology": 0.9,
    "finance": 1.2,
    "healthcare": 1.1,
    "education": 0.9,
    "entertainment": 1.0,
    "retail": 0.95,
    "manufacturing": 1.1,
    "real_estate": 1.05,
    "legal": 1.3,
    "nonprofit": 0.9,
    "government": 1.0,
    "other": 1.0
  }
};

// Claim risk assessment constants
export const CLAIM_RISK_CONSTANTS = {
  HIGH_AMOUNT_PER_DAY: 50, // USDC per day threshold
  HIGH_AMOUNT_SCORE: 15,
  HIGH_COVERAGE_RATIO: 0.7, // 70% of coverage amount
  HIGH_COVERAGE_SCORE: 20,
  PREVIOUS_CLAIM_SCORE: 10,
  EARLY_CLAIM_DAYS: 7, // Days since policy start
  EARLY_CLAIM_SCORE: 25
};

// Helper function to convert USDC amount to decimal representation
export const formatUSDC = (amount: number): number => {
  return amount / USDC_MULTIPLIER;
};

// Helper function to convert decimal USDC to integer units
export const parseUSDC = (amount: number): number => {
  return Math.floor(amount * USDC_MULTIPLIER);
};

// Default premium rates (base rates in USDC)
export const PREMIUM_RATES = {
  baseRate: 5, // 5 USDC base premium
  coverageRatioMultiplier: 1.5, // Non-linear scaling for higher coverage amounts
  periodMultiplier: 0.8, // Longer periods get discount
  riskScoreImpact: 0.02, // 2% change per risk score point
  minPremium: 2, // Minimum premium in USDC
  minCoveragePeriodDays: 7, // Minimum coverage period (1 week)
  maxCoveragePeriodDays: 365, // Maximum coverage period (1 year)
  maxCoverageRatio: 5.0, // Maximum coverage ratio multiplier
};

// Premium calculation constants
export const PREMIUM_CONSTANTS = {
  BASE_RATE_SOL: 0.1, // Base premium rate in SOL
  COVERAGE_SCALING_FACTOR: 1.2, // Non-linear scaling for coverage ratio
  PERIOD_SCALING_FACTOR: 0.8, // Non-linear scaling for period
  REPUTATION_MIN: 0.7, // Minimum reputation factor
  REPUTATION_MAX: 1.0, // Maximum reputation factor
  CLAIMS_IMPACT_MULTIPLIER: 0.25, // Impact of previous claims
  MARKET_CONDITION_MULTIPLIER: 1.0 // Current market conditions
};

// Claim assessment constants
export const CLAIM_CONSTANTS = {
  proofRequirementThreshold: 500, // USDC threshold requiring additional proof
  expeditedProcessingThreshold: 100, // USDC threshold for expedited processing
  fraudDetectionThreshold: 0.8, // Probability threshold for fraud detection
  maxAutomaticPayoutAmount: 250, // Maximum USDC for automatic payout
};

// Time constants (in seconds)
export const TIME_CONSTANTS = {
  claimProcessingTime: 24 * 60 * 60, // 24 hours for normal claims 
  expeditedProcessingTime: 2 * 60 * 60, // 2 hours for expedited claims
  gracePeriod: 3 * 24 * 60 * 60, // 3 days grace period after policy expiration
  cooldownPeriod: 7 * 24 * 60 * 60, // 7 days cooldown for new policies after claim
};
