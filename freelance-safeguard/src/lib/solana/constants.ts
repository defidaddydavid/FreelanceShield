import { PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Program IDs - Devnet program IDs
// Updated with the actual deployed program IDs from the Anchor.toml
export const CLAIMS_PROCESSOR_PROGRAM_ID = new PublicKey('5pQBQ2oz7RWJVrcjVzCocbzZsqcAPokwn4Fs3UtPEtda');
export const DAO_GOVERNANCE_PROGRAM_ID = new PublicKey('FDJJ1NSYbLe3v1wCVGXcrA1hqKvf2BbpbNXE3G6TSuf7');
export const ENHANCED_CLAIMS_PROGRAM_ID = new PublicKey('BYE7dnHiF7ptZY1oAxcRBA13NVKsCiFQ2QBQQEAnSf8H');
export const ENHANCED_COVER_PROGRAM_ID = new PublicKey('8wb2a2qR2rEpqALC8a1TdnGgsbVJLFUeRJQ5y7EfvQRT');
export const ESCROW_PROGRAM_ID = new PublicKey('FUnA7YXC27uJBqrcS2Q5ofGL4ghyxoBZkieCtpxvCVab');
export const FREELANCE_INSURANCE_PROGRAM_ID = new PublicKey('5PE9juxGEzx4gMhYBrpeypj8jYdiqNHvnK7PNZ3GAUvW');
export const INSURANCE_PROGRAM_ID = new PublicKey('Ge2xB8Hk3GY1p3YNJWbaxqNNRB6f18VxMsrjfSJ1DPVg');
export const POLICY_NFT_PROGRAM_ID = new PublicKey('2pwwsiBvc21ZcBaVmdWcymvz3QiP8DuYkB97S7gNoK6T');
export const REPUTATION_PROGRAM_ID = new PublicKey('9KbeVQ7mhcYSDUnQ9jcVpEeQx7uu1xJfqvKrQsfpaqEq');
export const RISK_POOL_PROGRAM_ID = new PublicKey('FroU966kfvu5RAQxhLfb4mhFdDjY6JewEf41ZfYR3xhm');
export const STAKING_PROGRAM_ID = new PublicKey('z1VyDVFdUGUXQzx6Dikrzt7aDR8BLgSARcncUvymcDb');

// USDC Token Mint Address (devnet)
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
  // Connection config for Anchor
  connectionConfig: {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  },
  // Business logic constants (in USDC)
  baseReserveRatio: 0.2, // 20% base reserve ratio
  recommendedBuffer: 0.5, // 50% recommended buffer
  minCoverageAmount: 25, // 25 USDC
  maxCoverageAmount: 25000, // 25,000 USDC
  minPeriodDays: 7,
  maxPeriodDays: 365,
  arbitrationThreshold: 70, // Risk score threshold for arbitration
  autoClaimLimit: 250, // Maximum USDC for auto-processing claims
  autoProcessThreshold: 50, // Risk score threshold for auto-processing
  lamportsPerSol: LAMPORTS_PER_SOL, // Still needed for SOL gas fees
  lamportsPerUSDC: USDC_MULTIPLIER, // Conversion factor for USDC to lamports
  // Program IDs for easier reference
  programIds: {
    claimsProcessor: '5pQBQ2oz7RWJVrcjVzCocbzZsqcAPokwn4Fs3UtPEtda',
    daoGovernance: 'FDJJ1NSYbLe3v1wCVGXcrA1hqKvf2BbpbNXE3G6TSuf7',
    enhancedClaims: 'BYE7dnHiF7ptZY1oAxcRBA13NVKsCiFQ2QBQQEAnSf8H',
    enhancedCover: '8wb2a2qR2rEpqALC8a1TdnGgsbVJLFUeRJQ5y7EfvQRT',
    escrowProgram: 'FUnA7YXC27uJBqrcS2Q5ofGL4ghyxoBZkieCtpxvCVab',
    freelanceInsurance: '5PE9juxGEzx4gMhYBrpeypj8jYdiqNHvnK7PNZ3GAUvW',
    insuranceProgram: 'Ge2xB8Hk3GY1p3YNJWbaxqNNRB6f18VxMsrjfSJ1DPVg',
    policyNft: '2pwwsiBvc21ZcBaVmdWcymvz3QiP8DuYkB97S7gNoK6T',
    reputationProgram: '9KbeVQ7mhcYSDUnQ9jcVpEeQx7uu1xJfqvKrQsfpaqEq',
    riskPoolProgram: 'FroU966kfvu5RAQxhLfb4mhFdDjY6JewEf41ZfYR3xhm',
    stakingProgram: 'z1VyDVFdUGUXQzx6Dikrzt7aDR8BLgSARcncUvymcDb',
  },
};

// Transaction Options
export const TX_OPTIONS = {
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
  commitment: 'confirmed' as const,
};

// Helper function to convert USDC amount to decimal representation
export function formatUSDC(amount: number): number {
  return amount / USDC_MULTIPLIER;
}

// Helper function to convert decimal USDC to integer units
export function parseUSDC(amount: number): number {
  return Math.floor(amount * USDC_MULTIPLIER);
}

// Rate limiting for RPC calls
export const RATE_LIMITS = {
  maxRequestsPerSecond: 10,
  maxRequestsPerMinute: 100,
};

// UI constants for displaying risk categories
export const RISK_CATEGORIES = {
  low: {
    threshold: 30,
    color: '#4ade80', // Green
    label: 'Low Risk',
  },
  medium: {
    threshold: 60,
    color: '#facc15', // Yellow
    label: 'Medium Risk',
  },
  high: {
    threshold: 100,
    color: '#f87171', // Red
    label: 'High Risk',
  },
};

// UI constants for premium calculation display
export const PREMIUM_CALCULATION = {
  baseFee: 5, // USDC
  coveragePercentage: 0.05, // 5% of coverage amount
  riskMultiplier: 1.2, // Multiplier for high-risk jobs
  reputationDiscount: 0.1, // 10% discount for high reputation
};

// Premium rates for insurance policies
export const PREMIUM_RATES = {
  baseRate: 0.02, // 2% base rate
  coverageRatioMultiplier: 0.75, // Non-linear scaling for coverage amount
  periodMultiplier: 0.15, // Exponent for period calculation
  minPremium: 1, // Minimum premium in USDC
  maxDiscount: 0.4, // Maximum 40% discount
};

// Risk weights for different job types and industries
export const RISK_WEIGHTS = {
  jobTypes: {
    development: 0.85,
    design: 0.9,
    writing: 0.8,
    marketing: 1.1,
    consulting: 1.2,
    other: 1.0
  },
  industries: {
    defi: 1.3,
    nft: 1.2,
    gaming: 0.9,
    dao: 1.1,
    infrastructure: 0.8,
    other: 1.0
  }
};

// Constants for claim risk evaluation
export const CLAIM_RISK_CONSTANTS = {
  quickClaimThreshold: 7, // Days after policy starts
  suspiciousRatio: 0.9, // Claim amount to coverage ratio
  highRiskScore: 75, // Score that triggers manual review
  maxPreviousClaims: 3, // Number of claims before automatic review
};

// Real blockchain explorer URL
export const EXPLORER_URL = 'https://explorer.solana.com';
export const EXPLORER_TX_URL = `${EXPLORER_URL}/tx`;
export const EXPLORER_ADDRESS_URL = `${EXPLORER_URL}/address`;

// Set this to true to enable devnet features
export const DEVNET_ENABLED = true;
