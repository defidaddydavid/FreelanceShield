import { RISK_WEIGHTS } from '@/lib/solana/constants';
import { 
  AIPremiumInput, 
  AIPremiumCalculation
} from './aiRiskModeling';

// Import enhanced Monte Carlo simulation and premium adjustment modules
import {
  simulateClaimProbability,
  adjustPremiumUsingMonteCarlo,
  getDynamicPremiumAdjustment,
  MONTE_CARLO_CONFIG
} from './monteCarloSimulation';

import {
  applyVolatilityAdjustment,
  applyReputationFactor,
  applyEscrowDiscount,
  applyProbabilisticDiscounts,
  getDefaultMarketVolatilityData,
  getDefaultReputationData,
  getDefaultEscrowData
} from './premiumAdjustments';

// Base rate in USDC
const BASE_RATE_USDC = 10;

// Current reserve-to-premium ratio (in a real implementation, this would be fetched from a database)
const CURRENT_RESERVE_RATIO = 1.3;

/**
 * Calculate premium using enhanced AI risk modeling with Monte Carlo simulations
 */
export function calculateAIPremium(input: AIPremiumInput): AIPremiumCalculation {
  // Calculate base coverage ratio (non-linear scaling)
  const coverageRatio = Math.pow(input.coverageAmount / 1000, 0.8);
  
  // Calculate period adjustment (exponential increase for longer periods)
  const periodAdjustment = Math.pow(input.periodDays / 30, 1.2);
  
  // Calculate risk adjustment based on job type and industry
  const jobTypeRisk = RISK_WEIGHTS.jobTypes[input.jobType] || 1.0;
  const industryRisk = RISK_WEIGHTS.industries[input.industry] || 1.0;
  const riskAdjustment = (jobTypeRisk * 0.6) + (industryRisk * 0.4);
  
  // Calculate reputation factor (0.7-1.0 range)
  const reputationFactor = 1.0 - (Math.min(input.reputationScore, 100) / 100) * 0.3;
  
  // Calculate claims impact
  const claimsImpact = 1.0 + (input.claimHistory * 0.2);
  
  // Run enhanced Monte Carlo simulation with 10,000+ iterations
  const monteCarloResults = simulateClaimProbability(
    input,
    MONTE_CARLO_CONFIG.DEFAULT_ITERATIONS,
    0.05 // Base failure rate
  );
  
  // Get dynamic premium adjustment based on risk profile
  const dynamicAdjustment = getDynamicPremiumAdjustment(
    input.reputationScore,
    reputationFactor,
    (input.escrowTransactionCount || 0) > 0
  );
  
  // Calculate base premium
  const basePremium = Math.max(1, Math.round(
    BASE_RATE_USDC * 
    coverageRatio * 
    periodAdjustment * 
    riskAdjustment * 
    reputationFactor * 
    claimsImpact * 
    dynamicAdjustment
  ));
  
  // Apply Monte Carlo simulation results to adjust premium
  const monteCarloAdjustedPremium = adjustPremiumUsingMonteCarlo(
    monteCarloResults,
    basePremium
  );
  
  // Apply USDC transaction volatility adjustment
  const volatilityData = getDefaultMarketVolatilityData();
  const volatilityAdjustment = applyVolatilityAdjustment(
    monteCarloAdjustedPremium,
    volatilityData
  );
  
  // Apply reputation-weighted pricing
  const reputationData = getDefaultReputationData(input.reputationScore);
  const reputationAdjustment = applyReputationFactor(
    reputationData,
    volatilityAdjustment.adjustedPremium
  );
  
  // Apply escrow utilization discount
  const escrowData = getDefaultEscrowData(
    input.escrowTransactionCount,
    input.transactionCount
  );
  const escrowAdjustment = applyEscrowDiscount(
    escrowData,
    reputationAdjustment.adjustedPremium
  );
  
  // Apply probabilistic discount factors
  const probabilisticAdjustment = applyProbabilisticDiscounts(
    input,
    escrowAdjustment.adjustedPremium
  );
  
  // Calculate final premium
  const premiumUSDC = Math.max(1, Math.round(probabilisticAdjustment.adjustedPremium));
  
  // Calculate risk score (0-100 scale)
  const riskScore = Math.min(100, Math.round(
    (riskAdjustment * 15) + 
    (claimsImpact * 10) + 
    (coverageRatio * 5) + 
    (reputationFactor * 25) + 
    (monteCarloResults.riskDecile * 4.5)
  ));
  
  // Calculate risk bucket based on Monte Carlo simulation
  const riskBucket = monteCarloResults.riskBucket;
  
  // Generate risk segmentation data
  const riskSegmentation = {
    bucket: riskBucket,
    score: riskScore,
    claimProbability: monteCarloResults.claimProbability,
    confidenceInterval: monteCarloResults.confidenceInterval,
    tailRisk: monteCarloResults.tailRisk,
    varianceContributions: monteCarloResults.varianceContributions
  };
  
  // Generate time-based projections
  const timeBasedProjections = {
    oneMonth: Math.round(premiumUSDC * 1.0),
    threeMonths: Math.round(premiumUSDC * 2.85), // 5% discount for 3 months
    sixMonths: Math.round(premiumUSDC * 5.4), // 10% discount for 6 months
    oneYear: Math.round(premiumUSDC * 9.6) // 20% discount for 1 year
  };
  
  // Generate recommended actions to lower premium
  const recommendedActions = generateRecommendedActions(input, monteCarloResults);
  
  // Return comprehensive premium calculation result
  return {
    premiumUSDC,
    riskScore,
    wri: calculateWRI(input),
    breakdownFactors: {
      baseRate: BASE_RATE_USDC,
      coverageRatio,
      periodAdjustment,
      riskAdjustment,
      reputationFactor,
      wriAdjustment: dynamicAdjustment,
      fivfAdjustment: volatilityAdjustment.adjustmentFactor,
      marketSentimentAdjustment: volatilityData.freelanceMarketVolatility,
      socialRiskPoolAdjustment: 0, // Not implemented in this version
      escrowDiscountAdjustment: -escrowAdjustment.discountFactor, // Negative because it's a discount
      osriAdjustment: volatilityData.solanaVolatility,
      bayesianAdjustment: 0, // Not implemented in this version
      monteCarloRiskAdjustment: monteCarloResults.premiumAdjustment,
      srprAdjustment: calculateSRPRAdjustment(CURRENT_RESERVE_RATIO),
      loyaltyAdjustment: -probabilisticAdjustment.breakdown.longTermEngagementDiscount,
      conditionalRiskAdjustment: 0 // Not implemented in this version
    },
    riskDecile: monteCarloResults.riskDecile,
    simulationResults: monteCarloResults,
    recommendedActions,
    timeBasedProjections,
    riskSegmentation
  };
}

