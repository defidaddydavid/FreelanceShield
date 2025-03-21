/**
 * Premium Adjustment Engine for FreelanceShield
 * 
 * This module implements dynamic AI-driven premium adjustments based on
 * real-time risk metrics, reputation factors, and escrow utilization.
 */

import { AIPremiumInput } from './aiRiskModeling';

// Configuration for premium adjustments
export const PREMIUM_ADJUSTMENT_CONFIG = {
  // Volatility adjustment parameters
  VOLATILITY: {
    BASE_FACTOR: 1.0,
    LOW_THRESHOLD: 0.01,
    MEDIUM_THRESHOLD: 0.03,
    HIGH_THRESHOLD: 0.05,
    LOW_ADJUSTMENT: 0.95, // 5% discount
    MEDIUM_ADJUSTMENT: 1.0, // No adjustment
    HIGH_ADJUSTMENT: 1.15, // 15% increase
    CRITICAL_ADJUSTMENT: 1.3, // 30% increase
    WEIGHT: 0.3 // Weight in overall adjustment
  },
  
  // Reputation factor parameters
  REPUTATION: {
    EXCELLENT_THRESHOLD: 90,
    GOOD_THRESHOLD: 75,
    AVERAGE_THRESHOLD: 60,
    POOR_THRESHOLD: 40,
    EXCELLENT_ADJUSTMENT: 0.8, // 20% discount
    GOOD_ADJUSTMENT: 0.9, // 10% discount
    AVERAGE_ADJUSTMENT: 1.0, // No adjustment
    POOR_ADJUSTMENT: 1.2, // 20% increase
    VERY_POOR_ADJUSTMENT: 1.5, // 50% increase
    HISTORY_WEIGHT: 0.6, // Weight for historical reputation
    RECENT_WEIGHT: 0.4, // Weight for recent activity
    WEIGHT: 0.4 // Weight in overall adjustment
  },
  
  // Escrow utilization parameters
  ESCROW: {
    HIGH_USAGE_THRESHOLD: 0.75, // 75% of transactions use escrow
    MEDIUM_USAGE_THRESHOLD: 0.5, // 50% of transactions use escrow
    LOW_USAGE_THRESHOLD: 0.25, // 25% of transactions use escrow
    HIGH_USAGE_DISCOUNT: 0.85, // 15% discount
    MEDIUM_USAGE_DISCOUNT: 0.9, // 10% discount
    LOW_USAGE_DISCOUNT: 0.95, // 5% discount
    NO_USAGE_ADJUSTMENT: 1.0, // No adjustment
    CONSECUTIVE_MULTIPLIER: 0.98, // 2% additional discount per consecutive escrow use
    MAX_CONSECUTIVE_DISCOUNT: 0.1, // Maximum 10% additional discount
    WEIGHT: 0.3 // Weight in overall adjustment
  },
  
  // Market conditions parameters
  MARKET: {
    STABLE_RANGE: 0.01, // ±1% change is considered stable
    MODERATE_RANGE: 0.03, // ±3% change is considered moderate
    STABLE_ADJUSTMENT: 1.0, // No adjustment
    MODERATE_ADJUSTMENT: 1.05, // 5% increase
    VOLATILE_ADJUSTMENT: 1.15, // 15% increase
    EXTREME_ADJUSTMENT: 1.25, // 25% increase
    WEIGHT: 0.2 // Weight in overall adjustment
  },
  
  // Time-based adjustment parameters
  TIME: {
    RECENT_ACTIVITY_DAYS: 30, // Last 30 days considered recent
    MEDIUM_TERM_DAYS: 90, // Last 90 days considered medium-term
    RECENT_WEIGHT: 0.5, // Weight for recent activity
    MEDIUM_WEIGHT: 0.3, // Weight for medium-term activity
    HISTORICAL_WEIGHT: 0.2 // Weight for historical activity
  }
};

/**
 * Interface for market volatility data
 */
export interface MarketVolatilityData {
  usdcVolatility: number;
  solanaVolatility: number;
  freelanceMarketVolatility: number;
  liquidityRisk: number;
  timestamp: number;
}

/**
 * Interface for reputation data
 */
