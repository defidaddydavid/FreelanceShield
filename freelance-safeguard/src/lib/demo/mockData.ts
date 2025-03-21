/**
 * Mock Data for FreelanceShield Demo Mode
 * 
 * This file contains static data used when users are in Demo Mode
 * (not connected with a wallet)
 */

import { PublicKey } from '@solana/web3.js';
// Import enums directly to avoid circular dependency
// Instead of importing from hooks which imports this file
export enum JobType {
  WEB_DEVELOPMENT = 'WEB_DEVELOPMENT',
  MOBILE_DEVELOPMENT = 'MOBILE_DEVELOPMENT',
  GRAPHIC_DESIGN = 'GRAPHIC_DESIGN',
  CONTENT_WRITING = 'CONTENT_WRITING',
  MARKETING = 'MARKETING',
  DATA_ANALYSIS = 'DATA_ANALYSIS',
  UI_UX_DESIGN = 'UI_UX_DESIGN',
  BLOCKCHAIN_DEVELOPMENT = 'BLOCKCHAIN_DEVELOPMENT',
  OTHER = 'OTHER'
}

export enum Industry {
  TECHNOLOGY = 'TECHNOLOGY',
  CREATIVE = 'CREATIVE',
  FINANCE = 'FINANCE',
  HEALTHCARE = 'HEALTHCARE',
  EDUCATION = 'EDUCATION',
  ECOMMERCE = 'ECOMMERCE',
  ENTERTAINMENT = 'ENTERTAINMENT',
  REAL_ESTATE = 'REAL_ESTATE',
  OTHER = 'OTHER'
}

// Import the interfaces but not the enums to avoid circular dependency
import type { PolicyDetails, ClaimDetails, PaymentVerificationDetails, RiskPoolMetrics } from '@/hooks/useSolanaInsurance';
import { RISK_WEIGHTS } from '../solana/constants'; // Updated path to the correct location

// Mock wallet address - using a valid base58 string for demo
export const DEMO_WALLET_ADDRESS = '11111111111111111111111111111111';

// Mock policy details
export const DEMO_POLICIES: PolicyDetails[] = [
  {
    owner: new PublicKey('GvDMxPzNj1rGXPQm9jJ5NnGgKg6ZjfQ5xw2TbDs4UsJv'),
    coverageAmount: 5000,
    premiumAmount: 0.25,
    startDate: new Date(2025, 2, 1), // March 1, 2025
    endDate: new Date(2025, 5, 1),   // June 1, 2025
    status: 'ACTIVE',
    jobType: JobType.WEB_DEVELOPMENT,
    industry: Industry.TECHNOLOGY,
    claimsCount: 0
  },
  {
    owner: new PublicKey('GvDMxPzNj1rGXPQm9jJ5NnGgKg6ZjfQ5xw2TbDs4UsJv'),
    coverageAmount: 2500,
    premiumAmount: 0.15,
    startDate: new Date(2025, 0, 15), // Jan 15, 2025
    endDate: new Date(2025, 3, 15),   // April 15, 2025
    status: 'ACTIVE',
    jobType: JobType.GRAPHIC_DESIGN,
    industry: Industry.CREATIVE,
    claimsCount: 1
  }
];

// Export the first policy as DEMO_POLICY for single policy use cases
export const DEMO_POLICY = DEMO_POLICIES[0];

// Mock claims details
export const DEMO_CLAIMS: ClaimDetails[] = [
  {
    policy: 'Policy_12345',
    owner: DEMO_WALLET_ADDRESS,
    amount: 1200,
    status: 'APPROVED',
    evidenceType: 'CONTRACT_BREACH',
    evidenceDescription: 'Client failed to pay after project completion',
    evidenceAttachments: ['contract.pdf', 'communication_log.pdf'],
    submissionDate: new Date(2025, 1, 10), // Feb 10, 2025
    verdict: {
      approved: true,
      reason: 'Evidence clearly shows completed work with no payment',
      processedAt: new Date(2025, 1, 15) // Feb 15, 2025
    }
  },
  {
    policy: 'Policy_67890',
    owner: DEMO_WALLET_ADDRESS,
    amount: 800,
    status: 'PENDING',
    evidenceType: 'PAYMENT_DELAY',
    evidenceDescription: 'Payment delayed by more than 30 days',
    evidenceAttachments: ['invoice.pdf', 'email_thread.pdf'],
    submissionDate: new Date(2025, 2, 5), // March 5, 2025
    verdict: null
  }
];

// Mock payment verification details
export const DEMO_PAYMENT_VERIFICATIONS: PaymentVerificationDetails[] = [
  {
    freelancer: DEMO_WALLET_ADDRESS,
    client: 'Client_ABC123',
    expectedAmount: 3000,
    deadline: new Date(2025, 3, 15), // April 15, 2025
    status: 'PENDING',
    createdAt: new Date(2025, 2, 15), // March 15, 2025
    paidAt: null
  },
  {
    freelancer: DEMO_WALLET_ADDRESS,
    client: 'Client_DEF456',
    expectedAmount: 1500,
    deadline: new Date(2025, 2, 28), // March 28, 2025
    status: 'COMPLETED',
    createdAt: new Date(2025, 2, 1), // March 1, 2025
    paidAt: new Date(2025, 2, 25) // March 25, 2025
  }
];

