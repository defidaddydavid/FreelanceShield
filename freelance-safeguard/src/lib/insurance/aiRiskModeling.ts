import { PublicKey } from '@solana/web3.js';
import { z } from 'zod';
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

// Enhanced input schema for AI-driven premium calculation
export const AIPremiumInputSchema = z.object({
  // Basic coverage details
  coverageAmount: z.number().positive(),
  periodDays: z.number().min(30).max(365),
  jobType: z.enum(Object.keys(RISK_WEIGHTS.jobTypes) as [string, ...string[]]),
  industry: z.enum(Object.keys(RISK_WEIGHTS.industries) as [string, ...string[]]),
  
  // On-chain reputation data
  walletAddress: z.string().optional(),
  walletAgeInDays: z.number().min(0).optional(),
  transactionCount: z.number().min(0).optional(),
  verifiedClientCount: z.number().min(0).optional(),
  escrowTransactionCount: z.number().min(0).optional(),
  
  // Enhanced on-chain data
  disputeResolutionCount: z.number().min(0).optional(),
  positiveDisputeOutcomes: z.number().min(0).optional(),
  transactionHistory: z.array(
    z.object({
      timestamp: z.number(),
      amount: z.number(),
      type: z.enum(['payment', 'escrow', 'claim', 'deposit', 'withdrawal']),
      counterpartyVerified: z.boolean().optional()
    })
  ).optional(),
  
  // Financial volatility data
  incomeTransactions: z.array(
    z.object({
      amount: z.number().positive(),
      timestamp: z.number()
    })
  ).optional(),
  
  // Risk pool data
  riskPoolId: z.string().optional(),
  riskPoolIds: z.array(z.string()).optional(), // Multiple risk pools
  
  // Traditional insurance metrics
  reputationScore: z.number().min(0).max(100),
  claimHistory: z.number().min(0),
  
  // Enhanced risk metrics
  monthsSinceLastClaim: z.number().min(0).optional(),
  consecutiveClaimFreeMonths: z.number().min(0).optional(),
  projectCompletionRate: z.number().min(0).max(1).optional(),
  
  // Market conditions
  marketSentiment: z.number().min(-1).max(1).optional(),
  solanaNetworkHealth: z.number().min(0).max(1).optional(),
  
  // Loyalty and retention data
  policyAgeInMonths: z.number().min(0).optional(),
  previousPolicies: z.number().min(0).optional()
});

export type AIPremiumInput = z.infer<typeof AIPremiumInputSchema>;

// Interface for storing historical simulation results
export interface SimulationHistory {
  timestamp: number;
  input: Partial<AIPremiumInput>;
  results: {
    claimProbability: number;
    confidenceInterval: [number, number];
    riskDecile: number;
  };
}

export interface AIPremiumCalculation {
  premiumUSDC: number;
  riskScore: number;
  wri: number; // Weighted Reputation Index
  breakdownFactors: {
    baseRate: number;
    coverageRatio: number;
    periodAdjustment: number;
    riskAdjustment: number;
    reputationFactor: number;
    wriAdjustment: number;
    fivfAdjustment: number;
    marketSentimentAdjustment: number;
    socialRiskPoolAdjustment: number;
    escrowDiscountAdjustment: number;
    osriAdjustment: number;
    bayesianAdjustment: number;
    monteCarloRiskAdjustment: number;
    srprAdjustment: number;
    loyaltyAdjustment: number; // New factor for loyalty discounts
    conditionalRiskAdjustment: number; // New factor for conditional probability
  };
  riskDecile: number;
  simulationResults: {
    claimProbability: number;
    confidenceInterval: [number, number];
    varianceContributions: Record<string, number>; // Contribution of each factor to variance
  };
  recommendedActions: string[];
  timeBasedProjections: { // Projections for future premium changes
    threeMonths: number;
    sixMonths: number;
    twelveMonths: number;
  };
  riskSegmentation: {
    personalRiskScore: number;
    industryRiskScore: number;
    combinedRiskScore: number;
  };
}

// Global storage for simulation history (in a real app, this would be in a database)
const simulationHistoryStore: SimulationHistory[] = [];

/**
 * Calculate Weighted Reputation Index (WRI) based on on-chain data with time-based decay
 * Lower WRI = Higher Risk, Higher WRI = Lower Risk
 */
