import { AIPremiumInput } from './types';
import { WRI_WEIGHTS, TIME_DECAY_CONSTANTS } from './constants';

/**
 * Calculate Weighted Reputation Index (WRI) based on on-chain data with time-based decay
 * Lower WRI = Higher Risk, Higher WRI = Lower Risk
 */
export function calculateWRI(input: AIPremiumInput): number {
  // Default values if data is not provided
  const transactionFrequency = input.transactionCount ? 
    Math.min(input.transactionCount / 100, 1) : 0.5;
  
  const walletAge = input.walletAgeInDays ? 
    Math.min(input.walletAgeInDays / 365, 1) : 0.5;
  
  const clientVerifications = input.verifiedClientCount ? 
    Math.min(input.verifiedClientCount / 10, 1) : 0.5;
  
  const escrowUsage = input.escrowTransactionCount ? 
    Math.min(input.escrowTransactionCount / 5, 1) : 0.5;
  
  // New factors
  const disputeResolution = calculateDisputeResolutionScore(input);
  const activityTrend = calculateActivityTrendScore(input);
  
  // Calculate WRI using the weighted formula
  const wri = 
    WRI_WEIGHTS.TRANSACTION_FREQUENCY * transactionFrequency +
    WRI_WEIGHTS.WALLET_AGE * walletAge +
    WRI_WEIGHTS.CLIENT_VERIFICATIONS * clientVerifications +
    WRI_WEIGHTS.ESCROW_USAGE * escrowUsage +
    WRI_WEIGHTS.DISPUTE_RESOLUTION * disputeResolution +
    WRI_WEIGHTS.ACTIVITY_TREND * activityTrend;
  
  return Number(wri.toFixed(2));
}

/**
 * Calculate dispute resolution score based on dispute history
 */
function calculateDisputeResolutionScore(input: AIPremiumInput): number {
  if (!input.disputeResolutionCount || input.disputeResolutionCount === 0) {
    return 0.5; // Neutral score if no dispute history
  }
  
  const positiveOutcomes = input.positiveDisputeOutcomes || 0;
  const positiveRatio = positiveOutcomes / input.disputeResolutionCount;
  
  // Apply time-based decay to older disputes if transaction history is available
  if (input.transactionHistory && input.transactionHistory.length > 0) {
    const now = Date.now();
    const disputeTransactions = input.transactionHistory.filter(tx => 
      tx.type === 'claim' || tx.type === 'escrow'
    );
    
    if (disputeTransactions.length > 0) {
      // Calculate weighted score based on recency
      let weightedScore = 0;
      let totalWeight = 0;
      
      disputeTransactions.forEach(tx => {
        const ageInDays = (now - tx.timestamp) / (1000 * 60 * 60 * 24);
        const decayFactor = Math.max(
          1 - TIME_DECAY_CONSTANTS.MAX_DECAY_FACTOR,
          Math.exp(-Math.log(2) * ageInDays / TIME_DECAY_CONSTANTS.HALF_LIFE_DAYS)
        );
        
        const weight = decayFactor;
        weightedScore += weight * (tx.counterpartyVerified ? 1 : 0);
        totalWeight += weight;
      });
      
      return totalWeight > 0 ? weightedScore / totalWeight : 0.5;
    }
  }
  
  return positiveRatio;
}

/**
 * Calculate activity trend score based on transaction history
 */
function calculateActivityTrendScore(input: AIPremiumInput): number {
  if (!input.transactionHistory || input.transactionHistory.length < 5) {
    return 0.5; // Neutral score if insufficient history
  }
  
  // Sort transactions by timestamp
  const sortedTransactions = [...input.transactionHistory]
    .sort((a, b) => a.timestamp - b.timestamp);
  
  // Split into two halves to compare activity
  const midpoint = Math.floor(sortedTransactions.length / 2);
  const firstHalf = sortedTransactions.slice(0, midpoint);
  const secondHalf = sortedTransactions.slice(midpoint);
  
  // Calculate transaction frequency in each half
  const firstHalfDuration = firstHalf[firstHalf.length - 1].timestamp - firstHalf[0].timestamp;
  const secondHalfDuration = secondHalf[secondHalf.length - 1].timestamp - secondHalf[0].timestamp;
  
  const firstHalfFrequency = firstHalfDuration > 0 ? 
    (firstHalf.length / (firstHalfDuration / (1000 * 60 * 60 * 24))) : 0;
  
  const secondHalfFrequency = secondHalfDuration > 0 ? 
    (secondHalf.length / (secondHalfDuration / (1000 * 60 * 60 * 24))) : 0;
  
  // Calculate growth ratio
  if (firstHalfFrequency === 0) return 0.7; // New but active user
  
  const growthRatio = secondHalfFrequency / firstHalfFrequency;
  
  // Map growth ratio to a 0-1 score
  if (growthRatio >= 1.5) return 1.0; // Strong growth
  if (growthRatio >= 1.0) return 0.8; // Moderate growth
  if (growthRatio >= 0.7) return 0.5; // Slight decline
  if (growthRatio >= 0.4) return 0.3; // Moderate decline
  return 0.1; // Strong decline
}
