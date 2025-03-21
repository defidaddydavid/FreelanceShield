import { NETWORK_CONFIG } from '../solana/constants';

// Risk weight data based on job type
const JOB_TYPE_RISK_WEIGHTS: Record<string, number> = {
  'Development': 0.9,
  'Design': 0.95,
  'Content': 1.0,
  'Marketing': 1.1,
  'Consulting': 1.15,
  'Engineering': 1.2,
  // Default if job type not found
  'Default': 1.0
};

// Risk weight data based on industry
const INDUSTRY_RISK_WEIGHTS: Record<string, number> = {
  'Technology': 0.9,
  'Healthcare': 1.0,
  'Finance': 1.3,
  'Education': 0.95,
  'Entertainment': 1.1,
  'Retail': 1.05,
  'Manufacturing': 1.2,
  // Default if industry not found
  'Default': 1.0
};

// Base rate in SOL
const BASE_RATE_SOL = 0.1;

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

// Interface for premium calculation result
export interface PremiumCalculationResult {
  premiumSOL: number;
  riskScore: number;
  baseRate: number;
  coverageRatio: number;
  periodAdjustment: number;
  riskAdjustment: number;
  reputationFactor: number;
  riskComponents: {
    jobTypeRisk: number;
    industryRisk: number;
    periodRisk: number;
    coverageRisk: number;
  };
}

// Interface for claim risk evaluation parameters
export interface ClaimRiskEvaluationParams {
  claimAmount: number;
  coverageAmount: number;
  policyStartDate: Date | number;
  claimSubmissionDate: Date | number;
  previousClaims: number;
}

// Interface for claim risk evaluation result
export interface ClaimRiskEvaluation {
  riskScore: number;
  needsReview: boolean;
  flags: string[];
}

/**
 * Calculate premium for insurance policy based on multiple factors
 * Uses the formula: Premium = BaseRate * CoverageRatio * PeriodAdjustment * RiskAdjustment * ReputationFactor * ClaimsImpact * MarketConditions
 * 
 * @param params Parameters for premium calculation
 * @returns Premium calculation result with breakdown
 */
export function calculatePremium(params: PremiumCalculationParams): PremiumCalculationResult {
  const {
    coverageAmount,
    periodDays,
    jobType,
    industry,
    reputationScore = 1.0,
    claimHistory = 0,
    marketConditions = 1.0
  } = params;

  // Base rate in SOL - starting point for all premium calculations
  const baseRate = BASE_RATE_SOL;
  
  // Coverage ratio - non-linear scaling based on coverage amount
  // Higher coverage amounts have diminishing effect on premium
  const coverageRatio = Math.pow(coverageAmount / 10, 0.85);
  
  // Period adjustment - exponential increase for longer periods
  // Longer periods have a more than linear increase in premium
  const periodAdjustment = Math.pow(periodDays / 30, 1.1);
  
  // Job type risk factor - from predefined weights
  const jobTypeRisk = JOB_TYPE_RISK_WEIGHTS[jobType] || JOB_TYPE_RISK_WEIGHTS.Default;
  
  // Industry risk factor - from predefined weights
  const industryRisk = INDUSTRY_RISK_WEIGHTS[industry] || INDUSTRY_RISK_WEIGHTS.Default;
  
  // Combined risk adjustment
  const riskAdjustment = jobTypeRisk * industryRisk;
  
  // Reputation factor - reduces premium for higher reputation scores
  // Valid range for reputationScore: 0.7 (worst) to 1.0 (best)
  const reputationFactor = Math.max(0.7, Math.min(1.0, reputationScore));
  
  // Claims history impact - increases premium for each previous claim
  const claimsImpact = 1.0 + (claimHistory * 0.1);
  
  // Calculate final premium
  let premiumSOL = baseRate * coverageRatio * periodAdjustment * riskAdjustment * reputationFactor * claimsImpact * marketConditions;
  
  // Ensure minimum premium of 0.05 SOL
  premiumSOL = Math.max(0.05, premiumSOL);
  
  // Calculate risk score based on the components
  // Formula: RiskScore = (RiskAdjustment * 20 + ClaimsHistory * 15 + CoverageRatioImpact * 30 + ReputationImpact * 35)
  const coverageRatioImpact = Math.min(1.5, coverageRatio / 2);
  const reputationImpact = (1 - (reputationFactor - 0.7) / 0.3); // Convert 0.7-1.0 to 1.0-0.0
  
  const riskScore = (
    (riskAdjustment - 0.8) * 50 + // Normalize around 1.0 
    (claimHistory * 15) +
    (coverageRatioImpact * 30) +
    (reputationImpact * 35)
  );
  
  return {
    premiumSOL,
    riskScore: Math.max(0, Math.min(100, riskScore)),
    baseRate,
    coverageRatio,
    periodAdjustment,
    riskAdjustment,
    reputationFactor,
    riskComponents: {
      jobTypeRisk,
      industryRisk,
      periodRisk: periodAdjustment,
      coverageRisk: coverageRatio
    }
  };
}

/**
 * Evaluate risk for an insurance claim
 * Higher risk score means higher likelihood of fraud or invalid claim
 * 
 * @param params Parameters for claim risk evaluation
 * @returns Risk evaluation result with breakdown
 */