export function calculateWRI(input: AIPremiumInput): number {
  // Default values if data is not provided
  const transactionFrequency = input.transactionCount ? 
    Math.min(input.transactionCount / 100, 1) : 0.5;
  
  const walletAge = input.walletAgeInDays ? 
    Math.min(input.walletAgeInDays / 365, 1) : 0.5;
  
  const clientVerifications = input.verifiedClientCount ? 
    Math.min(input.verifiedClientCount / 10, 1) : 0.5;
  
  const escrowUsage = input.escrowTransactionCount ? 
    Math.min(input.escrowTransactionCount / 5, 1) : 0.5;
  
  // New factors
  const disputeResolution = calculateDisputeResolutionScore(input);
  const activityTrend = calculateActivityTrendScore(input);
  
  // Calculate WRI using the weighted formula
  const wri = 
    WRI_WEIGHTS.TRANSACTION_FREQUENCY * transactionFrequency +
    WRI_WEIGHTS.WALLET_AGE * walletAge +
    WRI_WEIGHTS.CLIENT_VERIFICATIONS * clientVerifications +
    WRI_WEIGHTS.ESCROW_USAGE * escrowUsage +
    WRI_WEIGHTS.DISPUTE_RESOLUTION * disputeResolution +
    WRI_WEIGHTS.ACTIVITY_TREND * activityTrend;
  
  return Number(wri.toFixed(2));
}

/**
 * Calculate dispute resolution score based on dispute history
 */
function calculateDisputeResolutionScore(input: AIPremiumInput): number {
  if (!input.disputeResolutionCount || input.disputeResolutionCount === 0) {
    return 0.5; // Neutral score if no dispute history
  }
  
  const positiveOutcomes = input.positiveDisputeOutcomes || 0;
  const positiveRatio = positiveOutcomes / input.disputeResolutionCount;
  
  // Apply time-based decay to older disputes if transaction history is available
  if (input.transactionHistory && input.transactionHistory.length > 0) {
    const now = Date.now();
    const disputeTransactions = input.transactionHistory.filter(tx => 
      tx.type === 'claim' || tx.type === 'escrow'
    );
    
    if (disputeTransactions.length > 0) {
      // Calculate weighted score based on recency
      let weightedScore = 0;
      let totalWeight = 0;
      
      disputeTransactions.forEach(tx => {
        const ageInDays = (now - tx.timestamp) / (1000 * 60 * 60 * 24);
        const decayFactor = Math.max(
          1 - TIME_DECAY_CONSTANTS.MAX_DECAY_FACTOR,
          Math.exp(-Math.log(2) * ageInDays / TIME_DECAY_CONSTANTS.HALF_LIFE_DAYS)
        );
        
        const weight = decayFactor;
        weightedScore += weight * (tx.counterpartyVerified ? 1 : 0);
        totalWeight += weight;
      });
      
      return totalWeight > 0 ? weightedScore / totalWeight : 0.5;
    }
  }
  
  return positiveRatio;
}

/**
 * Calculate activity trend score based on transaction history
 */
function calculateActivityTrendScore(input: AIPremiumInput): number {
  if (!input.transactionHistory || input.transactionHistory.length < 5) {
    return 0.5; // Neutral score if insufficient history
  }
  
  // Sort transactions by timestamp
  const sortedTransactions = [...input.transactionHistory]
    .sort((a, b) => a.timestamp - b.timestamp);
  
  // Split into two halves to compare activity
  const midpoint = Math.floor(sortedTransactions.length / 2);
  const firstHalf = sortedTransactions.slice(0, midpoint);
  const secondHalf = sortedTransactions.slice(midpoint);
  
  // Calculate transaction frequency in each half
  const firstHalfDuration = firstHalf[firstHalf.length - 1].timestamp - firstHalf[0].timestamp;
  const secondHalfDuration = secondHalf[secondHalf.length - 1].timestamp - secondHalf[0].timestamp;
  
  const firstHalfFrequency = firstHalfDuration > 0 ? 
    (firstHalf.length / (firstHalfDuration / (1000 * 60 * 60 * 24))) : 0;
  
  const secondHalfFrequency = secondHalfDuration > 0 ? 
    (secondHalf.length / (secondHalfDuration / (1000 * 60 * 60 * 24))) : 0;
  
  // Calculate growth ratio
  if (firstHalfFrequency === 0) return 0.7; // New but active user
  
  const growthRatio = secondHalfFrequency / firstHalfFrequency;
  
  // Map growth ratio to a 0-1 score
  if (growthRatio >= 1.5) return 1.0; // Strong growth
  if (growthRatio >= 1.0) return 0.8; // Moderate growth
  if (growthRatio >= 0.7) return 0.5; // Slight decline
  if (growthRatio >= 0.4) return 0.3; // Moderate decline
  return 0.1; // Strong decline
}