export interface ReputationData {
  overallScore: number;
  paymentHistory: {
    onTimePayments: number;
    latePayments: number;
    missedPayments: number;
  };
  clientFeedback: {
    positiveReviews: number;
    neutralReviews: number;
    negativeReviews: number;
    averageRating: number;
  };
  engagementHistory: {
    completedProjects: number;
    canceledProjects: number;
    disputedProjects: number;
    totalMonths: number;
  };
}

/**
 * Interface for escrow utilization data
 */
export interface EscrowUtilizationData {
  totalTransactions: number;
  escrowTransactions: number;
  consecutiveEscrowUse: number;
  averageEscrowAmount: number;
  verifiedEscrowTransactions: number;
}

/**
 * Apply volatility adjustment to premium based on market conditions
 * @param basePremium Base premium amount
 * @param marketVolatilityData Market volatility data
 * @returns Adjusted premium
 */
export function applyVolatilityAdjustment(
  basePremium: number,
  marketVolatilityData: MarketVolatilityData
): {
  adjustedPremium: number;
  adjustmentFactor: number;
  breakdown: {
    usdcComponent: number;
    solanaComponent: number;
    freelanceMarketComponent: number;
    liquidityComponent: number;
  };
} {
  const config = PREMIUM_ADJUSTMENT_CONFIG.VOLATILITY;
  
  // Calculate USDC volatility component
  let usdcAdjustment: number;
  if (marketVolatilityData.usdcVolatility <= config.LOW_THRESHOLD) {
    usdcAdjustment = config.LOW_ADJUSTMENT;
  } else if (marketVolatilityData.usdcVolatility <= config.MEDIUM_THRESHOLD) {
    usdcAdjustment = config.MEDIUM_ADJUSTMENT;
  } else if (marketVolatilityData.usdcVolatility <= config.HIGH_THRESHOLD) {
    usdcAdjustment = config.HIGH_ADJUSTMENT;
  } else {
    usdcAdjustment = config.CRITICAL_ADJUSTMENT;
  }
  
  // Calculate Solana volatility component
  let solanaAdjustment: number;
  if (marketVolatilityData.solanaVolatility <= config.LOW_THRESHOLD) {
    solanaAdjustment = config.LOW_ADJUSTMENT;
  } else if (marketVolatilityData.solanaVolatility <= config.MEDIUM_THRESHOLD) {
    solanaAdjustment = config.MEDIUM_ADJUSTMENT;
  } else if (marketVolatilityData.solanaVolatility <= config.HIGH_THRESHOLD) {
    solanaAdjustment = config.HIGH_ADJUSTMENT;
  } else {
    solanaAdjustment = config.CRITICAL_ADJUSTMENT;
  }
  
  // Calculate freelance market volatility component
  let freelanceMarketAdjustment: number;
  if (marketVolatilityData.freelanceMarketVolatility <= config.LOW_THRESHOLD) {
    freelanceMarketAdjustment = config.LOW_ADJUSTMENT;
  } else if (marketVolatilityData.freelanceMarketVolatility <= config.MEDIUM_THRESHOLD) {
    freelanceMarketAdjustment = config.MEDIUM_ADJUSTMENT;
  } else if (marketVolatilityData.freelanceMarketVolatility <= config.HIGH_THRESHOLD) {
    freelanceMarketAdjustment = config.HIGH_ADJUSTMENT;
  } else {
    freelanceMarketAdjustment = config.CRITICAL_ADJUSTMENT;
  }
  
  // Calculate liquidity risk component
  let liquidityAdjustment: number;
  if (marketVolatilityData.liquidityRisk <= config.LOW_THRESHOLD) {
    liquidityAdjustment = config.LOW_ADJUSTMENT;
  } else if (marketVolatilityData.liquidityRisk <= config.MEDIUM_THRESHOLD) {
    liquidityAdjustment = config.MEDIUM_ADJUSTMENT;
  } else if (marketVolatilityData.liquidityRisk <= config.HIGH_THRESHOLD) {
    liquidityAdjustment = config.HIGH_ADJUSTMENT;
  } else {
    liquidityAdjustment = config.CRITICAL_ADJUSTMENT;
  }
  
  // Calculate weighted average adjustment
  const usdcComponent = usdcAdjustment * 0.3;
  const solanaComponent = solanaAdjustment * 0.3;
  const freelanceMarketComponent = freelanceMarketAdjustment * 0.2;
  const liquidityComponent = liquidityAdjustment * 0.2;
  
  const adjustmentFactor = 
    usdcComponent + 
    solanaComponent + 
    freelanceMarketComponent + 
    liquidityComponent;
  
  // Apply adjustment to premium
  const adjustedPremium = basePremium * adjustmentFactor;
  
  return {
    adjustedPremium: Math.round(adjustedPremium * 100) / 100,
    adjustmentFactor,
    breakdown: {
      usdcComponent,
      solanaComponent,
      freelanceMarketComponent,
      liquidityComponent
    }
  };
}

