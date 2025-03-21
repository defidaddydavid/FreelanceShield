/**
 * Monte Carlo Simulation Engine for FreelanceShield
 * 
 * This module implements advanced stochastic risk modeling using Monte Carlo simulations
 * to accurately predict claim probabilities and adjust premiums based on risk profiles.
 */

import { AIPremiumInput } from './aiRiskModeling';
import { RISK_WEIGHTS } from '@/lib/solana/constants';

// Configuration for Monte Carlo simulations
export const MONTE_CARLO_CONFIG = {
  DEFAULT_ITERATIONS: 10000,
  TAIL_RISK_PERCENTILE: 95, // Percentile for tail risk analysis
  CONFIDENCE_INTERVAL: 0.95, // 95% confidence interval
  PARALLEL_BATCH_SIZE: 1000, // Batch size for parallel execution
  RISK_BUCKETS: {
    LOW: { threshold: 30, premiumMultiplier: 0.8 },
    MEDIUM: { threshold: 70, premiumMultiplier: 1.0 },
    HIGH: { threshold: 100, premiumMultiplier: 1.5 }
  },
  // Probability density function parameters for different risk factors
  PDF_PARAMETERS: {
    JOB_TYPE: {
      SOFTWARE_DEVELOPMENT: { mean: 0.05, stdDev: 0.02 },
      DESIGN: { mean: 0.07, stdDev: 0.03 },
      WRITING: { mean: 0.06, stdDev: 0.025 },
      MARKETING: { mean: 0.08, stdDev: 0.035 },
      CONSULTING: { mean: 0.09, stdDev: 0.04 },
      OTHER: { mean: 0.085, stdDev: 0.035 }
    },
    INDUSTRY: {
      TECHNOLOGY: { mean: 0.05, stdDev: 0.02 },
      HEALTHCARE: { mean: 0.07, stdDev: 0.03 },
      FINANCE: { mean: 0.09, stdDev: 0.04 },
      EDUCATION: { mean: 0.04, stdDev: 0.015 },
      RETAIL: { mean: 0.06, stdDev: 0.025 },
      OTHER: { mean: 0.075, stdDev: 0.03 }
    },
    REPUTATION: {
      HIGH: { mean: 0.03, stdDev: 0.01 }, // 90-100 score
      MEDIUM: { mean: 0.06, stdDev: 0.02 }, // 70-89 score
      LOW: { mean: 0.12, stdDev: 0.05 } // Below 70 score
    },
    ESCROW_USAGE: {
      HIGH: { mean: 0.04, stdDev: 0.015 }, // >75% usage
      MEDIUM: { mean: 0.07, stdDev: 0.025 }, // 25-75% usage
      LOW: { mean: 0.1, stdDev: 0.04 } // <25% usage
    },
    CLAIM_HISTORY: {
      NONE: { mean: 0.04, stdDev: 0.01 },
      LOW: { mean: 0.08, stdDev: 0.03 }, // 1-2 claims
      MEDIUM: { mean: 0.12, stdDev: 0.05 }, // 3-5 claims
      HIGH: { mean: 0.2, stdDev: 0.08 } // >5 claims
    },
    USDC_VOLATILITY: {
      LOW: { mean: 0.01, stdDev: 0.005 },
      MEDIUM: { mean: 0.03, stdDev: 0.01 },
      HIGH: { mean: 0.05, stdDev: 0.02 }
    }
  },
  // Correlation matrix between different risk factors
  CORRELATION_MATRIX: {
    JOB_TYPE_INDUSTRY: 0.3,
    REPUTATION_CLAIM_HISTORY: -0.6,
    ESCROW_CLAIM_PROBABILITY: -0.5,
    REPUTATION_PAYMENT_BEHAVIOR: 0.7,
    VOLATILITY_CLAIM_PROBABILITY: 0.4
  }
};

// Types for simulation results
export interface MonteCarloSimulationResult {
  claimProbability: number;
  confidenceInterval: [number, number];
  riskDecile: number;
  riskBucket: 'LOW' | 'MEDIUM' | 'HIGH';
  premiumAdjustment: number;
  tailRisk: number;
  varianceContributions: Record<string, number>;
  simulationPaths: SimulationPath[];
  convergenceMetrics: ConvergenceMetrics;
}