/**
 * Calculate Freelancer Income Volatility Factor (FIVF) with trend analysis
 * Higher volatility = Higher premium
 */
export function calculateFIVF(input: AIPremiumInput): number {
  if (!input.incomeTransactions || input.incomeTransactions.length < 2) {
    return FIVF_CONSTANTS.BASE_VOLATILITY;
  }
  
  // Sort transactions by timestamp
  const sortedTransactions = [...input.incomeTransactions]
    .sort((a, b) => a.timestamp - b.timestamp);
  
  // Calculate coefficient of variation for income amounts
  const amounts = sortedTransactions.map(tx => tx.amount);
  const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
  const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / mean;
  
  // Calculate time irregularity (standard deviation of time between payments)
  const timeIntervals = [];
  for (let i = 1; i < sortedTransactions.length; i++) {
    timeIntervals.push(sortedTransactions[i].timestamp - sortedTransactions[i-1].timestamp);
  }
  
  const meanInterval = timeIntervals.reduce((sum, val) => sum + val, 0) / timeIntervals.length;
  const intervalVariance = timeIntervals.reduce((sum, val) => sum + Math.pow(val - meanInterval, 2), 0) / timeIntervals.length;
  const intervalStdDev = Math.sqrt(intervalVariance);
  const timeIrregularity = intervalStdDev / meanInterval;
  
  // NEW: Analyze trend in payment amounts
  let trendFactor = 0;
  if (sortedTransactions.length >= 4) {
    // Split into two halves to analyze trend
    const midpoint = Math.floor(sortedTransactions.length / 2);
    const firstHalfAmounts = sortedTransactions.slice(0, midpoint).map(tx => tx.amount);
    const secondHalfAmounts = sortedTransactions.slice(midpoint).map(tx => tx.amount);
    
    const firstHalfMean = firstHalfAmounts.reduce((sum, val) => sum + val, 0) / firstHalfAmounts.length;
    const secondHalfMean = secondHalfAmounts.reduce((sum, val) => sum + val, 0) / secondHalfAmounts.length;
    
    // Calculate trend direction and magnitude
    if (secondHalfMean > firstHalfMean) {
      // Increasing income trend (positive)
      const growthRatio = secondHalfMean / firstHalfMean;
      trendFactor = -0.1 * Math.min(growthRatio - 1, 1); // Negative adjustment (reduces premium)
    } else {
      // Decreasing income trend (negative)
      const declineRatio = firstHalfMean / secondHalfMean;
      trendFactor = 0.1 * Math.min(declineRatio - 1, 1); // Positive adjustment (increases premium)
    }
  }
  
  // Combine factors for overall volatility
  const volatilityScore = (coefficientOfVariation * 0.5) + (timeIrregularity * 0.3) + trendFactor;
  
  // Apply multipliers based on volatility thresholds
  if (volatilityScore > FIVF_CONSTANTS.HIGH_VOLATILITY_THRESHOLD) {
    return FIVF_CONSTANTS.HIGH_VOLATILITY_MULTIPLIER;
  } else if (volatilityScore < FIVF_CONSTANTS.LOW_VOLATILITY_THRESHOLD) {
    return FIVF_CONSTANTS.LOW_VOLATILITY_MULTIPLIER;
  } else {
    // Linear interpolation between thresholds
    const range = FIVF_CONSTANTS.HIGH_VOLATILITY_THRESHOLD - FIVF_CONSTANTS.LOW_VOLATILITY_THRESHOLD;
    const position = (volatilityScore - FIVF_CONSTANTS.LOW_VOLATILITY_THRESHOLD) / range;
    return FIVF_CONSTANTS.LOW_VOLATILITY_MULTIPLIER + 
      position * (FIVF_CONSTANTS.HIGH_VOLATILITY_MULTIPLIER - FIVF_CONSTANTS.LOW_VOLATILITY_MULTIPLIER);
  }
}

