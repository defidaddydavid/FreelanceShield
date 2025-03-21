import { AIPremiumInput } from './types';
import { 
  CONDITIONAL_PROBABILITY_THRESHOLDS, 
  LOYALTY_CONSTANTS,
  ESCROW_DISCOUNT_CONSTANTS,
  SOCIAL_RISK_POOL_CONSTANTS,
  OSRI_CONSTANTS,
  MARKET_SENTIMENT_CONSTANTS,
  SRPR_THRESHOLDS
} from './constants';

/**
 * Apply conditional probability segmentation to the premium calculation
 * This segments freelancers based on project value and risk profile
 */
export function applyConditionalProbability(input: AIPremiumInput, baseRisk: number): number {
  // Segment freelancers based on project value
  const isHighValueProject = input.coverageAmount >= CONDITIONAL_PROBABILITY_THRESHOLDS.HIGH_VALUE_PROJECT;
  
  // Segment based on risk profile
  const isLowRisk = baseRisk <= CONDITIONAL_PROBABILITY_THRESHOLDS.LOW_RISK_THRESHOLD / 100;
  const isHighRisk = baseRisk >= CONDITIONAL_PROBABILITY_THRESHOLDS.HIGH_RISK_THRESHOLD / 100;
  
  // Apply conditional probability adjustments
  if (isHighValueProject && isLowRisk) {
    return baseRisk * 0.85; // Premium discount for low-risk high-value projects
  } else if (isHighValueProject && isHighRisk) {
    return baseRisk * 1.25; // Premium increase for high-risk high-value projects
  } else if (!isHighValueProject && isLowRisk) {
    return baseRisk * 0.9; // Smaller discount for low-risk standard projects
  } else if (!isHighValueProject && isHighRisk) {
    return baseRisk * 1.15; // Smaller increase for high-risk standard projects
  }
  
  return baseRisk; // No adjustment for medium risk profiles
}

/**
 * Calculate loyalty discount based on policy age and claim-free months
 */
export function calculateLoyaltyDiscount(input: AIPremiumInput): number {
  if (!input.policyAgeInMonths && !input.previousPolicies) {
    return 0; // No loyalty discount for new customers
  }
  
  const policyAge = input.policyAgeInMonths || 0;
  const previousPolicies = input.previousPolicies || 0;
  
  // Calculate loyalty tier based on policy age and previous policies
  const loyaltyTier = Math.floor((policyAge + (previousPolicies * 3)) / LOYALTY_CONSTANTS.MONTHS_PER_TIER);
  
  // Calculate no-claim bonus
  const consecutiveClaimFreeMonths = input.consecutiveClaimFreeMonths || 0;
  const noClaimBonus = Math.floor(consecutiveClaimFreeMonths / LOYALTY_CONSTANTS.MONTHS_PER_TIER) * 
    LOYALTY_CONSTANTS.NO_CLAIM_BONUS_RATE;
  
  // Calculate total loyalty discount (capped at maximum)
  const baseDiscount = Math.min(
    loyaltyTier * LOYALTY_CONSTANTS.BASE_LOYALTY_DISCOUNT,
    LOYALTY_CONSTANTS.MAX_LOYALTY_DISCOUNT
  );
  
  return baseDiscount + noClaimBonus;
}

/**
 * Calculate escrow usage discount
 */
export function calculateEscrowDiscount(input: AIPremiumInput): number {
  if (!input.escrowTransactionCount || input.escrowTransactionCount < ESCROW_DISCOUNT_CONSTANTS.VERIFIED_TRANSACTIONS_THRESHOLD) {
    return 0; // No discount if not using escrow or below threshold
  }
  
  // Calculate base discount
  let discount = ESCROW_DISCOUNT_CONSTANTS.BASE_DISCOUNT;
  
  // Check for consecutive usage pattern if transaction history is available
  if (input.transactionHistory && input.transactionHistory.length > 0) {
    const escrowTransactions = input.transactionHistory.filter(tx => tx.type === 'escrow');
    
    if (escrowTransactions.length >= 3) {
      // Sort by timestamp
      const sortedTransactions = [...escrowTransactions].sort((a, b) => a.timestamp - b.timestamp);
      
      // Check if most recent transactions are escrow
      const recentTransactionsCount = Math.min(sortedTransactions.length, 5);
      const recentTransactions = sortedTransactions.slice(-recentTransactionsCount);
      
      // Calculate ratio of recent escrow usage
      const allRecentTransactions = input.transactionHistory
        .filter(tx => tx.timestamp >= recentTransactions[0].timestamp);
      
      const escrowRatio = recentTransactions.length / allRecentTransactions.length;
      
      // Apply consecutive usage multiplier if ratio is high
      if (escrowRatio >= 0.7) {
        discount *= ESCROW_DISCOUNT_CONSTANTS.CONSECUTIVE_USAGE_MULTIPLIER;
      }
    }
  }
  
  // Cap the discount at maximum
  return Math.min(discount, ESCROW_DISCOUNT_CONSTANTS.MAX_DISCOUNT);
}