/**
 * Apply reputation factor to premium based on user reputation
 * @param userReputationData User reputation data
 * @param basePremium Base premium amount
 * @returns Adjusted premium
 */
export function applyReputationFactor(
  userReputationData: ReputationData,
  basePremium: number
): {
  adjustedPremium: number;
  adjustmentFactor: number;
  breakdown: {
    overallScoreComponent: number;
    paymentHistoryComponent: number;
    clientFeedbackComponent: number;
    engagementHistoryComponent: number;
  };
} {
  const config = PREMIUM_ADJUSTMENT_CONFIG.REPUTATION;
  
  // Calculate overall score component
  let overallScoreAdjustment: number;
  if (userReputationData.overallScore >= config.EXCELLENT_THRESHOLD) {
    overallScoreAdjustment = config.EXCELLENT_ADJUSTMENT;
  } else if (userReputationData.overallScore >= config.GOOD_THRESHOLD) {
    overallScoreAdjustment = config.GOOD_ADJUSTMENT;
  } else if (userReputationData.overallScore >= config.AVERAGE_THRESHOLD) {
    overallScoreAdjustment = config.AVERAGE_ADJUSTMENT;
  } else if (userReputationData.overallScore >= config.POOR_THRESHOLD) {
    overallScoreAdjustment = config.POOR_ADJUSTMENT;
  } else {
    overallScoreAdjustment = config.VERY_POOR_ADJUSTMENT;
  }
  
  // Calculate payment history component
  const totalPayments = 
    userReputationData.paymentHistory.onTimePayments + 
    userReputationData.paymentHistory.latePayments + 
    userReputationData.paymentHistory.missedPayments;
  
  let paymentHistoryAdjustment = config.AVERAGE_ADJUSTMENT;
  if (totalPayments > 0) {
    const onTimeRatio = userReputationData.paymentHistory.onTimePayments / totalPayments;
    const missedRatio = userReputationData.paymentHistory.missedPayments / totalPayments;
    
    if (onTimeRatio >= 0.95) {
      paymentHistoryAdjustment = config.EXCELLENT_ADJUSTMENT;
    } else if (onTimeRatio >= 0.85) {
      paymentHistoryAdjustment = config.GOOD_ADJUSTMENT;
    } else if (missedRatio >= 0.2) {
      paymentHistoryAdjustment = config.VERY_POOR_ADJUSTMENT;
    } else if (missedRatio >= 0.1) {
      paymentHistoryAdjustment = config.POOR_ADJUSTMENT;
    }
  }
  
  // Calculate client feedback component
  let clientFeedbackAdjustment = config.AVERAGE_ADJUSTMENT;
  if (userReputationData.clientFeedback.averageRating >= 4.8) {
    clientFeedbackAdjustment = config.EXCELLENT_ADJUSTMENT;
  } else if (userReputationData.clientFeedback.averageRating >= 4.5) {
    clientFeedbackAdjustment = config.GOOD_ADJUSTMENT;
  } else if (userReputationData.clientFeedback.averageRating <= 3.0) {
    clientFeedbackAdjustment = config.VERY_POOR_ADJUSTMENT;
  } else if (userReputationData.clientFeedback.averageRating <= 3.5) {
    clientFeedbackAdjustment = config.POOR_ADJUSTMENT;
  }
  
  // Calculate engagement history component
  let engagementHistoryAdjustment = config.AVERAGE_ADJUSTMENT;
  const totalProjects = 
    userReputationData.engagementHistory.completedProjects + 
    userReputationData.engagementHistory.canceledProjects + 
    userReputationData.engagementHistory.disputedProjects;
  
  if (totalProjects > 0) {
    const completionRatio = userReputationData.engagementHistory.completedProjects / totalProjects;
    const disputeRatio = userReputationData.engagementHistory.disputedProjects / totalProjects;
    
    if (completionRatio >= 0.95) {
      engagementHistoryAdjustment = config.EXCELLENT_ADJUSTMENT;
    } else if (completionRatio >= 0.85) {
      engagementHistoryAdjustment = config.GOOD_ADJUSTMENT;
    } else if (disputeRatio >= 0.2) {
      engagementHistoryAdjustment = config.VERY_POOR_ADJUSTMENT;
    } else if (disputeRatio >= 0.1) {
      engagementHistoryAdjustment = config.POOR_ADJUSTMENT;
    }
  }
  
  // Apply long-term engagement bonus
  if (userReputationData.engagementHistory.totalMonths >= 24) {
    engagementHistoryAdjustment *= 0.9; // 10% additional discount for 2+ years
  } else if (userReputationData.engagementHistory.totalMonths >= 12) {
    engagementHistoryAdjustment *= 0.95; // 5% additional discount for 1+ year
  }
  
  // Calculate weighted average adjustment
  const overallScoreComponent = overallScoreAdjustment * 0.4;
  const paymentHistoryComponent = paymentHistoryAdjustment * 0.3;
  const clientFeedbackComponent = clientFeedbackAdjustment * 0.2;
  const engagementHistoryComponent = engagementHistoryAdjustment * 0.1;
  
  const adjustmentFactor = 
    overallScoreComponent + 
    paymentHistoryComponent + 
    clientFeedbackComponent + 
    engagementHistoryComponent;
  
  // Apply adjustment to premium
  const adjustedPremium = basePremium * adjustmentFactor;
  
  return {
    adjustedPremium: Math.round(adjustedPremium * 100) / 100,
    adjustmentFactor,
    breakdown: {
      overallScoreComponent,
      paymentHistoryComponent,
      clientFeedbackComponent,
      engagementHistoryComponent
    }
  };
}

