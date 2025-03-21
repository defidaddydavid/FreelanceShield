// Insurance related type definitions

// Job types for insurance policies
export enum JobType {
  DEVELOPMENT = 'Development',
  DESIGN = 'Design',
  WRITING = 'Content',
  MARKETING = 'Marketing',
  CONSULTING = 'Consulting',
  ENGINEERING = 'Engineering',
  OTHER = 'Other'
}

// Industry categories
export enum Industry {
  TECHNOLOGY = 'Technology',
  HEALTHCARE = 'Healthcare',
  FINANCE = 'Finance',
  EDUCATION = 'Education',
  ECOMMERCE = 'Retail',
  ENTERTAINMENT = 'Entertainment',
  MANUFACTURING = 'Manufacturing',
  OTHER = 'Other'
}

// Policy status types
export enum PolicyStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  PENDING = 'pending',
  CANCELLED = 'cancelled'
}

// Claim status types
export enum ClaimStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARBITRATION = 'arbitration',
  PAID = 'paid'
}

// Payment verification status
export enum PaymentVerificationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DISPUTED = 'disputed',
  RESOLVED = 'resolved'
}

// Insurance policy interface
export interface Policy {
  policyId: string;
  owner: string;
  coverageAmount: number;
  premiumAmount: number;
  startTime: string;  // ISO date string
  expiryTime: string; // ISO date string
  status: PolicyStatus | string;
  jobType: JobType | string;
  industry: Industry | string;
  projectName: string;
  clientName: string;
  description: string;
}

// Risk evaluation for a claim
export interface RiskEvaluation {
  score: number;
  factors: string[];
}

// Claim interface
export interface Claim {
  claimId: string;
  policyId: string;
  owner: string;
  amount: number;
  status: ClaimStatus | string;
  evidenceType: string;
  evidenceDescription: string;
  evidenceAttachments: string[];
  submissionTime: string; // ISO date string
  riskEvaluation: RiskEvaluation;
}

// Payment verification interface
export interface PaymentVerification {
  id: string;
  freelancer: string;
  client: string;
  expectedAmount: number;
  deadline: number; // Unix timestamp
  status: PaymentVerificationStatus | string;
  createdAt: number; // Unix timestamp
  confirmedAt?: number; // Unix timestamp
}

// Premium calculation parameters
export interface PremiumParams {
  coverageAmount: number;
  durationDays: number;
  jobType: JobType | string;
  industry: Industry | string;
  reputationScore?: number;
  previousClaims?: number;
}

// Risk assessment result for premium calculation
export interface RiskAssessment {
  riskScore: number;
  jobTypeRisk: number;
  industryRisk: number;
  coverageRisk: number;
  durationRisk: number;
  reputationImpact: number;
  claimsImpact: number;
}

// Risk pool metrics from the blockchain
export interface RiskPoolMetrics {
  totalPolicies: number;
  activePolicies: number;
  totalCoverage: number;
  poolBalance: number;
  totalPremiums: number;
  totalClaims: number;
  claimCount: number;
  claimApprovalRate: number;
  solvencyRatio: number;
  averagePremium: number;
  averageCoverage: number;
}
