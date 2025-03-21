import { PublicKey } from '@solana/web3.js';

// Program IDs
export const PROGRAM_IDS = {
  INSURANCE_PROGRAM: new PublicKey('5YQrtSDqiRsVTJ4ZxLEHbcNTibiJrMsYTGNs3kRqKLRW'),
  RISK_POOL_PROGRAM: new PublicKey('7YarYNBF8GYZ5yzrUJGR3yHVs6SQapPezvnJrKRFUeD7'),
  CLAIMS_PROCESSOR: new PublicKey('9ot9f4UgMKPdHHgHqkKJrEGmpGBgk9Kxg8xJPJsxGYNY'),
  ESCROW_PROGRAM: new PublicKey('8ZU8MgTZG3UAYu5ChPKCCqGBiV9RGR9WJZLJcWA1UDxz'),
  DAO_GOVERNANCE: new PublicKey('DAoGXKLYx3MgXkJxv1e4W5D4LQkbtqxnDRBUVJAqMSLt'),
  STAKING_PROGRAM: new PublicKey('StaKe5tXnKjeJC4vRVsnxBrNwUuUXRES2RdMc4MnrSA'),
};

// Insurance Program Types
export enum PolicyStatus {
  Inactive = 0,
  Active = 1,
  Expired = 2,
  Cancelled = 3,
}

export enum JobType {
  SoftwareDevelopment = 0,
  Design = 1,
  Writing = 2,
  Marketing = 3,
  Consulting = 4,
  Other = 5,
}

export enum Industry {
  Technology = 0,
  Healthcare = 1,
  Finance = 2,
  Education = 3,
  Retail = 4,
  Entertainment = 5,
  Other = 6,
}

export interface Policy {
  owner: PublicKey;
  coverageAmount: bigint;
  premiumAmount: bigint;
  startDate: bigint;
  endDate: bigint;
  status: PolicyStatus;
  jobType: JobType;
  industry: Industry;
  claimsCount: number;
  bump: number;
}

export interface InsuranceState {
  authority: PublicKey;
  riskPoolAuthority: PublicKey;
  baseReserveRatio: number;
  minCoverageAmount: bigint;
  maxCoverageAmount: bigint;
  minPeriodDays: number;
  maxPeriodDays: number;
  totalPolicies: bigint;
  activePolicies: bigint;
  totalCoverage: bigint;
  totalPremiums: bigint;
  totalClaimsPaid: bigint;
  isPaused: boolean;
  // New risk model parameters
  basePremiumRate: bigint;
  riskCurveExponent: number;
  reputationImpactWeight: number;
  claimsHistoryImpactWeight: number;
  marketVolatilityWeight: number;
  jobTypeRiskWeights: number[];
  industryRiskWeights: number[];
  bump: number;
}

// Claims Processor Types
export enum ClaimStatus {
  Pending = 0,
  UnderReview = 1,
  Approved = 2,
  Rejected = 3,
}

export interface Verdict {
  approved: boolean;
  reason: string;
  processedAt: bigint;
}

export interface Claim {
  policy: PublicKey;
  owner: PublicKey;
  amount: bigint;
  status: ClaimStatus;
  evidenceType: string;
  evidenceDescription: string;
  evidenceAttachments: string[];
  submissionDate: bigint;
  verdict: Verdict | null;
  riskScore: number;
  bump: number;
}

export interface ClaimsState {
  authority: PublicKey;
  insuranceProgramId: PublicKey;
  riskPoolId: PublicKey;
  arbitrationThreshold: number;
  autoClaimLimit: bigint;
  autoProcessThreshold: number;
  totalClaims: bigint;
  approvedClaims: bigint;
  rejectedClaims: bigint;
  totalPayoutAmount: bigint;
  isPaused: boolean;
  bump: number;
}

export interface ArbitratorAccount {
  arbitrator: PublicKey;
  isActive: boolean;
  claimsProcessed: bigint;
  bump: number;
}

// Risk Pool Types
export interface RiskPoolState {
  authority: PublicKey;
  insuranceProgramId: PublicKey;
  claimsProcessorId: PublicKey;
  targetReserveRatio: number;
  minCapitalRequirement: bigint;
  riskBufferPercentage: number;
  monteCarloIterations: number;
  totalCapital: bigint;
  totalCoverageLiability: bigint;
  currentReserveRatio: number;
  totalPremiumsCollected: bigint;
  totalClaimsPaid: bigint;
  isPaused: boolean;
  stakingProgramId?: PublicKey; // Optional staking program ID
  premiumSharePercent?: number; // Percentage of premiums shared with stakers
  bump: number;
}