/**
 * Apply escrow utilization discount based on escrow usage
 * @param escrowData Escrow utilization data
 * @param basePremium Base premium amount
 * @returns Adjusted premium with escrow discount
 */
export function applyEscrowDiscount(
  escrowData: EscrowUtilizationData,
  basePremium: number
): {
  adjustedPremium: number;
  discountFactor: number;
  breakdown: {
    usageRatioDiscount: number;
    consecutiveUseDiscount: number;
    verificationBonus: number;
  };
} {
  const config = PREMIUM_ADJUSTMENT_CONFIG.ESCROW;
  
  // Calculate escrow usage ratio
  const usageRatio = escrowData.totalTransactions > 0 
    ? escrowData.escrowTransactions / escrowData.totalTransactions 
    : 0;
  
  // Calculate usage ratio discount
  let usageRatioDiscount: number;
  if (usageRatio >= config.HIGH_USAGE_THRESHOLD) {
    usageRatioDiscount = 1 - (1 - config.HIGH_USAGE_DISCOUNT);
  } else if (usageRatio >= config.MEDIUM_USAGE_THRESHOLD) {
    usageRatioDiscount = 1 - (1 - config.MEDIUM_USAGE_DISCOUNT);
  } else if (usageRatio >= config.LOW_USAGE_THRESHOLD) {
    usageRatioDiscount = 1 - (1 - config.LOW_USAGE_DISCOUNT);
  } else {
    usageRatioDiscount = 0; // No discount
  }
  
  // Calculate consecutive use discount
  const consecutiveMultiplier = Math.pow(
    config.CONSECUTIVE_MULTIPLIER, 
    Math.min(escrowData.consecutiveEscrowUse, 10)
  );
  const consecutiveUseDiscount = 1 - consecutiveMultiplier;
  
  // Apply cap to consecutive use discount
  const cappedConsecutiveDiscount = Math.min(
    consecutiveUseDiscount, 
    config.MAX_CONSECUTIVE_DISCOUNT
  );
  
  // Calculate verification bonus
  const verificationRatio = escrowData.escrowTransactions > 0 
    ? escrowData.verifiedEscrowTransactions / escrowData.escrowTransactions 
    : 0;
  const verificationBonus = verificationRatio * 0.05; // Up to 5% additional discount
  
  // Calculate total discount factor
  const discountFactor = usageRatioDiscount + cappedConsecutiveDiscount + verificationBonus;
  
  // Apply discount to premium
  const adjustedPremium = basePremium * (1 - discountFactor);
  
  return {
    adjustedPremium: Math.round(adjustedPremium * 100) / 100,
    discountFactor,
    breakdown: {
      usageRatioDiscount,
      consecutiveUseDiscount: cappedConsecutiveDiscount,
      verificationBonus
    }
  };
}

