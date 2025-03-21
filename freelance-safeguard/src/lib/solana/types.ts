// Solana blockchain integration types

// Policy type
export interface Policy {
  id: string;
  owner: string;
  coverageAmount: number;
  premiumAmount: number;
  periodDays: number;
  startDate: number;
  endDate: number;
  jobType: string;
  industry: string;
  status: PolicyStatus;
  claims: Claim[];
  projectName?: string;
  clientName?: string;
  description?: string;
  txSignature?: string;
}

// Claim type
export interface Claim {
  id: string;
  policyId: string;
  amount: number;
  reason: string;
  evidence: string;
  status: ClaimStatus;
  submissionDate: number;
  reviewDate?: number;
  txSignature?: string;
}

// Transaction type
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  timestamp: number;
  txSignature?: string;
  policyId?: string;
  claimId?: string;
}

// Policy status enum
export enum PolicyStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  CLAIMED = 'claimed'
}

// Claim status enum
export enum ClaimStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid'
}

// Transaction type enum
export enum TransactionType {
  PREMIUM = 'premium',
  CLAIM = 'claim',
  YIELD = 'yield',
  STAKE = 'stake',
  UNSTAKE = 'unstake'
}

// Job type enum
export type JobType = 
  | 'development'
  | 'design'
  | 'writing'
  | 'marketing'
  | 'consulting'
  | 'translation'
  | 'video'
  | 'audio'
  | 'other';

// Industry enum
export type Industry = 
  | 'technology'
  | 'finance'
  | 'healthcare'
  | 'education'
  | 'ecommerce'
  | 'entertainment'
  | 'legal'
  | 'manufacturing'
  | 'real_estate'
  | 'other';

// Insurance state
export interface InsuranceState {
  totalPolicies: number;
  activePolicies: number;
  totalClaims: number;
  approvedClaims: number;
  totalPremiumCollected: number;
  totalClaimsPaid: number;
}

// Risk pool state
export interface RiskPoolState {
  totalValueLocked: number;
  capitalReserve: number;
  reserveRatio: number;
  activePolicies: number;
  totalCoverage: number;
  recentTransactions: Transaction[];
  solvencyScore: number;
}

// Premium calculation result
export interface PremiumCalculationResult {
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

// Monte Carlo simulation result
export interface SimulationResult {
  runDate: number;
  expectedLoss: number;
  worstCaseLoss: number;
  bestCaseLoss: number;
  confidenceInterval95: {
    lower: number;
    upper: number;
  };
  recommendedReserve: number;
  solvencyScore: number;
  riskOfInsolvency: number;
}
