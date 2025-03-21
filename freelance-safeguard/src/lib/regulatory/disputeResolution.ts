/**
 * Hybrid Dispute Resolution Module for FreelanceShield
 * 
 * This module implements a hybrid dispute resolution system that combines:
 * - On-chain arbitration pools with licensed adjusters
 * - Escrow mechanisms for contested claims requiring judicial review
 * - Multi-signature governance for cross-border claim settlements
 */

import { PublicKey, Connection, Transaction, SystemProgram } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { BN } from 'bn.js';
import { DISPUTE_RESOLUTION_MECHANISMS } from './constants';
import { regulatoryComplianceService, UserJurisdiction } from './regulatoryCompliance';
import { dataSovereigntyService } from './dataSovereignty';

// Types for dispute resolution
export interface Dispute {
  id: string;
  policyId: string;
  claimId: string;
  initiator: string;
  respondent: string;
  amount: number;
  currency: string;
  status: DisputeStatus;
  resolutionMechanism: ResolutionMechanism;
  evidenceHashes: string[];
  arbitrators: string[];
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  resolution?: DisputeResolution;
  crossBorder: boolean;
  jurisdictions: string[];
}

export enum DisputeStatus {
  INITIATED = 'initiated',
  EVIDENCE_COLLECTION = 'evidence_collection',
  ARBITRATION = 'arbitration',
  JUDICIAL_REVIEW = 'judicial_review',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled'
}

export enum ResolutionMechanism {
  ON_CHAIN_ARBITRATION = 'on_chain_arbitration',
  HYBRID_ARBITRATION = 'hybrid_arbitration',
  JUDICIAL_REVIEW = 'judicial_review'
}

export interface DisputeResolution {
  decision: 'approved' | 'denied' | 'partial';
  amount?: number;
  reason: string;
  arbitratorSignatures: string[];
  timestamp: number;
  enforcementMechanism: 'smart_contract' | 'escrow' | 'legal_system';
  appealable: boolean;
  appealDeadline?: number;
}

export interface Arbitrator {
  id: string;
  publicKey: string;
  name: string;
  jurisdictions: string[];
  specializations: string[];
  reputation: number;
  casesHandled: number;
  active: boolean;
}

export interface ArbitrationPool {
  id: string;
  jurisdiction: string;
  arbitrators: string[];
  minimumArbitrators: number;
  consensusThreshold: number;
  feeStructure: {
    base: number;
    percentOfDispute: number;
  };
}

// Main dispute resolution service
export class DisputeResolutionService {
  private connection: Connection | null = null;
  private disputes: Map<string, Dispute> = new Map();
  private arbitrators: Map<string, Arbitrator> = new Map();
  private arbitrationPools: Map<string, ArbitrationPool> = new Map();
  private userJurisdiction: UserJurisdiction | null = null;
  
  constructor() {
    this.initializeArbitrationPools();
  }

  /**
   * Initialize arbitration pools
   */
  private initializeArbitrationPools(): void {
    // Global arbitration pool
    this.arbitrationPools.set('GLOBAL', {
      id: 'global-arbitration-pool',
      jurisdiction: 'GLOBAL',
      arbitrators: [],
      minimumArbitrators: 3,
      consensusThreshold: 0.67, // 2/3 majority
      feeStructure: {
        base: 50, // 50 USDC base fee
        percentOfDispute: 0.05 // 5% of dispute amount
      }
    });
    
    // EU arbitration pool
    this.arbitrationPools.set('EU', {
      id: 'eu-arbitration-pool',
      jurisdiction: 'EU',
      arbitrators: [],
      minimumArbitrators: 3,
      consensusThreshold: 0.67, // 2/3 majority
      feeStructure: {
        base: 40, // 40 USDC base fee
        percentOfDispute: 0.04 // 4% of dispute amount
      }
    });
    
    // US arbitration pool
    this.arbitrationPools.set('US', {
      id: 'us-arbitration-pool',
      jurisdiction: 'US',
      arbitrators: [],
      minimumArbitrators: 3,
      consensusThreshold: 0.67, // 2/3 majority
      feeStructure: {
        base: 60, // 60 USDC base fee
        percentOfDispute: 0.05 // 5% of dispute amount
      }
    });
    
    // UK arbitration pool
    this.arbitrationPools.set('UK', {
      id: 'uk-arbitration-pool',
      jurisdiction: 'UK',
      arbitrators: [],
      minimumArbitrators: 3,
      consensusThreshold: 0.67, // 2/3 majority
      feeStructure: {
        base: 45, // 45 USDC base fee
        percentOfDispute: 0.045 // 4.5% of dispute amount
      }
    });
  }