export function evaluateClaimRisk(params: ClaimRiskEvaluationParams): ClaimRiskEvaluation {
  const {
    claimAmount,
    coverageAmount,
    policyStartDate,
    claimSubmissionDate,
    previousClaims
  } = params;
  
  const flags: string[] = [];
  
  // Convert dates to timestamps if they are Date objects
  const startTimestamp = policyStartDate instanceof Date ? policyStartDate.getTime() : policyStartDate;
  const claimTimestamp = claimSubmissionDate instanceof Date ? claimSubmissionDate.getTime() : claimSubmissionDate;
  
  // Calculate policy age in days
  const policyAgeMs = claimTimestamp - startTimestamp;
  const policyAgeDays = policyAgeMs / (1000 * 60 * 60 * 24);
  
  // Calculate claim amount as percentage of coverage
  const claimPercentage = (claimAmount / coverageAmount) * 100;
  
  // Risk factors
  
  // 1. Claim timing risk - Claims made very early in policy period are higher risk
  let timingRisk = 0;
  if (policyAgeDays < 3) {
    timingRisk = 35;
    flags.push('Very early claim');
  } else if (policyAgeDays < 7) {
    timingRisk = 25;
    flags.push('Early claim');
  } else if (policyAgeDays < 14) {
    timingRisk = 15;
  } else {
    timingRisk = 5;
  }
  
  // 2. Claim amount risk - Claims for large percentages of coverage are higher risk
  let amountRisk = 0;
  if (claimPercentage > 90) {
    amountRisk = 40;
    flags.push('Nearly full coverage claim');
  } else if (claimPercentage > 75) {
    amountRisk = 30;
    flags.push('High value claim');
  } else if (claimPercentage > 50) {
    amountRisk = 20;
    flags.push('Medium-high value claim');
  } else if (claimPercentage > 25) {
    amountRisk = 10;
  } else {
    amountRisk = 5;
  }
  
  // 3. Previous claims risk - More previous claims = higher risk
  const previousClaimsRisk = previousClaims * 15;
  if (previousClaims > 2) {
    flags.push('Multiple previous claims');
  }
  
  // 4. Daily amount risk - High amount per day ratio is suspicious
  const amountPerDay = claimAmount / Math.max(1, policyAgeDays);
  let dailyRateRisk = 0;
  
  if (amountPerDay > coverageAmount / 10) {
    dailyRateRisk = 30;
    flags.push('High amount per day ratio');
  } else if (amountPerDay > coverageAmount / 20) {
    dailyRateRisk = 20;
  } else if (amountPerDay > coverageAmount / 30) {
    dailyRateRisk = 10;
  }
  
  // Calculate final risk score (0-100)
  const riskScore = Math.min(100, 
    timingRisk * 0.3 +
    amountRisk * 0.3 +
    previousClaimsRisk * 0.2 +
    dailyRateRisk * 0.2
  );
  
  // Determine if the claim needs manual review
  const needsReview = riskScore > 70 || flags.length > 2;
  
  return {
    riskScore,
    needsReview,
    flags
  };
}

/**
 * Calculate risk pool health metrics based on current pool status
 * 
 * @param totalPolicies Number of active policies
 * @param totalCoverage Total coverage amount in SOL 
 * @param poolBalance Current risk pool balance in SOL
 * @param totalPremiums Total premiums collected in SOL
 * @returns Object with calculated health metrics
 */
export function calculateRiskPoolHealth(
  totalPolicies: number,
  totalCoverage: number,
  poolBalance: number,
  totalPremiums: number
) {
  // Solvency ratio - pool balance as percentage of total coverage
  const solvencyRatio = poolBalance / Math.max(1, totalCoverage);
  
  // Reserve ratio - amount of reserves compared to premiums collected
  const reserveRatio = poolBalance / Math.max(1, totalPremiums);
  
  // Calculate base reserve ratio - increases with more policies
  // More policies = more risk diversification = lower reserve requirements
  const baseReserveRatio = 0.2 - Math.min(0.15, (totalPolicies * 0.005));
  
  // Calculate recommended reserves with 50% buffer
  const recommendedReserveRatio = baseReserveRatio * 1.5;
  
  // Risk buffer - additional amount needed for safe operations
  const riskBuffer = totalCoverage * 0.1;
  
  return {
    solvencyRatio,
    reserveRatio,
    baseReserveRatio,
    recommendedReserveRatio,
    riskBuffer,
    solvencyStatus: solvencyRatio >= 0.7 ? 'excellent' :
                   solvencyRatio >= 0.5 ? 'good' :
                   solvencyRatio >= 0.3 ? 'moderate' : 'at-risk',
    reserveStatus: reserveRatio >= recommendedReserveRatio ? 'sufficient' : 'insufficient'
  };
}

/**
 * Convert SOL amount to lamports for on-chain storage
 * @param solAmount Amount in SOL
 * @returns Amount in lamports
 */
export function solToLamports(solAmount: number): number {
  return solAmount * NETWORK_CONFIG.lamportsPerSol;
}

/**
 * Convert lamports amount to SOL for display
 * @param lamports Amount in lamports
 * @returns Amount in SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / NETWORK_CONFIG.lamportsPerSol;
}
