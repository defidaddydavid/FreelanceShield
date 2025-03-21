import { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useSolana } from '../SolanaProvider';

interface UserProfile {
  user: PublicKey;
  reputationScore: number;
  completedContracts: number;
  successfulContracts: number;
  disputedContracts: number;
  claimsSubmitted: number;
  claimsApproved: number;
  claimsRejected: number;
  lastUpdated: number;
  bump: number;
  publicKey: PublicKey;
}

interface UseReputationProgramReturn {
  // Profile operations
  createProfile: () => Promise<{ success: boolean; txId?: string; error?: string }>;
  getUserProfile: (userPublicKey?: PublicKey) => Promise<{ profile: UserProfile | null; error?: string }>;
  
  // Reputation operations
  getReputationFactor: (userPublicKey?: PublicKey) => Promise<{ factor: number; error?: string }>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
}

export function useReputationProgram(): UseReputationProgramReturn {
  const { sdk } = useSolana();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a new user profile
  const createProfile = useCallback(async () => {
    if (!sdk) {
      return { success: false, error: 'SDK not initialized' };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Assuming the SDK has a method to create a profile
      // This will need to be implemented in the SDK
      const txId = await sdk.reputationProgram.methods
        .createProfile()
        .accounts({
          user: sdk.wallet.publicKey,
          // Other accounts would be determined by the program
        })
        .rpc();

      return { success: true, txId };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  // Get a user's profile
  const getUserProfile = useCallback(async (userPublicKey?: PublicKey) => {
    if (!sdk) {
      return { profile: null, error: 'SDK not initialized' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const targetPublicKey = userPublicKey || sdk.wallet.publicKey;
      
      // Find the PDA for the user profile
      const [profilePDA] = await PublicKey.findProgramAddress(
        [Buffer.from('user_profile'), targetPublicKey.toBuffer()],
        sdk.reputationProgram.programId
      );

      // Fetch the profile data
      const profileAccount = await sdk.reputationProgram.account.userProfile.fetch(profilePDA);
      
      // Transform the account data into our UserProfile type
      const profile: UserProfile = {
        ...profileAccount,
        publicKey: profilePDA
      };

      return { profile };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { profile: null, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  // Get a user's reputation factor (normalized score for premium calculation)
  const getReputationFactor = useCallback(async (userPublicKey?: PublicKey) => {
    if (!sdk) {
      return { factor: 1.0, error: 'SDK not initialized' }; // Default to neutral factor
    }

    setIsLoading(true);
    setError(null);

    try {
      const targetPublicKey = userPublicKey || sdk.wallet.publicKey;
      
      // Try to get the user profile
      const { profile, error } = await getUserProfile(targetPublicKey);
      
      if (error || !profile) {
        // If no profile exists, return the default factor (neutral)
        return { factor: 1.0 };
      }
      
      // Calculate reputation factor based on profile data
      // This is a simplified calculation - the actual implementation
      // might be more complex based on business requirements
      const successRate = profile.completedContracts > 0 
        ? profile.successfulContracts / profile.completedContracts 
        : 0.5; // Default to neutral if no contracts
        
      const claimApprovalRate = profile.claimsSubmitted > 0
        ? profile.claimsApproved / profile.claimsSubmitted
        : 0.5; // Default to neutral if no claims
      
      // Combine factors (weighted average)
      // 60% weight on success rate, 40% on claim approval
      const combinedScore = (successRate * 0.6) + (claimApprovalRate * 0.4);
      
      // Map to the range defined in constants (MIN_REPUTATION_FACTOR to MAX_REPUTATION_FACTOR)
      // Assuming these are imported from constants.ts
      const MIN_REPUTATION_FACTOR = 0.7;
      const MAX_REPUTATION_FACTOR = 1.0;
      
      const factor = MIN_REPUTATION_FACTOR + 
        (combinedScore * (MAX_REPUTATION_FACTOR - MIN_REPUTATION_FACTOR));
      
      return { factor };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { factor: 1.0, error: errorMessage }; // Default to neutral factor on error
    } finally {
      setIsLoading(false);
    }
  }, [sdk, getUserProfile]);

  return {
    createProfile,
    getUserProfile,
    getReputationFactor,
    isLoading,
    error,
  };
}