/**
 * Calculate Stable Reserve-to-Premium Ratio (SRPR) adjustment
 */
export function calculateSRPRAdjustment(totalReserves: number, outstandingCoverage: number): number {
  const srpr = totalReserves / outstandingCoverage;
  
  if (srpr < SRPR_THRESHOLDS.MIN_THRESHOLD) {
    // Increase premiums proportionally as SRPR decreases below minimum threshold
    const shortfall = SRPR_THRESHOLDS.MIN_THRESHOLD - srpr;
    return 1 + (shortfall / SRPR_THRESHOLDS.MIN_THRESHOLD);
  } else if (srpr > SRPR_THRESHOLDS.MAX_THRESHOLD) {
    // Decrease premiums proportionally as SRPR increases above maximum threshold
    const excess = srpr - SRPR_THRESHOLDS.MAX_THRESHOLD;
    const maxExcess = 1.0; // Cap the excess to prevent premiums from going too low
    const adjustmentFactor = Math.min(excess, maxExcess) / SRPR_THRESHOLDS.MAX_THRESHOLD;
    return Math.max(0.8, 1 - (adjustmentFactor * 0.2)); // Limit discount to 20%
  } else {
    // No adjustment needed within the optimal range
    return 1.0;
  }
}

/**
 * Calculate escrow usage discount
 */
export function calculateEscrowDiscount(input: AIPremiumInput): number {
  if (!input.escrowTransactionCount || input.escrowTransactionCount === 0) {
    return 0;
  }
  
  if (input.escrowTransactionCount >= ESCROW_DISCOUNT_CONSTANTS.VERIFIED_TRANSACTIONS_THRESHOLD) {
    return ESCROW_DISCOUNT_CONSTANTS.MAX_DISCOUNT;
  } else {
    // Linear scaling of discount based on number of escrow transactions
    return (input.escrowTransactionCount / ESCROW_DISCOUNT_CONSTANTS.VERIFIED_TRANSACTIONS_THRESHOLD) * 
      ESCROW_DISCOUNT_CONSTANTS.MAX_DISCOUNT;
  }
}

/**
 * Simulate claim probability using Monte Carlo methods
 */
export function runMonteCarloSimulation(input: AIPremiumInput): {
  claimProbability: number;
  confidenceInterval: [number, number];
  riskDecile: number;
  adjustment: number;
} {
  // Base claim probability factors
  const baseProbability = 0.05; // 5% base probability
  
  // Risk factors
  const jobTypeRisk = RISK_WEIGHTS.jobTypes[input.jobType as keyof typeof RISK_WEIGHTS.jobTypes];
  const industryRisk = RISK_WEIGHTS.industries[input.industry as keyof typeof RISK_WEIGHTS.industries];
  const reputationRisk = 1 - (input.reputationScore / 100);
  const claimHistoryRisk = input.claimHistory * 0.03;
  const wri = calculateWRI(input);
  const wriRisk = 1 - wri;
  
  // Combined risk factors
  const combinedRiskFactor = (
    (jobTypeRisk * 0.15) + 
    (industryRisk * 0.15) + 
    (reputationRisk * 0.2) + 
    (claimHistoryRisk * 0.2) + 
    (wriRisk * 0.3)
  );
  
  // Adjusted base probability
  const adjustedProbability = baseProbability * (1 + combinedRiskFactor);
  
  // Run simplified Monte Carlo simulation
  let successfulClaims = 0;
  const simulationResults = [];
  
  for (let i = 0; i < MONTE_CARLO_CONSTANTS.SIMULATION_COUNT; i++) {
    // Add random noise to the adjusted probability
    const simulationProbability = adjustedProbability * (0.7 + (Math.random() * 0.6));
    
    // Simulate claim event
    const claimOccurred = Math.random() < simulationProbability;
    if (claimOccurred) {
      successfulClaims++;
    }
    
    simulationResults.push(simulationProbability);
  }
  
  // Calculate final claim probability
  const claimProbability = successfulClaims / MONTE_CARLO_CONSTANTS.SIMULATION_COUNT;
  
  // Calculate confidence interval (95%)
  simulationResults.sort((a, b) => a - b);
  const lowerBound = simulationResults[Math.floor(MONTE_CARLO_CONSTANTS.SIMULATION_COUNT * 0.025)];
  const upperBound = simulationResults[Math.floor(MONTE_CARLO_CONSTANTS.SIMULATION_COUNT * 0.975)];
  
  // Determine risk decile (0-10, where 10 is highest risk)
  const riskDecile = Math.min(10, Math.floor(claimProbability * 100));
  
  // Calculate premium adjustment based on risk decile
  let adjustment = 1.0;
  if (riskDecile >= 9) { // Top 10% risk
    adjustment = MONTE_CARLO_CONSTANTS.HIGH_RISK_DECILE_MULTIPLIER;
  } else if (riskDecile <= 1) { // Bottom 10% risk
    adjustment = MONTE_CARLO_CONSTANTS.LOW_RISK_DECILE_MULTIPLIER;
  } else {
    // Linear interpolation for middle deciles
    const position = (riskDecile - 1) / 8; // Position between 0 and 1
    adjustment = MONTE_CARLO_CONSTANTS.LOW_RISK_DECILE_MULTIPLIER + 
      position * (MONTE_CARLO_CONSTANTS.HIGH_RISK_DECILE_MULTIPLIER - MONTE_CARLO_CONSTANTS.LOW_RISK_DECILE_MULTIPLIER);
  }
  
  return {
    claimProbability,
    confidenceInterval: [lowerBound, upperBound],
    riskDecile,
    adjustment
  };
}

