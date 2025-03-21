/**
 * React hook for integrating regulatory compliance features with the frontend
 */
import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

import { regulatoryComplianceService, UserJurisdiction } from '../lib/regulatory/regulatoryCompliance';
import { dataSovereigntyService } from '../lib/regulatory/dataSovereignty';
import { regulatorySandboxService } from '../lib/regulatory/regulatorySandbox';
import { disputeResolutionService, DisputeStatus, ResolutionMechanism } from '../lib/regulatory/disputeResolution';
import { regulatoryIntegrationService, RegulatoryCheckResult, PolicyRegulatoryInfo } from '../lib/regulatory/regulatoryIntegration';
import { SUPPORTED_JURISDICTIONS } from '../lib/regulatory/constants';

export interface UseRegulatoryComplianceProps {
  autoDetectJurisdiction?: boolean;
}

export function useRegulatoryCompliance({ autoDetectJurisdiction = true }: UseRegulatoryComplianceProps = {}) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  
  const [userJurisdiction, setUserJurisdiction] = useState<UserJurisdiction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inSandbox, setInSandbox] = useState<boolean>(false);
  const [requiredDisclosures, setRequiredDisclosures] = useState<string[]>([]);
  
  // Initialize services with connection
  useEffect(() => {
    if (connection) {
      regulatoryComplianceService.setConnection(connection);
      dataSovereigntyService.setConnection(connection);
      regulatorySandboxService.setConnection(connection);
      disputeResolutionService.setConnection(connection);
      regulatoryIntegrationService.setConnection(connection);
    }
  }, [connection]);
  
  // Auto-detect jurisdiction if enabled
  useEffect(() => {
    if (autoDetectJurisdiction && publicKey) {
      detectJurisdiction();
    }
  }, [autoDetectJurisdiction, publicKey]);
  
  // Update sandbox status and disclosures when jurisdiction changes
  useEffect(() => {
    if (userJurisdiction) {
      regulatoryComplianceService.setUserJurisdiction(userJurisdiction);
      dataSovereigntyService.setUserJurisdiction(userJurisdiction);
      regulatorySandboxService.setUserJurisdiction(userJurisdiction);
      disputeResolutionService.setUserJurisdiction(userJurisdiction);
      regulatoryIntegrationService.setUserJurisdiction(userJurisdiction);
      
      setInSandbox(regulatorySandboxService.isInSandbox());
      setRequiredDisclosures(getRequiredDisclosures());
    }
  }, [userJurisdiction]);
  
  /**
   * Detect user jurisdiction based on IP geolocation
   */
  const detectJurisdiction = useCallback(async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would use a geolocation service
      // For now, we'll simulate this with a mock API call
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const countryCode = data.country_code || 'GLOBAL';
      const isEU = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'].includes(countryCode);
      
      const jurisdiction: UserJurisdiction = {
        countryCode,
        isEU,
        stateOrProvince: data.region || '',
        detectionMethod: 'ip-geolocation',
      };
      
      setUserJurisdiction(jurisdiction);
      
      // Store the user's jurisdiction in the regulatory compliance service
      await regulatoryComplianceService.registerUserJurisdiction(publicKey, jurisdiction);
    } catch (err) {
      console.error('Failed to detect jurisdiction:', err);
      setError('Failed to detect jurisdiction. Please set it manually.');
      
      // Fallback to global jurisdiction
      const fallbackJurisdiction: UserJurisdiction = {
        countryCode: 'GLOBAL',
        isEU: false,
        stateOrProvince: '',
        detectionMethod: 'fallback',
      };
      
      setUserJurisdiction(fallbackJurisdiction);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);
  
  /**
   * Manually set user jurisdiction
   */
  const setManualJurisdiction = useCallback(async (countryCode: string, stateOrProvince: string = '') => {
    if (!publicKey) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const isEU = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'].includes(countryCode);
      
      const jurisdiction: UserJurisdiction = {
        countryCode,
        isEU,
        stateOrProvince,
        detectionMethod: 'manual',
      };
      
      setUserJurisdiction(jurisdiction);
      
      // Store the user's jurisdiction in the regulatory compliance service
      await regulatoryComplianceService.registerUserJurisdiction(publicKey, jurisdiction);
    } catch (err) {
      console.error('Failed to set jurisdiction:', err);
      setError('Failed to set jurisdiction.');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);
  
  /**
   * Get supported jurisdictions
   */
  const getSupportedJurisdictions = useCallback(() => {
    return Object.entries(SUPPORTED_JURISDICTIONS).map(([code, info]) => ({
      code,
      name: info.name,
    }));
  }, []);
  
  /**
   * Check policy creation compliance
   */
  const checkPolicyCreationCompliance = useCallback((
    coverageAmount: number,
    periodDays: number,
    jobType: string,
    industry: string
  ): RegulatoryCheckResult => {
    if (!publicKey || !userJurisdiction) {
      return {
        approved: false,
        reason: 'User not connected or jurisdiction not set',
        requiresAdditionalVerification: true,
        additionalRequirements: ['Connect wallet', 'Set jurisdiction'],
      };
    }
    
    return regulatoryIntegrationService.checkPolicyCreationCompliance(
      coverageAmount,
      periodDays,
      jobType,
      industry,
      publicKey
    );
  }, [publicKey, userJurisdiction]);
  
  /**
   * Check claim submission compliance
   */
  const checkClaimSubmissionCompliance = useCallback((
    policyId: string,
    claimAmount: number,
    claimReason: string
  ): RegulatoryCheckResult => {
    if (!publicKey || !userJurisdiction) {
      return {
        approved: false,
        reason: 'User not connected or jurisdiction not set',
        requiresAdditionalVerification: true,
        additionalRequirements: ['Connect wallet', 'Set jurisdiction'],
      };
    }
    
    return regulatoryIntegrationService.checkClaimSubmissionCompliance(
      policyId,
      claimAmount,
      claimReason,
      publicKey
    );
  }, [publicKey, userJurisdiction]);
  
  /**
   * Check dispute creation compliance
   */
  const checkDisputeCreationCompliance = useCallback((
    policyId: string,
    claimId: string,
    disputeAmount: number
  ): RegulatoryCheckResult => {
    if (!publicKey || !userJurisdiction) {
      return {
        approved: false,
        reason: 'User not connected or jurisdiction not set',
        requiresAdditionalVerification: true,
        additionalRequirements: ['Connect wallet', 'Set jurisdiction'],
      };
    }
    
    return regulatoryIntegrationService.checkDisputeCreationCompliance(
      policyId,
      claimId,
      disputeAmount,
      publicKey
    );
  }, [publicKey, userJurisdiction]);
  
  /**
   * Get policy regulatory info
   */
  const getPolicyRegulatoryInfo = useCallback((policyId: string): PolicyRegulatoryInfo | null => {
    return regulatoryIntegrationService.getPolicyRegulatoryInfo(policyId);
  }, []);
  
  /**
   * Store personal data with data sovereignty
   */
  const storePersonalData = useCallback(async (
    dataType: string,
    data: any
  ): Promise<{ success: boolean; dataHash: string }> => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }
    
    return dataSovereigntyService.storePersonalData(publicKey, dataType, data);
  }, [publicKey]);
  
  /**
   * Retrieve personal data with data sovereignty
   */
  const retrievePersonalData = useCallback(async (
    dataHash: string
  ): Promise<{ success: boolean; data: any }> => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }
    
    return dataSovereigntyService.retrievePersonalData(publicKey, dataHash);
  }, [publicKey]);
  
  /**
   * Create a dispute
   */
  const createDispute = useCallback(async (
    policyId: string,
    claimId: string,
    respondent: PublicKey,
    amount: number,
    currency: string,
    jurisdictions: string[]
  ) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }
    
    return disputeResolutionService.createDispute(
      policyId,
      claimId,
      publicKey,
      respondent,
      amount,
      currency,
      jurisdictions
    );
  }, [publicKey]);
  
  /**
   * Get user disputes
   */
  const getUserDisputes = useCallback(() => {
    if (!publicKey) {
      return [];
    }
    
    return disputeResolutionService.getUserDisputes(publicKey);
  }, [publicKey]);
  
  /**
   * Get required disclosures
   */
  const getRequiredDisclosures = useCallback((): string[] => {
    const disclosures: string[] = [];
    
    // Add sandbox disclosures if applicable
    if (regulatorySandboxService.isInSandbox()) {
      disclosures.push(regulatorySandboxService.generateDisclosureText());
    }
    
    // Add jurisdiction-specific disclosures
    if (userJurisdiction) {
      const jurisdictionKey = userJurisdiction.isEU ? 'EU' : userJurisdiction.countryCode;
      const jurisdictionInfo = SUPPORTED_JURISDICTIONS[jurisdictionKey as keyof typeof SUPPORTED_JURISDICTIONS];
      
      if (jurisdictionInfo) {
        disclosures.push(`FreelanceShield operates under the regulatory frameworks of ${jurisdictionInfo.regulatoryFrameworks.join(', ')}.`);
      }
    }
    
    return disclosures;
  }, [userJurisdiction]);
  
  /**
   * Generate compliance report
   */
  const generateComplianceReport = useCallback((policyId: string) => {
    return regulatoryIntegrationService.generateComplianceReport(policyId);
  }, []);
  
  return {
    userJurisdiction,
    isLoading,
    error,
    inSandbox,
    requiredDisclosures,
    detectJurisdiction,
    setManualJurisdiction,
    getSupportedJurisdictions,
    checkPolicyCreationCompliance,
    checkClaimSubmissionCompliance,
    checkDisputeCreationCompliance,
    getPolicyRegulatoryInfo,
    storePersonalData,
    retrievePersonalData,
    createDispute,
    getUserDisputes,
    getRequiredDisclosures,
    generateComplianceReport,
  };
}
