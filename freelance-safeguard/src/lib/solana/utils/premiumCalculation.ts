import { PremiumCalculationParams } from '../hooks/useSolanaInsurance';
import { PremiumCalculationResult } from '../types';
import { RISK_WEIGHTS, PREMIUM_RATES, formatUSDC, parseUSDC } from '../constants';

/**
 * Calculate insurance premium based on coverage amount, period, job type, and industry
 * 
 * The premium calculation uses the following formula:
 * Premium = BaseRate * CoverageRatio * PeriodAdjustment * RiskAdjustment * ReputationFactor * MarketConditions
 * 
 * @param params Premium calculation parameters
 * @returns Premium calculation result with breakdown
 */
export function calculatePremium(params: PremiumCalculationParams): PremiumCalculationResult {
  const {
    coverageAmount,
    periodDays,
    jobType,
    industry,
    reputationScore = 0.9
  } = params;

  // Base rate (in USDC)
  const baseRate = PREMIUM_RATES.baseRate;

  // Coverage ratio (non-linear scaling)
  const coverageRatio = Math.pow(coverageAmount / 1000, PREMIUM_RATES.coverageRatioMultiplier);

  // Period adjustment (exponential increase for longer periods)
  const periodAdjustment = Math.pow(periodDays / 30, PREMIUM_RATES.periodMultiplier);

  // Risk adjustment based on job type and industry
  const jobTypeRisk = RISK_WEIGHTS.jobTypes[jobType as keyof typeof RISK_WEIGHTS.jobTypes] || 1.0;
  const industryRisk = RISK_WEIGHTS.industries[industry as keyof typeof RISK_WEIGHTS.industries] || 1.0;
  const riskAdjustment = jobTypeRisk * industryRisk;

  // Reputation factor (lower reputation = higher premium)
  const reputationFactor = 2 - reputationScore;

  // Market conditions (could be dynamic based on market data)
  const marketConditions = 1.0;

  // Calculate premium in USDC
  let premiumUSDC = baseRate * coverageRatio * periodAdjustment * riskAdjustment * reputationFactor * marketConditions;
  
  // Ensure minimum premium
  premiumUSDC = Math.max(premiumUSDC, PREMIUM_RATES.minPremium);

  // Calculate risk score
  const riskScore = Math.min(
    100,
    (riskAdjustment * 20 + 
     0 * 15 + // No claims history in the calculation, so using 0
     (coverageRatio * 30) + 
     ((2 - reputationFactor) * 35)) // Convert reputation factor to impact
  );

  return {
    premiumUSDC: Number(premiumUSDC.toFixed(2)),
    riskScore: Number(riskScore.toFixed(2)),
    breakdownFactors: {
      baseRate,
      coverageRatio: Number(coverageRatio.toFixed(2)),
      periodAdjustment: Number(periodAdjustment.toFixed(2)),
      riskAdjustment: Number(riskAdjustment.toFixed(2)),
      reputationFactor: Number(reputationFactor.toFixed(2)),
      marketConditions: Number(marketConditions.toFixed(2))
    }
  };
}

/**
 * Calculate the maximum coverage amount based on the risk pool's total value locked
 * and the risk adjustment factors
 * 
 * @param totalValueLocked Total value locked in the risk pool (in USDC)
 * @param jobType Job type
 * @param industry Industry
 * @returns Maximum coverage amount (in USDC)
 */
export function calculateMaxCoverage(
  totalValueLocked: number,
  jobType: string,
  industry: string
): number {
  // Get risk adjustment
  const jobTypeRisk = RISK_WEIGHTS.jobTypes[jobType as keyof typeof RISK_WEIGHTS.jobTypes] || 1.0;
  const industryRisk = RISK_WEIGHTS.industries[industry as keyof typeof RISK_WEIGHTS.industries] || 1.0;
  const riskAdjustment = jobTypeRisk * industryRisk;
  
  // Calculate max coverage (higher risk = lower max coverage)
  const maxCoverageRatio = 0.5 / riskAdjustment;
  
  // Apply max coverage ratio to total value locked
  const maxCoverage = totalValueLocked * maxCoverageRatio;
  
  return Math.min(maxCoverage, 10000); // Cap at 10,000 USDC
}

/**
 * Calculate the solvency score of the risk pool based on the reserve ratio
 * and active policies
 * 
 * @param reserveRatio Current reserve ratio
 * @param activePolicies Number of active policies
 * @returns Solvency score (0-100)
 */
export function calculateSolvencyScore(
  reserveRatio: number,
  activePolicies: number
): number {
  // Base solvency score from reserve ratio
  const baseScore = Math.min(100, reserveRatio * 100);
  
  // Adjustment based on policy diversification
  const diversificationFactor = Math.min(1, activePolicies / 20);
  
  // Calculate final score
  const solvencyScore = baseScore * (0.8 + 0.2 * diversificationFactor);
  
  return Number(solvencyScore.toFixed(2));
}
