import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useFreelanceInsurance } from '@/lib/solana/hooks/useFreelanceInsurance';
import { Policy, Claim, RiskPoolMetrics, JobType, Industry } from '@/types/insurance';

export function useInsuranceOperations() {
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    createPolicy: createPolicyOnChain,
    submitClaim: submitClaimOnChain,
    getPoliciesForUser,
    getClaimsForUser,
    getRiskPoolMetrics,
  } = useFreelanceInsurance();

  // Fetch user's policies
  const { 
    data: policies, 
    isLoading: isPoliciesLoading, 
    error: policiesError,
    refetch: refetchPolicies 
  } = useQuery({
    queryKey: ['policies', publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey) return [];
      
      try {
        const result = await getPoliciesForUser(publicKey);
        return result || [];
      } catch (err) {
        console.error('Error fetching policies:', err);
        setError(`Failed to fetch policies: ${err.message}`);
        return []; // Return empty array instead of throwing to prevent UI breakage
      }
    },
    enabled: !!publicKey,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Fetch user's claims
  const { 
    data: claims, 
    isLoading: isClaimsLoading, 
    error: claimsError,
    refetch: refetchClaims 
  } = useQuery({
    queryKey: ['claims', publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey) return [];
      
      try {
        const result = await getClaimsForUser(publicKey);
        return result || [];
      } catch (err) {
        console.error('Error fetching claims:', err);
        setError(`Failed to fetch claims: ${err.message}`);
        return []; // Return empty array instead of throwing to prevent UI breakage
      }
    },
    enabled: !!publicKey,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Fetch risk pool metrics
  const { 
    data: riskPoolMetrics, 
    isLoading: isMetricsLoading, 
    error: metricsError,
    refetch: refetchMetrics 
  } = useQuery({
    queryKey: ['riskPoolMetrics'],
    queryFn: async () => {
      try {
        const result = await getRiskPoolMetrics();
        return result;
      } catch (err) {
        console.error('Error fetching risk pool metrics:', err);
        setError(`Failed to fetch risk pool metrics: ${err.message}`);
        throw err;
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Create policy mutation
  const createPolicyMutation = useMutation({
    mutationFn: async ({
      coverageAmount,
      premiumAmount,
      periodDays,
      jobType,
      industry,
      projectName,
      clientName,
      description,
    }: {
      coverageAmount: number;
      premiumAmount: number;
      periodDays: number;
      jobType: JobType | string;
      industry: Industry | string;
      projectName: string;
      clientName: string;
      description: string;
    }) => {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      setIsLoading(true);
      setError(null);

      try {
        // Convert string enums to their proper types if needed
        const jobTypeValue = typeof jobType === 'string' ? JobType[jobType as keyof typeof JobType] : jobType;
        const industryValue = typeof industry === 'string' ? Industry[industry as keyof typeof Industry] : industry;
        
        const result = await createPolicyOnChain(
          coverageAmount,
          premiumAmount,
          periodDays,
          jobTypeValue,
          industryValue,
          projectName,
          clientName,
          description
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to create policy');
        }

        return result;
      } catch (err) {
        console.error('Error creating policy:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error creating policy';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      toast.success('Policy created successfully!');
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      queryClient.invalidateQueries({ queryKey: ['riskPoolMetrics'] });
    },
    onError: (error) => {
      toast.error(`Failed to create policy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Submit claim mutation
  const submitClaimMutation = useMutation({
    mutationFn: async ({
      policyId,
      amount,
      evidenceType,
      evidenceDescription,
      evidenceAttachments = [],
    }: {
      policyId: string;
      amount: number;
      evidenceType: string;
      evidenceDescription: string;
      evidenceAttachments?: string[];
    }) => {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      setIsLoading(true);
      setError(null);

      try {
        const policyPDA = new PublicKey(policyId);
        
        const result = await submitClaimOnChain(
          policyPDA,
          amount,
          evidenceType,
          evidenceDescription,
          evidenceAttachments
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to submit claim');
        }

        return result;
      } catch (err) {
        console.error('Error submitting claim:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error submitting claim';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      toast.success('Claim submitted successfully!');
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['riskPoolMetrics'] });
    },
    onError: (error) => {
      toast.error(`Failed to submit claim: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Create a policy
  const createPolicy = useCallback(
    async (
      coverageAmount: number,
      premiumAmount: number,
      periodDays: number,
      jobType: JobType | string,
      industry: Industry | string,
      projectName: string,
      clientName: string,
      description: string
    ) => {
      return createPolicyMutation.mutateAsync({
        coverageAmount,
        premiumAmount,
        periodDays,
        jobType,
        industry,
        projectName,
        clientName,
        description,
      });
    },
    [createPolicyMutation]
  );

  // Submit a claim
  const submitClaim = useCallback(
    async (
      policyId: string,
      amount: number,
      evidenceType: string,
      evidenceDescription: string,
      evidenceAttachments: string[] = []
    ) => {
      return submitClaimMutation.mutateAsync({
        policyId,
        amount,
        evidenceType,
        evidenceDescription,
        evidenceAttachments,
      });
    },
    [submitClaimMutation]
  );

  // Refresh all data
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.allSettled([
        refetchPolicies(),
        refetchClaims(),
        refetchMetrics()
      ]);
      
      // Check if any promises were rejected and set an appropriate error
      const errors = [];
      if (policiesError) errors.push(`Policies: ${policiesError}`);
      if (claimsError) errors.push(`Claims: ${claimsError}`);
      if (metricsError) errors.push(`Metrics: ${metricsError}`);
      
      if (errors.length > 0) {
        setError(`Some data could not be refreshed: ${errors.join(', ')}`);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(`Failed to refresh data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [refetchPolicies, refetchClaims, refetchMetrics, policiesError, claimsError, metricsError]);

  return {
    // Data
    policies: policies || [],
    claims: claims || [],
    riskPoolMetrics,
    
    // Operations
    createPolicy,
    submitClaim,
    refreshData,
    
    // Loading states
    isLoading: isLoading || isPoliciesLoading || isClaimsLoading || isMetricsLoading,
    error: error || policiesError || claimsError || metricsError,
  };
}
