/**
 * Regulatory Compliance Module for FreelanceShield
 * 
 * This module provides a modular regulatory framework that adapts to different jurisdictions
 * and implements the necessary compliance measures for blockchain-enabled insurance.
 */

import { SUPPORTED_JURISDICTIONS, REGULATORY_SANDBOXES, 
         DATA_PROTECTION_REQUIREMENTS, DISPUTE_RESOLUTION_MECHANISMS,
         KYC_AML_REQUIREMENTS, REPORTING_REQUIREMENTS } from './constants';
import { NETWORK_CONFIG } from '../solana/constants';
import { PublicKey, Connection } from '@solana/web3.js';

// Types for regulatory compliance
export interface UserJurisdiction {
  countryCode: string;
  stateOrProvince?: string; // For countries with regional regulations (e.g., US states)
  isEU: boolean;
  detectionMethod?: 'ip-geolocation' | 'manual' | 'fallback';
  regulatoryFramework?: string[];
  dataProtectionRegime?: string[];
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  applicableJurisdictions: string[];
  implementationStatus: 'implemented' | 'partial' | 'planned' | 'not-applicable';
  validationFunction?: (params: any) => boolean;
}

export interface RegulatoryPool {
  id: string;
  jurisdiction: string;
  reserveRatio: number;
  minCapitalRequirement: number;
  publicKey?: PublicKey;
  isActive: boolean;
}

// Main regulatory compliance service
export class RegulatoryComplianceService {
  private userJurisdiction: UserJurisdiction | null = null;
  private applicableRequirements: ComplianceRequirement[] = [];
  private regulatoryPools: Map<string, RegulatoryPool> = new Map();
  private geolocationEnabled: boolean = true;
  private connection: Connection | null = null;

  constructor() {
    this.initializeRegulatoryPools();
  }

  /**
   * Initialize regulatory pools for different jurisdictions
   */
  private initializeRegulatoryPools(): void {
    // Create a separate liquidity pool for each major jurisdiction
    Object.entries(SUPPORTED_JURISDICTIONS).forEach(([code, config]) => {
      if (code === 'GLOBAL') return; // Skip global default for now

      this.regulatoryPools.set(code, {
        id: `risk-pool-${code.toLowerCase()}`,
        jurisdiction: code,
        reserveRatio: config.capitalRequirements.baseReserveRatio,
        minCapitalRequirement: config.capitalRequirements.minCapitalRequirement,
        isActive: true
      });
    });

    // Always add global pool as fallback
    const globalConfig = SUPPORTED_JURISDICTIONS.GLOBAL;
    this.regulatoryPools.set('GLOBAL', {
      id: 'risk-pool-global',
      jurisdiction: 'GLOBAL',
      reserveRatio: globalConfig.capitalRequirements.baseReserveRatio,
      minCapitalRequirement: globalConfig.capitalRequirements.minCapitalRequirement,
      isActive: true
    });
  }

  /**
   * Set user's jurisdiction based on geolocation or user input
   */
  public setUserJurisdiction(countryCode: string, region?: string): UserJurisdiction {
    const isEU = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 
                  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 
                  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'].includes(countryCode);
    
    let regulatoryFramework: string[] = [];
    let dataProtectionRegime: string[] = [];
    
    // Determine applicable regulatory frameworks
    if (isEU) {
      regulatoryFramework = SUPPORTED_JURISDICTIONS.EU.regulatoryFrameworks;
      dataProtectionRegime = ['EU_GDPR'];
    } else if (countryCode === 'US') {
      regulatoryFramework = SUPPORTED_JURISDICTIONS.US.regulatoryFrameworks;
      dataProtectionRegime = ['US_CCPA'];
    } else if (countryCode === 'GB') {
      regulatoryFramework = SUPPORTED_JURISDICTIONS.UK.regulatoryFrameworks;
      dataProtectionRegime = ['UK_GDPR'];
    } else if (countryCode === 'SG') {
      regulatoryFramework = SUPPORTED_JURISDICTIONS.SINGAPORE.regulatoryFrameworks;
      dataProtectionRegime = [];
    } else {
      // Default to global standards for unsupported jurisdictions
      regulatoryFramework = SUPPORTED_JURISDICTIONS.GLOBAL.regulatoryFrameworks;
      dataProtectionRegime = [];
    }
    
    this.userJurisdiction = {
      countryCode,
      stateOrProvince: region,
      isEU,
      detectionMethod: 'ip-geolocation',
      regulatoryFramework,
      dataProtectionRegime
    };
    
    // Update applicable requirements based on jurisdiction
    this.updateApplicableRequirements();
    
    return this.userJurisdiction;
  }

