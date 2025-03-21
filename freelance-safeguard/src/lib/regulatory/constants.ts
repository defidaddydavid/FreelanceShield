/**
 * Regulatory Compliance Constants for FreelanceShield
 * 
 * This module defines constants and configurations for regulatory compliance
 * across different jurisdictions.
 */

// Supported jurisdictions with their regulatory frameworks
export const SUPPORTED_JURISDICTIONS = {
  EU: {
    name: 'European Union',
    code: 'EU',
    regulatoryFrameworks: ['Solvency II', 'GDPR', 'DLT Pilot Regime'],
    capitalRequirements: {
      baseReserveRatio: 0.25, // 25% base reserve ratio (Solvency II influenced)
      minCapitalRequirement: 50000, // 50,000 USDC equivalent
      riskBasedCapital: true,
    },
    dataRequirements: {
      storageLocation: 'EU',
      dataRetentionPeriod: 730, // days (2 years)
      rightToErasure: true,
      dataMinimization: true,
    },
    claimProcessing: {
      maxAutomaticPayoutAmount: 200, // Lower automatic threshold in EU
      mandatoryReviewThreshold: 500,
      appealPeriod: 30, // days
    },
    kycRequirements: {
      required: true,
      thresholds: {
        basic: 100,    // Basic KYC for policies under 100 USDC
        enhanced: 1000, // Enhanced KYC for policies under 1000 USDC
        full: Infinity, // Full KYC for policies over 1000 USDC
      }
    },
    sandboxEligible: true,
  },
  US: {
    name: 'United States',
    code: 'US',
    regulatoryFrameworks: ['NAIC RBC', 'State Insurance Laws', 'Wyoming DAO LLC'],
    capitalRequirements: {
      baseReserveRatio: 0.20, // 20% base reserve ratio (NAIC influenced)
      minCapitalRequirement: 75000, // 75,000 USDC equivalent
      riskBasedCapital: true,
    },
    dataRequirements: {
      storageLocation: 'US',
      dataRetentionPeriod: 1095, // days (3 years)
      rightToErasure: false,
      dataMinimization: true,
    },
    claimProcessing: {
      maxAutomaticPayoutAmount: 250,
      mandatoryReviewThreshold: 750,
      appealPeriod: 45, // days
    },
    kycRequirements: {
      required: true,
      thresholds: {
        basic: 250,    // Basic KYC for policies under 250 USDC
        enhanced: 2000, // Enhanced KYC for policies under 2000 USDC
        full: Infinity, // Full KYC for policies over 2000 USDC
      }
    },
    sandboxEligible: true,
    stateSpecific: true, // US has state-specific insurance regulations
  },
  UK: {
    name: 'United Kingdom',
    code: 'UK',
    regulatoryFrameworks: ['UK Solvency II', 'FCA Regulations', 'UK GDPR'],
    capitalRequirements: {
      baseReserveRatio: 0.23, // 23% base reserve ratio
      minCapitalRequirement: 60000, // 60,000 USDC equivalent
      riskBasedCapital: true,
    },
    dataRequirements: {
      storageLocation: 'UK',
      dataRetentionPeriod: 730, // days (2 years)
      rightToErasure: true,
      dataMinimization: true,
    },
    claimProcessing: {
      maxAutomaticPayoutAmount: 225,
      mandatoryReviewThreshold: 600,
      appealPeriod: 30, // days
    },
    kycRequirements: {
      required: true,
      thresholds: {
        basic: 150,    // Basic KYC for policies under 150 USDC
        enhanced: 1500, // Enhanced KYC for policies under 1500 USDC
        full: Infinity, // Full KYC for policies over 1500 USDC
      }
    },
    sandboxEligible: true,
  },
  SINGAPORE: {
    name: 'Singapore',
    code: 'SG',
    regulatoryFrameworks: ['MAS Regulations', 'Payment Services Act', 'Sandbox Express'],
    capitalRequirements: {
      baseReserveRatio: 0.18, // 18% base reserve ratio
      minCapitalRequirement: 40000, // 40,000 USDC equivalent
      riskBasedCapital: true,
    },
    dataRequirements: {
      storageLocation: 'Singapore',
      dataRetentionPeriod: 1095, // days (3 years)
      rightToErasure: false,
      dataMinimization: true,
    },
    claimProcessing: {
      maxAutomaticPayoutAmount: 300,
      mandatoryReviewThreshold: 800,
      appealPeriod: 30, // days
    },
    kycRequirements: {
      required: true,
      thresholds: {
        basic: 200,    // Basic KYC for policies under 200 USDC
        enhanced: 1800, // Enhanced KYC for policies under 1800 USDC
        full: Infinity, // Full KYC for policies over 1800 USDC
      }
    },
    sandboxEligible: true,
  },
  GLOBAL: {
    name: 'Global Default',
    code: 'GLOBAL',
    regulatoryFrameworks: ['IAIS Standards', 'FATF Recommendations'],
    capitalRequirements: {
      baseReserveRatio: 0.30, // 30% base reserve ratio (conservative approach)
      minCapitalRequirement: 100000, // 100,000 USDC equivalent
      riskBasedCapital: true,
    },
    dataRequirements: {
      storageLocation: 'Distributed',
      dataRetentionPeriod: 1095, // days (3 years)
      rightToErasure: true, // Support the strictest standard
      dataMinimization: true,
    },
    claimProcessing: {
      maxAutomaticPayoutAmount: 100, // Conservative automatic threshold
      mandatoryReviewThreshold: 500,
      appealPeriod: 45, // days
    },
    kycRequirements: {
      required: true,
      thresholds: {
        basic: 100,    // Basic KYC for policies under 100 USDC
        enhanced: 1000, // Enhanced KYC for policies under 1000 USDC
        full: Infinity, // Full KYC for policies over 1000 USDC
      }
    },
    sandboxEligible: false,
  },
};