export interface SimulationPath {
  iteration: number;
  claimOccurred: boolean;
  claimAmount: number;
  riskFactors: Record<string, number>;
}

export interface ConvergenceMetrics {
  meanConvergence: number[];
  varianceConvergence: number[];
  iterationsToConvergence: number;
  converged: boolean;
}

/**
 * Generate random number from normal distribution
 */
function normalRandom(mean: number, stdDev: number): number {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdDev;
}

/**
 * Apply correlation between two random variables
 */
function applyCorrelation(x: number, y: number, correlation: number): number {
  return correlation * x + Math.sqrt(1 - correlation * correlation) * y;
}

/**
 * Categorize reputation score into buckets
 */
function categorizeReputation(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 90) return 'HIGH';
  if (score >= 70) return 'MEDIUM';
  return 'LOW';
}

/**
 * Categorize escrow usage into buckets
 */
function categorizeEscrowUsage(input: AIPremiumInput): 'HIGH' | 'MEDIUM' | 'LOW' {
  const escrowCount = input.escrowTransactionCount || 0;
  const totalTransactions = input.transactionCount || 1;
  const escrowRatio = escrowCount / totalTransactions;
  
  if (escrowRatio >= 0.75) return 'HIGH';
  if (escrowRatio >= 0.25) return 'MEDIUM';
  return 'LOW';
}

/**
 * Categorize claim history into buckets
 */
function categorizeClaimHistory(claimCount: number): 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' {
  if (claimCount === 0) return 'NONE';
  if (claimCount <= 2) return 'LOW';
  if (claimCount <= 5) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Categorize USDC volatility based on market conditions
 */
function categorizeUSDCVolatility(volatility: number = 0.02): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (volatility < 0.01) return 'LOW';
  if (volatility < 0.03) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Generate simulation paths for Monte Carlo analysis
 * @param numIterations Number of simulation iterations to run
 * @param baseRiskValues Base risk values for different factors
 * @param varianceFactors Variance factors for different risk components
 * @returns Array of simulation paths
 */
export function generateSimulationPaths(
  numIterations: number,
  baseRiskValues: Record<string, number>,
  varianceFactors: Record<string, { mean: number; stdDev: number }>,
  correlationMatrix: Record<string, number> = MONTE_CARLO_CONFIG.CORRELATION_MATRIX
): SimulationPath[] {
  const simulationPaths: SimulationPath[] = [];
  
  for (let i = 0; i < numIterations; i++) {
    // Generate correlated random variables for risk factors
    const jobTypeRandom = normalRandom(varianceFactors.JOB_TYPE.mean, varianceFactors.JOB_TYPE.stdDev);
    const industryRandom = normalRandom(varianceFactors.INDUSTRY.mean, varianceFactors.INDUSTRY.stdDev);
    
    // Apply correlation between job type and industry
    const correlatedIndustryRandom = applyCorrelation(
      jobTypeRandom, 
      industryRandom, 
      correlationMatrix.JOB_TYPE_INDUSTRY
    );
    
    // Generate other risk factors
    const reputationRandom = normalRandom(varianceFactors.REPUTATION.mean, varianceFactors.REPUTATION.stdDev);
    const escrowRandom = normalRandom(varianceFactors.ESCROW_USAGE.mean, varianceFactors.ESCROW_USAGE.stdDev);
    const claimHistoryRandom = normalRandom(varianceFactors.CLAIM_HISTORY.mean, varianceFactors.CLAIM_HISTORY.stdDev);
    const volatilityRandom = normalRandom(varianceFactors.USDC_VOLATILITY.mean, varianceFactors.USDC_VOLATILITY.stdDev);
    
    // Apply correlations between other factors
    const correlatedClaimHistoryRandom = applyCorrelation(
      reputationRandom,
      claimHistoryRandom,
      correlationMatrix.REPUTATION_CLAIM_HISTORY
    );
    
    const correlatedEscrowRandom = applyCorrelation(
      escrowRandom,
      claimHistoryRandom,
      correlationMatrix.ESCROW_CLAIM_PROBABILITY
    );
    
    const correlatedVolatilityRandom = applyCorrelation(
      volatilityRandom,
      claimHistoryRandom,
      correlationMatrix.VOLATILITY_CLAIM_PROBABILITY
    );
    
    // Calculate combined risk factor (probability of claim)
    const combinedRiskFactor = (
      baseRiskValues.JOB_TYPE * jobTypeRandom +
      baseRiskValues.INDUSTRY * correlatedIndustryRandom +
      baseRiskValues.REPUTATION * reputationRandom +
      baseRiskValues.ESCROW_USAGE * correlatedEscrowRandom +
      baseRiskValues.CLAIM_HISTORY * correlatedClaimHistoryRandom +
      baseRiskValues.USDC_VOLATILITY * correlatedVolatilityRandom
    ) / Object.keys(baseRiskValues).length;
    
    // Determine if claim occurs in this simulation
    const claimOccurred = Math.random() < combinedRiskFactor;
    
    // Calculate claim amount if claim occurred
    const claimAmount = claimOccurred ? 
      baseRiskValues.AVERAGE_CLAIM_AMOUNT * (0.5 + Math.random()) : 0;
    
    // Store simulation path
    simulationPaths.push({
      iteration: i,
      claimOccurred,
      claimAmount,
      riskFactors: {
        jobType: jobTypeRandom,
        industry: correlatedIndustryRandom,
        reputation: reputationRandom,
        escrowUsage: correlatedEscrowRandom,
        claimHistory: correlatedClaimHistoryRandom,
        usdcVolatility: correlatedVolatilityRandom,
        combinedRisk: combinedRiskFactor
      }
    });
  }
  
  return simulationPaths;
}