/**
 * Calculate social risk pool adjustment
 */
export function calculateSocialRiskPoolAdjustment(input: AIPremiumInput): number {
  if (!input.riskPoolId && (!input.riskPoolIds || input.riskPoolIds.length === 0)) {
    return 0; // No adjustment if not part of any risk pool
  }
  
  // In a real implementation, this would query a database to get risk pool data
  // For this example, we'll simulate a random adjustment based on the pool ID
  
  // Get all pool IDs
  const poolIds = input.riskPoolIds || (input.riskPoolId ? [input.riskPoolId] : []);
  
  // Calculate adjustment for each pool (in a real implementation, this would use actual pool data)
  let totalAdjustment = 0;
  
  poolIds.forEach(poolId => {
    // Generate a deterministic adjustment based on the pool ID
    const poolHash = hashString(poolId);
    const adjustment = ((poolHash % 20) - 10) / 100; // Range: -0.1 to 0.1
    
    totalAdjustment += adjustment;
  });
  
  // Limit the total adjustment based on the maximum number of pools
  const maxPools = SOCIAL_RISK_POOL_CONSTANTS.MAX_POOLS_PER_FREELANCER;
  const adjustmentFactor = Math.min(poolIds.length, maxPools) / maxPools;
  
  return Math.max(
    -SOCIAL_RISK_POOL_CONSTANTS.MAX_COHORT_ADJUSTMENT,
    Math.min(SOCIAL_RISK_POOL_CONSTANTS.MAX_COHORT_ADJUSTMENT, totalAdjustment * adjustmentFactor)
  );
}

/**
 * Calculate On-Chain Solana Risk Index adjustment
 */
export function calculateOSRIAdjustment(input: AIPremiumInput): number {
  if (!input.solanaNetworkHealth) {
    return 0; // No adjustment if no network health data
  }
  
  // Calculate liquidity risk
  const liquidityRisk = (1 - input.solanaNetworkHealth) * OSRI_CONSTANTS.LIQUIDITY_WEIGHT;
  
  // In a real implementation, we would fetch transaction failure rates and network congestion
  // For this example, we'll use the network health as a proxy
  const transactionFailureRisk = (1 - input.solanaNetworkHealth) * OSRI_CONSTANTS.TRANSACTION_FAILURE_WEIGHT;
  const networkCongestionRisk = (1 - input.solanaNetworkHealth) * OSRI_CONSTANTS.NETWORK_CONGESTION_WEIGHT;
  
  // Calculate total risk adjustment
  const totalRiskAdjustment = liquidityRisk + transactionFailureRisk + networkCongestionRisk;
  
  // Apply emergency adjustment if liquidity is below critical threshold
  if (input.solanaNetworkHealth < OSRI_CONSTANTS.CRITICAL_LIQUIDITY_THRESHOLD) {
    return OSRI_CONSTANTS.MAX_ADJUSTMENT; // Maximum risk adjustment
  }
  
  return Math.min(totalRiskAdjustment, OSRI_CONSTANTS.MAX_ADJUSTMENT);
}

/**
 * Calculate market sentiment adjustment
 */
export function calculateMarketSentimentAdjustment(input: AIPremiumInput): number {
  if (input.marketSentiment === undefined) {
    return 0; // No adjustment if no market sentiment data
  }
  
  // Normalize sentiment to -1 to 1 range
  const normalizedSentiment = Math.max(-1, Math.min(1, input.marketSentiment));
  
  // Calculate adjustment based on sentiment direction
  if (normalizedSentiment < 0) {
    // Negative sentiment increases premium
    return Math.abs(normalizedSentiment) * MARKET_SENTIMENT_CONSTANTS.MAX_NEGATIVE_ADJUSTMENT;
  } else {
    // Positive sentiment decreases premium
    return normalizedSentiment * MARKET_SENTIMENT_CONSTANTS.MAX_POSITIVE_ADJUSTMENT;
  }
}

