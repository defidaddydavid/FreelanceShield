import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useRegulatoryCompliance } from './useRegulatoryCompliance';
import { 
  regulatorySolanaIntegrationService, 
  RegulatoryTransactionResult 
} from '../lib/regulatory/regulatorySolanaIntegration';

/**
 * Hook for interacting with the Solana blockchain for regulatory compliance features
 */
export const useRegulatorySolana = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { userJurisdiction } = useRegulatoryCompliance();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastTransactionResult, setLastTransactionResult] = useState<RegulatoryTransactionResult | null>(null);

  // Initialize the service with the current connection and jurisdiction
  useEffect(() => {
    if (connection && userJurisdiction) {
      regulatorySolanaIntegrationService.setConnection(connection);
      regulatorySolanaIntegrationService.setUserJurisdiction(userJurisdiction);
      setIsInitialized(true);
    } else {
      setIsInitialized(false);
    }
  }, [connection, userJurisdiction]);

  /**
   * Register the user's jurisdiction on the blockchain
   */
  const registerJurisdiction = useCallback(async () => {
    if (!isInitialized || !publicKey || !userJurisdiction) {
      return {
        success: false,
        error: 'Service not initialized or wallet not connected'
      };
    }

    setIsLoading(true);
    try {
      const result = await regulatorySolanaIntegrationService.registerJurisdictionOnChain(
        publicKey,
        userJurisdiction
      );
      setLastTransactionResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setLastTransactionResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, publicKey, userJurisdiction]);

  /**
   * Verify policy compliance with regulatory requirements
   */
  const verifyPolicyCompliance = useCallback(async (
    coverageAmount: number,
    periodDays: number,
    jobType: string,
    industry: string
  ) => {
    if (!isInitialized || !publicKey) {
      return {
        success: false,
        error: 'Service not initialized or wallet not connected'
      };
    }

    setIsLoading(true);
    try {
      const result = await regulatorySolanaIntegrationService.verifyPolicyComplianceOnChain(
        publicKey,
        coverageAmount,
        periodDays,
        jobType,
        industry
      );
      setLastTransactionResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setLastTransactionResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, publicKey]);

  /**
   * Store a hash of user data on the blockchain for data sovereignty
   */
  const storeDataHash = useCallback(async (
    dataHash: string,
    dataType: string,
    expiryTimestamp: number
  ) => {
    if (!isInitialized || !publicKey) {
      return {
        success: false,
        error: 'Service not initialized or wallet not connected'
      };
    }

    setIsLoading(true);
    try {
      const result = await regulatorySolanaIntegrationService.storeDataHashOnChain(
        publicKey,
        dataHash,
        dataType,
        expiryTimestamp
      );
      setLastTransactionResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setLastTransactionResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, publicKey]);

  /**
   * Create a dispute record on the blockchain
   */
  const createDispute = useCallback(async (
    policyId: string,
    disputeAmount: number,
    disputeReason: string
  ) => {
    if (!isInitialized || !publicKey) {
      return {
        success: false,
        error: 'Service not initialized or wallet not connected'
      };
    }

    setIsLoading(true);
    try {
      const result = await regulatorySolanaIntegrationService.createDisputeOnChain(
        publicKey,
        policyId,
        disputeAmount,
        disputeReason
      );
      setLastTransactionResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setLastTransactionResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, publicKey]);

  /**
   * Join a regulatory sandbox on the blockchain
   */
  const joinSandbox = useCallback(async (
    sandboxId: string,
    companyName: string,
    businessModel: string
  ) => {
    if (!isInitialized || !publicKey) {
      return {
        success: false,
        error: 'Service not initialized or wallet not connected'
      };
    }

    setIsLoading(true);
    try {
      const result = await regulatorySolanaIntegrationService.joinSandboxOnChain(
        publicKey,
        sandboxId,
        companyName,
        businessModel
      );
      setLastTransactionResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setLastTransactionResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, publicKey]);

  /**
   * Get KYC requirements based on coverage amount
   */
  const getKycRequirements = useCallback((coverageAmount: number) => {
    return regulatorySolanaIntegrationService.getKycRequirementsForCoverage(coverageAmount);
  }, []);

  /**
   * Check if AML screening is required for a transaction
   */
  const checkAmlScreeningRequired = useCallback((transactionAmount: number) => {
    return regulatorySolanaIntegrationService.isAmlScreeningRequired(transactionAmount);
  }, []);

  /**
   * Get limitations for a specific regulatory sandbox
   */
  const getSandboxLimitations = useCallback((sandboxId: string) => {
    return regulatorySolanaIntegrationService.getSandboxLimitations(sandboxId);
  }, []);

  return {
    isInitialized,
    isLoading,
    lastTransactionResult,
    registerJurisdiction,
    verifyPolicyCompliance,
    storeDataHash,
    createDispute,
    joinSandbox,
    getKycRequirements,
    checkAmlScreeningRequired,
    getSandboxLimitations
  };
};