// Mock risk pool metrics
const mockRiskPoolMetrics: RiskPoolMetrics = {
  reserveRatio: 0,
  totalCapital: 0,
  totalPolicies: 0,
  totalClaims: 0,
  totalPremiums: 0,
  totalPayouts: 0,
  claimsCount: 0,
  lastUpdated: new Date()
};

export const DEMO_RISK_POOL_METRICS = mockRiskPoolMetrics;

// Mock staking data
export const DEMO_STAKING_POSITIONS = [
  {
    id: 1,
    owner: new PublicKey('GvDMxPzNj1rGXPQm9jJ5NnGgKg6ZjfQ5xw2TbDs4UsJv'),
    tokenMint: new PublicKey('GvDMxPzNj1rGXPQm9jJ5NnGgKg6ZjfQ5xw2TbDs4UsJv'),
    amount: 1000000000, // 1000 tokens
    lockPeriodDays: 90,
    startTime: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60), // 30 days ago
    endTime: Math.floor(Date.now() / 1000) + (60 * 24 * 60 * 60),   // 60 days from now
    lastClaimTime: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60), // 7 days ago
    isActive: true,
    bonusMultiplier: 10 // 10% bonus
  },
  {
    id: 2,
    owner: new PublicKey('GvDMxPzNj1rGXPQm9jJ5NnGgKg6ZjfQ5xw2TbDs4UsJv'),
    tokenMint: new PublicKey('GvDMxPzNj1rGXPQm9jJ5NnGgKg6ZjfQ5xw2TbDs4UsJv'),
    amount: 500000000, // 500 tokens
    lockPeriodDays: 180,
    startTime: Math.floor(Date.now() / 1000) - (60 * 24 * 60 * 60), // 60 days ago
    endTime: Math.floor(Date.now() / 1000) + (120 * 24 * 60 * 60),  // 120 days from now
    lastClaimTime: Math.floor(Date.now() / 1000) - (14 * 24 * 60 * 60), // 14 days ago
    isActive: true,
    bonusMultiplier: 20 // 20% bonus
  }
];

// Mock premium calculation results
export const DEMO_PREMIUM_RESULT = {
  premium: 0.235,
  riskScore: 72,
  riskDecile: 7,
  claimProbability: 0.085,
  confidenceInterval: [0.065, 0.105] as [number, number],
  timeBasedProjections: {
    threeMonths: 0.235,
    sixMonths: 0.45,
    twelveMonths: 0.85
  },
  breakdownFactors: [
    { name: 'Base Rate', value: 0.1, description: 'Starting premium rate' },
    { name: 'Coverage Ratio', value: 1.2, description: 'Based on coverage amount' },
    { name: 'Period Adjustment', value: 1.1, description: 'Based on coverage period' },
    { name: 'Job Type Risk', value: 1.05, description: 'Web development risk factor' },
    { name: 'Industry Risk', value: 1.1, description: 'Technology industry risk' },
    { name: 'Reputation Factor', value: 0.9, description: 'Based on reputation score' },
    { name: 'Market Conditions', value: 1.05, description: 'Current market volatility' }
  ],
  recommendations: [
    { text: 'Use escrow for payments to reduce premium by 10%', impact: -0.1 },
    { text: 'Increase coverage period to 90 days for better rates', impact: -0.05 },
    { text: 'Complete identity verification for 5% discount', impact: -0.05 }
  ]
};

// Mock Monte Carlo simulation results
export const DEMO_MONTE_CARLO_RESULT = {
  iterations: 1000,
  convergenceRate: 0.9875,
  confidenceLevel: 95,
  claimProbability: 0.085,
  expectedLosses: [
    { percentile: 50, value: 12500 },
    { percentile: 75, value: 18750 },
    { percentile: 90, value: 25000 },
    { percentile: 95, value: 31250 },
    { percentile: 99, value: 37500 }
  ],
  capitalAdequacy: {
    requiredCapital: 31250,
    currentCapital: 50000,
    surplusDeficit: 18750,
    adequacyRatio: 1.6
  }
};

// Add wallet balance for demo mode
export const DEMO_WALLET_BALANCE = {
  sol: 5.75,
  usdc: 250.45
};

// Demo user profile
export const DEMO_USER_PROFILE = {
  username: 'demo_user',
  reputationScore: 85,
  verificationLevel: 'BASIC',
  memberSince: new Date(2024, 9, 15), // Oct 15, 2024
  completedJobs: 24,
  totalEarnings: 15000,
  preferredJobTypes: [JobType.WEB_DEVELOPMENT, JobType.MOBILE_DEVELOPMENT],
  preferredIndustries: [Industry.TECHNOLOGY, Industry.ECOMMERCE]
};

console.log('Job Types:', RISK_WEIGHTS.jobTypes);

const jobTypes = {
  WEB_DEVELOPMENT: RISK_WEIGHTS.jobTypes?.SOFTWARE_DEVELOPMENT || 'UNKNOWN',
  GRAPHIC_DESIGN: RISK_WEIGHTS.jobTypes?.DESIGN || 'UNKNOWN',
  MOBILE_DEVELOPMENT: RISK_WEIGHTS.jobTypes?.OTHER || 'UNKNOWN',
  // Add other job types with optional chaining
};
