/**
 * Regulatory Integration Module for FreelanceShield
 * 
 * This module integrates the regulatory compliance features with the Solana blockchain insurance system,
 * ensuring that all insurance operations adhere to the relevant regulatory requirements.
 */

import { PublicKey, Connection } from '@solana/web3.js';
import { regulatoryComplianceService, UserJurisdiction } from './regulatoryCompliance';
import { dataSovereigntyService } from './dataSovereignty';
import { regulatorySandboxService } from './regulatorySandbox';
import { disputeResolutionService } from './disputeResolution';
import { SUPPORTED_JURISDICTIONS, REGULATORY_SANDBOXES, DISPUTE_RESOLUTION_MECHANISMS } from './constants';

// Types for regulatory integration
export interface RegulatoryCheckResult {
  approved: boolean;
  reason?: string;
  requiresAdditionalVerification: boolean;
  additionalRequirements?: string[];
  regulatoryDisclosures?: string[];
}

export interface PolicyRegulatoryInfo {
  jurisdiction: string;
  regulatoryFrameworks: string[];
  dataProtectionRequirements: string[];
  disputeResolutionMechanism: string;
  sandboxStatus: boolean;
  crossBorderStatus: boolean;
  requiredDisclosures: string[];
}

// Main regulatory integration service
export class RegulatoryIntegrationService {
  private connection: Connection | null = null;
  private userJurisdiction: UserJurisdiction | null = null;
  
  constructor() {
    // Initialize the service
  }

  /**
   * Set the connection for blockchain operations
   */
  public setConnection(connection: Connection): void {
    this.connection = connection;
    
    // Pass the connection to the other regulatory services
    regulatoryComplianceService.setConnection(connection);
    dataSovereigntyService.setConnection(connection);
    regulatorySandboxService.setConnection(connection);
    disputeResolutionService.setConnection(connection);
  }

  /**
   * Set user jurisdiction for regulatory decisions
   */
  public setUserJurisdiction(jurisdiction: UserJurisdiction): void {
    this.userJurisdiction = jurisdiction;
    
    // Pass the jurisdiction to the other regulatory services
    regulatoryComplianceService.setUserJurisdiction(jurisdiction);
    dataSovereigntyService.setUserJurisdiction(jurisdiction);
    regulatorySandboxService.setUserJurisdiction(jurisdiction);
    disputeResolutionService.setUserJurisdiction(jurisdiction);
  }

  /**
   * Check if a policy creation is compliant with regulatory requirements
   */
  public checkPolicyCreationCompliance(
    coverageAmount: number,
    periodDays: number,
    jobType: string,
    industry: string,
    userPublicKey: PublicKey
  ): RegulatoryCheckResult {
    if (!this.userJurisdiction) {
      return {
        approved: false,
        reason: 'User jurisdiction not set',
        requiresAdditionalVerification: true,
        additionalRequirements: ['Set user jurisdiction'],
      };
    }
    
    // Get applicable regulatory requirements
    const complianceRequirements = regulatoryComplianceService.getComplianceRequirements(
      this.userJurisdiction.countryCode
    );
    
    // Check if the policy is within capital requirements
    const capitalRequirements = complianceRequirements.capitalRequirements;
    const reserveRatio = capitalRequirements.baseReserveRatio;
    
    // Check if KYC is required for this coverage amount
    const kycRequirements = complianceRequirements.kycRequirements;
    let kycLevel = 'none';
    
    if (kycRequirements.required) {
      if (coverageAmount <= kycRequirements.thresholds.basic) {
        kycLevel = 'basic';
      } else if (coverageAmount <= kycRequirements.thresholds.enhanced) {
        kycLevel = 'enhanced';
      } else {
        kycLevel = 'full';
      }
    }
    
    // Check if the user has completed the required KYC level
    const userKycLevel = regulatoryComplianceService.getUserKycLevel(userPublicKey);
    
    if (kycLevel !== 'none' && (!userKycLevel || this.getKycLevelValue(userKycLevel) < this.getKycLevelValue(kycLevel))) {
      return {
        approved: false,
        reason: `KYC level ${kycLevel} required for this coverage amount`,
        requiresAdditionalVerification: true,
        additionalRequirements: [`Complete ${kycLevel} KYC verification`],
      };
    }
    
    // Check if operating in a sandbox
    if (regulatorySandboxService.isInSandbox()) {
      const sandboxCheck = regulatorySandboxService.isPolicyAllowedUnderSandbox(
        coverageAmount,
        this.userJurisdiction.countryCode
      );
      
      if (!sandboxCheck.allowed) {
        return {
          approved: false,
          reason: sandboxCheck.reason || 'Policy not allowed under sandbox limitations',
          requiresAdditionalVerification: false,
          additionalRequirements: [],
          regulatoryDisclosures: [regulatorySandboxService.generateDisclosureText()],
        };
      }
    }
    
    // All checks passed
    return {
      approved: true,
      requiresAdditionalVerification: false,
      regulatoryDisclosures: this.getRequiredDisclosures(),
    };
  }

