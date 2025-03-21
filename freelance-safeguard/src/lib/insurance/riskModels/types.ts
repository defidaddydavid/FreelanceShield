import { z } from 'zod';
import { RISK_WEIGHTS } from '@/lib/solana/constants';

// Enhanced input schema for AI-driven premium calculation
export const AIPremiumInputSchema = z.object({
  // Basic coverage details
  coverageAmount: z.number().positive(),
  periodDays: z.number().min(30).max(365),
  jobType: z.enum(Object.keys(RISK_WEIGHTS.jobTypes) as [string, ...string[]]),
  industry: z.enum(Object.keys(RISK_WEIGHTS.industries) as [string, ...string[]]),
  
  // On-chain reputation data
  walletAddress: z.string().optional(),
  walletAgeInDays: z.number().min(0).optional(),
  transactionCount: z.number().min(0).optional(),
  verifiedClientCount: z.number().min(0).optional(),
  escrowTransactionCount: z.number().min(0).optional(),
  
  // Enhanced on-chain data
  disputeResolutionCount: z.number().min(0).optional(),
  positiveDisputeOutcomes: z.number().min(0).optional(),
  transactionHistory: z.array(
    z.object({
      timestamp: z.number(),
      amount: z.number(),
      type: z.enum(['payment', 'escrow', 'claim', 'deposit', 'withdrawal']),
      counterpartyVerified: z.boolean().optional()
    })
  ).optional(),
  
  // Financial volatility data
  incomeTransactions: z.array(
    z.object({
      amount: z.number().positive(),
      timestamp: z.number()
    })
  ).optional(),
  
  // Risk pool data
  riskPoolId: z.string().optional(),
  riskPoolIds: z.array(z.string()).optional(), // Multiple risk pools
  
  // Traditional insurance metrics
  reputationScore: z.number().min(0).max(100),
  claimHistory: z.number().min(0),
  
  // Enhanced risk metrics
  monthsSinceLastClaim: z.number().min(0).optional(),
  consecutiveClaimFreeMonths: z.number().min(0).optional(),
  projectCompletionRate: z.number().min(0).max(1).optional(),
  
  // Market conditions
  marketSentiment: z.number().min(-1).max(1).optional(),
  solanaNetworkHealth: z.number().min(0).max(1).optional(),
  
  // Loyalty and retention data
  policyAgeInMonths: z.number().min(0).optional(),
  previousPolicies: z.number().min(0).optional()
});

export type AIPremiumInput = z.infer<typeof AIPremiumInputSchema>;

// Interface for storing historical simulation results
export interface SimulationHistory {
  timestamp: number;
  input: Partial<AIPremiumInput>;
  results: SimulationResult;
}

// Interface for Monte Carlo simulation results
export interface SimulationResult {
  claimProbability: number;
  confidenceInterval: [number, number];
  riskDecile: number;
  varianceContributions: Record<string, number>; // Contribution of each factor to variance
}

// Interface for premium calculation results
export interface AIPremiumCalculation {
  premiumUSDC: number;
  riskScore: number;
  wri: number; // Weighted Reputation Index
  breakdownFactors: {
    baseRate: number;
    coverageRatio: number;
    periodAdjustment: number;
    riskAdjustment: number;
    reputationFactor: number;
    wriAdjustment: number;
    fivfAdjustment: number;
    marketSentimentAdjustment: number;
    socialRiskPoolAdjustment: number;
    escrowDiscountAdjustment: number;
    osriAdjustment: number;
    bayesianAdjustment: number;
    monteCarloRiskAdjustment: number;
    srprAdjustment: number;
    loyaltyAdjustment: number; // New factor for loyalty discounts
    conditionalRiskAdjustment: number; // New factor for conditional probability
  };
  riskDecile: number;
  simulationResults: SimulationResult;
  recommendedActions: string[];
  timeBasedProjections: { // Projections for future premium changes
    threeMonths: number;
    sixMonths: number;
    twelveMonths: number;
  };
  riskSegmentation: {
    personalRiskScore: number;
    industryRiskScore: number;
    combinedRiskScore: number;
  };
}