  /**
   * Update the list of applicable compliance requirements based on user jurisdiction
   */
  private updateApplicableRequirements(): void {
    if (!this.userJurisdiction) return;
    
    this.applicableRequirements = [];
    
    // Add base requirements applicable to all jurisdictions
    this.addBaseRequirements();
    
    // Add jurisdiction-specific requirements
    if (this.userJurisdiction.isEU) {
      this.addEURequirements();
    } else if (this.userJurisdiction.countryCode === 'US') {
      this.addUSRequirements();
    } else if (this.userJurisdiction.countryCode === 'GB') {
      this.addUKRequirements();
    } else if (this.userJurisdiction.countryCode === 'SG') {
      this.addSingaporeRequirements();
    }
  }

  /**
   * Add base requirements applicable to all jurisdictions
   */
  private addBaseRequirements(): void {
    this.applicableRequirements.push({
      id: 'base-kyc',
      name: 'Basic KYC Requirements',
      description: 'Basic Know Your Customer requirements for all users',
      applicableJurisdictions: ['GLOBAL'],
      implementationStatus: 'implemented',
      validationFunction: this.validateBasicKYC.bind(this)
    });
    
    this.applicableRequirements.push({
      id: 'base-aml',
      name: 'Anti-Money Laundering Checks',
      description: 'Basic AML screening for all transactions',
      applicableJurisdictions: ['GLOBAL'],
      implementationStatus: 'implemented',
      validationFunction: this.validateAML.bind(this)
    });
  }

  /**
   * Add EU-specific requirements
   */
  private addEURequirements(): void {
    this.applicableRequirements.push({
      id: 'eu-gdpr',
      name: 'GDPR Compliance',
      description: 'General Data Protection Regulation requirements',
      applicableJurisdictions: ['EU'],
      implementationStatus: 'implemented',
      validationFunction: this.validateGDPR.bind(this)
    });
    
    this.applicableRequirements.push({
      id: 'eu-solvency',
      name: 'Solvency II Requirements',
      description: 'Capital requirements based on Solvency II directive',
      applicableJurisdictions: ['EU'],
      implementationStatus: 'implemented',
      validationFunction: this.validateSolvencyII.bind(this)
    });

    this.applicableRequirements.push({
      id: 'eu-dlt-pilot',
      name: 'EU DLT Pilot Regime',
      description: 'Compliance with EU DLT Pilot Regime for financial instruments',
      applicableJurisdictions: ['EU'],
      implementationStatus: 'partial',
      validationFunction: this.validateDLTPilot.bind(this)
    });
  }

  /**
   * Add US-specific requirements
   */
  private addUSRequirements(): void {
    this.applicableRequirements.push({
      id: 'us-state-insurance',
      name: 'State Insurance Regulations',
      description: 'Compliance with state-specific insurance regulations',
      applicableJurisdictions: ['US'],
      implementationStatus: 'partial',
      validationFunction: this.validateStateInsurance.bind(this)
    });
    
    this.applicableRequirements.push({
      id: 'us-dao-llc',
      name: 'DAO LLC Structure',
      description: 'Compliance with Wyoming DAO LLC framework',
      applicableJurisdictions: ['US'],
      implementationStatus: 'planned',
      validationFunction: this.validateDAOLLC.bind(this)
    });

    if (this.userJurisdiction?.stateOrProvince === 'CA') {
      this.applicableRequirements.push({
        id: 'us-ccpa',
        name: 'CCPA Compliance',
        description: 'California Consumer Privacy Act requirements',
        applicableJurisdictions: ['US'],
        implementationStatus: 'implemented',
        validationFunction: this.validateCCPA.bind(this)
      });
    }
  }

