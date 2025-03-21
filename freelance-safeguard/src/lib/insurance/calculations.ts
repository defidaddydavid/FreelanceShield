import { z } from 'zod';
import { RISK_WEIGHTS, PREMIUM_RATES, parseUSDC, formatUSDC } from '@/lib/solana/constants';
import { NETWORK_CONFIG } from '@/lib/solana/constants';

// Base rate in USDC for insurance coverage
const BASE_RATE_USDC = 10;
const MAX_COVERAGE_RATIO = 5.0;
const MIN_COVERAGE_PERIOD_DAYS = 7; // Reduced to match UI minimum
const MAX_COVERAGE_PERIOD_DAYS = 365;

// Market condition adjustment (can be updated based on market data)
const MARKET_CONDITION_FACTOR = 1.0;

export type JobType = keyof typeof RISK_WEIGHTS.jobTypes;
export type Industry = keyof typeof RISK_WEIGHTS.industries;

export type PremiumInput = {
  coverageAmount: number;
  periodDays: number;
  jobType: JobType;
  industry: Industry;
  reputationScore?: number;
  claimHistory?: number;
};

export const PremiumInputSchema = z.object({
  coverageAmount: z.number().positive(),
  periodDays: z.number().min(PREMIUM_RATES.minCoveragePeriodDays).max(PREMIUM_RATES.maxCoveragePeriodDays),
  jobType: z.enum(["SOFTWARE_DEVELOPMENT", "DESIGN", "WRITING", "MARKETING", "CONSULTING", "OTHER"]),
  industry: z.enum(["TECHNOLOGY", "FINANCE", "HEALTHCARE", "EDUCATION", "RETAIL", "OTHER"]),
  reputationScore: z.number().min(0).max(100).optional(),
  claimHistory: z.number().min(0).optional(),
});

export interface PremiumCalculation {
  premiumUSDC: number;
  riskScore: number;
  breakdownFactors: {
    baseRate: number;
    coverageRatio: number;
    periodAdjustment: number;
    riskAdjustment: number;
    reputationFactor: number;
    marketConditions: number;
  };
}

export function calculatePremium(input: PremiumInput): PremiumCalculation {
  try {
    // Convert job type and industry to uppercase for validation
    const normalizedInput = {
      ...input,
      jobType: input.jobType.toUpperCase() as JobType,
      industry: input.industry.toUpperCase() as Industry,
      reputationScore: input.reputationScore || 80, // Default good reputation
      claimHistory: input.claimHistory || 0 // Default no claims
    };

    // Validate input
    PremiumInputSchema.parse(normalizedInput);

    // Calculate coverage ratio with enhanced non-linear scaling
    const coverageRatio = Math.min(
      Math.pow(input.coverageAmount / 1000, PREMIUM_RATES.coverageRatioMultiplier) * // Non-linear scaling
      (1 + Math.log10(Math.max(1, input.coverageAmount / 1000))), // Logarithmic scaling factor
      PREMIUM_RATES.maxCoverageRatio
    );

    // Calculate period adjustment with exponential increase for longer periods
    const periodAdjustment = Math.pow(input.periodDays / 30, PREMIUM_RATES.periodMultiplier);

    // Get risk weights for job type and industry
    const jobTypeRisk = RISK_WEIGHTS.jobTypes[normalizedInput.jobType] || 1.0;
    const industryRisk = RISK_WEIGHTS.industries[normalizedInput.industry] || 1.0;

    // Combined risk adjustment
    const riskAdjustment = jobTypeRisk * industryRisk;

    // Reputation factor (lower is better)
    const reputationFactor = reputationScoreToPremiumFactor(normalizedInput.reputationScore);

    // Claims history impact (more claims = higher premium)
    const claimsImpact = 1 + (normalizedInput.claimHistory * 0.15);

    // Calculate premium in USDC
    let premiumUSDC = PREMIUM_RATES.baseRate * 
      coverageRatio * 
      periodAdjustment * 
      riskAdjustment * 
      reputationFactor * 
      claimsImpact * 
      MARKET_CONDITION_FACTOR;
      
    // Ensure minimum premium
    premiumUSDC = Math.max(premiumUSDC, PREMIUM_RATES.minPremium);

    // Calculate risk score (0-100)
    const riskScore = calculateRiskScore(
      riskAdjustment,
      normalizedInput.claimHistory,
      coverageRatio,
      reputationFactor
    );

    return {
      premiumUSDC,
      riskScore,
      breakdownFactors: {
        baseRate: PREMIUM_RATES.baseRate,
        coverageRatio,
        periodAdjustment,
        riskAdjustment,
        reputationFactor,
        marketConditions: MARKET_CONDITION_FACTOR
      }
    };
  } catch (error) {
    console.error('Error calculating premium:', error);
    // Return default values in case of error
    return {
      premiumUSDC: PREMIUM_RATES.baseRate,
      riskScore: 50,
      breakdownFactors: {
        baseRate: PREMIUM_RATES.baseRate,
        coverageRatio: 1,
        periodAdjustment: 1,
        riskAdjustment: 1,
        reputationFactor: 1,
        marketConditions: 1
      }
    };
  }
}