/**
 * Calculate convergence metrics for simulation
 */
function calculateConvergenceMetrics(simulationPaths: SimulationPath[]): ConvergenceMetrics {
  const meanConvergence: number[] = [];
  const varianceConvergence: number[] = [];
  let iterationsToConvergence = simulationPaths.length;
  let converged = false;
  
  // Calculate running mean and variance
  for (let i = 100; i < simulationPaths.length; i += 100) {
    const subset = simulationPaths.slice(0, i);
    const claimOccurrences = subset.filter(path => path.claimOccurred).length;
    const mean = claimOccurrences / i;
    
    // Calculate variance
    const squaredDiffs = subset.map(path => {
      const value = path.claimOccurred ? 1 : 0;
      return Math.pow(value - mean, 2);
    });
    const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / i;
    
    meanConvergence.push(mean);
    varianceConvergence.push(variance);
    
    // Check for convergence (less than 1% change in mean)
    if (meanConvergence.length > 5) {
      const recentMeans = meanConvergence.slice(-5);
      const maxChange = Math.max(...recentMeans) - Math.min(...recentMeans);
      const relativeChange = maxChange / recentMeans[0];
      
      if (relativeChange < 0.01 && !converged) {
        converged = true;
        iterationsToConvergence = i;
      }
    }
  }
  
  return {
    meanConvergence,
    varianceConvergence,
    iterationsToConvergence,
    converged
  };
}

/**
 * Calculate variance contributions from different risk factors
 */
function calculateVarianceContributions(simulationPaths: SimulationPath[]): Record<string, number> {
  const riskFactors = ['jobType', 'industry', 'reputation', 'escrowUsage', 'claimHistory', 'usdcVolatility'];
  const contributions: Record<string, number> = {};
  
  // Calculate correlation between each risk factor and claim occurrence
  for (const factor of riskFactors) {
    const factorValues = simulationPaths.map(path => path.riskFactors[factor]);
    const claimOccurrences = simulationPaths.map(path => path.claimOccurred ? 1 : 0);
    
    // Calculate correlation coefficient
    const factorMean = factorValues.reduce((sum, val) => sum + val, 0) / factorValues.length;
    const claimMean = claimOccurrences.reduce((sum, val) => sum + val, 0) / claimOccurrences.length;
    
    let numerator = 0;
    let factorDenominator = 0;
    let claimDenominator = 0;
    
    for (let i = 0; i < factorValues.length; i++) {
      const factorDiff = factorValues[i] - factorMean;
      const claimDiff = claimOccurrences[i] - claimMean;
      
      numerator += factorDiff * claimDiff;
      factorDenominator += factorDiff * factorDiff;
      claimDenominator += claimDiff * claimDiff;
    }
    
    const correlation = numerator / Math.sqrt(factorDenominator * claimDenominator);
    contributions[factor] = Math.abs(correlation);
  }
  
  // Normalize contributions to sum to 1
  const total = Object.values(contributions).reduce((sum, val) => sum + val, 0);
  for (const factor of riskFactors) {
    contributions[factor] /= total;
  }
  
  return contributions;
}