  /**
   * Set the connection for blockchain operations
   */
  public setConnection(connection: Connection): void {
    this.connection = connection;
  }

  /**
   * Set user jurisdiction for dispute resolution decisions
   */
  public setUserJurisdiction(jurisdiction: UserJurisdiction): void {
    this.userJurisdiction = jurisdiction;
  }

  /**
   * Determine the appropriate resolution mechanism based on dispute parameters
   */
  public determineResolutionMechanism(
    amount: number,
    crossBorder: boolean,
    jurisdictions: string[]
  ): ResolutionMechanism {
    // For small amounts, use on-chain arbitration
    if (amount <= DISPUTE_RESOLUTION_MECHANISMS.ON_CHAIN_ARBITRATION.thresholds.maxAmount) {
      return ResolutionMechanism.ON_CHAIN_ARBITRATION;
    }
    
    // For medium amounts or cross-border disputes, use hybrid arbitration
    if (amount <= DISPUTE_RESOLUTION_MECHANISMS.HYBRID_ARBITRATION.thresholds.maxAmount || crossBorder) {
      return ResolutionMechanism.HYBRID_ARBITRATION;
    }
    
    // For large amounts, use judicial review
    return ResolutionMechanism.JUDICIAL_REVIEW;
  }

  /**
   * Create a new dispute
   */
  public async createDispute(
    policyId: string,
    claimId: string,
    initiator: PublicKey,
    respondent: PublicKey,
    amount: number,
    currency: string,
    jurisdictions: string[]
  ): Promise<Dispute> {
    if (!this.connection) {
      throw new Error('Connection not set');
    }
    
    const crossBorder = jurisdictions.length > 1;
    
    // Determine the appropriate resolution mechanism
    const resolutionMechanism = this.determineResolutionMechanism(
      amount,
      crossBorder,
      jurisdictions
    );
    
    // Create the dispute
    const dispute: Dispute = {
      id: `dispute-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      policyId,
      claimId,
      initiator: initiator.toString(),
      respondent: respondent.toString(),
      amount,
      currency,
      status: DisputeStatus.INITIATED,
      resolutionMechanism,
      evidenceHashes: [],
      arbitrators: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      crossBorder,
      jurisdictions
    };
    
    // Store the dispute
    this.disputes.set(dispute.id, dispute);
    
    // If using on-chain arbitration, select arbitrators
    if (resolutionMechanism === ResolutionMechanism.ON_CHAIN_ARBITRATION) {
      await this.selectArbitrators(dispute);
    }
    
    // Move to evidence collection phase
    dispute.status = DisputeStatus.EVIDENCE_COLLECTION;
    dispute.updatedAt = Date.now();
    
    return dispute;
  }

  /**
   * Add evidence to a dispute
   */
  public async addEvidence(
    disputeId: string,
    submitter: PublicKey,
    evidenceData: any
  ): Promise<{ evidenceHash: string; success: boolean }> {
    const dispute = this.disputes.get(disputeId);
    
    if (!dispute) {
      throw new Error('Dispute not found');
    }
    
    // Check if the submitter is a party to the dispute
    if (submitter.toString() !== dispute.initiator && 
        submitter.toString() !== dispute.respondent) {
      throw new Error('Not authorized to submit evidence');
    }
    
    // Check if the dispute is in the evidence collection phase
    if (dispute.status !== DisputeStatus.EVIDENCE_COLLECTION) {
      throw new Error('Dispute is not in evidence collection phase');
    }
    
    // Store evidence off-chain with blockchain hash verification
    const result = await dataSovereigntyService.storePersonalData(
      submitter,
      'claim',
      evidenceData
    );
    
    // Add the evidence hash to the dispute
    dispute.evidenceHashes.push(result.dataHash);
    dispute.updatedAt = Date.now();
    
    return {
      evidenceHash: result.dataHash,
      success: true
    };
  }

  /**
   * Move a dispute to arbitration phase
   */
  public async startArbitration(disputeId: string): Promise<boolean> {
    const dispute = this.disputes.get(disputeId);
    
    if (!dispute) {
      throw new Error('Dispute not found');
    }
    
    // Check if the dispute is in the evidence collection phase
    if (dispute.status !== DisputeStatus.EVIDENCE_COLLECTION) {
      throw new Error('Dispute is not in evidence collection phase');
    }
    
    // Check if there is evidence submitted
    if (dispute.evidenceHashes.length === 0) {
      throw new Error('No evidence submitted');
    }
    
    // If using on-chain arbitration and arbitrators not yet selected, select them now
    if (dispute.resolutionMechanism === ResolutionMechanism.ON_CHAIN_ARBITRATION && 
        dispute.arbitrators.length === 0) {
      await this.selectArbitrators(dispute);
    }
    
    // Move to arbitration phase
    dispute.status = DisputeStatus.ARBITRATION;
    dispute.updatedAt = Date.now();
    
    return true;
  }

  /**
   * Select arbitrators for a dispute
   */
  private async selectArbitrators(dispute: Dispute): Promise<void> {
    // Determine which arbitration pool to use
    let poolKey = 'GLOBAL';
    
    if (dispute.crossBorder) {
      // For cross-border disputes, use the global pool
      poolKey = 'GLOBAL';
    } else if (dispute.jurisdictions.length === 1) {
      // For single jurisdiction disputes, use that jurisdiction's pool if available
      const jurisdiction = dispute.jurisdictions[0];
      if (this.arbitrationPools.has(jurisdiction)) {
        poolKey = jurisdiction;
      }
    }
    
    const pool = this.arbitrationPools.get(poolKey)!;
    
    // In a real implementation, this would select arbitrators from the pool
    // For now, we'll simulate this
    const selectedArbitrators: string[] = [];
    for (let i = 0; i < pool.minimumArbitrators; i++) {
      selectedArbitrators.push(`arbitrator-${i}-${Math.random().toString(36).substring(2, 15)}`);
    }
    
    dispute.arbitrators = selectedArbitrators;
  }

  /**
   * Submit an arbitrator decision
   */
  public async submitArbitratorDecision(
    disputeId: string,
    arbitratorId: string,
    decision: 'approved' | 'denied' | 'partial',
    amount: number | undefined,
    reason: string
  ): Promise<boolean> {
    const dispute = this.disputes.get(disputeId);
    
    if (!dispute) {
      throw new Error('Dispute not found');
    }
    
    // Check if the dispute is in the arbitration phase
    if (dispute.status !== DisputeStatus.ARBITRATION) {
      throw new Error('Dispute is not in arbitration phase');
    }
    
    // Check if the arbitrator is assigned to the dispute
    if (!dispute.arbitrators.includes(arbitratorId)) {
      throw new Error('Arbitrator not assigned to this dispute');
    }
    
    // In a real implementation, this would record the arbitrator's decision
    // and check if consensus has been reached
    // For now, we'll simulate this by resolving the dispute
    
    // Create a resolution
    const resolution: DisputeResolution = {
      decision,
      amount: amount !== undefined ? amount : (decision === 'approved' ? dispute.amount : 0),
      reason,
      arbitratorSignatures: [arbitratorId],
      timestamp: Date.now(),
      enforcementMechanism: this.getEnforcementMechanism(dispute.resolutionMechanism),
      appealable: true,
      appealDeadline: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    };
    
    // Resolve the dispute
    dispute.resolution = resolution;
    dispute.status = DisputeStatus.RESOLVED;
    dispute.resolvedAt = Date.now();
    dispute.updatedAt = Date.now();
    
    // If using on-chain enforcement, execute the resolution
    if (resolution.enforcementMechanism === 'smart_contract') {
      await this.executeOnChainResolution(dispute);
    }
    
    return true;
  }

  /**
   * Get the enforcement mechanism based on resolution mechanism
   */
  private getEnforcementMechanism(
    resolutionMechanism: ResolutionMechanism
  ): 'smart_contract' | 'escrow' | 'legal_system' {
    switch (resolutionMechanism) {
      case ResolutionMechanism.ON_CHAIN_ARBITRATION:
        return 'smart_contract';
      case ResolutionMechanism.HYBRID_ARBITRATION:
        return 'escrow';
      case ResolutionMechanism.JUDICIAL_REVIEW:
        return 'legal_system';
      default:
        return 'escrow';
    }
  }

  /**
   * Execute an on-chain resolution
   */
  private async executeOnChainResolution(dispute: Dispute): Promise<string | null> {
    if (!this.connection || !dispute.resolution) {
      return null;
    }
    
    // This is a placeholder for actual on-chain resolution execution
    // In a real implementation, this would create a transaction to transfer funds
    console.log(`Executing on-chain resolution for dispute ${dispute.id}`);
    
    // Simulate transaction ID
    return `simulated-tx-${Date.now()}`;
  }

  /**
   * Appeal a dispute resolution
   */
  public async appealResolution(
    disputeId: string,
    appellant: PublicKey,
    reason: string
  ): Promise<boolean> {
    const dispute = this.disputes.get(disputeId);
    
    if (!dispute) {
      throw new Error('Dispute not found');
    }
    
    // Check if the dispute is resolved
    if (dispute.status !== DisputeStatus.RESOLVED) {
      throw new Error('Dispute is not resolved');
    }
    
    // Check if the appellant is a party to the dispute
    if (appellant.toString() !== dispute.initiator && 
        appellant.toString() !== dispute.respondent) {
      throw new Error('Not authorized to appeal');
    }
    
    // Check if the resolution is appealable
    if (!dispute.resolution?.appealable) {
      throw new Error('Resolution is not appealable');
    }
    
    // Check if the appeal deadline has passed
    if (dispute.resolution?.appealDeadline && 
        Date.now() > dispute.resolution.appealDeadline) {
      throw new Error('Appeal deadline has passed');
    }
    
    // Determine the next level of resolution
    let nextResolutionMechanism: ResolutionMechanism;
    
    if (dispute.resolutionMechanism === ResolutionMechanism.ON_CHAIN_ARBITRATION) {
      nextResolutionMechanism = ResolutionMechanism.HYBRID_ARBITRATION;
    } else if (dispute.resolutionMechanism === ResolutionMechanism.HYBRID_ARBITRATION) {
      nextResolutionMechanism = ResolutionMechanism.JUDICIAL_REVIEW;
    } else {
      throw new Error('No further appeal mechanism available');
    }
    
    // Update the dispute
    dispute.resolutionMechanism = nextResolutionMechanism;
    dispute.status = DisputeStatus.EVIDENCE_COLLECTION;
    dispute.updatedAt = Date.now();
    
    // Clear arbitrators for re-selection
    dispute.arbitrators = [];
    
    return true;
  }

  /**
   * Get dispute details
   */
  public getDisputeDetails(disputeId: string): Dispute | null {
    return this.disputes.get(disputeId) || null;
  }

  /**
   * Get disputes for a user
   */
  public getUserDisputes(userPublicKey: PublicKey): Dispute[] {
    const userAddress = userPublicKey.toString();
    const userDisputes: Dispute[] = [];
    
    for (const dispute of this.disputes.values()) {
      if (dispute.initiator === userAddress || dispute.respondent === userAddress) {
        userDisputes.push(dispute);
      }
    }
    
    return userDisputes;
  }

  /**
   * Calculate dispute resolution fee
   */
  public calculateDisputeFee(
    amount: number,
    resolutionMechanism: ResolutionMechanism,
    jurisdictions: string[]
  ): number {
    let poolKey = 'GLOBAL';
    
    if (jurisdictions.length === 1) {
      const jurisdiction = jurisdictions[0];
      if (this.arbitrationPools.has(jurisdiction)) {
        poolKey = jurisdiction;
      }
    }
    
    const pool = this.arbitrationPools.get(poolKey)!;
    
    // Calculate fee based on pool fee structure
    const baseFee = pool.feeStructure.base;
    const percentFee = amount * pool.feeStructure.percentOfDispute;
    
    // Add complexity multiplier based on resolution mechanism
    let complexityMultiplier = 1.0;
    
    if (resolutionMechanism === ResolutionMechanism.HYBRID_ARBITRATION) {
      complexityMultiplier = 1.5;
    } else if (resolutionMechanism === ResolutionMechanism.JUDICIAL_REVIEW) {
      complexityMultiplier = 2.0;
    }
    
    // Add cross-border multiplier
    const crossBorderMultiplier = jurisdictions.length > 1 ? 1.25 : 1.0;
    
    return (baseFee + percentFee) * complexityMultiplier * crossBorderMultiplier;
  }

  /**
   * Get the timeframe for dispute resolution
   */
  public getDisputeTimeframe(resolutionMechanism: ResolutionMechanism): {
    responseWindow: number;
    resolutionTarget: number;
  } {
    switch (resolutionMechanism) {
      case ResolutionMechanism.ON_CHAIN_ARBITRATION:
        return DISPUTE_RESOLUTION_MECHANISMS.ON_CHAIN_ARBITRATION.timeframes;
      case ResolutionMechanism.HYBRID_ARBITRATION:
        return DISPUTE_RESOLUTION_MECHANISMS.HYBRID_ARBITRATION.timeframes;
      case ResolutionMechanism.JUDICIAL_REVIEW:
        return DISPUTE_RESOLUTION_MECHANISMS.JUDICIAL_REVIEW.timeframes;
      default:
        return {
          responseWindow: 14, // days
          resolutionTarget: 30 // days
        };
    }
  }

  /**
   * Register an arbitrator
   */
  public registerArbitrator(
    publicKey: PublicKey,
    name: string,
    jurisdictions: string[],
    specializations: string[]
  ): Arbitrator {
    const arbitratorId = `arbitrator-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    const arbitrator: Arbitrator = {
      id: arbitratorId,
      publicKey: publicKey.toString(),
      name,
      jurisdictions,
      specializations,
      reputation: 0,
      casesHandled: 0,
      active: true
    };
    
    this.arbitrators.set(arbitratorId, arbitrator);
    
    // Add to appropriate arbitration pools
    for (const jurisdiction of jurisdictions) {
      if (this.arbitrationPools.has(jurisdiction)) {
        const pool = this.arbitrationPools.get(jurisdiction)!;
        pool.arbitrators.push(arbitratorId);
      }
    }
    
    // Always add to global pool
    const globalPool = this.arbitrationPools.get('GLOBAL')!;
    globalPool.arbitrators.push(arbitratorId);
    
    return arbitrator;
  }

  /**
   * Get arbitrator details
   */
  public getArbitratorDetails(arbitratorId: string): Arbitrator | null {
    return this.arbitrators.get(arbitratorId) || null;
  }
}

// Create and export a singleton instance
export const disputeResolutionService = new DisputeResolutionService();