/**
 * Calculate market sentiment adjustment based on external data
 */
export function calculateMarketSentimentAdjustment(sentiment: number = 0): number {
  if (sentiment === 0) {
    return 1.0; // Neutral sentiment, no adjustment
  } else if (sentiment < 0) {
    // Negative sentiment increases premiums
    return 1 + (Math.abs(sentiment) * MARKET_SENTIMENT_CONSTANTS.MAX_NEGATIVE_ADJUSTMENT);
  } else {
    // Positive sentiment decreases premiums
    return 1 + (sentiment * MARKET_SENTIMENT_CONSTANTS.MAX_POSITIVE_ADJUSTMENT);
  }
}

/**
 * Calculate On-Chain Solana Risk Index (OSRI) adjustment
 */
export function calculateOSRIAdjustment(
  usdcLiquidity: number = 0.5, // Default to middle value if not provided
  transactionFailureRate: number = 0.1 // Default to 10% failure rate if not provided
): number {
  // Normalize inputs to 0-1 range
  const normalizedLiquidity = Math.max(0, Math.min(1, usdcLiquidity));
  const normalizedFailureRate = Math.max(0, Math.min(1, transactionFailureRate));
  
  // Calculate liquidity risk (lower liquidity = higher risk)
  const liquidityRisk = 1 - normalizedLiquidity;
  
  // Calculate transaction risk (higher failure rate = higher risk)
  const transactionRisk = normalizedFailureRate;
  
  // Combine risks using weights
  const combinedRisk = 
    (liquidityRisk * OSRI_CONSTANTS.LIQUIDITY_WEIGHT) + 
    (transactionRisk * OSRI_CONSTANTS.TRANSACTION_FAILURE_WEIGHT);
  
  // Calculate adjustment factor
  return OSRI_CONSTANTS.BASE_RISK + (combinedRisk * OSRI_CONSTANTS.MAX_ADJUSTMENT);
}

/**
 * Calculate Social Risk Pool adjustment based on cohort performance
 */
export function calculateSocialRiskPoolAdjustment(
  poolDefaultRate: number = 0.05, // Default to 5% default rate if not provided
  poolSize: number = SOCIAL_RISK_POOL_CONSTANTS.POOL_SIZE
): number {
  // Normalize default rate to prevent extreme values
  const normalizedDefaultRate = Math.max(0, Math.min(0.5, poolDefaultRate));
  
  // Calculate adjustment factor based on default rate and pool size
  const baseAdjustment = normalizedDefaultRate * 2; // Double the default rate for base adjustment
  
  // Apply pool size scaling (smaller pools have more volatility)
  const sizeScaling = Math.max(0.5, Math.min(1, poolSize / SOCIAL_RISK_POOL_CONSTANTS.POOL_SIZE));
  
  // Calculate final adjustment, capped at maximum
  const adjustment = baseAdjustment / sizeScaling;
  return 1 + Math.min(adjustment, SOCIAL_RISK_POOL_CONSTANTS.MAX_COHORT_ADJUSTMENT);
}

