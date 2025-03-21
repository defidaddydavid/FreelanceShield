import { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { FreelanceInsuranceSDK } from '../sdk';
import { NETWORK_CONFIG, parseUSDC, formatUSDC } from '../constants';
import { Policy, Claim, RiskPoolMetrics, JobType, Industry } from '@/types/insurance';

export interface CreatePolicyResult {
  success: boolean;
  txId?: string;
  error?: string;
}

export interface SubmitClaimResult {
  success: boolean;
  txId?: string;
  error?: string;
}

export interface UseFreelanceInsuranceReturn {
  createPolicy: (
    coverageAmount: number,
    premiumAmount: number,
    coveragePeriod: number,
    jobType: JobType,
    industry: Industry,
    projectName: string,
    clientName: string,
    description: string
  ) => Promise<CreatePolicyResult>;
  submitClaim: (
    policyPDA: PublicKey,
    amount: number,
    evidenceType: string,
    evidenceDescription: string,
    evidenceAttachments: string[]
  ) => Promise<SubmitClaimResult>;
  getPoliciesForUser: (userPublicKey: PublicKey) => Promise<Policy[] | null>;
  getClaimsForUser: (userPublicKey: PublicKey) => Promise<Claim[] | null>;
  getRiskPoolMetrics: () => Promise<RiskPoolMetrics | null>;
  isLoading: boolean;
  error: string | null;
}

export function useFreelanceInsurance(): UseFreelanceInsuranceReturn {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize SDK
  const getSDK = useCallback(() => {
    try {
      return new FreelanceInsuranceSDK(connection);
    } catch (err) {
      console.error('Failed to initialize FreelanceInsuranceSDK:', err);
      setError('Failed to initialize insurance SDK');
      throw err;
    }
  }, [connection]);

  // Map JobType and Industry from insurance.ts to useSolanaInsurance.ts format
  const mapJobType = (jobType: JobType | string): string => {
    const jobTypeMap: Record<string, string> = {
      [JobType.DEVELOPMENT]: 'SOFTWARE_DEVELOPMENT',
      [JobType.DESIGN]: 'DESIGN',
      [JobType.WRITING]: 'WRITING',
      [JobType.MARKETING]: 'MARKETING',
      [JobType.CONSULTING]: 'CONSULTING',
      [JobType.ENGINEERING]: 'ENGINEERING',
      [JobType.OTHER]: 'OTHER',
    };
    return jobTypeMap[jobType as string] || jobType as string;
  };

  const mapIndustry = (industry: Industry | string): string => {
    const industryMap: Record<string, string> = {
      [Industry.TECHNOLOGY]: 'TECHNOLOGY',
      [Industry.HEALTHCARE]: 'HEALTHCARE',
      [Industry.FINANCE]: 'FINANCE',
      [Industry.EDUCATION]: 'EDUCATION',
      [Industry.ECOMMERCE]: 'RETAIL',
      [Industry.ENTERTAINMENT]: 'ENTERTAINMENT',
      [Industry.MANUFACTURING]: 'MANUFACTURING',
      [Industry.OTHER]: 'OTHER',
    };
    return industryMap[industry as string] || industry as string;
  };

  // Create a new insurance policy
  const createPolicy = useCallback(
    async (
      coverageAmount: number,
      premiumAmount: number,
      coveragePeriod: number,
      jobType: JobType,
      industry: Industry,
      projectName: string,
      clientName: string,
      description: string
    ): Promise<CreatePolicyResult> => {
      if (!publicKey) {
        return { success: false, error: 'Wallet not connected' };
      }

      setIsLoading(true);
      setError(null);

      try {
        const sdk = getSDK();

        // Map the JobType and Industry to the format expected by the SDK
        const mappedJobType = mapJobType(jobType);
        const mappedIndustry = mapIndustry(industry);

        // Convert to lamports for on-chain storage
        const coverageLamports = coverageAmount * NETWORK_CONFIG.lamportsPerUSDC;
        const premiumLamports = premiumAmount * NETWORK_CONFIG.lamportsPerUSDC;

        // Create the transaction
        const transaction = new Transaction();
        
        // Add policy creation instruction
        const createPolicyIx = await sdk.createPolicyInstruction(
          publicKey,
          coverageLamports,
          premiumLamports,
          coveragePeriod,
          mappedJobType,
          mappedIndustry,
          projectName,
          clientName,
          description
        );
        
        transaction.add(createPolicyIx);

        // Send the transaction
        const signature = await sendTransaction(transaction, connection);
        
        // Wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed');
        
        console.log('Policy created successfully:', signature);
        
        return {
          success: true,
          txId: signature
        };
      } catch (err) {
        console.error('Error creating policy:', err);
        setError(err instanceof Error ? err.message : 'Unknown error creating policy');
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error creating policy'
        };
      } finally {
        setIsLoading(false);
      }
    },
    [publicKey, connection, sendTransaction, getSDK]
  );

  // Submit a claim for an existing policy
  const submitClaim = useCallback(
    async (
      policyPDA: PublicKey,
      amount: number,
      evidenceType: string,
      evidenceDescription: string,
      evidenceAttachments: string[] = []
    ): Promise<SubmitClaimResult> => {
      if (!publicKey) {
        return { success: false, error: 'Wallet not connected' };
      }

      setIsLoading(true);
      setError(null);

      try {
        const sdk = getSDK();

        // Convert to lamports for on-chain storage
        const amountLamports = amount * NETWORK_CONFIG.lamportsPerUSDC;

        // Create the transaction
        const transaction = new Transaction();
        
        // Add claim submission instruction
        const submitClaimIx = await sdk.submitClaimInstruction(
          publicKey,
          policyPDA,
          amountLamports,
          evidenceType,
          evidenceDescription,
          evidenceAttachments
        );
        
        transaction.add(submitClaimIx);

        // Send the transaction
        const signature = await sendTransaction(transaction, connection);
        
        // Wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed');
        
        console.log('Claim submitted successfully:', signature);
        
        return {
          success: true,
          txId: signature
        };
      } catch (err) {
        console.error('Error submitting claim:', err);
        setError(err instanceof Error ? err.message : 'Unknown error submitting claim');
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error submitting claim'
        };
      } finally {
        setIsLoading(false);
      }
    },
    [publicKey, connection, sendTransaction, getSDK]
  );

  // Get all policies for a user
  const getPoliciesForUser = useCallback(
    async (userPublicKey: PublicKey): Promise<Policy[] | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const sdk = getSDK();
        const policies = await sdk.getPoliciesForUser(userPublicKey);
        
        if (!policies || policies.length === 0) {
          return [];
        }

        // The SDK now returns the correct Policy type, so we don't need to transform
        return policies;
      } catch (err) {
        console.error('Error fetching policies:', err);
        setError(err instanceof Error ? err.message : 'Unknown error fetching policies');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getSDK]
  );

  // Get all claims for a user
  const getClaimsForUser = useCallback(
    async (userPublicKey: PublicKey): Promise<Claim[] | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const sdk = getSDK();
        const claims = await sdk.getClaimsForUser(userPublicKey);
        
        if (!claims || claims.length === 0) {
          return [];
        }

        // The SDK now returns the correct Claim type, so we don't need to transform
        return claims;
      } catch (err) {
        console.error('Error fetching claims:', err);
        setError(err instanceof Error ? err.message : 'Unknown error fetching claims');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getSDK]
  );

  // Get risk pool metrics
  const getRiskPoolMetrics = useCallback(async (): Promise<RiskPoolMetrics | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const sdk = getSDK();
      const metrics = await sdk.getRiskPoolMetrics();
      
      if (!metrics) {
        return null;
      }

      // The SDK now returns the correct RiskPoolMetrics type
      return metrics;
    } catch (err) {
      console.error('Error fetching risk pool metrics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error fetching risk pool metrics');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getSDK]);

  return {
    createPolicy,
    submitClaim,
    getPoliciesForUser,
    getClaimsForUser,
    getRiskPoolMetrics,
    isLoading,
    error
  };
}
