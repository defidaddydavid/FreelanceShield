import { AIPremiumInput, SimulationHistory, SimulationResult } from './types';
import { MONTE_CARLO_CONSTANTS } from './constants';
import { RISK_WEIGHTS } from '@/lib/solana/constants';

// Global storage for simulation history (in a real app, this would be in a database)
const simulationHistoryStore: SimulationHistory[] = [];

/**
 * Run an enhanced Monte Carlo simulation with variance-based probability weighting
 * and multi-variable risk correlation tracking
 */
export function runMonteCarloSimulation(input: AIPremiumInput): SimulationResult {
  // Extract risk factors from input
  const riskFactors = extractRiskFactors(input);
  
  // Apply correlation matrix to risk factors
  const correlatedRiskFactors = applyRiskCorrelations(riskFactors);
  
  // Initialize variance tracking for different factors
  const varianceContributions: Record<string, number> = {};
  
  // Run simulations
  let successfulClaims = 0;
  const claimProbabilities: number[] = [];
  
  // Store individual factor contributions to variance
  Object.keys(MONTE_CARLO_CONSTANTS.VARIANCE_WEIGHT_FACTORS).forEach(factor => {
    varianceContributions[factor] = 0;
  });
  
  for (let i = 0; i < MONTE_CARLO_CONSTANTS.SIMULATION_COUNT; i++) {
    // Generate random variations for each risk factor
    const simulationFactors = generateSimulationFactors(correlatedRiskFactors);
    
    // Calculate claim probability for this simulation
    const simulationProbability = calculateSimulationProbability(simulationFactors);
    claimProbabilities.push(simulationProbability);
    
    // Track factor contributions to variance
    trackVarianceContributions(simulationFactors, varianceContributions);
    
    // Determine if claim occurs in this simulation
    const randomValue = Math.random();
    if (randomValue < simulationProbability) {
      successfulClaims++;
    }
  }
  
  // Calculate overall claim probability
  const claimProbability = successfulClaims / MONTE_CARLO_CONSTANTS.SIMULATION_COUNT;
  
  // Calculate confidence interval (95%)
  const sortedProbabilities = [...claimProbabilities].sort((a, b) => a - b);
  const lowerBoundIndex = Math.floor(MONTE_CARLO_CONSTANTS.SIMULATION_COUNT * 0.025);
  const upperBoundIndex = Math.floor(MONTE_CARLO_CONSTANTS.SIMULATION_COUNT * 0.975);
  const confidenceInterval: [number, number] = [
    sortedProbabilities[lowerBoundIndex],
    sortedProbabilities[upperBoundIndex]
  ];
  
  // Calculate risk decile (0-10 scale)
  const riskDecile = Math.min(Math.floor(claimProbability * 10) + 1, 10);
  
  // Normalize variance contributions
  const totalVariance = Object.values(varianceContributions).reduce((sum, val) => sum + val, 0);
  if (totalVariance > 0) {
    Object.keys(varianceContributions).forEach(key => {
      varianceContributions[key] = varianceContributions[key] / totalVariance;
    });
  }
  
  // Store simulation for future reference
  const simulationResult: SimulationResult = {
    claimProbability,
    confidenceInterval,
    riskDecile,
    varianceContributions
  };
  
  storeSimulationResult(input, simulationResult);
  
  // Apply historical simulation data if available
  const historicalData = getRelevantHistoricalSimulations(input);
  if (historicalData.length > 0) {
    return applyHistoricalSimulationData(simulationResult, historicalData);
  }
  
  return simulationResult;
}

/**
 * Extract risk factors from input data
 */
function extractRiskFactors(input: AIPremiumInput): Record<string, number> {
  const jobTypeRisk = RISK_WEIGHTS.jobTypes[input.jobType] || 1.0;
  const industryRisk = RISK_WEIGHTS.industries[input.industry] || 1.0;
  
  const walletAgeRisk = input.walletAgeInDays ? 
    Math.max(0.5, 1 - Math.min(input.walletAgeInDays / 365, 1)) : 0.5;
  
  const transactionHistoryRisk = input.transactionCount ? 
    Math.max(0.5, 1 - Math.min(input.transactionCount / 100, 1)) : 0.5;
  
  const reputationRisk = Math.max(0.1, 1 - (input.reputationScore / 100));
  
  return {
    JOB_TYPE: jobTypeRisk,
    INDUSTRY: industryRisk,
    WALLET_AGE: walletAgeRisk,
    TRANSACTION_HISTORY: transactionHistoryRisk,
    REPUTATION: reputationRisk
  };
}

/**
 * Apply risk correlations based on correlation matrix
 */
function applyRiskCorrelations(riskFactors: Record<string, number>): Record<string, number> {
  const correlatedFactors = { ...riskFactors };
  
  // Apply wallet age vs reputation correlation
  if (riskFactors.WALLET_AGE && riskFactors.REPUTATION) {
    const correlation = MONTE_CARLO_CONSTANTS.CORRELATION_MATRIX.WALLET_AGE_VS_REPUTATION;
    const adjustmentFactor = 0.2; // Maximum adjustment strength
    
    // Apply correlation effect (higher wallet age should correlate with better reputation)
    const walletAgeEffect = (0.5 - riskFactors.WALLET_AGE) * correlation * adjustmentFactor;
    correlatedFactors.REPUTATION = Math.max(0.1, Math.min(1.0, riskFactors.REPUTATION - walletAgeEffect));
  }
  
  // Apply transaction count vs claim risk correlation
  if (riskFactors.TRANSACTION_HISTORY) {
    const correlation = MONTE_CARLO_CONSTANTS.CORRELATION_MATRIX.TRANSACTION_COUNT_VS_CLAIM_RISK;
    const adjustmentFactor = 0.15; // Maximum adjustment strength
    
    // Apply correlation to all other factors
    Object.keys(correlatedFactors).forEach(key => {
      if (key !== 'TRANSACTION_HISTORY') {
        const transactionEffect = (0.5 - riskFactors.TRANSACTION_HISTORY) * correlation * adjustmentFactor;
        correlatedFactors[key] = Math.max(0.1, Math.min(1.0, correlatedFactors[key] - transactionEffect));
      }
    });
  }
  
  return correlatedFactors;
}