/**
 * Calculate a risk score based on various factors
 * @returns Risk score from 0-100 (higher = riskier)
 */
function calculateRiskScore(
  riskAdjustment: number,
  claimsHistory: number,
  coverageRatio: number,
  reputationFactor: number
): number {
  // Convert risk adjustment (typically 0.9-1.3) to a 0-100 scale
  const riskAdjustmentScore = Math.min(100, (riskAdjustment - 0.8) * 200);
  
  // Claims history impact (0-100)
  const claimsScore = Math.min(100, claimsHistory * 25);
  
  // Coverage ratio impact (higher coverage = higher risk)
  const coverageRatioScore = Math.min(100, coverageRatio * 20);
  
  // Reputation impact (reputationFactor is 0.7-1.0, convert to 0-100)
  const reputationScore = Math.min(100, (reputationFactor - 0.7) * 333);
  
  // Weighted average of all factors
  const weightedScore = (
    (riskAdjustmentScore * 20) + 
    (claimsScore * 15) + 
    (coverageRatioScore * 30) + 
    (reputationScore * 35)
  ) / 100;
  
  return Math.min(100, Math.max(0, weightedScore));
}

/**
 * User reputation data interface
 */
export interface UserReputationData {
  // Work & Payment History
  onTimePayments: number;
  totalTransactions: number;
  disputes: number;
  completedContracts: number;
  
  // User Feedback & Ratings
  avgRating: number;
  positiveFeedbackPct: number;
  
  // Tenure & Consistency
  accountAgeMonths: number;
  lastActiveMonths: number;
  
  // Claim & Policy Compliance
  claimsMade: number;
  fraudFlagged: boolean;
  
  // New fields for work-based reputation
  contractsLast90Days: number;
  disputesResolved: number;
  disputesRuledAgainst: number;
  stakingParticipation: boolean;
  governanceParticipation: boolean;
  lastContractCompletionDate?: Date;
}

/**
 * Dispute resolution data
 */
export interface DisputeResolution {
  id: string;
  date: Date;
  outcome: 'resolved_amicably' | 'ruled_for_freelancer' | 'ruled_for_client' | 'unresolved';
  description: string;
}

/**
 * Contract completion data
 */
export interface ContractCompletion {
  id: string;
  completionDate: Date;
  onTime: boolean;
  amount: number;
  clientSatisfaction: number; // 1-5 scale
}

/**
 * Reputation score calculation result
 */
export interface ReputationScoreResult {
  score: number;
  breakdown: {
    workHistoryScore: number;
    paymentHistoryScore: number;
    disputeResolutionScore: number;
    activityScore: number;
    governanceScore: number;
  };
  riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk';
  premiumDiscount: number; // Percentage discount
  discountTier: string;
  improvementAreas: string[];
  recentActivity: {
    description: string;
    impact: number;
    date: Date;
  }[];
  timeDecayFactor: number;
}

/**
 * Calculate a user's reputation score based on their work history and verifiable actions
 * 
 * @param userData User reputation data
 * @returns Reputation score result with breakdown and risk level
 */