// Regulatory sandbox configurations
export const REGULATORY_SANDBOXES = {
  EU_DLT_PILOT: {
    name: 'EU DLT Pilot Regime',
    eligibleJurisdictions: ['EU'],
    maxCoverageAmount: 10000, // 10,000 USDC
    maxUserCount: 5000,
    requiresReporting: true,
    reportingFrequency: 'quarterly',
    expiryDate: new Date('2026-12-31'),
    regulatoryPassport: true,
    crossBorderEnabled: true,
    innovationHubAccess: true,
  },
  WYOMING_DAO_LLC: {
    name: 'Wyoming DAO LLC Framework',
    eligibleJurisdictions: ['US'],
    maxCoverageAmount: 15000, // 15,000 USDC
    maxUserCount: 7500,
    requiresReporting: true,
    reportingFrequency: 'quarterly',
    expiryDate: new Date('2027-06-30'),
    regulatoryPassport: false,
    crossBorderEnabled: false,
    innovationHubAccess: true,
  },
  US_INSURTECH_SANDBOX: {
    name: 'US InsurTech Regulatory Sandbox',
    eligibleJurisdictions: ['US'],
    maxCoverageAmount: 20000, // 20,000 USDC
    maxUserCount: 10000,
    requiresReporting: true,
    reportingFrequency: 'bi-monthly',
    expiryDate: new Date('2027-12-31'),
    regulatoryPassport: false,
    crossBorderEnabled: true,
    innovationHubAccess: true,
  },
  SINGAPORE_FINTECH_SANDBOX: {
    name: 'Singapore FinTech Regulatory Sandbox',
    eligibleJurisdictions: ['SINGAPORE'],
    maxCoverageAmount: 12000, // 12,000 USDC
    maxUserCount: 6000,
    requiresReporting: true,
    reportingFrequency: 'monthly',
    expiryDate: new Date('2026-09-30'),
    regulatoryPassport: false,
    crossBorderEnabled: true,
    innovationHubAccess: true,
  },
  GLOBAL_BLOCKCHAIN_INSURANCE: {
    name: 'Global Blockchain Insurance Sandbox',
    eligibleJurisdictions: ['GLOBAL', 'EU', 'US', 'UK', 'SINGAPORE'],
    maxCoverageAmount: 5000, // 5,000 USDC
    maxUserCount: 3000,
    requiresReporting: true,
    reportingFrequency: 'quarterly',
    expiryDate: new Date('2025-12-31'),
    regulatoryPassport: true,
    crossBorderEnabled: true,
    innovationHubAccess: false,
  },
  SINGAPORE_SANDBOX_EXPRESS: {
    name: 'MAS Sandbox Express',
    eligibleJurisdictions: ['SINGAPORE'],
    maxCoverageAmount: 12000, // 12,000 USDC
    maxUserCount: 6000,
    requiresReporting: true,
    reportingFrequency: 'monthly',
    expiryDate: new Date('2026-09-30'),
    regulatoryPassport: false,
    crossBorderEnabled: true,
    innovationHubAccess: true,
  },
  UK_FCA_SANDBOX: {
    name: 'UK FCA Regulatory Sandbox',
    eligibleJurisdictions: ['UK'],
    maxCoverageAmount: 10000, // 10,000 USDC
    maxUserCount: 5000,
    requiresReporting: true,
    reportingFrequency: 'quarterly',
    expiryDate: new Date('2026-12-31'),
    regulatoryPassport: false,
    crossBorderEnabled: true,
    innovationHubAccess: true,
  },
};