/**
 * Calculate Stable Reserve-to-Premium Ratio adjustment
 */
export function calculateSRPRAdjustment(currentRatio: number): number {
  if (currentRatio <= 0) {
    return 0; // Invalid ratio
  }
  
  // Check if ratio is below critical threshold
  if (currentRatio < SRPR_THRESHOLDS.CRITICAL_THRESHOLD) {
    return 0.3; // Emergency premium increase
  }
  
  // Check if ratio is below minimum threshold
  if (currentRatio < SRPR_THRESHOLDS.MIN_THRESHOLD) {
    // Linear increase as ratio approaches critical threshold
    const range = SRPR_THRESHOLDS.MIN_THRESHOLD - SRPR_THRESHOLDS.CRITICAL_THRESHOLD;
    const position = (currentRatio - SRPR_THRESHOLDS.CRITICAL_THRESHOLD) / range;
    return 0.3 - (position * 0.2); // Range: 0.1 to 0.3
  }
  
  // Check if ratio is above maximum threshold
  if (currentRatio > SRPR_THRESHOLDS.MAX_THRESHOLD) {
    // Premium discount to encourage growth
    return -0.1;
  }
  
  // Ratio is within healthy range
  // Fine-tune premium to target the ideal ratio
  const targetDifference = SRPR_THRESHOLDS.TARGET_RATIO - currentRatio;
  return targetDifference * 0.1; // Small adjustment to nudge toward target
}

/**
 * Calculate time-based premium projections
 */
export function calculateTimeBasedProjections(
  currentPremium: number,
  input: AIPremiumInput,
  riskScore: number
): { threeMonths: number; sixMonths: number; twelveMonths: number } {
  // Base projection factors
  const threeMonthFactor = 1.0;
  const sixMonthFactor = 1.0;
  const twelveMonthFactor = 1.0;
  
  // Adjust based on risk score trend
  let riskTrendFactor = 0;
  
  // In a real implementation, we would use historical risk scores
  // For this example, we'll use claim history and reputation as proxies
  if (input.claimHistory > 0) {
    // Higher claim history suggests increasing risk over time
    riskTrendFactor = 0.05 * Math.min(input.claimHistory, 3);
  } else if (input.consecutiveClaimFreeMonths && input.consecutiveClaimFreeMonths > 6) {
    // Long claim-free periods suggest decreasing risk over time
    riskTrendFactor = -0.03 * Math.min(Math.floor(input.consecutiveClaimFreeMonths / 6), 3);
  }
  
  // Adjust based on activity trend if transaction history is available
  let activityTrendFactor = 0;
  if (input.transactionHistory && input.transactionHistory.length > 0) {
    const sortedTransactions = [...input.transactionHistory]
      .sort((a, b) => a.timestamp - b.timestamp);
    
    // Check if activity is increasing or decreasing
    const midpoint = Math.floor(sortedTransactions.length / 2);
    const firstHalf = sortedTransactions.slice(0, midpoint);
    const secondHalf = sortedTransactions.slice(midpoint);
    
    if (secondHalf.length > firstHalf.length) {
      // Increasing activity suggests lower risk
      activityTrendFactor = -0.02;
    } else if (secondHalf.length < firstHalf.length) {
      // Decreasing activity suggests higher risk
      activityTrendFactor = 0.02;
    }
  }
  
  // Calculate final projection factors
  const threeMonthProjection = currentPremium * (threeMonthFactor + (riskTrendFactor * 1) + (activityTrendFactor * 1));
  const sixMonthProjection = currentPremium * (sixMonthFactor + (riskTrendFactor * 2) + (activityTrendFactor * 1.5));
  const twelveMonthProjection = currentPremium * (twelveMonthFactor + (riskTrendFactor * 3) + (activityTrendFactor * 2));
  
  return {
    threeMonths: Math.max(currentPremium * 0.8, threeMonthProjection),
    sixMonths: Math.max(currentPremium * 0.7, sixMonthProjection),
    twelveMonths: Math.max(currentPremium * 0.6, twelveMonthProjection)
  };
}

