import { PublicKey } from '@solana/web3.js';
import { PREMIUM_RATES, NETWORK_CONFIG, RISK_WEIGHTS, CLAIM_RISK_CONSTANTS } from './solana/constants';

// Define premium calculation constants
export const PREMIUM_CONSTANTS = {
  baseRate: PREMIUM_RATES.baseRate,
  coverageRatioMultiplier: PREMIUM_RATES.coverageRatioMultiplier,
  periodMultiplier: 0.1, // Exponent for period calculation
  minPremium: PREMIUM_RATES.minPremium || 1,
  minCoveragePeriodDays: NETWORK_CONFIG.minPeriodDays,
  maxCoveragePeriodDays: NETWORK_CONFIG.maxPeriodDays,
  maxCoverageAmount: NETWORK_CONFIG.maxCoverageAmount
};

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind utility for merging class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency values
export function formatCurrency(amount: number, currency: string = "SOL", decimals: number = 2): string {
  return `${amount.toFixed(decimals)} ${currency}`;
}

// Format date to readable string
export function formatDate(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Truncate Solana address for display
export function truncateAddress(address: string, prefixLength: number = 4, suffixLength: number = 4): string {
  if (!address) return '';
  if (address.length <= prefixLength + suffixLength) return address;
  
  const prefix = address.slice(0, prefixLength);
  const suffix = address.slice(-suffixLength);
  
  return `${prefix}...${suffix}`;
}

// Calculate days remaining until a date
export function daysRemaining(endDate: Date | number): number {
  const end = typeof endDate === 'number' ? new Date(endDate) : endDate;
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Interface for premium calculation parameters
export interface PremiumCalculationParams {
  coverageAmount: number;
  periodDays: number;
  jobType: string;
  industry: string;
  reputationScore?: number;
  claimHistory?: number;
  marketConditions?: number;
}

// Calculate insurance premium based on parameters
export function calculatePremium(params: PremiumCalculationParams): { 
  premiumSOL: number;
  riskScore: number;
  breakdown: {
    baseRate: number;
    coverageImpact: number;
    periodImpact: number;
    riskAdjustment: number;
    reputationFactor: number;
    claimsImpact: number;
    marketConditions: number;
  }
} {
  // Base rate in SOL
  const baseRate = PREMIUM_CONSTANTS.baseRate;
  
  // Coverage amount impact (non-linear scaling)
  const coverageRatio = params.coverageAmount / PREMIUM_CONSTANTS.maxCoverageAmount;
  const coverageImpact = Math.pow(coverageRatio, PREMIUM_CONSTANTS.coverageRatioMultiplier);
  
  // Period impact (exponential increase for longer periods)
  const periodRatio = params.periodDays / PREMIUM_CONSTANTS.minCoveragePeriodDays;
  const periodImpact = Math.pow(periodRatio, PREMIUM_CONSTANTS.periodMultiplier);
  
  // Risk adjustment based on job type and industry
  const jobTypeKey = params.jobType.toLowerCase().replace(/\s+/g, '_');
  const industryKey = params.industry.toLowerCase().replace(/\s+/g, '_');
  
  const jobTypeRisk = RISK_WEIGHTS.jobTypes[jobTypeKey] || RISK_WEIGHTS.jobTypes.other;
  const industryRisk = RISK_WEIGHTS.industries[industryKey] || RISK_WEIGHTS.industries.other;
  
  const riskAdjustment = (jobTypeRisk + industryRisk) / 2;
  
  // Reputation factor (0.7-1.0 range)
  const reputationFactor = params.reputationScore ? 
    Math.max(0.7, Math.min(1.0, params.reputationScore / 100)) : 
    0.9; // Default for new users
  
  // Claims history impact (1.0-1.5 range)
  const claimsImpact = params.claimHistory ? 
    Math.max(1.0, Math.min(1.5, 1 + (params.claimHistory * 0.1))) : 
    1.0; // Default for no claims
  
  // Market conditions adjustment
  const marketConditions = params.marketConditions || 1.0;
  
  // Calculate risk score (0-100)
  const riskScore = calculateRiskScore({
    riskAdjustment,
    claimHistory: params.claimHistory || 0,
    coverageRatio,
    reputationScore: params.reputationScore || 90
  });
  
  // Calculate final premium
  const premiumSOL = baseRate * 
    coverageImpact * 
    periodImpact * 
    riskAdjustment * 
    reputationFactor * 
    claimsImpact * 
    marketConditions;
  
  return {
    premiumSOL: Math.max(PREMIUM_CONSTANTS.minPremium, premiumSOL),
    riskScore,
    breakdown: {
      baseRate,
      coverageImpact,
      periodImpact,
      riskAdjustment,
      reputationFactor,
      claimsImpact,
      marketConditions
    }
  };
}

// Interface for risk score calculation
interface RiskScoreParams {
  riskAdjustment: number;
  claimHistory: number;
  coverageRatio: number;
  reputationScore: number;
}

// Calculate risk score (0-100)
export function calculateRiskScore(params: RiskScoreParams): number {
  const { riskAdjustment, claimHistory, coverageRatio, reputationScore } = params;
  
  // Risk adjustment impact (20%)
  const riskAdjustmentImpact = ((riskAdjustment - 0.9) / 0.4) * 20; // Normalize to 0-20 range
  
  // Claims history impact (15%)
  const claimsHistoryImpact = Math.min(claimHistory * 5, 15); // 0-15 range
  
  // Coverage ratio impact (30%)
  const coverageRatioImpact = coverageRatio * 30; // 0-30 range
  
  // Reputation impact (35%)
  const reputationImpact = (1 - (reputationScore / 100)) * 35; // 0-35 range (inverse of reputation)
  
  // Calculate total risk score
  const riskScore = riskAdjustmentImpact + claimsHistoryImpact + coverageRatioImpact + reputationImpact;
  
  // Ensure risk score is between 0-100
  return Math.min(Math.max(riskScore, 0), 100);
}

// Interface for claim risk evaluation
export interface ClaimRiskEvaluationParams {
  claimAmount: number;
  coverageAmount: number;
  policyStartDate: Date | number;
  claimSubmissionDate: Date | number;
  previousClaims: number;
}

// Evaluate claim risk and determine if it needs review
export function evaluateClaimRisk(params: ClaimRiskEvaluationParams): {
  riskScore: number;
  needsReview: boolean;
  flags: string[];
} {
  const {
    claimAmount,
    coverageAmount,
    policyStartDate,
    claimSubmissionDate,
    previousClaims
  } = params;
  
  const flags: string[] = [];
  let riskScore = 0;
  
  // Check amount per day
  const policyStart = typeof policyStartDate === 'number' ? new Date(policyStartDate) : policyStartDate;
  const claimDate = typeof claimSubmissionDate === 'number' ? new Date(claimSubmissionDate) : claimSubmissionDate;
  const daysSinceStart = Math.ceil((claimDate.getTime() - policyStart.getTime()) / (1000 * 60 * 60 * 24));
  
  const amountPerDay = claimAmount / Math.max(daysSinceStart, 1);
  if (amountPerDay > CLAIM_RISK_CONSTANTS.HIGH_AMOUNT_PER_DAY) {
    riskScore += CLAIM_RISK_CONSTANTS.HIGH_AMOUNT_SCORE;
    flags.push('High amount per day');
  }
  
  // Check coverage ratio
  const coverageRatio = claimAmount / coverageAmount;
  if (coverageRatio > CLAIM_RISK_CONSTANTS.HIGH_COVERAGE_RATIO) {
    riskScore += CLAIM_RISK_CONSTANTS.HIGH_COVERAGE_SCORE;
    flags.push('High percentage of coverage');
  }
  
  // Check previous claims
  if (previousClaims > 0) {
    riskScore += CLAIM_RISK_CONSTANTS.PREVIOUS_CLAIM_SCORE;
    flags.push('Has previous claims');
  }
  
  // Check early claim
  if (daysSinceStart < CLAIM_RISK_CONSTANTS.EARLY_CLAIM_DAYS) {
    riskScore += CLAIM_RISK_CONSTANTS.EARLY_CLAIM_SCORE;
    flags.push('Early claim submission');
  }
  
  // Determine if claim needs review
  const needsReview = riskScore >= 30;
  
  return {
    riskScore,
    needsReview,
    flags
  };
}

// Format blockchain address for display
export function formatAddress(address: string, length: number = 4): string {
  if (!address) return '';
  return `${address.substring(0, length)}...${address.substring(address.length - length)}`;
}

// Convert lamports to SOL
export function lamportsToSol(lamports: number, decimals: number = 9): number {
  return lamports / Math.pow(10, decimals);
}

// Convert SOL to lamports
export function solToLamports(sol: number, decimals: number = 9): number {
  return sol * Math.pow(10, decimals);
}

// Debug utility for logging blockchain interactions
export function logBlockchainInteraction(
  action: string, 
  params: Record<string, any>, 
  result?: any, 
  error?: any
): void {
  console.group(`🔗 Blockchain Interaction: ${action}`);
  console.log('Parameters:', params);
  if (result) console.log('Result:', result);
  if (error) console.error('Error:', error);
  console.groupEnd();
}