// Dispute resolution mechanisms
export const DISPUTE_RESOLUTION_MECHANISMS = {
  ON_CHAIN_ARBITRATION: {
    name: 'On-Chain Arbitration',
    description: 'Fully on-chain arbitration with licensed adjusters and smart contract enforcement',
    thresholds: {
      maxAmount: 1000, // Maximum amount for on-chain arbitration (1,000 USDC)
      minArbitrators: 3, // Minimum number of arbitrators required
      consensusThreshold: 0.67, // 2/3 majority required for resolution
    },
    timeframes: {
      responseWindow: 7, // days
      resolutionTarget: 14, // days
    },
    fees: {
      baseFee: 50, // 50 USDC
      percentOfDispute: 0.05, // 5% of dispute amount
    },
    appealable: true,
    crossBorderSupport: true,
  },
  HYBRID_ARBITRATION: {
    name: 'Hybrid Arbitration',
    description: 'Combined on-chain and off-chain arbitration with escrow mechanisms',
    thresholds: {
      maxAmount: 10000, // Maximum amount for hybrid arbitration (10,000 USDC)
      minArbitrators: 3, // Minimum number of arbitrators required
      consensusThreshold: 0.67, // 2/3 majority required for resolution
    },
    timeframes: {
      responseWindow: 14, // days
      resolutionTarget: 30, // days
    },
    fees: {
      baseFee: 100, // 100 USDC
      percentOfDispute: 0.04, // 4% of dispute amount
    },
    appealable: true,
    crossBorderSupport: true,
  },
  JUDICIAL_REVIEW: {
    name: 'Judicial Review',
    description: 'Traditional legal system review with blockchain evidence',
    thresholds: {
      maxAmount: Infinity, // No maximum amount
      minArbitrators: 1, // Minimum number of arbitrators (judge)
      consensusThreshold: 1.0, // Single decision maker
    },
    timeframes: {
      responseWindow: 30, // days
      resolutionTarget: 90, // days
    },
    fees: {
      baseFee: 250, // 250 USDC
      percentOfDispute: 0.03, // 3% of dispute amount
    },
    appealable: true,
    crossBorderSupport: false,
  },
};

// Cross-border liability frameworks
export const CROSS_BORDER_LIABILITY_FRAMEWORKS = {
  EU_PASSPORTING: {
    name: 'EU Passporting',
    eligibleJurisdictions: ['EU'],
    description: 'EU passporting rights for insurance services across member states',
    requiresLocalRegistration: false,
    disputeResolutionMechanism: 'HYBRID_ARBITRATION',
    applicableLaw: 'Country of origin',
  },
  GLOBAL_ARBITRATION: {
    name: 'Global Arbitration Agreement',
    eligibleJurisdictions: ['GLOBAL'],
    description: 'Standardized arbitration agreement for cross-border disputes',
    requiresLocalRegistration: false,
    disputeResolutionMechanism: 'HYBRID_ARBITRATION',
    applicableLaw: 'Arbitration seat',
  },
  LOCAL_REPRESENTATION: {
    name: 'Local Legal Representation',
    eligibleJurisdictions: ['GLOBAL'],
    description: 'Local legal representatives for each jurisdiction',
    requiresLocalRegistration: true,
    disputeResolutionMechanism: 'JUDICIAL_REVIEW',
    applicableLaw: 'Local jurisdiction',
  },
};