export interface CapitalProvider {
  provider: PublicKey;
  depositedAmount: bigint;
  lastDepositTimestamp: bigint;
  bump: number;
}

export interface SimulationResult {
  runTimestamp: bigint;
  currentPolicies: bigint;
  avgClaimFrequency: number;
  avgClaimSeverity: bigint;
  marketVolatility: number;
  expectedLoss: bigint;
  var95: bigint;
  var99: bigint;
  recommendedCapital: bigint;
  currentCapital: bigint;
  capitalAdequacy: boolean;
  bump: number;
}

// Risk Pool Metrics
export interface RiskPoolMetrics {
  totalCapital: number;
  reserveRatio: number;
  expectedLiabilities: number;
  claimPayouts: number;
  lastUpdated?: Date;
}

// Escrow Program Types
export enum EscrowStatus {
  Active = 0,
  Completed = 1,
  Cancelled = 2,
  Resolved = 3,
}

export interface Milestone {
  title: string;
  description: string;
  amount: bigint;
  deadline: bigint;
  completed: boolean;
  completedAt: bigint | null;
}

export interface Escrow {
  client: PublicKey;
  freelancer: PublicKey;
  amount: bigint;
  description: string;
  createdAt: bigint;
  deadline: bigint;
  status: EscrowStatus;
  milestones: Milestone[];
  completedMilestones: number;
  disputed: boolean;
  disputeReason: string | null;
  disputer: PublicKey | null;
  resolutionNotes: string | null;
  resolvedAt: bigint | null;
  autoReleaseDate: bigint;
  bump: number;
}

export interface EscrowState {
  authority: PublicKey;
  insuranceProgramId: PublicKey;
  disputeResolutionFee: bigint;
  autoReleaseDays: number;
  totalEscrows: bigint;
  activeEscrows: bigint;
  totalVolume: bigint;
  isPaused: boolean;
  bump: number;
}

// DAO Governance Types
export enum ProposalStatus {
  Active = 0,
  Approved = 1,
  Rejected = 2,
  Executed = 3,
}

export interface ProposalAccount {
  pubkey: PublicKey;
  isSigner: boolean;
  isWritable: boolean;
}

export interface Proposal {
  proposer: PublicKey;
  title: string;
  description: string;
  programId: PublicKey;
  instructionData: Uint8Array;
  accounts: ProposalAccount[];
  createdAt: bigint;
  votingEndsAt: bigint;
  executionTime: bigint;
  status: ProposalStatus;
  yesVotes: bigint;
  noVotes: bigint;
  executed: boolean;
  bump: number;
}

export interface VoteRecord {
  voter: PublicKey;
  proposal: PublicKey;
  vote: boolean;
  votingPower: bigint;
  timestamp: bigint;
  bump: number;
}

export interface DaoState {
  authority: PublicKey;
  votingTokenMint: PublicKey;
  minStakeAmount: bigint;
  proposalThreshold: bigint;
  votingPeriodDays: number;
  executionDelayDays: number;
  totalProposals: bigint;
  totalStaked: bigint;
  stakersCount: bigint;
  isPaused: boolean;
  bump: number;
}

export interface StakerAccount {
  staker: PublicKey;
  stakedAmount: bigint;
  lastStakeTimestamp: bigint;
  bump: number;
}

// Staking Program Types
export enum StakingTokenType {
  SOL = 0,
  USDC = 1,
  STAKED_SOL = 2,
  GOVERNANCE_TOKEN = 3,
}

export interface StakePosition {
  id: number;
  amount: bigint;
  tokenMint: PublicKey;
  startTime: bigint;
  unlockTime: bigint;
  lockPeriodDays: number;
  bonusMultiplier: number;
  claimedRewards: bigint;
  isActive: boolean;
}

export interface StakerInfo {
  staker: PublicKey;
  stakedAmount: bigint;
  nextPositionId: bigint;
  lastStakeTime: bigint;
  positions: StakePosition[];
  bump: number;
}

export interface SupportedToken {
  mint: PublicKey;
  name: string;
  weight: number;
  totalStaked: bigint;
  isActive: boolean;
}

export interface StakingState {
  authority: PublicKey;
  riskPoolId: PublicKey;
  daoGovernanceId: PublicKey;
  minStakePeriodDays: number;
  earlyUnstakePenaltyPercent: number;
  rewardDistributionInterval: bigint;
  baseRewardRate: number;
  performanceMultiplierCap: number;
  totalStakedAmount: bigint;
  totalStakers: bigint;
  totalRewardsDistributed: bigint;
  lastRewardDistribution: bigint;
  premiumSharePercent: number;
  isPaused: boolean;
  supportedTokens: SupportedToken[];
  bump: number;
}