/**
 * Generate simulation factors with random variations
 */
function generateSimulationFactors(baseFactors: Record<string, number>): Record<string, number> {
  const simulationFactors: Record<string, number> = {};
  
  // Add random variations to each factor
  Object.keys(baseFactors).forEach(key => {
    const baseFactor = baseFactors[key];
    const variationRange = 0.2; // 20% variation range
    const randomVariation = (Math.random() * 2 - 1) * variationRange;
    simulationFactors[key] = Math.max(0.1, Math.min(1.0, baseFactor * (1 + randomVariation)));
  });
  
  return simulationFactors;
}

/**
 * Calculate claim probability for a single simulation
 */
function calculateSimulationProbability(factors: Record<string, number>): number {
  let weightedProbability = 0;
  let totalWeight = 0;
  
  // Calculate weighted probability based on variance weight factors
  Object.keys(factors).forEach(key => {
    const weight = MONTE_CARLO_CONSTANTS.VARIANCE_WEIGHT_FACTORS[key as keyof typeof MONTE_CARLO_CONSTANTS.VARIANCE_WEIGHT_FACTORS] || 0;
    weightedProbability += factors[key] * weight;
    totalWeight += weight;
  });
  
  // Normalize to ensure we have a valid probability
  return totalWeight > 0 ? Math.min(weightedProbability / totalWeight, 1) : 0.5;
}

/**
 * Track contributions of each factor to the overall variance
 */
function trackVarianceContributions(
  factors: Record<string, number>, 
  varianceContributions: Record<string, number>
): void {
  Object.keys(factors).forEach(key => {
    const weight = MONTE_CARLO_CONSTANTS.VARIANCE_WEIGHT_FACTORS[key as keyof typeof MONTE_CARLO_CONSTANTS.VARIANCE_WEIGHT_FACTORS] || 0;
    const variance = Math.pow(factors[key] - 0.5, 2) * weight;
    varianceContributions[key] = (varianceContributions[key] || 0) + variance;
  });
}

/**
 * Store simulation result for future reference
 */
function storeSimulationResult(input: AIPremiumInput, result: SimulationResult): void {
  // Create a simplified version of the input to store
  const simplifiedInput: Partial<AIPremiumInput> = {
    coverageAmount: input.coverageAmount,
    periodDays: input.periodDays,
    jobType: input.jobType,
    industry: input.industry,
    walletAddress: input.walletAddress,
    reputationScore: input.reputationScore,
    claimHistory: input.claimHistory
  };
  
  // Store the simulation history
  simulationHistoryStore.push({
    timestamp: Date.now(),
    input: simplifiedInput,
    results: result
  });
  
  // Limit history size
  if (simulationHistoryStore.length > 100) {
    simulationHistoryStore.shift();
  }
}

/**
 * Get relevant historical simulations for the current input
 */
function getRelevantHistoricalSimulations(input: AIPremiumInput): SimulationHistory[] {
  // Filter for simulations with the same wallet address if available
  if (input.walletAddress) {
    const walletSimulations = simulationHistoryStore.filter(
      sim => sim.input.walletAddress === input.walletAddress
    );
    
    if (walletSimulations.length > 0) {
      return walletSimulations;
    }
  }
  
  // Otherwise, find simulations with similar job type and industry
  return simulationHistoryStore.filter(
    sim => sim.input.jobType === input.jobType && sim.input.industry === input.industry
  );
}

/**
 * Apply historical simulation data to current simulation result
 */
function applyHistoricalSimulationData(
  currentResult: SimulationResult,
  historicalData: SimulationHistory[]
): SimulationResult {
  if (historicalData.length === 0) {
    return currentResult;
  }
  
  // Calculate weighted average of historical results
  let totalWeight = 0;
  let weightedProbability = 0;
  const now = Date.now();
  
  historicalData.forEach(history => {
    // More recent simulations get higher weight
    const ageInDays = (now - history.timestamp) / (1000 * 60 * 60 * 24);
    const recencyWeight = Math.exp(-ageInDays / 30); // 30-day half-life
    
    weightedProbability += history.results.claimProbability * recencyWeight;
    totalWeight += recencyWeight;
  });
  
  // Combine historical data with current result
  const historicalWeight = MONTE_CARLO_CONSTANTS.SIMULATION_HISTORY_WEIGHT;
  const currentWeight = 1 - historicalWeight;
  
  const combinedProbability = 
    (currentResult.claimProbability * currentWeight) + 
    ((weightedProbability / totalWeight) * historicalWeight);
  
  // Adjust confidence interval proportionally
  const intervalWidth = currentResult.confidenceInterval[1] - currentResult.confidenceInterval[0];
  const newLowerBound = Math.max(0, combinedProbability - (intervalWidth / 2));
  const newUpperBound = Math.min(1, combinedProbability + (intervalWidth / 2));
  
  // Calculate new risk decile
  const newRiskDecile = Math.min(Math.floor(combinedProbability * 10) + 1, 10);
  
  return {
    claimProbability: combinedProbability,
    confidenceInterval: [newLowerBound, newUpperBound],
    riskDecile: newRiskDecile,
    varianceContributions: currentResult.varianceContributions
  };
}