export function calculateReputationScore(userData: UserReputationData): ReputationScoreResult {
  // Initialize scores for each category
  let workHistoryScore = 0;
  let paymentHistoryScore = 0;
  let disputeResolutionScore = 0;
  let activityScore = 0;
  let governanceScore = 0;
  const improvementAreas: string[] = [];
  const recentActivity: { description: string; impact: number; date: Date }[] = [];
  
  const now = new Date();
  
  // ---- Work History Score (30% weight) ----
  
  // Completed contracts - verifiable on-chain actions
  if (userData.completedContracts >= 20) {
    workHistoryScore += 25; // 20+ contracts
  } else if (userData.completedContracts >= 10) {
    workHistoryScore += 20; // 10-19 contracts
  } else if (userData.completedContracts >= 5) {
    workHistoryScore += 15; // 5-9 contracts
  } else if (userData.completedContracts >= 1) {
    workHistoryScore += 10; // 1-4 contracts
  } else {
    improvementAreas.push('Complete contracts to establish work history');
  }
  
  // Recent activity bonus - contracts in last 90 days
  if (userData.contractsLast90Days >= 5) {
    workHistoryScore += 5; // Very active
    recentActivity.push({
      description: 'Completed 5+ contracts in the last 90 days',
      impact: 5,
      date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
    });
  } else if (userData.contractsLast90Days >= 3) {
    workHistoryScore += 3; // Moderately active
  } else if (userData.contractsLast90Days >= 1) {
    workHistoryScore += 1; // Somewhat active
  } else {
    improvementAreas.push('Complete more contracts in the last 90 days');
  }
  
  // ---- Payment History Score (25% weight) ----
  
  // On-time payment/delivery rate - verifiable on-chain metric
  const onTimeRate = userData.totalTransactions > 0 
    ? userData.onTimePayments / userData.totalTransactions 
    : 0;
    
  if (onTimeRate >= 0.95) {
    paymentHistoryScore += 25; // 95-100% on-time
    recentActivity.push({
      description: 'Maintained excellent on-time rate',
      impact: 5,
      date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) // 2 weeks ago
    });
  } else if (onTimeRate >= 0.90) {
    paymentHistoryScore += 20; // 90-94%
  } else if (onTimeRate >= 0.85) {
    paymentHistoryScore += 15; // 85-89%
  } else if (onTimeRate >= 0.80) {
    paymentHistoryScore += 10; // 80-84%
  } else if (userData.totalTransactions > 0) {
    paymentHistoryScore += 5; // Below 80%
    improvementAreas.push('Improve on-time payment/delivery rate to at least 85%');
  }
  
  // ---- Dispute Resolution Score (20% weight) ----
  
  // Dispute frequency - verifiable on-chain
  if (userData.disputes === 0) {
    disputeResolutionScore += 10; // No disputes
  } else {
    // Calculate the dispute ratio (disputes per contract)
    const disputeRatio = userData.completedContracts > 0 
      ? userData.disputes / userData.completedContracts 
      : 1;
      
    if (disputeRatio <= 0.05) {
      disputeResolutionScore += 8; // Very low dispute ratio
    } else if (disputeRatio <= 0.1) {
      disputeResolutionScore += 5; // Low dispute ratio
    } else if (disputeRatio <= 0.2) {
      disputeResolutionScore += 0; // Moderate dispute ratio
      improvementAreas.push('Reduce frequency of disputes');
    } else {
      disputeResolutionScore -= 10; // High dispute ratio
      improvementAreas.push('High dispute ratio is affecting your score negatively');
      recentActivity.push({
        description: 'High dispute frequency detected',
        impact: -10,
        date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 1 month ago
      });
    }
  }
  
  // Dispute resolution outcomes - verifiable through platform records
  if (userData.disputes > 0) {
    // Calculate percentage of disputes that were resolved amicably or in user's favor
    const positiveResolutions = userData.disputesResolved - userData.disputesRuledAgainst;
    const resolutionRate = userData.disputes > 0 
      ? positiveResolutions / userData.disputes 
      : 0;
      
    if (resolutionRate >= 0.8) {
      disputeResolutionScore += 10; // Excellent resolution rate
    } else if (resolutionRate >= 0.6) {
      disputeResolutionScore += 5; // Good resolution rate
    } else if (resolutionRate >= 0.4) {
      disputeResolutionScore += 0; // Average resolution rate
    } else {
      disputeResolutionScore -= 5; // Poor resolution rate
      improvementAreas.push('Improve dispute resolution outcomes');
    }
  }
  
  // ---- Activity Score (15% weight) ----
  
  // Account age with time decay - older accounts have proven longevity
  let ageScore = 0;
  if (userData.accountAgeMonths > 36) {
    ageScore = 7; // Over 3 years
  } else if (userData.accountAgeMonths > 24) {
    ageScore = 6; // 2-3 years
  } else if (userData.accountAgeMonths > 12) {
    ageScore = 5; // 1-2 years
  } else if (userData.accountAgeMonths > 6) {
    ageScore = 3; // 6-12 months
  } else {
    ageScore = 1; // Under 6 months
    improvementAreas.push('Build account history over time');
  }
  
  // Activity recency - score decays with inactivity
  let recencyScore = 0;
  if (userData.lastActiveMonths === 0) {
    recencyScore = 8; // Active this month
  } else if (userData.lastActiveMonths <= 1) {
    recencyScore = 7; // Active in last month
  } else if (userData.lastActiveMonths <= 3) {
    recencyScore = 5; // Active in last 3 months
  } else if (userData.lastActiveMonths <= 6) {
    recencyScore = 2; // Active in last 6 months
  } else {
    recencyScore = 0; // Inactive for over 6 months
    improvementAreas.push('Maintain regular platform activity');
    recentActivity.push({
      description: 'Account inactivity detected',
      impact: -5,
      date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) // 2 months ago
    });
  }
  
  activityScore = ageScore + recencyScore;
  
  // ---- Governance Score (10% weight) ----
  
  // Staking and governance participation
  if (userData.stakingParticipation && userData.governanceParticipation) {
    governanceScore += 10; // Full participation
    recentActivity.push({
      description: 'Active participation in platform governance',
      impact: 5,
      date: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000) // 3 weeks ago
    });
  } else if (userData.stakingParticipation) {
    governanceScore += 5; // Staking only
    improvementAreas.push('Participate in governance voting to improve score');
  } else if (userData.governanceParticipation) {
    governanceScore += 3; // Governance only
    improvementAreas.push('Stake tokens to improve score');
  } else {
    governanceScore += 0;
    improvementAreas.push('Participate in staking and governance to improve score');
  }
  
  // ---- Claims History (Penalty) ----
  
  // Claims history - verified through insurance records
  let claimsPenalty = 0;
  if (userData.claimsMade > 3) {
    claimsPenalty = -15; // Many claims
    improvementAreas.push('Reduce frequency of insurance claims');
  } else if (userData.claimsMade > 1) {
    claimsPenalty = -10; // Multiple claims
  } else if (userData.claimsMade === 1) {
    claimsPenalty = -5; // One claim
  }
  
  // Fraud flag - major penalty for verified fraud
  if (userData.fraudFlagged) {
    claimsPenalty -= 30; // Major penalty for fraud
    improvementAreas.push('Address fraud flags on account');
    recentActivity.push({
      description: 'Fraud flag detected on account',
      impact: -30,
      date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000) // 1.5 months ago
    });
  }
  
  // ---- Time Decay Factor ----
  
  // Calculate time decay factor - reputation fades if not maintained
  let timeDecayFactor = 1.0;
  if (userData.lastContractCompletionDate) {
    const daysSinceLastContract = Math.floor((now.getTime() - userData.lastContractCompletionDate.getTime()) / (24 * 60 * 60 * 1000));
    
    if (daysSinceLastContract > 180) { // 6 months
      timeDecayFactor = 0.8; // 20% decay
    } else if (daysSinceLastContract > 90) { // 3 months
      timeDecayFactor = 0.9; // 10% decay
    } else if (daysSinceLastContract > 60) { // 2 months
      timeDecayFactor = 0.95; // 5% decay
    }
  }
  
  // Apply weights to each score component
  const weightedWorkScore = workHistoryScore * 0.3;
  const weightedPaymentScore = paymentHistoryScore * 0.25;
  const weightedDisputeScore = disputeResolutionScore * 0.2;
  const weightedActivityScore = activityScore * 0.15;
  const weightedGovernanceScore = governanceScore * 0.1;
  
  // Calculate total score starting from a neutral baseline of 50
  let totalScore = 50 + 
    weightedWorkScore + 
    weightedPaymentScore + 
    weightedDisputeScore + 
    weightedActivityScore + 
    weightedGovernanceScore + 
    claimsPenalty;
  
  // Apply time decay factor
  totalScore = totalScore * timeDecayFactor;
  
  // Clamp between 0 and 100
  totalScore = Math.min(100, Math.max(0, totalScore));
  
  // Determine risk level and premium discount based on score
  let riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk';
  let premiumDiscount: number;
  let discountTier: string;
  
  if (totalScore >= 75) {
    riskLevel = 'Low Risk';
    premiumDiscount = 22 + ((totalScore - 75) / 25) * 8; // 22-30% discount
    discountTier = 'Premium';
  } else if (totalScore >= 50) {
    riskLevel = 'Medium Risk';
    premiumDiscount = 15 + ((totalScore - 50) / 25) * 7; // 15-22% discount
    discountTier = 'Standard';
  } else {
    riskLevel = 'High Risk';
    premiumDiscount = ((totalScore) / 50) * 15; // 0-15% discount
    discountTier = 'Basic';
  }
  
  return {
    score: Math.round(totalScore),
    breakdown: {
      workHistoryScore: Math.round(weightedWorkScore),
      paymentHistoryScore: Math.round(weightedPaymentScore),
      disputeResolutionScore: Math.round(weightedDisputeScore),
      activityScore: Math.round(weightedActivityScore),
      governanceScore: Math.round(weightedGovernanceScore)
    },
    riskLevel,
    premiumDiscount: Math.round(premiumDiscount),
    discountTier,
    improvementAreas,
    recentActivity,
    timeDecayFactor
  };
}

