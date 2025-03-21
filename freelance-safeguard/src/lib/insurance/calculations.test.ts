import { describe, it, expect } from 'vitest';
import {
  calculatePremium,
  calculateReserveRequirements,
  evaluateClaimRisk,
  type PremiumInput
} from './calculations';

describe('Insurance Premium Calculations', () => {
  // Base case test
  it('calculates base premium correctly', () => {
    const input: PremiumInput = {
      coverageAmount: 1000,
      periodDays: 30,
      jobType: 'SOFTWARE_DEVELOPMENT',
      industry: 'TECHNOLOGY',
      reputationScore: 80,
      claimHistory: 0
    };

    const result = calculatePremium(input);
    expect(result.premiumSOL).toBeGreaterThan(0);
    expect(result.riskScore).toBeLessThanOrEqual(100);
    expect(result.breakdownFactors.baseRate).toBe(0.1);
  });

  // Coverage ratio scaling test
  it('scales premium non-linearly with coverage amount', () => {
    const baseInput: PremiumInput = {
      coverageAmount: 1000,
      periodDays: 30,
      jobType: 'SOFTWARE_DEVELOPMENT',
      industry: 'TECHNOLOGY',
      reputationScore: 80,
      claimHistory: 0
    };

    const highCoverageInput: PremiumInput = {
      ...baseInput,
      coverageAmount: 10000
    };

    const basePremium = calculatePremium(baseInput).premiumSOL;
    const highPremium = calculatePremium(highCoverageInput).premiumSOL;

    // Premium should increase non-linearly (more than 10x for 10x coverage)
    expect(highPremium / basePremium).toBeGreaterThan(10);
  });

  // Period adjustment test
  it('adjusts premium based on coverage period', () => {
    const baseInput: PremiumInput = {
      coverageAmount: 1000,
      periodDays: 30,
      jobType: 'SOFTWARE_DEVELOPMENT',
      industry: 'TECHNOLOGY',
      reputationScore: 80,
      claimHistory: 0
    };

    const longPeriodInput: PremiumInput = {
      ...baseInput,
      periodDays: 365
    };

    const basePremium = calculatePremium(baseInput).premiumSOL;
    const longPremium = calculatePremium(longPeriodInput).premiumSOL;

    // Premium should increase non-linearly with period
    expect(longPremium / basePremium).toBeGreaterThan(12);
  });

  // Risk factors test
  it('applies risk factors correctly', () => {
    const lowRiskInput: PremiumInput = {
      coverageAmount: 1000,
      periodDays: 30,
      jobType: 'WRITING',
      industry: 'EDUCATION',
      reputationScore: 90,
      claimHistory: 0
    };

    const highRiskInput: PremiumInput = {
      coverageAmount: 1000,
      periodDays: 30,
      jobType: 'CONSULTING',
      industry: 'FINANCE',
      reputationScore: 60,
      claimHistory: 2
    };

    const lowRiskPremium = calculatePremium(lowRiskInput);
    const highRiskPremium = calculatePremium(highRiskInput);

    expect(highRiskPremium.premiumSOL).toBeGreaterThan(lowRiskPremium.premiumSOL);
    expect(highRiskPremium.riskScore).toBeGreaterThan(lowRiskPremium.riskScore);
  });

  // Input validation test
  it('validates input parameters', () => {
    const invalidInput = {
      coverageAmount: -1000,
      periodDays: 10,
      jobType: 'INVALID_JOB',
      industry: 'TECHNOLOGY',
      reputationScore: 150,
      claimHistory: -1
    };

    expect(() => calculatePremium(invalidInput as any)).toThrow();
  });
});

describe('Reserve Requirements Calculations', () => {
  it('calculates minimum reserve requirements', () => {
    const result = calculateReserveRequirements(100000, 10);
    
    expect(result.minimumReserveSOL).toBeGreaterThan(0);
    expect(result.recommendedReserveSOL).toBeGreaterThan(result.minimumReserveSOL);
    expect(result.reserveRatio).toBeLessThan(1);
  });

  it('scales reserves with policy count', () => {
    const smallPool = calculateReserveRequirements(100000, 10);
    const largePool = calculateReserveRequirements(100000, 100);

    expect(largePool.minimumReserveSOL).toBeGreaterThan(smallPool.minimumReserveSOL);
  });
});

describe('Claim Risk Evaluation', () => {
  it('evaluates low-risk claims correctly', () => {
    const lowRiskClaim = {
      amount: 1000,
      policyAge: 180,
      claimDescription: 'Valid claim with proper documentation',
      previousClaims: 0
    };

    const result = evaluateClaimRisk(lowRiskClaim);
    expect(result.riskScore).toBeLessThan(70);
    expect(result.flaggedForReview).toBe(false);
    expect(result.riskFactors.length).toBe(0);
  });

  it('flags high-risk claims', () => {
    const highRiskClaim = {
      amount: 10000,
      policyAge: 30,
      claimDescription: 'Large claim on new policy',
      previousClaims: 2,
      timeFromLastClaim: 15
    };

    const result = evaluateClaimRisk(highRiskClaim);
    expect(result.riskScore).toBeGreaterThan(70);
    expect(result.flaggedForReview).toBe(true);
    expect(result.riskFactors.length).toBeGreaterThan(0);
  });

  it('considers claim frequency', () => {
    const frequentClaims = {
      amount: 1000,
      policyAge: 90,
      claimDescription: 'Another claim',
      previousClaims: 3,
      timeFromLastClaim: 20
    };

    const result = evaluateClaimRisk(frequentClaims);
    expect(result.riskFactors).toContain('Multiple previous claims');
    expect(result.riskFactors).toContain('Recent previous claim');
  });
});
