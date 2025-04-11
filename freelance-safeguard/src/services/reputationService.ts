/**
 * FreelanceShield Reputation Service
 * 
 * Implements a Bayesian reputation scoring system that can import data from:
 * - Colony (Ethereum)
 * - Braintrust (Solana)
 * - Internal FreelanceShield reputation data
 * 
 * The scoring system follows these principles:
 * - Transparent scoring based on verifiable on-chain data
 * - Bayesian statistical methods for handling uncertainty
 * - Weighted scoring across multiple reputation dimensions
 */

import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import axios from 'axios';

// Reputation sources
export enum ReputationSource {
  FREELANCESHIELD = 'freelanceshield',
  COLONY = 'colony',
  BRAINTRUST = 'braintrust'
}

// Reputation dimensions
export enum ReputationDimension {
  COMPLETED_WORK = 'completed_work',
  DISPUTE_RESOLUTION = 'dispute_resolution',
  PAYMENT_HISTORY = 'payment_history',
  CLAIM_HISTORY = 'claim_history',
  COMMUNITY_PARTICIPATION = 'community_participation'
}

// Reputation record structure
export interface ReputationRecord {
  source: ReputationSource;
  dimension: ReputationDimension;
  value: number;
  weight: number;
  timestamp: number;
  txId?: string; // Transaction ID for on-chain verification
  metadataUri?: string; // URI to additional metadata
}

// User reputation profile
export interface ReputationProfile {
  publicKey: string;
  totalScore: number;
  dimensionScores: Record<ReputationDimension, number>;
  sourceScores: Record<ReputationSource, number>;
  records: ReputationRecord[];
  lastUpdated: number;
}

// Initial prior distribution parameters for Bayesian calculation
interface BayesianPrior {
  alpha: number; // Success parameter
  beta: number;  // Failure parameter
}

/**
 * Bayesian Reputation Service
 * Implements a Bayesian approach to reputation scoring across multiple dimensions
 */
export class ReputationService {
  private connection: Connection;
  private programId: PublicKey;

  // Default prior distribution - moderate trust with uncertainty
  private defaultPrior: BayesianPrior = {
    alpha: 5,  // Represents initial "good" evidence
    beta: 2    // Represents initial "bad" evidence
  };

  // Dimension weights (must sum to 1.0)
  private dimensionWeights: Record<ReputationDimension, number> = {
    [ReputationDimension.COMPLETED_WORK]: 0.40,
    [ReputationDimension.DISPUTE_RESOLUTION]: 0.20,
    [ReputationDimension.PAYMENT_HISTORY]: 0.15,
    [ReputationDimension.CLAIM_HISTORY]: 0.15,
    [ReputationDimension.COMMUNITY_PARTICIPATION]: 0.10
  };

  // Source weights (must sum to 1.0)
  private sourceWeights: Record<ReputationSource, number> = {
    [ReputationSource.FREELANCESHIELD]: 0.65,
    [ReputationSource.COLONY]: 0.20,
    [ReputationSource.BRAINTRUST]: 0.15
  };

  constructor(
    connection: Connection, 
    programId: string
  ) {
    this.connection = connection;
    this.programId = new PublicKey(programId);
  }

  /**
   * Calculate Bayesian reputation score
   * Uses Beta distribution: posterior mean = (α + positive) / (α + β + total)
   */
  private calculateBayesianScore(
    positive: number, 
    total: number,
    prior: BayesianPrior = this.defaultPrior
  ): number {
    // Add prior to observed data
    const posteriorAlpha = prior.alpha + positive;
    const posteriorTotal = prior.alpha + prior.beta + total;
    
    // Prevent division by zero and calculate posterior mean
    if (posteriorTotal === 0) return 0.5; // Default to neutral when no data
    
    // Return posterior mean (expected value of the Beta distribution)
    return posteriorAlpha / posteriorTotal;
  }

  /**
   * Fetch reputation from Colony (Ethereum)
   * @param ethereumAddress User's Ethereum address
   */
  public async importColonyReputation(
    ethereumAddress: string
  ): Promise<ReputationRecord[]> {
    try {
      // In production, you would:
      // 1. Query Colony's reputation oracle or subgraph
      // 2. Verify the reputation data on Ethereum
      // 3. Map Colony's reputation dimensions to FreelanceShield's dimensions
      
      // This is a mock implementation until Colony API integration
      console.log(`Importing reputation for ${ethereumAddress} from Colony`);
      
      // For demo purposes, generating mock data
      const mockColonyData = [
        {
          dimension: ReputationDimension.COMPLETED_WORK,
          value: Math.random() * 0.5 + 0.5, // Random value between 0.5 and 1.0
          weight: this.dimensionWeights[ReputationDimension.COMPLETED_WORK],
          timestamp: Date.now()
        },
        {
          dimension: ReputationDimension.COMMUNITY_PARTICIPATION,
          value: Math.random() * 0.5 + 0.4, // Random value between 0.4 and 0.9
          weight: this.dimensionWeights[ReputationDimension.COMMUNITY_PARTICIPATION],
          timestamp: Date.now()
        }
      ];
      
      // Convert to ReputationRecord
      return mockColonyData.map(item => ({
        source: ReputationSource.COLONY,
        dimension: item.dimension,
        value: item.value,
        weight: item.weight,
        timestamp: item.timestamp,
        metadataUri: `https://colony.io/reputation/${ethereumAddress}`
      }));
    } catch (error) {
      console.error('Error importing Colony reputation:', error);
      return [];
    }
  }