/**
 * Converts a reputation score to a premium adjustment factor
 * 
 * @param reputationScore User reputation score (0-100)
 * @returns Premium adjustment factor (0.7-1.0)
 */
export function reputationScoreToPremiumFactor(reputationScore: number): number {
  // Ensure score is within valid range
  const clampedScore = Math.min(100, Math.max(0, reputationScore));
  
  // Map scores to discount tiers based on the new model
  let factor: number;
  
  if (clampedScore >= 75) {
    // Low Risk tier: 22-30% discount (factor 0.78-0.70)
    factor = 1.0 - (0.22 + ((clampedScore - 75) / 25) * 0.08);
  } else if (clampedScore >= 50) {
    // Medium Risk tier: 15-22% discount (factor 0.85-0.78)
    factor = 1.0 - (0.15 + ((clampedScore - 50) / 25) * 0.07);
  } else {
    // High Risk tier: 0-15% discount (factor 1.0-0.85)
    factor = 1.0 - ((clampedScore / 50) * 0.15);
  }
  
  return Number(factor.toFixed(2));
}

/**
 * Evaluates the risk of a claim based on various factors
 * @param amount The claim amount in SOL
 * @param policyAgeDays Age of the policy in days
 * @param previousClaimsCount Number of previous claims on this policy
 * @param coverageAmount Total coverage amount of the policy
 * @returns Risk evaluation with a score and breakdown of factors
 */