/**
 * Simulate claim probability using Monte Carlo methods
 * @param input User risk data
 * @param monteCarloIterations Number of iterations for simulation
 * @param baseFailureRate Base failure rate for the simulation
 * @returns Simulation results with claim probability and adjustments
 */
export function simulateClaimProbability(
  input: AIPremiumInput,
  monteCarloIterations: number = MONTE_CARLO_CONFIG.DEFAULT_ITERATIONS,
  baseFailureRate: number = 0.05
): MonteCarloSimulationResult {
  // Determine risk parameters based on input
  const jobType = input.jobType;
  const industry = input.industry;
  const reputationCategory = categorizeReputation(input.reputationScore);
  const escrowCategory = categorizeEscrowUsage(input);
  const claimCategory = categorizeClaimHistory(input.claimHistory);
  const volatilityCategory = categorizeUSDCVolatility();
  
  // Get PDF parameters for each risk factor
  const jobTypePDF = MONTE_CARLO_CONFIG.PDF_PARAMETERS.JOB_TYPE[jobType as keyof typeof MONTE_CARLO_CONFIG.PDF_PARAMETERS.JOB_TYPE];
  const industryPDF = MONTE_CARLO_CONFIG.PDF_PARAMETERS.INDUSTRY[industry as keyof typeof MONTE_CARLO_CONFIG.PDF_PARAMETERS.INDUSTRY];
  const reputationPDF = MONTE_CARLO_CONFIG.PDF_PARAMETERS.REPUTATION[reputationCategory];
  const escrowPDF = MONTE_CARLO_CONFIG.PDF_PARAMETERS.ESCROW_USAGE[escrowCategory];
  const claimPDF = MONTE_CARLO_CONFIG.PDF_PARAMETERS.CLAIM_HISTORY[claimCategory];
  const volatilityPDF = MONTE_CARLO_CONFIG.PDF_PARAMETERS.USDC_VOLATILITY[volatilityCategory];
  
  // Set base risk values
  const baseRiskValues = {
    JOB_TYPE: RISK_WEIGHTS.jobTypes[jobType] || 1.0,
    INDUSTRY: RISK_WEIGHTS.industries[industry] || 1.0,
    REPUTATION: (100 - input.reputationScore) / 100, // Higher reputation = lower risk
    ESCROW_USAGE: input.escrowTransactionCount ? 
      1 - (input.escrowTransactionCount / (input.transactionCount || 1)) : 0.5,
    CLAIM_HISTORY: Math.min(1, input.claimHistory * 0.2),
    USDC_VOLATILITY: 0.02, // Default volatility
    AVERAGE_CLAIM_AMOUNT: input.coverageAmount * 0.7 // Average claim is 70% of coverage
  };
  
  // Generate simulation paths
  const simulationPaths = generateSimulationPaths(
    monteCarloIterations,
    baseRiskValues,
    {
      JOB_TYPE: jobTypePDF,
      INDUSTRY: industryPDF,
      REPUTATION: reputationPDF,
      ESCROW_USAGE: escrowPDF,
      CLAIM_HISTORY: claimPDF,
      USDC_VOLATILITY: volatilityPDF
    }
  );
  
  // Calculate claim probability
  const claimOccurrences = simulationPaths.filter(path => path.claimOccurred).length;
  const claimProbability = claimOccurrences / monteCarloIterations;
  
  // Calculate confidence interval (using normal approximation)
  const standardError = Math.sqrt((claimProbability * (1 - claimProbability)) / monteCarloIterations);
  const zScore = 1.96; // 95% confidence interval
  const confidenceInterval: [number, number] = [
    Math.max(0, claimProbability - zScore * standardError),
    Math.min(1, claimProbability + zScore * standardError)
  ];
  
  // Calculate risk decile (1-10 scale)
  const riskDecile = Math.min(10, Math.ceil(claimProbability * 20));
  
  // Determine risk bucket
  let riskBucket: 'LOW' | 'MEDIUM' | 'HIGH';
  if (riskDecile <= 3) riskBucket = 'LOW';
  else if (riskDecile <= 7) riskBucket = 'MEDIUM';
  else riskBucket = 'HIGH';
  
  // Calculate premium adjustment based on risk bucket
  const premiumAdjustment = MONTE_CARLO_CONFIG.RISK_BUCKETS[riskBucket].premiumMultiplier;
  
  // Calculate tail risk (95th percentile of claim amounts)
  const claimAmounts = simulationPaths
    .filter(path => path.claimOccurred)
    .map(path => path.claimAmount)
    .sort((a, b) => a - b);
  
  const tailRiskIndex = Math.floor(claimAmounts.length * (MONTE_CARLO_CONFIG.TAIL_RISK_PERCENTILE / 100));
  const tailRisk = claimAmounts.length > 0 ? claimAmounts[tailRiskIndex] || 0 : 0;
  
  // Calculate variance contributions
  const varianceContributions = calculateVarianceContributions(simulationPaths);
  
  // Calculate convergence metrics
  const convergenceMetrics = calculateConvergenceMetrics(simulationPaths);
  
  return {
    claimProbability,
    confidenceInterval,
    riskDecile,
    riskBucket,
    premiumAdjustment,
    tailRisk,
    varianceContributions,
    simulationPaths,
    convergenceMetrics
  };
}

