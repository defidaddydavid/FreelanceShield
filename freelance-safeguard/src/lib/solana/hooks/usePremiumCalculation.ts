import { useState, useCallback } from 'react';
import { useReputationSystem } from '@/lib/hooks/useReputationSystem';
import { PREMIUM_RATES, NETWORK_CONFIG, RISK_WEIGHTS } from '../constants';

// Define premium calculation constants
const PREMIUM_CONSTANTS = {
  baseRate: PREMIUM_RATES.baseRate,
  coverageRatioMultiplier: PREMIUM_RATES.coverageRatioMultiplier,
  periodMultiplier: 0.1, // Exponent for period calculation
  minPremium: PREMIUM_RATES.minPremium || 1,
  minCoveragePeriodDays: NETWORK_CONFIG.minPeriodDays,
  maxCoveragePeriodDays: NETWORK_CONFIG.maxPeriodDays,
  maxCoverageRatio: 5.0
};

interface PremiumCalculationParams {
  coverageAmount: number;
  periodDays: number;
  jobType: string;
  industry: string;
  userAddress?: string;
}

interface PremiumCalculationResult {
  premiumAmount: number;
  baseRate: number;
  coverageRatio: number;
  periodAdjustment: number;
  riskAdjustment: number;
  reputationFactor: number;
  totalRiskScore: number;
}

export function usePremiumCalculation() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getReputationFactor } = useReputationSystem();

  const calculatePremium = useCallback(
    async ({
      coverageAmount,
      periodDays,
      jobType,
      industry,
      userAddress
    }: PremiumCalculationParams): Promise<PremiumCalculationResult> => {
      setIsCalculating(true);
      setError(null);

      try {
        // 1. Base rate (in USDC)
        const baseRate = PREMIUM_CONSTANTS.baseRate;

        // 2. Coverage ratio adjustment (non-linear scaling)
        // Higher coverage amounts have progressively higher premiums
        const coverageRatio = Math.pow(
          coverageAmount / NETWORK_CONFIG.minCoverageAmount,
          PREMIUM_CONSTANTS.coverageRatioMultiplier / 10
        );

        // 3. Period adjustment (exponential increase for longer periods)
        // Longer periods have progressively higher premiums
        const periodRatio = periodDays / NETWORK_CONFIG.minPeriodDays;
        const periodAdjustment = Math.pow(periodRatio, PREMIUM_CONSTANTS.periodMultiplier);

        // 4. Risk adjustment based on job type and industry
        const jobTypeKey = jobType.toLowerCase().replace(/\s+/g, '_');
        const industryKey = industry.toLowerCase().replace(/\s+/g, '_');
        
        const jobTypeRisk = RISK_WEIGHTS.jobTypes[jobTypeKey] || RISK_WEIGHTS.jobTypes.other;
        const industryRisk = RISK_WEIGHTS.industries[industryKey] || RISK_WEIGHTS.industries.other;
        const riskAdjustment = (jobTypeRisk + industryRisk) / 2;

        // 5. Reputation factor (if user address is provided)
        let reputationFactor = 1.0; // Default for new users
        if (userAddress) {
          try {
            const { factor } = await getReputationFactor();
            reputationFactor = factor;
          } catch (err) {
            console.warn('Could not retrieve reputation factor, using default:', err);
          }
        }

        // 6. Calculate risk score (0-100)
        const riskScore = 
          (riskAdjustment * 20) + // Risk adjustment (20%)
          (coverageRatio * 30) +  // Coverage impact (30%)
          ((2 - reputationFactor) * 50); // Reputation impact (50%)

        const totalRiskScore = Math.min(100, Math.max(0, riskScore));

        // 7. Calculate final premium
        const premiumAmount = Math.ceil(
          baseRate * 
          coverageRatio * 
          periodAdjustment * 
          riskAdjustment * 
          reputationFactor
        );

        // Ensure premium is not below minimum
        const finalPremium = Math.max(premiumAmount, PREMIUM_CONSTANTS.minPremium);

        return {
          premiumAmount: finalPremium,
          baseRate,
          coverageRatio,
          periodAdjustment,
          riskAdjustment,
          reputationFactor,
          totalRiskScore
        };
      } catch (err) {
        console.error('Error calculating premium:', err);
        setError('Failed to calculate premium. Please try again.');
        throw err;
      } finally {
        setIsCalculating(false);
      }
    },
    [getReputationFactor]
  );

  return {
    calculatePremium,
    isCalculating,
    error
  };
}