export function evaluateClaimRisk(
  amount: number,
  policyAgeDays: number,
  previousClaimsCount: number,
  coverageAmount: number
): ClaimRiskEvaluation {
  // Calculate amount per day factor (higher amount per day = higher risk)
  const amountPerDay = amount / Math.max(policyAgeDays, 1);
  const amountFactor = Math.min(100, amountPerDay * 10);
  
  // Calculate age factor (newer policies have higher risk)
  const ageFactor = Math.max(10, 100 - (policyAgeDays / 3.65)); // Lower risk as policy ages
  
  // Calculate history factor (more previous claims = higher risk)
  const historyFactor = Math.min(100, previousClaimsCount * 25 + 25);
  
  // Calculate coverage ratio factor (claims for higher percentage of coverage = higher risk)
  const coverageRatio = amount / coverageAmount;
  const coverageRatioFactor = Math.min(100, coverageRatio * 100 * 2); // Double the impact
  
  // Calculate weighted risk score
  const riskScore = (
    amountFactor * 0.3 +
    ageFactor * 0.2 +
    historyFactor * 0.25 +
    coverageRatioFactor * 0.25
  );
  
  // Determine if claim should be flagged for review
  const flaggedForReview = riskScore > 70 || 
                          (coverageRatio > 0.5) || 
                          (previousClaimsCount > 2);
  
  return {
    riskScore,
    factors: {
      amountFactor,
      ageFactor,
      historyFactor,
      coverageRatioFactor
    },
    flaggedForReview
  };
}