/**
 * Calculate risk segmentation scores
 */
export function calculateRiskSegmentation(
  input: AIPremiumInput,
  riskScore: number
): { personalRiskScore: number; industryRiskScore: number; combinedRiskScore: number } {
  // Calculate personal risk factors
  const claimHistoryImpact = input.claimHistory * 10;
  const reputationImpact = 100 - input.reputationScore;
  const walletAgeImpact = input.walletAgeInDays ? 
    Math.max(0, 50 - Math.min(input.walletAgeInDays / 7, 50)) : 25;
  
  // Calculate personal risk score (0-100 scale)
  const personalRiskScore = Math.min(100, (
    (claimHistoryImpact * 0.3) + 
    (reputationImpact * 0.5) + 
    (walletAgeImpact * 0.2)
  ));
  
  // Calculate industry risk factors based on job type and industry
  // In a real implementation, this would use actual industry risk data
  // For this example, we'll use a deterministic approach based on the input values
  const jobTypeHash = hashString(input.jobType);
  const industryHash = hashString(input.industry);
  
  const jobTypeRisk = 40 + (jobTypeHash % 40); // Range: 40-79
  const industryRisk = 30 + (industryHash % 50); // Range: 30-79
  
  // Calculate industry risk score (0-100 scale)
  const industryRiskScore = Math.min(100, (
    (jobTypeRisk * 0.6) + 
    (industryRisk * 0.4)
  ));
  
  // Calculate combined risk score with weighted factors
  const combinedRiskScore = (
    (personalRiskScore * CONDITIONAL_PROBABILITY_THRESHOLDS.PERSONAL_RISK_WEIGHT) +
    (industryRiskScore * CONDITIONAL_PROBABILITY_THRESHOLDS.INDUSTRY_RISK_WEIGHT)
  );
  
  return {
    personalRiskScore,
    industryRiskScore,
    combinedRiskScore
  };
}

/**
 * Generate recommended actions to lower premium
 */
export function generateRecommendedActions(input: AIPremiumInput, varianceContributions: Record<string, number>): string[] {
  const recommendations: string[] = [];
  
  // Sort factors by their contribution to variance
  const sortedFactors = Object.entries(varianceContributions)
    .sort((a, b) => b[1] - a[1]);
  
  // Generate recommendations based on top contributing factors
  for (const [factor, contribution] of sortedFactors) {
    if (contribution < 0.1) continue; // Skip factors with low contribution
    
    switch (factor) {
      case 'JOB_TYPE':
        recommendations.push('Consider specializing in lower-risk job types to reduce your premium.');
        break;
      case 'INDUSTRY':
        recommendations.push('Some industries have inherently higher risk profiles. Diversifying your client base across multiple industries can help reduce risk.');
        break;
      case 'WALLET_AGE':
        if (!input.walletAgeInDays || input.walletAgeInDays < 180) {
          recommendations.push('Maintain consistent activity with your wallet to build a longer history on the blockchain.');
        }
        break;
      case 'TRANSACTION_HISTORY':
        if (!input.transactionCount || input.transactionCount < 50) {
          recommendations.push('Increase your on-chain transaction history with successful project completions.');
        }
        break;
      case 'REPUTATION':
        recommendations.push('Improve your reputation score by completing projects successfully and receiving positive feedback.');
        break;
    }
  }
  
  // Add general recommendations
  if (!input.escrowTransactionCount || input.escrowTransactionCount < ESCROW_DISCOUNT_CONSTANTS.VERIFIED_TRANSACTIONS_THRESHOLD) {
    recommendations.push(`Use escrow for at least ${ESCROW_DISCOUNT_CONSTANTS.VERIFIED_TRANSACTIONS_THRESHOLD} transactions to qualify for premium discounts.`);
  }
  
  if (input.claimHistory > 0) {
    recommendations.push('Maintain a claim-free record to qualify for no-claim bonuses over time.');
  }
  
  if (!input.riskPoolId && (!input.riskPoolIds || input.riskPoolIds.length === 0)) {
    recommendations.push('Join a social risk pool with other reputable freelancers to potentially reduce your premium.');
  }
  
  return recommendations;
}

/**
 * Simple hash function for strings
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