/**
 * Adjust premium using Monte Carlo simulation results
 * @param simulationResults Results from Monte Carlo simulation
 * @param basePremium Base premium amount
 * @returns Adjusted premium
 */
export function adjustPremiumUsingMonteCarlo(
  simulationResults: MonteCarloSimulationResult,
  basePremium: number
): number {
  // Apply non-linear premium adjustment for high-risk freelancers
  let adjustment = simulationResults.premiumAdjustment;
  
  // For high-risk freelancers, apply progressive scaling
  if (simulationResults.riskBucket === 'HIGH') {
    // Apply exponential scaling for high-risk deciles
    const exponent = 1 + (simulationResults.riskDecile - 7) * 0.1;
    adjustment = Math.pow(adjustment, exponent);
  }
  
  // Apply tail risk adjustment
  const tailRiskRatio = simulationResults.tailRisk / basePremium;
  const tailRiskAdjustment = Math.max(0, (tailRiskRatio - 1) * 0.1);
  
  // Calculate final adjusted premium
  const adjustedPremium = basePremium * adjustment * (1 + tailRiskAdjustment);
  
  return Math.round(adjustedPremium * 100) / 100;
}

/**
 * Get dynamic premium adjustment based on risk profile
 * @param riskScore Risk score (0-100)
 * @param reputationFactor Reputation factor
 * @param escrowFlag Whether escrow is used
 * @returns Dynamic premium adjustment factor
 */
export function getDynamicPremiumAdjustment(
  riskScore: number,
  reputationFactor: number,
  escrowFlag: boolean
): number {
  // Base adjustment starts at 1.0 (no adjustment)
  let adjustment = 1.0;
  
  // Apply non-linear adjustment based on risk score
  if (riskScore < 30) {
    // Low risk - discount
    adjustment = 1.0 - (30 - riskScore) * 0.01;
  } else if (riskScore > 70) {
    // High risk - progressive increase
    const excessRisk = riskScore - 70;
    adjustment = 1.0 + Math.pow(excessRisk / 10, 1.5) * 0.1;
  }
  
  // Apply reputation factor (higher reputation = lower premium)
  adjustment *= reputationFactor;
  
  // Apply escrow discount
  if (escrowFlag) {
    adjustment *= 0.9; // 10% discount for using escrow
  }
  
  return adjustment;
}