// Data protection requirements
export const DATA_PROTECTION_REQUIREMENTS = {
  EU_GDPR: {
    name: 'EU General Data Protection Regulation',
    applicableJurisdictions: ['EU'],
    dataSubjectRights: [
      'access',
      'rectification',
      'erasure',
      'restriction',
      'portability',
      'object',
      'automated-decision-making',
    ],
    dataRetentionPeriod: 730, // days (2 years)
    dataMinimizationRequired: true,
    crossBorderTransferRestrictions: true,
    breachNotificationRequired: true,
    breachNotificationDeadline: 72, // hours
    dpoRequired: true,
    dpaRequired: true,
  },
  US_CCPA: {
    name: 'California Consumer Privacy Act',
    applicableJurisdictions: ['US'],
    dataSubjectRights: [
      'access',
      'deletion',
      'opt-out-of-sale',
      'non-discrimination',
    ],
    dataRetentionPeriod: 1095, // days (3 years)
    dataMinimizationRequired: false,
    crossBorderTransferRestrictions: false,
    breachNotificationRequired: true,
    breachNotificationDeadline: 72, // hours
    dpoRequired: false,
    dpaRequired: false,
  },
  UK_GDPR: {
    name: 'UK General Data Protection Regulation',
    applicableJurisdictions: ['UK'],
    dataSubjectRights: [
      'access',
      'rectification',
      'erasure',
      'restriction',
      'portability',
      'object',
      'automated-decision-making',
    ],
    dataRetentionPeriod: 730, // days (2 years)
    dataMinimizationRequired: true,
    crossBorderTransferRestrictions: true,
    breachNotificationRequired: true,
    breachNotificationDeadline: 72, // hours
    dpoRequired: true,
    dpaRequired: true,
  },
  SINGAPORE_PDPA: {
    name: 'Singapore Personal Data Protection Act',
    applicableJurisdictions: ['SINGAPORE'],
    dataSubjectRights: [
      'access',
      'correction',
      'withdrawal-of-consent',
    ],
    dataRetentionPeriod: 1095, // days (3 years)
    dataMinimizationRequired: true,
    crossBorderTransferRestrictions: true,
    breachNotificationRequired: true,
    breachNotificationDeadline: 72, // hours
    dpoRequired: true,
    dpaRequired: false,
  },
  GLOBAL_STANDARD: {
    name: 'Global Data Protection Standard',
    applicableJurisdictions: ['GLOBAL'],
    dataSubjectRights: [
      'access',
      'rectification',
      'erasure',
      'restriction',
      'portability',
    ],
    dataRetentionPeriod: 1095, // days (3 years)
    dataMinimizationRequired: true,
    crossBorderTransferRestrictions: true,
    breachNotificationRequired: true,
    breachNotificationDeadline: 72, // hours
    dpoRequired: true,
    dpaRequired: true,
  },
};

// Reporting requirements
export const REPORTING_REQUIREMENTS = {
  EU: {
    name: 'EU Regulatory Reporting',
    frequency: 'quarterly',
    metrics: [
      'policy_count',
      'premium_volume',
      'claim_ratio',
      'reserve_ratio',
      'cross_border_activity',
      'user_demographics',
    ],
    format: 'XBRL',
    deadline: 30, // days after quarter end
  },
  US: {
    name: 'US Regulatory Reporting',
    frequency: 'quarterly',
    metrics: [
      'policy_count',
      'premium_volume',
      'claim_ratio',
      'reserve_ratio',
      'state_distribution',
      'user_demographics',
    ],
    format: 'JSON',
    deadline: 45, // days after quarter end
  },
  UK: {
    name: 'UK Regulatory Reporting',
    frequency: 'quarterly',
    metrics: [
      'policy_count',
      'premium_volume',
      'claim_ratio',
      'reserve_ratio',
      'cross_border_activity',
      'user_demographics',
    ],
    format: 'XBRL',
    deadline: 30, // days after quarter end
  },
  SINGAPORE: {
    name: 'Singapore Regulatory Reporting',
    frequency: 'monthly',
    metrics: [
      'policy_count',
      'premium_volume',
      'claim_ratio',
      'reserve_ratio',
      'cross_border_activity',
      'user_demographics',
    ],
    format: 'JSON',
    deadline: 20, // days after month end
  },
  GLOBAL: {
    name: 'Global Regulatory Reporting',
    frequency: 'quarterly',
    metrics: [
      'policy_count',
      'premium_volume',
      'claim_ratio',
      'reserve_ratio',
      'jurisdiction_distribution',
      'user_demographics',
    ],
    format: 'JSON',
    deadline: 45, // days after quarter end
  },
};

