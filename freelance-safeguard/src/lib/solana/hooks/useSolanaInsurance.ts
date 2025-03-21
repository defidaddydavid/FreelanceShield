import { useEffect, useState, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Connection, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { BN } from 'bn.js';
import { toast } from 'sonner';
import { 
  Policy, 
  JobType, 
  Industry, 
  InsuranceState, 
  RiskPoolState, 
  SimulationResult 
} from '../types';
import { NETWORK_CONFIG, RISK_WEIGHTS } from '../constants';
import { calculatePremium } from '../utils/premiumCalculation';

export interface PremiumCalculationParams {
  coverageAmount: number;
  periodDays: number;
  jobType: string;
  industry: string;
  reputationScore?: number;
}

export interface PolicyCreationParams {
  coverageAmount: number;
  periodDays: number;
  jobType: string;
  industry: string;
  projectName?: string;
  clientName?: string;
  description?: string;
}

export function useSolanaInsurance() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, sendTransaction } = wallet;

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Create anchor provider
  const provider = useMemo(() => {
    if (!wallet) return null;
    return new anchor.AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    );
  }, [connection, wallet]);

  // Initialize program clients when available
  const programId = useMemo(() => {
    try {
      return new PublicKey(NETWORK_CONFIG.insuranceProgramId);
    } catch (err) {
      console.error('Invalid program ID:', err);
      return null;
    }
  }, []);

  // Fetch user policies
  const fetchUserPolicies = async () => {
    if (!publicKey || !programId) return [];

    try {
      setIsLoading(true);
      setError(null);
      
      // In a real implementation, this would query the blockchain for policies
      // For now, we'll simulate this with a local fetch
      // This would be replaced with actual program account fetching
      
      // Example of how to fetch program accounts:
      // const accounts = await connection.getProgramAccounts(programId, {
      //   filters: [
      //     { dataSize: 1232 }, // Size of policy account data
      //     { memcmp: { offset: 8, bytes: publicKey.toBase58() } } // Filter by owner
      //   ]
      // });
      
      // Simulate fetching policies from blockchain
      const mockPolicies: Policy[] = [];
      setPolicies(mockPolicies);
      return mockPolicies;
    } catch (err) {
      console.error('Error fetching user policies:', err);
      setError('Failed to fetch policies');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Estimate premium for a policy
  const estimatePremium = (
    coverageAmount: number,
    periodDays: number,
    jobType: string,
    industry: string,
    reputationScore: number = 0.9
  ): number => {
    try {
      // Use the imported calculatePremium utility
      const result = calculatePremium({
        coverageAmount,
        periodDays,
        jobType,
        industry,
        reputationScore
      });
      
      return result.premiumUSDC;
    } catch (err) {
      console.error('Error calculating premium:', err);
      throw new Error('Failed to calculate premium');
    }
  };

  // Create a new policy
  const createPolicy = async (
    coverageAmount: number,
    periodDays: number,
    jobType: string,
    industry: string,
    projectName?: string,
    clientName?: string,
    description?: string
  ) => {
    if (!publicKey || !programId || !sendTransaction) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Calculate premium
      const premium = estimatePremium(coverageAmount, periodDays, jobType, industry);
      
      // Convert premium to lamports (SOL)
      const premiumLamports = Math.ceil(premium * LAMPORTS_PER_SOL);
      
      // Create a transaction to transfer SOL to the program account
      // In a real implementation, this would call the program's create_policy instruction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(NETWORK_CONFIG.riskPoolProgramId),
          lamports: premiumLamports,
        })
      );
      
      // Set recent blockhash and fee payer
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = publicKey;
      
      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed to confirm');
      }
      
      // In a real implementation, we would now fetch the newly created policy
      // For now, we'll simulate this by refreshing the policies list
      await fetchUserPolicies();
      
      toast.success('Policy created successfully', {
        description: `Transaction signature: ${signature}`,
      });
      
      return signature;
    } catch (err: any) {
      console.error('Error creating policy:', err);
      setError('Failed to create policy: ' + (err.message || 'Unknown error'));
      toast.error('Failed to create policy', {
        description: err.message || 'Unknown error occurred',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel a policy
  const cancelPolicy = async (policyAddress: string) => {
    if (!publicKey || !programId || !sendTransaction) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // In a real implementation, this would call the program's cancel_policy instruction
      // For now, we'll simulate this with a transaction
      const policyPublicKey = new PublicKey(policyAddress);
      
      // Create a transaction (this is a placeholder - real implementation would use program instructions)
      const transaction = new Transaction();
      
      // Set recent blockhash and fee payer
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = publicKey;
      
      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Refresh policies
      await fetchUserPolicies();
      
      toast.success('Policy cancelled successfully', {
        description: `Transaction signature: ${signature}`,
      });
      
      return signature;
    } catch (err: any) {
      console.error('Error cancelling policy:', err);
      setError('Failed to cancel policy: ' + (err.message || 'Unknown error'));
      toast.error('Failed to cancel policy', {
        description: err.message || 'Unknown error occurred',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Submit a claim
  const submitClaim = async (
    policyAddress: string,
    claimAmount: number,
    reason: string,
    evidence: string
  ) => {
    if (!publicKey || !programId || !sendTransaction) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // In a real implementation, this would call the program's submit_claim instruction
      // For now, we'll simulate this with a transaction
      const policyPublicKey = new PublicKey(policyAddress);
      
      // Create a transaction (this is a placeholder - real implementation would use program instructions)
      const transaction = new Transaction();
      
      // Set recent blockhash and fee payer
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      transaction.feePayer = publicKey;
      
      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('Claim submitted successfully', {
        description: `Transaction signature: ${signature}`,
      });
      
      return signature;
    } catch (err: any) {
      console.error('Error submitting claim:', err);
      setError('Failed to submit claim: ' + (err.message || 'Unknown error'));
      toast.error('Failed to submit claim', {
        description: err.message || 'Unknown error occurred',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    if (publicKey) {
      fetchUserPolicies();
    }
  }, [publicKey, connection]);

  return {
    policies,
    isLoading,
    error,
    estimatePremium,
    createPolicy,
    cancelPolicy,
    submitClaim,
    fetchUserPolicies,
  };
}