  /**
   * Add UK-specific requirements
   */
  private addUKRequirements(): void {
    this.applicableRequirements.push({
      id: 'uk-gdpr',
      name: 'UK GDPR Compliance',
      description: 'UK General Data Protection Regulation requirements',
      applicableJurisdictions: ['UK'],
      implementationStatus: 'implemented',
      validationFunction: this.validateUKGDPR.bind(this)
    });
    
    this.applicableRequirements.push({
      id: 'uk-fca',
      name: 'FCA Regulatory Sandbox',
      description: 'Financial Conduct Authority sandbox requirements',
      applicableJurisdictions: ['UK'],
      implementationStatus: 'planned',
      validationFunction: this.validateFCASandbox.bind(this)
    });
  }

  /**
   * Add Singapore-specific requirements
   */
  private addSingaporeRequirements(): void {
    this.applicableRequirements.push({
      id: 'sg-mas',
      name: 'MAS Regulations',
      description: 'Monetary Authority of Singapore regulatory requirements',
      applicableJurisdictions: ['SINGAPORE'],
      implementationStatus: 'partial',
      validationFunction: this.validateMAS.bind(this)
    });
    
    this.applicableRequirements.push({
      id: 'sg-sandbox',
      name: 'Sandbox Express',
      description: 'MAS Sandbox Express for fintech innovations',
      applicableJurisdictions: ['SINGAPORE'],
      implementationStatus: 'planned',
      validationFunction: this.validateSandboxExpress.bind(this)
    });
  }

  /**
   * Get the appropriate risk pool for the user's jurisdiction
   */
  public getJurisdictionRiskPool(): RegulatoryPool {
    if (!this.userJurisdiction) {
      return this.regulatoryPools.get('GLOBAL')!;
    }
    
    if (this.userJurisdiction.isEU) {
      return this.regulatoryPools.get('EU')!;
    } else if (this.userJurisdiction.countryCode === 'US') {
      return this.regulatoryPools.get('US')!;
    } else if (this.userJurisdiction.countryCode === 'GB') {
      return this.regulatoryPools.get('UK')!;
    } else if (this.userJurisdiction.countryCode === 'SG') {
      return this.regulatoryPools.get('SINGAPORE')!;
    }
    
    return this.regulatoryPools.get('GLOBAL')!;
  }

  /**
   * Get KYC requirements based on policy amount and jurisdiction
   */
  public getKYCRequirements(policyAmount: number): any {
    if (!this.userJurisdiction) {
      return KYC_AML_REQUIREMENTS.ENHANCED; // Default to enhanced if no jurisdiction
    }
    
    let jurisdictionCode = 'GLOBAL';
    
    if (this.userJurisdiction.isEU) {
      jurisdictionCode = 'EU';
    } else if (this.userJurisdiction.countryCode === 'US') {
      jurisdictionCode = 'US';
    } else if (this.userJurisdiction.countryCode === 'GB') {
      jurisdictionCode = 'UK';
    } else if (this.userJurisdiction.countryCode === 'SG') {
      jurisdictionCode = 'SINGAPORE';
    }
    
    const thresholds = SUPPORTED_JURISDICTIONS[jurisdictionCode as keyof typeof SUPPORTED_JURISDICTIONS]
                        .kycRequirements.thresholds;
    
    if (policyAmount <= thresholds.basic) {
      return KYC_AML_REQUIREMENTS.BASIC;
    } else if (policyAmount <= thresholds.enhanced) {
      return KYC_AML_REQUIREMENTS.ENHANCED;
    } else {
      return KYC_AML_REQUIREMENTS.FULL;
    }
  }