/**
 * Apply probabilistic discount factors based on risk metrics
 * @param input User risk data
 * @param basePremium Base premium amount
 * @returns Adjusted premium with probabilistic discounts
 */
export function applyProbabilisticDiscounts(
  input: AIPremiumInput,
  basePremium: number
): {
  adjustedPremium: number;
  discountFactor: number;
  breakdown: {
    longTermEngagementDiscount: number;
    escrowBackedDiscount: number;
    lowRiskProfileDiscount: number;
  };
} {
  // Calculate long-term engagement discount
  const engagementMonths = input.policyAgeInMonths || 0;
  const longTermEngagementDiscount = Math.min(0.15, engagementMonths * 0.005);
  
  // Calculate escrow-backed discount
  const escrowTransactions = input.escrowTransactionCount || 0;
  const totalTransactions = input.transactionCount || 1;
  const escrowRatio = escrowTransactions / totalTransactions;
  const escrowBackedDiscount = Math.min(0.2, escrowRatio * 0.25);
  
  // Calculate low-risk profile discount
  const riskScore = 100 - input.reputationScore; // Lower reputation = higher risk
  let lowRiskProfileDiscount = 0;
  
  if (riskScore < 20) {
    // Very low risk (80+ reputation)
    lowRiskProfileDiscount = 0.1;
  } else if (riskScore < 30) {
    // Low risk (70-80 reputation)
    lowRiskProfileDiscount = 0.05;
  }
  
  // Calculate total discount factor
  const discountFactor = longTermEngagementDiscount + escrowBackedDiscount + lowRiskProfileDiscount;
  
  // Apply discount to premium
  const adjustedPremium = basePremium * (1 - discountFactor);
  
  return {
    adjustedPremium: Math.round(adjustedPremium * 100) / 100,
    discountFactor,
    breakdown: {
      longTermEngagementDiscount,
      escrowBackedDiscount,
      lowRiskProfileDiscount
    }
  };
}

/**
 * Get default market volatility data (in a real app, this would come from an API)
 */
export function getDefaultMarketVolatilityData(): MarketVolatilityData {
  return {
    usdcVolatility: 0.015,
    solanaVolatility: 0.025,
    freelanceMarketVolatility: 0.02,
    liquidityRisk: 0.01,
    timestamp: Date.now()
  };
}

/**
 * Get default reputation data (in a real app, this would come from a database)
 */
export function getDefaultReputationData(reputationScore: number): ReputationData {
  // Scale components based on overall reputation score
  const scoreRatio = reputationScore / 100;
  
  return {
    overallScore: reputationScore,
    paymentHistory: {
      onTimePayments: Math.round(10 * scoreRatio),
      latePayments: Math.round(2 * (1 - scoreRatio)),
      missedPayments: Math.round(1 * (1 - scoreRatio))
    },
    clientFeedback: {
      positiveReviews: Math.round(8 * scoreRatio),
      neutralReviews: Math.round(2 * (1 - scoreRatio) * 0.7),
      negativeReviews: Math.round(2 * (1 - scoreRatio) * 0.3),
      averageRating: 3 + (2 * scoreRatio)
    },
    engagementHistory: {
      completedProjects: Math.round(15 * scoreRatio),
      canceledProjects: Math.round(3 * (1 - scoreRatio) * 0.7),
      disputedProjects: Math.round(3 * (1 - scoreRatio) * 0.3),
      totalMonths: Math.round(24 * scoreRatio)
    }
  };
}

/**
 * Get default escrow utilization data (in a real app, this would come from a database)
 */
export function getDefaultEscrowData(escrowTransactionCount: number = 0, transactionCount: number = 0): EscrowUtilizationData {
  return {
    totalTransactions: transactionCount || 10,
    escrowTransactions: escrowTransactionCount || 5,
    consecutiveEscrowUse: Math.min(escrowTransactionCount || 0, 5),
    averageEscrowAmount: 500,
    verifiedEscrowTransactions: Math.floor((escrowTransactionCount || 5) * 0.8)
  };
}