  /**
   * Fetch reputation from Braintrust (Solana)
   * @param solanaAddress User's Solana address
   */
  public async importBraintrustReputation(
    solanaAddress: string
  ): Promise<ReputationRecord[]> {
    try {
      // In production, you would:
      // 1. Use Solana web3.js to query Braintrust's on-chain reputation data
      // 2. Verify the token holdings and reputation NFTs
      // 3. Map Braintrust's reputation dimensions to FreelanceShield's dimensions
      
      // This is a mock implementation until Braintrust API integration
      console.log(`Importing reputation for ${solanaAddress} from Braintrust`);
      
      // For demo purposes, generating mock data
      const mockBraintrustData = [
        {
          dimension: ReputationDimension.COMPLETED_WORK,
          value: Math.random() * 0.3 + 0.7, // Random value between 0.7 and 1.0
          weight: this.dimensionWeights[ReputationDimension.COMPLETED_WORK],
          timestamp: Date.now()
        },
        {
          dimension: ReputationDimension.PAYMENT_HISTORY,
          value: Math.random() * 0.2 + 0.7, // Random value between 0.7 and 0.9
          weight: this.dimensionWeights[ReputationDimension.PAYMENT_HISTORY],
          timestamp: Date.now()
        }
      ];
      
      // Convert to ReputationRecord
      return mockBraintrustData.map(item => ({
        source: ReputationSource.BRAINTRUST,
        dimension: item.dimension,
        value: item.value,
        weight: item.weight,
        timestamp: item.timestamp,
        metadataUri: `https://app.braintrust.io/talent/${solanaAddress}`
      }));
    } catch (error) {
      console.error('Error importing Braintrust reputation:', error);
      return [];
    }
  }

  /**
   * Get FreelanceShield internal reputation data
   * @param solanaAddress User's Solana address
   */
  public async getInternalReputation(
    solanaAddress: string
  ): Promise<ReputationRecord[]> {
    try {
      // In production, this would query your Solana program for on-chain reputation data
      const publicKey = new PublicKey(solanaAddress);
      
      // Calculate the PDA (Program Derived Address) for reputation data
      const [reputationPDA] = await PublicKey.findProgramAddress(
        [Buffer.from('reputation'), publicKey.toBuffer()],
        this.programId
      );
      
      // Query the account data - this would actually be calling your Anchor program
      console.log(`Querying internal reputation for ${solanaAddress} at ${reputationPDA.toString()}`);
      
      // For demo, we'll use mock data - in production this would be real on-chain data
      const dimensions = Object.values(ReputationDimension);
      const mockInternalData = dimensions.map(dimension => ({
        source: ReputationSource.FREELANCESHIELD,
        dimension: dimension,
        value: Math.random() * 0.4 + 0.6, // Random value between 0.6 and 1.0
        weight: this.dimensionWeights[dimension],
        timestamp: Date.now(),
        txId: 'mock-transaction-id' // In production, this would be a real Solana transaction ID
      }));
      
      return mockInternalData;
    } catch (error) {
      console.error('Error fetching internal reputation:', error);
      return [];
    }
  }