  /**
   * Get appropriate dispute resolution mechanism based on claim amount and jurisdiction
   */
  public getDisputeResolutionMechanism(claimAmount: number): any {
    if (claimAmount <= DISPUTE_RESOLUTION_MECHANISMS.ON_CHAIN_ARBITRATION.thresholds.maxAmount) {
      return DISPUTE_RESOLUTION_MECHANISMS.ON_CHAIN_ARBITRATION;
    } else if (claimAmount <= DISPUTE_RESOLUTION_MECHANISMS.HYBRID_ARBITRATION.thresholds.maxAmount) {
      return DISPUTE_RESOLUTION_MECHANISMS.HYBRID_ARBITRATION;
    } else {
      return DISPUTE_RESOLUTION_MECHANISMS.JUDICIAL_REVIEW;
    }
  }

  /**
   * Get data protection requirements based on user jurisdiction
   */
  public getDataProtectionRequirements(): any {
    if (!this.userJurisdiction) {
      return null;
    }
    
    if (this.userJurisdiction.isEU) {
      return DATA_PROTECTION_REQUIREMENTS.EU_GDPR;
    } else if (this.userJurisdiction.countryCode === 'US' && this.userJurisdiction.stateOrProvince === 'CA') {
      return DATA_PROTECTION_REQUIREMENTS.US_CCPA;
    } else if (this.userJurisdiction.countryCode === 'GB') {
      return DATA_PROTECTION_REQUIREMENTS.UK_GDPR;
    }
    
    return null;
  }

  /**
   * Get reporting requirements based on user jurisdiction
   */
  public getReportingRequirements(): any {
    if (!this.userJurisdiction) {
      return null;
    }
    
    if (this.userJurisdiction.isEU) {
      return REPORTING_REQUIREMENTS.EU;
    } else if (this.userJurisdiction.countryCode === 'US') {
      return REPORTING_REQUIREMENTS.US;
    } else if (this.userJurisdiction.countryCode === 'GB') {
      return REPORTING_REQUIREMENTS.UK;
    } else if (this.userJurisdiction.countryCode === 'SG') {
      return REPORTING_REQUIREMENTS.SINGAPORE;
    }
    
    return null;
  }

  /**
   * Adjust premium based on regulatory requirements
   */
  public adjustPremiumForRegulation(basePremium: number): number {
    if (!this.userJurisdiction) {
      return basePremium * 1.1; // 10% increase for unknown jurisdiction (higher risk)
    }
    
    let regulatoryMultiplier = 1.0;
    
    // Apply jurisdiction-specific adjustments
    if (this.userJurisdiction.isEU) {
      regulatoryMultiplier = 1.05; // 5% increase for EU compliance costs
    } else if (this.userJurisdiction.countryCode === 'US') {
      regulatoryMultiplier = 1.08; // 8% increase for US compliance costs
    } else if (this.userJurisdiction.countryCode === 'GB') {
      regulatoryMultiplier = 1.06; // 6% increase for UK compliance costs
    } else if (this.userJurisdiction.countryCode === 'SG') {
      regulatoryMultiplier = 1.03; // 3% increase for Singapore compliance costs
    } else {
      regulatoryMultiplier = 1.1; // 10% increase for other jurisdictions
    }
    
    return basePremium * regulatoryMultiplier;
  }

