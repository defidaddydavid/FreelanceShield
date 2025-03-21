/**
 * Premium Calculation Engine for FreelanceShield
 * 
 * This module contains functions for dynamically calculating insurance premiums
 * based on various input parameters.
 */

import { RISK_WEIGHTS } from '@/lib/solana/constants';

// Base rate in USDC for insurance premium calculations
const BASE_RATE_USDC = 10;

// Maximum coverage ratio for non-linear scaling
const MAX_COVERAGE_RATIO = 5.0;

// Minimum coverage period in days
const MIN_COVERAGE_PERIOD_DAYS = 30;

// Multipliers for different coverage periods
const PERIOD_MULTIPLIERS = {
  "1month": 1.0,
  "3months": 0.95, // 5% discount for 3 months
  "6months": 0.90, // 10% discount for 6 months
  "1year": 0.80,   // 20% discount for 1 year
};

// Default reputation score if not provided
const DEFAULT_REPUTATION_SCORE = 75;

// Market volatility factor (this could be fetched from an API in a real implementation)
const MARKET_VOLATILITY = 1.05; // Slightly volatile market (5% increase)

/**
 * Calculate coverage ratio multiplier based on coverage amount and project value
 */
const calculateCoverageRatioMultiplier = (coverageAmount: number, projectValue: number): number => {
  const ratio = coverageAmount / projectValue;
  
  // If coverage is less than project value, lower multiplier
  // If coverage equals project value, multiplier is 1
  // If coverage is more than project value, higher multiplier
  if (ratio < 0.5) return 0.8;
  if (ratio < 0.75) return 0.9;
  if (ratio < 1) return 1.0;
  if (ratio < 1.25) return 1.1;
  if (ratio < 1.5) return 1.2;
  return 1.3; // For coverage that's 150% or more of project value
};

/**
 * Calculate risk multiplier based on risk tolerance (0-100)
 * Lower risk tolerance = higher premium (higher multiplier)
 * Higher risk tolerance = lower premium (lower multiplier)
 */
const calculateRiskMultiplier = (riskTolerance: number): number => {
  // Convert 0-100 scale to a 1.5-0.8 multiplier range
  // 0 (lowest risk tolerance) = 1.5 multiplier
  // 100 (highest risk tolerance) = 0.8 multiplier
  return 1.5 - (riskTolerance / 100) * 0.7;
};

/**
 * Calculate reputation adjustment based on user's reputation score
 */
const calculateReputationAdjustment = (reputationScore: number = DEFAULT_REPUTATION_SCORE): number => {
  // Convert 0-100 scale to a 1.5-0.8 multiplier range
  // 0 (lowest reputation) = 1.5 multiplier (higher premium)
  // 100 (highest reputation) = 0.8 multiplier (lower premium)
  return 1.5 - (reputationScore / 100) * 0.7;
};

/**
 * Calculate job type and industry risk adjustment
 */
const calculateRiskAdjustment = (jobType: string, industry: string): number => {
  const jobTypeRisk = RISK_WEIGHTS.jobTypes[jobType as keyof typeof RISK_WEIGHTS.jobTypes] || 1.0;
  const industryRisk = RISK_WEIGHTS.industries[industry as keyof typeof RISK_WEIGHTS.industries] || 1.0;
  return jobTypeRisk * industryRisk;
};

/**
 * Calculate period adjustment based on days
 */
const calculatePeriodAdjustment = (periodDays: number): number => {
  return Math.pow(periodDays / MIN_COVERAGE_PERIOD_DAYS, 1.1);
};

/**
 * Main premium calculation function that combines all factors
 */
export const calculatePremium = (
  projectValue: number,
  coverageAmount: number,
  coveragePeriod: string,
  riskTolerance: number,
  reputationScore: number = DEFAULT_REPUTATION_SCORE
): {
  premium: number;
  breakdown: {
    baseRate: number;
    coverageRatioMultiplier: number;
    periodMultiplier: number;
    riskMultiplier: number;
    reputationAdjustment: number;
    marketVolatility: number;
  };
} => {
  // Validate inputs
  if (projectValue <= 0 || coverageAmount <= 0) {
    throw new Error("Project value and coverage amount must be positive numbers");
  }
  
  // Calculate individual factors
  const coverageRatioMultiplier = calculateCoverageRatioMultiplier(coverageAmount, projectValue);
  const periodMultiplier = PERIOD_MULTIPLIERS[coveragePeriod as keyof typeof PERIOD_MULTIPLIERS] || 1.0;
  const riskMultiplier = calculateRiskMultiplier(riskTolerance);
  const reputationAdjustment = calculateReputationAdjustment(reputationScore);
  
  // Calculate final premium
  const premium = BASE_RATE_USDC * 
    coverageRatioMultiplier * 
    periodMultiplier * 
    riskMultiplier * 
    reputationAdjustment * 
    MARKET_VOLATILITY;
  
  // Return premium and breakdown of factors
  return {
    premium: Number(premium.toFixed(2)),
    breakdown: {
      baseRate: BASE_RATE_USDC,
      coverageRatioMultiplier,
      periodMultiplier,
      riskMultiplier,
      reputationAdjustment,
      marketVolatility: MARKET_VOLATILITY
    }
  };
};

/**
 * Format a number as USDC with 2 decimal places
 */
export const formatUSDC = (amount: number): string => {
  return `${amount.toFixed(2)} USDC`;
};

/**
 * Generate a description for a multiplier's impact on the premium
 */
export const getMultiplierDescription = (
  name: string,
  value: number,
  isPositive: boolean = value < 1
): string => {
  const percentage = Math.abs((value - 1) * 100).toFixed(0);
  const impact = isPositive ? "decrease" : "increase";
  
  return `${name} (${value.toFixed(2)}): ${percentage}% ${impact}`;
};