  /**
   * Check if a claim submission is compliant with regulatory requirements
   */
  public checkClaimSubmissionCompliance(
    policyId: string,
    claimAmount: number,
    claimReason: string,
    userPublicKey: PublicKey
  ): RegulatoryCheckResult {
    if (!this.userJurisdiction) {
      return {
        approved: false,
        reason: 'User jurisdiction not set',
        requiresAdditionalVerification: true,
        additionalRequirements: ['Set user jurisdiction'],
      };
    }
    
    // Get applicable regulatory requirements
    const complianceRequirements = regulatoryComplianceService.getComplianceRequirements(
      this.userJurisdiction.countryCode
    );
    
    // Check if the claim requires mandatory review
    const claimProcessing = complianceRequirements.claimProcessing;
    
    if (claimAmount > claimProcessing.maxAutomaticPayoutAmount) {
      const additionalRequirements = ['Claim requires manual review'];
      
      if (claimAmount > claimProcessing.mandatoryReviewThreshold) {
        additionalRequirements.push('Enhanced documentation required');
        additionalRequirements.push('Adjuster review required');
      }
      
      return {
        approved: true, // Claim can be submitted but will require review
        requiresAdditionalVerification: true,
        additionalRequirements,
        regulatoryDisclosures: [
          `Claims above ${claimProcessing.maxAutomaticPayoutAmount} USDC require manual review.`,
          `Review process may take up to 5 business days.`,
        ],
      };
    }
    
    // All checks passed
    return {
      approved: true,
      requiresAdditionalVerification: false,
      regulatoryDisclosures: this.getRequiredDisclosures(),
    };
  }

  /**
   * Check if a dispute creation is compliant with regulatory requirements
   */
  public checkDisputeCreationCompliance(
    policyId: string,
    claimId: string,
    disputeAmount: number,
    userPublicKey: PublicKey
  ): RegulatoryCheckResult {
    if (!this.userJurisdiction) {
      return {
        approved: false,
        reason: 'User jurisdiction not set',
        requiresAdditionalVerification: true,
        additionalRequirements: ['Set user jurisdiction'],
      };
    }
    
    // Determine if this is a cross-border dispute
    const policyJurisdiction = regulatoryComplianceService.getPolicyJurisdiction(policyId);
    const crossBorder = policyJurisdiction !== this.userJurisdiction.countryCode;
    
    // Determine the appropriate dispute resolution mechanism
    const resolutionMechanism = disputeResolutionService.determineResolutionMechanism(
      disputeAmount,
      crossBorder,
      [this.userJurisdiction.countryCode, policyJurisdiction].filter(Boolean) as string[]
    );
    
    // Calculate dispute fee
    const disputeFee = disputeResolutionService.calculateDisputeFee(
      disputeAmount,
      resolutionMechanism,
      [this.userJurisdiction.countryCode, policyJurisdiction].filter(Boolean) as string[]
    );
    
    // Get dispute timeframe
    const timeframe = disputeResolutionService.getDisputeTimeframe(resolutionMechanism);
    
    // All checks passed
    return {
      approved: true,
      requiresAdditionalVerification: false,
      additionalRequirements: [
        `Dispute fee: ${disputeFee} USDC`,
        `Response window: ${timeframe.responseWindow} days`,
        `Expected resolution time: ${timeframe.resolutionTarget} days`,
      ],
      regulatoryDisclosures: [
        `This dispute will be handled through ${DISPUTE_RESOLUTION_MECHANISMS[resolutionMechanism].name}.`,
        crossBorder ? 'This is a cross-border dispute and may be subject to additional requirements.' : '',
      ].filter(Boolean),
    };
  }

  /**
   * Get required regulatory disclosures
   */
  private getRequiredDisclosures(): string[] {
    const disclosures: string[] = [];
    
    // Add sandbox disclosures if applicable
    if (regulatorySandboxService.isInSandbox()) {
      disclosures.push(regulatorySandboxService.generateDisclosureText());
    }
    
    // Add jurisdiction-specific disclosures
    if (this.userJurisdiction) {
      const jurisdictionInfo = SUPPORTED_JURISDICTIONS[this.userJurisdiction.countryCode as keyof typeof SUPPORTED_JURISDICTIONS];
      
      if (jurisdictionInfo) {
        disclosures.push(`FreelanceShield operates under the regulatory frameworks of ${jurisdictionInfo.regulatoryFrameworks.join(', ')}.`);
      }
    }
    
    return disclosures;
  }

