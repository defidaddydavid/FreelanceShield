import { PublicKey } from '@solana/web3.js';
import { formatCurrency, evaluateClaimRisk } from '@/lib/utils';
import { NETWORK_CONFIG } from '../constants';

// Policy interfaces
export interface Policy {
  id: string;
  name?: string;
  description?: string;
  coverageAmount: number;
  premium: number;
  periodDays: number;
  status: 'active' | 'expired' | 'claimed';
  creationDate: number;
  expiryDate: number;
  jobType: string;
  industry: string;
  owner: string;
}

// Claim interfaces
export interface Claim {
  id: string;
  name?: string;
  description?: string;
  policyId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  submissionDate: number;
  riskScore?: number;
  evidenceType: string;
  evidenceDescription: string;
  evidenceAttachments?: string[];
}

// Risk pool metrics interface
export interface RiskPoolMetrics {
  totalPremiums: number;
  totalClaims: number;
  poolBalance: number;
  totalPolicies: number;
  claimCount: number;
  totalCoverage: number;
  openClaimsAmount: number;
  reserveRatio: number;
  solvencyRatio: number;
  claimApprovalRate: number;
}

/**
 * Adapt raw policy response from Solana SDK to our standardized Policy interface
 * @param policyResponse Raw policy data from blockchain
 * @param userPublicKey User's public key
 * @returns Formatted Policy object
 */
export function adaptPolicyResponse(policyResponse: any, userPublicKey: PublicKey): Policy {
  // Extract Unix timestamp if available, or use current time as fallback
  const creationTimestamp = policyResponse.createdAt ? 
    Number(policyResponse.createdAt) * 1000 : // Convert to milliseconds
    Date.now();
  
  // Calculate expiry date based on period days
  const periodDays = Number(policyResponse.periodDays || 30);
  const expiryTimestamp = creationTimestamp + (periodDays * 24 * 60 * 60 * 1000);
  
  // Extract coverageAmount and premium, converting from lamports to SOL
  const coverageAmount = policyResponse.coverageAmount ? 
    Number(policyResponse.coverageAmount) / NETWORK_CONFIG.lamportsPerSol : 0;
  
  const premium = policyResponse.premiumAmount ? 
    Number(policyResponse.premiumAmount) / NETWORK_CONFIG.lamportsPerSol : 0;
  
  // Determine the status of the policy
  const now = Date.now();
  let status: 'active' | 'expired' | 'claimed' = 'active';
  
  if (expiryTimestamp < now) {
    status = 'expired';
  } else if (policyResponse.claimed) {
    status = 'claimed';
  }
  
  return {
    id: policyResponse.pubkey?.toString() || policyResponse.policyPda || 'unknown',
    name: policyResponse.name || `${policyResponse.jobType || 'Freelance'} Insurance`,
    description: policyResponse.description || `Insurance coverage for ${policyResponse.jobType || 'freelance'} work in ${policyResponse.industry || 'technology'}`,
    coverageAmount,
    premium,
    periodDays,
    status,
    creationDate: creationTimestamp,
    expiryDate: expiryTimestamp,
    jobType: policyResponse.jobType || 'General',
    industry: policyResponse.industry || 'Technology',
    owner: policyResponse.owner?.toString() || userPublicKey.toString()
  };
}

/**
 * Adapt raw claim response from Solana SDK to our standardized Claim interface
 * @param claimResponse Raw claim data from blockchain
 * @param userPublicKey User's public key
 * @returns Formatted Claim object
 */