// KYC and AML requirements
export const KYC_AML_REQUIREMENTS = {
  EU: {
    name: 'EU KYC/AML Requirements',
    kycLevels: {
      basic: {
        threshold: 100, // SOL
        requirements: ['email', 'name', 'address'],
        verificationMethod: 'automated',
      },
      enhanced: {
        threshold: 1000, // SOL
        requirements: ['email', 'name', 'address', 'id_document', 'selfie'],
        verificationMethod: 'manual-review',
      },
      full: {
        threshold: Infinity, // SOL
        requirements: ['email', 'name', 'address', 'id_document', 'selfie', 'proof_of_address', 'source_of_funds'],
        verificationMethod: 'manual-review',
      },
    },
    amlScreening: {
      required: true,
      screeningFrequency: 'transaction-based',
      monitoringThreshold: 500, // SOL
    },
    riskAssessment: {
      required: true,
      frequency: 'annual',
    },
  },
  US: {
    name: 'US KYC/AML Requirements',
    kycLevels: {
      basic: {
        threshold: 250, // SOL
        requirements: ['email', 'name', 'address', 'ssn_last_4'],
        verificationMethod: 'automated',
      },
      enhanced: {
        threshold: 2000, // SOL
        requirements: ['email', 'name', 'address', 'ssn', 'id_document', 'selfie'],
        verificationMethod: 'manual-review',
      },
      full: {
        threshold: Infinity, // SOL
        requirements: ['email', 'name', 'address', 'ssn', 'id_document', 'selfie', 'proof_of_address', 'source_of_funds'],
        verificationMethod: 'manual-review',
      },
    },
    amlScreening: {
      required: true,
      screeningFrequency: 'transaction-based',
      monitoringThreshold: 750, // SOL
    },
    riskAssessment: {
      required: true,
      frequency: 'annual',
    },
  },
  UK: {
    name: 'UK KYC/AML Requirements',
    kycLevels: {
      basic: {
        threshold: 150, // SOL
        requirements: ['email', 'name', 'address'],
        verificationMethod: 'automated',
      },
      enhanced: {
        threshold: 1500, // SOL
        requirements: ['email', 'name', 'address', 'id_document', 'selfie'],
        verificationMethod: 'manual-review',
      },
      full: {
        threshold: Infinity, // SOL
        requirements: ['email', 'name', 'address', 'id_document', 'selfie', 'proof_of_address', 'source_of_funds'],
        verificationMethod: 'manual-review',
      },
    },
    amlScreening: {
      required: true,
      screeningFrequency: 'transaction-based',
      monitoringThreshold: 600, // SOL
    },
    riskAssessment: {
      required: true,
      frequency: 'annual',
    },
  },
  SINGAPORE: {
    name: 'Singapore KYC/AML Requirements',
    kycLevels: {
      basic: {
        threshold: 200, // SOL
        requirements: ['email', 'name', 'address'],
        verificationMethod: 'automated',
      },
      enhanced: {
        threshold: 1800, // SOL
        requirements: ['email', 'name', 'address', 'id_document', 'selfie'],
        verificationMethod: 'manual-review',
      },
      full: {
        threshold: Infinity, // SOL
        requirements: ['email', 'name', 'address', 'id_document', 'selfie', 'proof_of_address', 'source_of_funds'],
        verificationMethod: 'manual-review',
      },
    },
    amlScreening: {
      required: true,
      screeningFrequency: 'transaction-based',
      monitoringThreshold: 800, // SOL
    },
    riskAssessment: {
      required: true,
      frequency: 'annual',
    },
  },
  GLOBAL: {
    name: 'Global KYC/AML Requirements',
    kycLevels: {
      basic: {
        threshold: 100, // SOL
        requirements: ['email', 'name', 'address'],
        verificationMethod: 'automated',
      },
      enhanced: {
        threshold: 1000, // SOL
        requirements: ['email', 'name', 'address', 'id_document', 'selfie'],
        verificationMethod: 'manual-review',
      },
      full: {
        threshold: Infinity, // SOL
        requirements: ['email', 'name', 'address', 'id_document', 'selfie', 'proof_of_address', 'source_of_funds'],
        verificationMethod: 'manual-review',
      },
    },
    amlScreening: {
      required: true,
      screeningFrequency: 'transaction-based',
      monitoringThreshold: 500, // SOL
    },
    riskAssessment: {
      required: true,
      frequency: 'annual',
    },
  },
};