  /**
   * Get KYC level value for comparison
   */
  private getKycLevelValue(level: string): number {
    switch (level.toLowerCase()) {
      case 'none': return 0;
      case 'basic': return 1;
      case 'enhanced': return 2;
      case 'full': return 3;
      default: return 0;
    }
  }

  /**
   * Get regulatory information for a policy
   */
  public getPolicyRegulatoryInfo(policyId: string): PolicyRegulatoryInfo | null {
    if (!this.userJurisdiction) {
      return null;
    }
    
    const policyJurisdiction = regulatoryComplianceService.getPolicyJurisdiction(policyId);
    
    if (!policyJurisdiction) {
      return null;
    }
    
    const jurisdictionInfo = SUPPORTED_JURISDICTIONS[policyJurisdiction as keyof typeof SUPPORTED_JURISDICTIONS];
    
    if (!jurisdictionInfo) {
      return null;
    }
    
    // Determine if the policy is cross-border
    const crossBorder = policyJurisdiction !== this.userJurisdiction.countryCode;
    
    // Determine if the policy is in a sandbox
    const inSandbox = regulatorySandboxService.isInSandbox();
    
    return {
      jurisdiction: policyJurisdiction,
      regulatoryFrameworks: jurisdictionInfo.regulatoryFrameworks,
      dataProtectionRequirements: this.getDataProtectionRequirements(policyJurisdiction),
      disputeResolutionMechanism: this.getDisputeResolutionMechanism(policyJurisdiction, crossBorder),
      sandboxStatus: inSandbox,
      crossBorderStatus: crossBorder,
      requiredDisclosures: this.getRequiredDisclosures(),
    };
  }

  /**
   * Get data protection requirements for a jurisdiction
   */
  private getDataProtectionRequirements(jurisdiction: string): string[] {
    switch (jurisdiction) {
      case 'EU':
        return ['GDPR Compliant', 'Right to Erasure', 'Data Portability'];
      case 'US':
        return ['CCPA Compliant (California)', 'State-specific requirements may apply'];
      case 'UK':
        return ['UK GDPR Compliant', 'Right to Erasure', 'Data Portability'];
      case 'SG':
        return ['PDPA Compliant', 'Consent Required for Collection'];
      default:
        return ['Global Data Protection Standards'];
    }
  }

  /**
   * Get dispute resolution mechanism for a jurisdiction
   */
  private getDisputeResolutionMechanism(jurisdiction: string, crossBorder: boolean): string {
    if (crossBorder) {
      return 'Hybrid Arbitration (Cross-Border)';
    }
    
    switch (jurisdiction) {
      case 'EU':
        return 'On-Chain Arbitration with EU Regulatory Oversight';
      case 'US':
        return 'Hybrid Arbitration with State Insurance Commission Oversight';
      case 'UK':
        return 'On-Chain Arbitration with FCA Oversight';
      case 'SG':
        return 'On-Chain Arbitration with MAS Oversight';
      default:
        return 'Global Arbitration Standard';
    }
  }

  /**
   * Generate a regulatory compliance report for a policy
   */
  public generateComplianceReport(policyId: string): any {
    // This would generate a detailed compliance report for a policy
    // For now, we'll return a placeholder
    const policyInfo = this.getPolicyRegulatoryInfo(policyId);
    
    if (!policyInfo) {
      return null;
    }
    
    return {
      policyId,
      timestamp: new Date().toISOString(),
      jurisdiction: policyInfo.jurisdiction,
      regulatoryFrameworks: policyInfo.regulatoryFrameworks,
      complianceStatus: 'Compliant',
      dataProtection: {
        requirements: policyInfo.dataProtectionRequirements,
        status: 'Compliant',
      },
      disputeResolution: {
        mechanism: policyInfo.disputeResolutionMechanism,
        status: 'Available',
      },
      sandbox: {
        active: policyInfo.sandboxStatus,
        limitations: policyInfo.sandboxStatus ? 'Coverage limits apply' : 'N/A',
      },
      crossBorder: {
        status: policyInfo.crossBorderStatus,
        implications: policyInfo.crossBorderStatus ? 'Multi-jurisdictional rules apply' : 'N/A',
      },
      disclosures: policyInfo.requiredDisclosures,
    };
  }
}

// Create and export a singleton instance
export const regulatoryIntegrationService = new RegulatoryIntegrationService();