export function adaptClaimResponse(claimResponse: any, userPublicKey: PublicKey): Claim {
  // Extract Unix timestamp if available, or use current time as fallback
  const submissionTimestamp = claimResponse.submittedAt ? 
    Number(claimResponse.submittedAt) * 1000 : // Convert to milliseconds
    Date.now();
  
  // Extract claim amount, converting from lamports to SOL
  const amount = claimResponse.claimAmount ? 
    Number(claimResponse.claimAmount) / NETWORK_CONFIG.lamportsPerSol : 0;
  
  // Extract policy info
  const policyAmount = claimResponse.policyAmount ? 
    Number(claimResponse.policyAmount) / NETWORK_CONFIG.lamportsPerSol : 0;
  
  // Determine the status of the claim
  let status: 'pending' | 'approved' | 'rejected' | 'processing' = 'pending';
  
  if (claimResponse.status) {
    // Direct status mapping if available
    status = claimResponse.status.toLowerCase();
  } else if (claimResponse.approved) {
    status = 'approved';
  } else if (claimResponse.rejected) {
    status = 'rejected';
  } else if (claimResponse.processing) {
    status = 'processing';
  }
  
  // Calculate risk score if not provided
  let riskScore: number | undefined = claimResponse.riskScore;
  
  if (riskScore === undefined && amount && policyAmount) {
    // Calculate risk evaluation
    try {
      const riskEvaluation = evaluateClaimRisk({
        claimAmount: amount,
        coverageAmount: policyAmount,
        policyStartDate: new Date(submissionTimestamp - (30 * 24 * 60 * 60 * 1000)),
        claimSubmissionDate: new Date(submissionTimestamp),
        previousClaims: 0
      });
      
      riskScore = riskEvaluation.riskScore;
    } catch (error) {
      console.error('Error calculating risk score:', error);
    }
  }
  
  return {
    id: claimResponse.pubkey?.toString() || claimResponse.claimPda || 'unknown',
    name: claimResponse.name || `Claim #${claimResponse.pubkey?.toString().slice(0, 8) || 'New'}`,
    description: claimResponse.description || claimResponse.evidenceDescription || 'Freelance work compensation claim',
    policyId: claimResponse.policyPda?.toString() || 'unknown',
    amount,
    status,
    submissionDate: submissionTimestamp,
    riskScore,
    evidenceType: claimResponse.evidenceType || 'Documentation',
    evidenceDescription: claimResponse.evidenceDescription || '',
    evidenceAttachments: claimResponse.evidenceAttachments || []
  };
}

/**
 * Adapt raw risk pool metrics from Solana SDK to our standardized RiskPoolMetrics interface
 * @param metricsResponse Raw metrics data from blockchain
 * @returns Formatted RiskPoolMetrics object
 */
export function adaptRiskPoolMetricsResponse(metricsResponse: any): RiskPoolMetrics {
  // Extract metrics, converting from lamports to SOL where needed
  const totalPremiums = metricsResponse.totalPremiums ? 
    Number(metricsResponse.totalPremiums) / NETWORK_CONFIG.lamportsPerSol : 0;
  
  const totalClaims = metricsResponse.totalClaims ? 
    Number(metricsResponse.totalClaims) / NETWORK_CONFIG.lamportsPerSol : 0;
  
  const poolBalance = metricsResponse.poolBalance ? 
    Number(metricsResponse.poolBalance) / NETWORK_CONFIG.lamportsPerSol : 0;
  
  const totalCoverage = metricsResponse.totalCoverage ? 
    Number(metricsResponse.totalCoverage) / NETWORK_CONFIG.lamportsPerSol : 0;
  
  const openClaimsAmount = metricsResponse.openClaimsAmount ? 
    Number(metricsResponse.openClaimsAmount) / NETWORK_CONFIG.lamportsPerSol : 0;
  
  // Calculate ratios
  const reserveRatio = metricsResponse.reserveRatio || 
    (totalPremiums > 0 ? poolBalance / totalPremiums : 0);
  
  const solvencyRatio = metricsResponse.solvencyRatio || 
    (totalCoverage > 0 ? poolBalance / totalCoverage : 0);
  
  const claimApprovalRate = metricsResponse.claimApprovalRate || 
    (metricsResponse.claimCount > 0 ? (metricsResponse.approvedClaimCount || 0) / metricsResponse.claimCount : 0);
  
  return {
    totalPremiums,
    totalClaims,
    poolBalance,
    totalPolicies: metricsResponse.policyCount || 0,
    claimCount: metricsResponse.claimCount || 0,
    totalCoverage,
    openClaimsAmount,
    reserveRatio,
    solvencyRatio,
    claimApprovalRate
  };
}