/**
 * Apply Bayesian updating to risk assessment based on successful projects
 */
export function calculateBayesianAdjustment(
  successfulProjects: number = 0,
  totalProjects: number = 0
): number {
  if (totalProjects === 0) {
    return 1.0; // No adjustment if no projects
  }
  
  // Prior probability of default (conservative estimate)
  const priorDefaultProbability = 0.1;
  
  // Calculate success rate
  const successRate = successfulProjects / totalProjects;
  
  // Apply Bayesian update (simplified)
  const posteriorDefaultProbability = 
    (priorDefaultProbability * (1 - successRate)) / 
    ((priorDefaultProbability * (1 - successRate)) + ((1 - priorDefaultProbability) * successRate));
  
  // Convert to adjustment factor (lower probability of default = lower premium)
  const adjustment = posteriorDefaultProbability / priorDefaultProbability;
  
  // Cap the adjustment to prevent extreme values
  return Math.max(0.7, Math.min(1.2, adjustment));
}

/**
 * Generate recommended actions to lower premium
 */
export function generateRecommendedActions(input: AIPremiumInput, calculation: AIPremiumCalculation): string[] {
  const recommendations: string[] = [];
  
  // WRI-based recommendations
  if (calculation.wri < 0.6) {
    if (!input.escrowTransactionCount || input.escrowTransactionCount < 5) {
      recommendations.push("Use escrow payments for your next 5 transactions to receive up to 30% discount");
    }
    
    if (!input.verifiedClientCount || input.verifiedClientCount < 3) {
      recommendations.push("Complete projects with 3 more verified clients to improve your reputation score");
    }
  }
  
  // Risk decile based recommendations
  if (calculation.riskDecile > 7) {
    recommendations.push("Your risk profile is in the higher range. Consider smaller contract amounts initially");
  }
  
  // FIVF-based recommendations
  if (calculation.breakdownFactors.fivfAdjustment > 1.1) {
    recommendations.push("Your income shows high volatility. Establishing more regular payment schedules can lower your premium");
  }
  
  // Add general recommendations if list is empty
  if (recommendations.length === 0) {
    recommendations.push("Your risk profile is good. Continue maintaining your positive transaction history");
    recommendations.push("Consider increasing your coverage amount for better protection while maintaining a good premium ratio");
  }
  
  return recommendations;
}

/**
 * Main function to calculate AI-driven premium
 */