  /**
   * Combine and calculate weighted reputation score across all dimensions and sources
   * @param records Array of reputation records from all sources
   */
  private calculateAggregateScore(records: ReputationRecord[]): {
    totalScore: number;
    dimensionScores: Record<ReputationDimension, number>;
    sourceScores: Record<ReputationSource, number>;
  } {
    // Initialize scores
    const dimensionScores: Record<ReputationDimension, number> = {} as Record<ReputationDimension, number>;
    const sourceScores: Record<ReputationSource, number> = {} as Record<ReputationSource, number>;
    
    // Initialize with zeros
    Object.values(ReputationDimension).forEach(dim => {
      dimensionScores[dim] = 0;
    });
    
    Object.values(ReputationSource).forEach(src => {
      sourceScores[src] = 0;
    });
    
    // Group by dimension and source for weighted calculation
    const dimensionGroups: Record<ReputationDimension, ReputationRecord[]> = {} as Record<ReputationDimension, ReputationRecord[]>;
    const sourceGroups: Record<ReputationSource, ReputationRecord[]> = {} as Record<ReputationSource, ReputationRecord[]>;
    
    // Group records
    records.forEach(record => {
      if (!dimensionGroups[record.dimension]) {
        dimensionGroups[record.dimension] = [];
      }
      if (!sourceGroups[record.source]) {
        sourceGroups[record.source] = [];
      }
      
      dimensionGroups[record.dimension].push(record);
      sourceGroups[record.source].push(record);
    });
    
    // Calculate dimension scores
    Object.entries(dimensionGroups).forEach(([dimension, records]) => {
      if (records.length === 0) return;
      
      const totalWeight = records.reduce((sum, record) => sum + record.weight, 0);
      const weightedSum = records.reduce((sum, record) => sum + (record.value * record.weight), 0);
      
      dimensionScores[dimension as ReputationDimension] = totalWeight > 0 
        ? weightedSum / totalWeight 
        : 0;
    });
    
    // Calculate source scores
    Object.entries(sourceGroups).forEach(([source, records]) => {
      if (records.length === 0) return;
      
      const totalWeight = records.reduce((sum, record) => sum + record.weight, 0);
      const weightedSum = records.reduce((sum, record) => sum + (record.value * record.weight), 0);
      
      sourceScores[source as ReputationSource] = totalWeight > 0 
        ? weightedSum / totalWeight 
        : 0;
    });
    
    // Calculate total score as weighted average of all dimensions
    let totalScore = 0;
    let totalDimensionWeight = 0;
    
    Object.entries(dimensionScores).forEach(([dimension, score]) => {
      const weight = this.dimensionWeights[dimension as ReputationDimension];
      totalScore += score * weight;
      totalDimensionWeight += weight;
    });
    
    // Normalize total score
    if (totalDimensionWeight > 0) {
      totalScore = totalScore / totalDimensionWeight;
    } else {
      totalScore = 0;
    }
    
    return {
      totalScore,
      dimensionScores,
      sourceScores
    };
  }

  /**
   * Get complete reputation profile for a user
   * Combines data from all sources: FreelanceShield, Colony, and Braintrust
   * @param solanaAddress User's Solana address
   * @param ethereumAddress Optional Ethereum address for Colony reputation
   */
  public async getReputationProfile(
    solanaAddress: string,
    ethereumAddress?: string
  ): Promise<ReputationProfile> {
    // Collect reputation from all sources
    const internalRecords = await this.getInternalReputation(solanaAddress);
    const braintrustRecords = await this.importBraintrustReputation(solanaAddress);
    
    // Only fetch Colony reputation if Ethereum address is provided
    let colonyRecords: ReputationRecord[] = [];
    if (ethereumAddress) {
      colonyRecords = await this.importColonyReputation(ethereumAddress);
    }
    
    // Combine all records
    const allRecords = [
      ...internalRecords,
      ...braintrustRecords,
      ...colonyRecords
    ];
    
    // Calculate aggregate scores
    const { totalScore, dimensionScores, sourceScores } = this.calculateAggregateScore(allRecords);
    
    // Return complete profile
    return {
      publicKey: solanaAddress,
      totalScore,
      dimensionScores,
      sourceScores,
      records: allRecords,
      lastUpdated: Date.now()
    };
  }

  /**
   * Determine premium discount percentage based on reputation score
   * @param reputationScore User's reputation score (0-1)
   * @returns Discount percentage (0-25%)
   */
  public calculatePremiumDiscount(reputationScore: number): number {
    // Minimum score required for discount
    const MIN_SCORE_FOR_DISCOUNT = 0.5;
    
    // Maximum possible discount percentage
    const MAX_DISCOUNT_PERCENTAGE = 25;
    
    if (reputationScore < MIN_SCORE_FOR_DISCOUNT) return 0;
    
    // Linear scaling from 0% to MAX_DISCOUNT_PERCENTAGE
    // The formula maps 0.5 -> 0% and 1.0 -> 25%
    const normalizedScore = (reputationScore - MIN_SCORE_FOR_DISCOUNT) / (1 - MIN_SCORE_FOR_DISCOUNT);
    const discountPercentage = normalizedScore * MAX_DISCOUNT_PERCENTAGE;
    
    // Round to nearest whole percentage
    return Math.round(discountPercentage);
  }
}

// Export singleton instance for use throughout the application
export const createReputationService = (
  connection: Connection,
  programId: string
) => {
  return new ReputationService(connection, programId);
};
