import { AIPremiumInput } from './types';
import { FIVF_CONSTANTS } from './constants';

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
  
  // Analyze trend in payment amounts
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