/**
 * Calculate Weighted Reputation Index (WRI)
 */
function calculateWRI(input: AIPremiumInput): number {
  // Implementation simplified for brevity
  const baseWRI = (input.reputationScore / 100) * 0.8;
  const transactionFactor = input.transactionCount ? Math.min(1, input.transactionCount / 50) * 0.1 : 0;
  const escrowFactor = input.escrowTransactionCount ? Math.min(1, input.escrowTransactionCount / 20) * 0.1 : 0;
  
  return baseWRI + transactionFactor + escrowFactor;
}

/**
 * Calculate Stable Reserve-to-Premium Ratio adjustment
 */
function calculateSRPRAdjustment(currentRatio: number): number {
  const targetRatio = 1.35;
  const minRatio = 1.2;
  const maxRatio = 1.5;
  
  if (currentRatio < minRatio) {
    // Below minimum threshold, increase premiums
    return 0.1 * (1 - (currentRatio / minRatio));
  } else if (currentRatio > maxRatio) {
    // Above maximum threshold, decrease premiums
    return -0.05 * ((currentRatio - maxRatio) / maxRatio);
  } else {
    // Within acceptable range, minor adjustment
    return 0.02 * ((targetRatio - currentRatio) / targetRatio);
  }
}

/**
 * Generate recommended actions to lower premium based on Monte Carlo simulation results
 */
function generateRecommendedActions(
  input: AIPremiumInput, 
  monteCarloResults: any
): string[] {
  const actions: string[] = [];
  
  // Analyze variance contributions to identify highest risk factors
  const varianceContributions = monteCarloResults.varianceContributions;
  const sortedFactors = Object.entries(varianceContributions)
    .sort((a, b) => b[1] as number - (a[1] as number))
    .slice(0, 3);
  
  // Generate recommendations based on top risk factors
  for (const [factor, contribution] of sortedFactors) {
    switch (factor) {
      case 'jobType':
        actions.push('Consider specializing in lower-risk job types like software development or writing');
        break;
      case 'industry':
        actions.push('Consider focusing on lower-risk industries like technology or education');
        break;
      case 'reputation':
        actions.push('Improve your reputation score by completing more projects successfully and getting positive reviews');
        break;
      case 'escrowUsage':
        actions.push('Increase your use of escrow payments to reduce risk and qualify for escrow discounts');
        break;
      case 'claimHistory':
        actions.push('Maintain a clean claims history to qualify for no-claims discounts');
        break;
      case 'usdcVolatility':
        actions.push('Consider longer-term contracts during periods of high market volatility');
        break;
    }
  }
  
  // Add general recommendations
  if (input.escrowTransactionCount === 0 || !input.escrowTransactionCount) {
    actions.push('Start using escrow-backed payments to receive premium discounts');
  }
  
  if (input.reputationScore < 80) {
    actions.push('Focus on improving your overall reputation score to qualify for better rates');
  }
  
  return actions;
}