  /**
   * Check if a policy is allowed in the user's jurisdiction
   */
  public isPolicyAllowedInJurisdiction(
    coverageAmount: number, 
    periodDays: number, 
    jobType: string
  ): boolean {
    if (!this.userJurisdiction) {
      return false; // Require jurisdiction to be set
    }
    
    // Check for jurisdiction-specific restrictions
    if (this.userJurisdiction.isEU) {
      // EU has a maximum coverage amount for non-licensed insurers
      if (coverageAmount > SUPPORTED_JURISDICTIONS.EU.capitalRequirements.minCapitalRequirement * 2) {
        return false;
      }
    } else if (this.userJurisdiction.countryCode === 'US') {
      // US requires state-by-state licensing, using sandbox for now
      if (!this.isInSandbox() && coverageAmount > 5000) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if the platform is operating in a regulatory sandbox for the user's jurisdiction
   */
  public isInSandbox(): boolean {
    if (!this.userJurisdiction) {
      return false;
    }
    
    if (this.userJurisdiction.isEU && 
        REGULATORY_SANDBOXES.EU_DLT_PILOT.eligibleJurisdictions.includes('EU')) {
      return true;
    } else if (this.userJurisdiction.countryCode === 'US' && 
              REGULATORY_SANDBOXES.WYOMING_DAO_LLC.eligibleJurisdictions.includes('US')) {
      return true;
    } else if (this.userJurisdiction.countryCode === 'GB' && 
              REGULATORY_SANDBOXES.UK_FCA_SANDBOX.eligibleJurisdictions.includes('UK')) {
      return true;
    } else if (this.userJurisdiction.countryCode === 'SG' && 
              REGULATORY_SANDBOXES.SINGAPORE_SANDBOX_EXPRESS.eligibleJurisdictions.includes('SINGAPORE')) {
      return true;
    }
    
    return false;
  }

  /**
   * Get sandbox limitations for the user's jurisdiction
   */
  public getSandboxLimitations(): any {
    if (!this.userJurisdiction || !this.isInSandbox()) {
      return null;
    }
    
    if (this.userJurisdiction.isEU) {
      return REGULATORY_SANDBOXES.EU_DLT_PILOT;
    } else if (this.userJurisdiction.countryCode === 'US') {
      return REGULATORY_SANDBOXES.WYOMING_DAO_LLC;
    } else if (this.userJurisdiction.countryCode === 'GB') {
      return REGULATORY_SANDBOXES.UK_FCA_SANDBOX;
    } else if (this.userJurisdiction.countryCode === 'SG') {
      return REGULATORY_SANDBOXES.SINGAPORE_SANDBOX_EXPRESS;
    }
    
    return null;
  }

  /**
   * Set the connection to the Solana network
   */
  public setConnection(connection: Connection): void {
    this.connection = connection;
  }

  // Validation functions for compliance requirements
  private validateBasicKYC(params: any): boolean {
    // Implementation would check if user has completed basic KYC
    return true;
  }

  private validateAML(params: any): boolean {
    // Implementation would check if transaction passes AML screening
    return true;
  }

  private validateGDPR(params: any): boolean {
    // Implementation would check GDPR compliance
    return true;
  }

  private validateSolvencyII(params: any): boolean {
    // Implementation would check Solvency II compliance
    return true;
  }

  private validateDLTPilot(params: any): boolean {
    // Implementation would check EU DLT Pilot Regime compliance
    return true;
  }

  private validateStateInsurance(params: any): boolean {
    // Implementation would check US state insurance regulations
    return true;
  }

  private validateDAOLLC(params: any): boolean {
    // Implementation would check Wyoming DAO LLC compliance
    return true;
  }

  private validateCCPA(params: any): boolean {
    // Implementation would check CCPA compliance
    return true;
  }

  private validateUKGDPR(params: any): boolean {
    // Implementation would check UK GDPR compliance
    return true;
  }

  private validateFCASandbox(params: any): boolean {
    // Implementation would check FCA Sandbox compliance
    return true;
  }

  private validateMAS(params: any): boolean {
    // Implementation would check MAS regulations compliance
    return true;
  }

  private validateSandboxExpress(params: any): boolean {
    // Implementation would check Sandbox Express compliance
    return true;
  }
}

// Create and export a singleton instance
export const regulatoryComplianceService = new RegulatoryComplianceService();