export function calculateAIPremium(
  input: AIPremiumInput,
  systemParams: {
    totalReserves: number;
    outstandingCoverage: number;
    usdcLiquidity?: number;
    transactionFailureRate?: number;
    poolDefaultRate?: number;
    successfulProjects?: number;
    totalProjects?: number;
  } = {
    totalReserves: 100000,
    outstandingCoverage: 50000
  }
): AIPremiumCalculation {
  // Validate input
  AIPremiumInputSchema.parse(input);
  
  // Base premium calculation components
  const BASE_RATE_USDC = 10;
  const MAX_COVERAGE_RATIO = 5.0;
  
  // Calculate coverage ratio with enhanced non-linear scaling
  const coverageRatio = Math.min(
    Math.pow(input.coverageAmount / 1000, 1.8) * 
    (1 + Math.log10(input.coverageAmount / 1000)),
    MAX_COVERAGE_RATIO
  );
  
  // Period adjustment (exponential increase for longer periods)
  const periodAdjustment = Math.pow(
    input.periodDays / 30,
    1.1
  );
  
  // Risk adjustment based on job type and industry
  const jobTypeRisk = RISK_WEIGHTS.jobTypes[input.jobType as keyof typeof RISK_WEIGHTS.jobTypes];
  const industryRisk = RISK_WEIGHTS.industries[input.industry as keyof typeof RISK_WEIGHTS.industries];
  const riskAdjustment = jobTypeRisk * industryRisk;
  
  // Reputation factor (better reputation = lower premium)
  const reputationFactor = Math.max(0.7, 1 - (input.reputationScore / 200));
  
  // Calculate Weighted Reputation Index
  const wri = calculateWRI(input);
  const wriAdjustment = Math.max(0.7, 1.3 - wri);
  
  // Calculate Freelancer Income Volatility Factor
  const fivfAdjustment = calculateFIVF(input);
  
  // Calculate Stable Reserve-to-Premium Ratio adjustment
  const srprAdjustment = calculateSRPRAdjustment(
    systemParams.totalReserves,
    systemParams.outstandingCoverage
  );
  
  // Calculate escrow discount
  const escrowDiscount = calculateEscrowDiscount(input);
  const escrowDiscountAdjustment = 1 - escrowDiscount;
  
  // Run Monte Carlo simulation for risk assessment
  const monteCarloResults = runMonteCarloSimulation(input);
  const monteCarloRiskAdjustment = monteCarloResults.adjustment;
  
  // Calculate market sentiment adjustment
  const marketSentimentAdjustment = calculateMarketSentimentAdjustment(input.marketSentiment);
  
  // Calculate On-Chain Solana Risk Index adjustment
  const osriAdjustment = calculateOSRIAdjustment(
    systemParams.usdcLiquidity,
    systemParams.transactionFailureRate
  );
  
  // Calculate Social Risk Pool adjustment
  const socialRiskPoolAdjustment = calculateSocialRiskPoolAdjustment(
    systemParams.poolDefaultRate
  );
  
  // Calculate Bayesian adjustment based on successful projects
  const bayesianAdjustment = calculateBayesianAdjustment(
    systemParams.successfulProjects,
    systemParams.totalProjects
  );
  
  // Calculate final premium with all adjustment factors
  const premium = BASE_RATE_USDC *
    coverageRatio *
    periodAdjustment *
    riskAdjustment *
    reputationFactor *
    wriAdjustment *
    fivfAdjustment *
    marketSentimentAdjustment *
    socialRiskPoolAdjustment *
    escrowDiscountAdjustment *
    osriAdjustment *
    bayesianAdjustment *
    monteCarloRiskAdjustment *
    srprAdjustment;
  
  // Calculate overall risk score (0-100)
  const riskScore = Math.min(
    100,
    (riskAdjustment * 15 +
      (input.claimHistory * 10) +
      (coverageRatio / MAX_COVERAGE_RATIO * 15) +
      ((1 - reputationFactor) * 20) +
      (wriAdjustment * 20) +
      (monteCarloResults.riskDecile * 10) +
      ((fivfAdjustment - 1) * 10))
  );
  
  // Create result object
  const result: AIPremiumCalculation = {
    premiumUSDC: Number(premium.toFixed(2)),
    riskScore: Number(riskScore.toFixed(2)),
    wri,
    breakdownFactors: {
      baseRate: BASE_RATE_USDC,
      coverageRatio,
      periodAdjustment,
      riskAdjustment,
      reputationFactor,
      wriAdjustment,
      fivfAdjustment,
      marketSentimentAdjustment,
      socialRiskPoolAdjustment,
      escrowDiscountAdjustment,
      osriAdjustment,
      bayesianAdjustment,
      monteCarloRiskAdjustment,
      srprAdjustment,
      loyaltyAdjustment: 1.0, // Default value for loyalty adjustment (no adjustment)
      conditionalRiskAdjustment: 1.0 // Default value for conditional risk adjustment (no adjustment)
    },
    riskDecile: monteCarloResults.riskDecile,
    simulationResults: {
      claimProbability: monteCarloResults.claimProbability,
      confidenceInterval: monteCarloResults.confidenceInterval,
      varianceContributions: {
        'jobType': 0.15,
        'industry': 0.20,
        'coverageAmount': 0.25,
        'periodDays': 0.10,
        'reputation': 0.30
      } // Add variance contributions
    },
    recommendedActions: [],
    // Add time-based projections
    timeBasedProjections: {
      threeMonths: Number((premium * 0.95).toFixed(2)),  // 5% discount after 3 months
      sixMonths: Number((premium * 0.90).toFixed(2)),    // 10% discount after 6 months
      twelveMonths: Number((premium * 0.85).toFixed(2))  // 15% discount after 12 months
    },
    // Add risk segmentation
    riskSegmentation: {
      personalRiskScore: Number((riskScore * 0.7).toFixed(2)),
      industryRiskScore: Number((riskScore * 0.3 + 20).toFixed(2)),
      combinedRiskScore: Number(riskScore.toFixed(2))
    }
  };
  
  // Generate recommended actions
  result.recommendedActions = generateRecommendedActions(input, result);
  
  return result;
}
