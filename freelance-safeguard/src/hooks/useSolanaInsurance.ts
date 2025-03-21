import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { FreelanceInsuranceSDK } from '../lib/solana/sdk/freelanceInsurance';
import { NETWORK_CONFIG, parseUSDC, formatUSDC } from '../lib/solana/constants';
import { BN } from '@project-serum/anchor';
import { calculatePremium } from '../lib/insurance/calculations';
import { toast } from 'sonner';
import { PolicyAccountExtended, ClaimAccountExtended, PaymentVerificationExtended, safeToNumber, safeToDate } from '../lib/solana/sdk/types-extension';
import { useUnifiedWallet } from '../lib/solana/UnifiedWalletService';

// Import the calculation types
import type { PremiumCalculationResult } from '../lib/solana/types';

// Define types for policy creation
export enum JobType {
  SOFTWARE_DEVELOPMENT = 'SOFTWARE_DEVELOPMENT',
  DESIGN = 'DESIGN',
  WRITING = 'WRITING',
  MARKETING = 'MARKETING',
  CONSULTING = 'CONSULTING',
  OTHER = 'OTHER',
}

export enum Industry {
  TECHNOLOGY = 'TECHNOLOGY',
  FINANCE = 'FINANCE',
  HEALTHCARE = 'HEALTHCARE',
  EDUCATION = 'EDUCATION',
  RETAIL = 'RETAIL',
  OTHER = 'OTHER',
}

export interface PolicyDetails {
  owner: string | PublicKey;
  coverageAmount: number;
  premiumAmount: number;
  startDate: Date;
  endDate: Date;
  status: string;
  jobType: JobType;
  industry: Industry;
  claimsCount: number;
  projectName?: string;
  clientName?: string;
  description?: string;
}

export interface ClaimDetails {
  policy: string;
  owner: string;
  amount: number;
  status: string;
  evidenceType: string;
  evidenceDescription: string;
  evidenceAttachments: string[];
  submissionDate: Date;
  verdict: {
    approved: boolean;
    reason: string;
    processedAt: Date;
  } | null;
}

export interface PaymentVerificationDetails {
  freelancer: string;
  client: string;
  expectedAmount: number;
  deadline: Date;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
}

export interface RiskPoolMetrics {
  totalCapital: number;
  totalPolicies: number;
  totalClaims: number;
  totalPremiums: number;
  totalPayouts: number;
  reserveRatio: number;
  claimsCount: number;
  lastUpdated: Date;
  // Add missing properties used in AIPremiumSimulator
  totalStaked?: number;
  totalCoverage?: number;
}

export interface PolicyCreationParams {
  coverageAmount: number;
  coveragePeriod: number;
  jobType: string;
  industry: string;
  projectName: string;
  clientName: string;
  description: string;
}

export const useSolanaInsurance = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const [walletInfo, walletActions] = useUnifiedWallet();

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<Error | null>(null);
  const [sdk, setSDK] = useState<FreelanceInsuranceSDK | null>(null);
  const [policy, setPolicy] = useState<PolicyDetails | null>(null);
  const [claims, setClaims] = useState<ClaimDetails[]>([]);
  const [riskPoolMetrics, setRiskPoolMetrics] = useState<RiskPoolMetrics | null>(null);
  const [paymentVerifications, setPaymentVerifications] = useState<PaymentVerificationDetails[]>([]);
  const [policies, setPolicies] = useState<PolicyDetails[]>([]);
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'processing' | 'success' | 'error'>('idle');
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);

  // Initialize SDK when wallet is connected
  useEffect(() => {
    const initialize = async () => {
      try {
        // Only initialize when wallet is connected
        if ((publicKey && connection) || (walletInfo.connected && walletInfo.publicKey)) {
          setIsLoading(true);

          // Create a wallet adapter that works with both standard wallet adapter and our unified wallet
          const wallet = {
            publicKey: publicKey || (walletInfo.publicKey ? new PublicKey(walletInfo.publicKey) : null),
            signTransaction: async (tx: Transaction) => {
              if (signTransaction) {
                return signTransaction(tx);
              } else if (walletActions.signTransaction) {
                return walletActions.signTransaction(tx) || tx;
              }
              throw new Error('No wallet available to sign transaction');
            },
            signAllTransactions: async (txs: Transaction[]) => {
              if (signTransaction) {
                return Promise.all(txs.map(tx => signTransaction(tx)));
              } else if (walletActions.signAllTransactions) {
                return walletActions.signAllTransactions(txs) || txs;
              }
              throw new Error('No wallet available to sign transactions');
            },
          } as any;

          if (wallet.publicKey) {
            const newSDK = new FreelanceInsuranceSDK(connection, wallet);
            setSDK(newSDK);
            await checkProgramInitialization(newSDK);
          }

          setIsLoading(false);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        setInitializationError(error instanceof Error ? error : new Error('Initialization failed'));
        setIsLoading(false);
      }
    };

    initialize();
  }, [publicKey, connection, signTransaction, walletInfo.connected, walletInfo.publicKey, walletActions]);

  // Check if the program is already initialized
  const checkProgramInitialization = async (insuranceSDK: FreelanceInsuranceSDK) => {
    try {
      const metrics = await insuranceSDK.getRiskPoolMetrics();
      setIsInitialized(metrics !== null);
      if (metrics) {
        // Type guard function to check if a value has toNumber method
        const hasToNumber = (value: any): value is { toNumber: () => number } => {
          return value && typeof value.toNumber === 'function';
        };

        // Convert BN values to numbers
        setRiskPoolMetrics({
          totalCapital: hasToNumber(metrics.totalCapital) ? metrics.totalCapital.toNumber() : 0,
          totalPolicies: hasToNumber(metrics.totalPolicies) ? metrics.totalPolicies.toNumber() : 0,
          totalClaims: hasToNumber(metrics.totalClaims) ? metrics.totalClaims.toNumber() : 0,
          totalPremiums: hasToNumber(metrics.totalPremiums) ? metrics.totalPremiums.toNumber() : 0,
          totalPayouts: hasToNumber(metrics.totalPayouts) ? metrics.totalPayouts.toNumber() : 0,
          reserveRatio: hasToNumber(metrics.reserveRatio) ? metrics.reserveRatio.toNumber() / 100 : 0,
          claimsCount: hasToNumber(metrics.claimsCount) ? metrics.claimsCount.toNumber() : 0,
          lastUpdated: new Date(),
        });
      }
    } catch (error) {
      console.error('Error checking program initialization:', error);
      setIsInitialized(false);
    }
  };

  // Initialize the program if not already initialized
  const initializeProgram = async (): Promise<string> => {
    if (!sdk || !publicKey) {
      throw new Error('SDK not initialized or wallet not connected');
    }

    try {
      setIsLoading(true);
      setTransactionStatus('pending');

      // Initialize the program
      const signature = await sdk.initializeProgram();

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      setIsInitialized(true);
      setTransactionStatus('success');
      setTransactionSignature(signature);

      // Refresh metrics
      await refreshRiskPoolMetrics();

      return signature;
    } catch (error) {
      console.error('Error initializing program:', error);
      setTransactionStatus('error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Estimate premium
  const estimatePremium = useCallback(
    (
      coverageAmount: number,
      periodDays: number,
      jobType: JobType,
      industry: Industry
    ): PremiumCalculationResult => {
      try {
        // Default reputation score and claim history for new users
        const reputationScore = 80; // Default good reputation
        const claimHistory = 0; // No claims by default

        // Calculate premium using the calculation function
        const result = calculatePremium({
          coverageAmount,
          periodDays,
          jobType,
          industry,
          reputationScore,
          claimHistory
        });

        return result;
      } catch (error) {
        console.error('Error estimating premium:', error);
        // Return a default premium calculation in case of error
        return {
          premiumUSDC: 10,
          riskScore: 50,
          breakdownFactors: {
            baseRate: 10,
            coverageRatio: 1,
            periodAdjustment: 1,
            riskAdjustment: 1,
            reputationFactor: 1,
            marketConditions: 1
          }
        };
      }
    },
    []
  );

  // Create a new policy
  const createPolicy = async (params: PolicyCreationParams): Promise<string> => {
    if (!sdk || !publicKey) {
      throw new Error('SDK not initialized or wallet not connected');
    }

    try {
      setIsLoading(true);
      setTransactionStatus('pending');

      // Calculate premium
      const premium = estimatePremium(
        params.coverageAmount,
        params.coveragePeriod,
        params.jobType as JobType,
        params.industry as Industry
      );

      // Use the premium in USDC units (convert from decimal USDC to USDC units)
      const premiumUSDCUnits = parseUSDC(premium.premiumUSDC);

      // Create policy transaction with the proper structure
      const signature = await sdk.createPolicy(
        parseUSDC(params.coverageAmount),
        premiumUSDCUnits,
        params.coveragePeriod,
        params.jobType,
        params.industry
      );

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      // Get the policy details
      await refreshPolicy();
      await refreshRiskPoolMetrics();

      setTransactionStatus('success');
      setTransactionSignature(signature);

      toast.success("Policy Created Successfully", {
        description: `Your policy has been created with a premium of ${formatUSDC(premiumUSDCUnits)} USDC.`
      });

      return signature;
    } catch (error) {
      console.error('Error creating policy:', error);
      setTransactionStatus('error');

      toast.error("Policy Creation Failed", {
        description: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Submit a claim
  const submitClaim = async (
    policyId: string,
    amount: number,
    evidenceType: string,
    evidenceDescription: string,
    evidenceAttachments: string[] = []
  ): Promise<void> => {
    if (!sdk || !sdk.wallet.publicKey) {
      setError('SDK or wallet not initialized');
      return;
    }

    try {
      setTransactionStatus('processing');
      setIsLoading(true);

      // Convert the policy ID string to a PublicKey
      const policyPubkey = new PublicKey(policyId);

      // Submit claim transaction with the policy public key
      const signature = await sdk.submitClaim(
        policyPubkey,
        amount,
        evidenceType,
        evidenceDescription,
        evidenceAttachments
      );

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      // Refresh claims
      await refreshClaims();

      setTransactionStatus('success');
      setTransactionSignature(signature);

      return;
    } catch (error) {
      console.error('Error submitting claim:', error);
      setTransactionStatus('error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh policy details
  const refreshPolicy = async (): Promise<void> => {
    if (!sdk || !publicKey) return;

    try {
      const policyData = await sdk.getPolicy(publicKey);

      if (policyData) {
        // Cast the policy data to our extended type
        const policyExtended = policyData as unknown as PolicyAccountExtended;

        setPolicy({
          owner: publicKey,
          coverageAmount: safeToNumber(policyExtended.coverageAmount),
          premiumAmount: safeToNumber(policyExtended.premium),
          startDate: safeToDate(policyExtended.startDate),
          endDate: safeToDate(policyExtended.endDate),
          status: policyExtended.status,
          jobType: policyExtended.jobType as JobType,
          industry: policyExtended.industry as Industry,
          claimsCount: safeToNumber(policyExtended.claimsCount),
          projectName: policyExtended.projectName || '',
          clientName: policyExtended.clientName || '',
          description: policyExtended.description || ''
        });
      }
    } catch (error) {
      console.error('Error refreshing policy:', error);
    }
  };

  // Refresh claims
  const refreshClaims = async (): Promise<void> => {
    if (!sdk || !publicKey) return;

    try {
      const claimsData = await sdk.getClaims(publicKey);

      if (claimsData && claimsData.length > 0) {
        setClaims(claimsData.map(claim => {
          // Cast to our extended type
          const claimExtended = claim as unknown as ClaimAccountExtended;

          return {
            policy: claimExtended.policy.toString(),
            owner: claimExtended.owner.toString(),
            amount: safeToNumber(claimExtended.amount),
            status: claimExtended.status,
            evidenceType: claimExtended.evidenceType,
            evidenceDescription: claimExtended.evidenceDescription,
            evidenceAttachments: claimExtended.evidenceAttachments || [],
            submissionDate: safeToDate(claimExtended.submissionDate),
            verdict: claimExtended.verdict ? {
              approved: claimExtended.verdict.approved,
              reason: claimExtended.verdict.reason,
              processedAt: safeToDate(claimExtended.verdict.processedAt)
            } : null
          };
        }));
      } else {
        setClaims([]);
      }
    } catch (error) {
      console.error('Error refreshing claims:', error);
    }
  };

  // Refresh risk pool metrics
  const refreshRiskPoolMetrics = async (): Promise<void> => {
    if (!sdk) return;

    try {
      const metrics = await sdk.getRiskPoolMetrics();

      if (metrics) {
        // Type guard function to check if a value has toNumber method
        const hasToNumber = (value: any): value is { toNumber: () => number } => {
          return value && typeof value.toNumber === 'function';
        };

        // Convert BN values to numbers
        setRiskPoolMetrics({
          totalCapital: hasToNumber(metrics.totalCapital) ? metrics.totalCapital.toNumber() : 0,
          totalPolicies: hasToNumber(metrics.totalPolicies) ? metrics.totalPolicies.toNumber() : 0,
          totalClaims: hasToNumber(metrics.totalClaims) ? metrics.totalClaims.toNumber() : 0,
          totalPremiums: hasToNumber(metrics.totalPremiums) ? metrics.totalPremiums.toNumber() : 0,
          totalPayouts: hasToNumber(metrics.totalPayouts) ? metrics.totalPayouts.toNumber() : 0,
          reserveRatio: hasToNumber(metrics.reserveRatio) ? metrics.reserveRatio.toNumber() / 100 : 0,
          claimsCount: hasToNumber(metrics.totalClaims) ? metrics.totalClaims.toNumber() : 0,
          lastUpdated: new Date(),
        });
      }
    } catch (error) {
      console.error('Error refreshing risk pool metrics:', error);
    }
  };

  // Refresh payment verifications
  const refreshPaymentVerifications = async (): Promise<void> => {
    if (!sdk || !publicKey) return;

    try {
      const verifications = await sdk.getPaymentVerifications('freelancer');

      if (verifications && verifications.length > 0) {
        const verificationDetails = verifications.map(verification => {
          // Cast to our extended type
          const verificationExtended = verification as unknown as PaymentVerificationExtended;

          return {
            freelancer: verificationExtended.freelancer.toString(),
            client: verificationExtended.client.toString(),
            expectedAmount: safeToNumber(verificationExtended.expectedAmount),
            deadline: safeToDate(verificationExtended.deadline),
            status: verificationExtended.status,
            createdAt: safeToDate(verificationExtended.createdAt),
            paidAt: verificationExtended.paidAt ? safeToDate(verificationExtended.paidAt) : null
          };
        });
        setPaymentVerifications(verificationDetails);
      } else {
        setPaymentVerifications([]);
      }
    } catch (error) {
      console.error('Error refreshing payment verifications:', error);
    }
  };

  // Refresh policies
  const refreshPolicies = async (): Promise<void> => {
    if (!sdk) return;

    try {
      // Since there's no getAllPolicies method in the SDK, we'll just use the current user's policy if available
      if (policy) {
        setPolicies([policy]);
      } else {
        setPolicies([]);
      }
    } catch (error) {
      console.error('Error refreshing policies:', error);
    }
  };

  // Load the user's policies, claims, and risk pool metrics
  useEffect(() => {
    const loadUserData = async () => {
      if (!sdk || !sdk.wallet.publicKey) return;
      
      try {
        setIsLoading(true);
        
        // Get risk pool metrics
        try {
          const metrics = await sdk.getRiskPoolMetrics();
          if (metrics) {
            setRiskPoolMetrics({
              totalCapital: metrics.totalCapital,
              totalPolicies: metrics.totalPolicies,
              totalClaims: metrics.totalClaims,
              totalPremiums: metrics.totalPremiums,
              totalPayouts: metrics.totalPayouts,
              reserveRatio: metrics.reserveRatio,
              claimsCount: metrics.totalClaims, // Use totalClaims as claimsCount
              lastUpdated: new Date(metrics.lastUpdated)
            });
          }
        } catch (error) {
          console.warn('Error loading risk pool metrics:', error);
        }
        
        // Get user's policy
        try {
          if (sdk.wallet.publicKey) {
            const publicKeyObj = new PublicKey(sdk.wallet.publicKey);
            const userPolicy = await sdk.getPolicy(publicKeyObj);
            
            if (userPolicy) {
              // Use type assertion to handle the policy data
              const policy = userPolicy as unknown as {
                owner: PublicKey;
                coverageAmount: BN;
                premiumAmount: BN;
                startDate: BN;
                endDate: BN;
                status: any;
                jobType: string;
                industry: string;
                claimsCount: BN;
                projectName: string;
                clientName: string;
                description: string;
              };
              
              // Convert to policy details format
              const policyDetails: PolicyDetails = {
                owner: policy.owner.toString(),
                coverageAmount: policy.coverageAmount.toNumber() / LAMPORTS_PER_SOL,
                premiumAmount: policy.premiumAmount.toNumber() / LAMPORTS_PER_SOL,
                startDate: new Date(policy.startDate.toNumber() * 1000),
                endDate: new Date(policy.endDate.toNumber() * 1000),
                status: policy.status.active ? 'active' : policy.status.expired ? 'expired' : 'terminated',
                jobType: policy.jobType as JobType,
                industry: policy.industry as Industry,
                claimsCount: policy.claimsCount.toNumber(),
                projectName: policy.projectName,
                clientName: policy.clientName,
                description: policy.description
              };
              setPolicies([policyDetails]);
            } else {
              setPolicies([]);
            }
          }
        } catch (error) {
          console.warn('Error loading policy:', error);
          setPolicies([]);
        }
        
        // Get user's claims
        try {
          if (sdk.wallet.publicKey) {
            const publicKeyObj = new PublicKey(sdk.wallet.publicKey);
            const userClaims = await sdk.getClaims(publicKeyObj);
            
            if (userClaims && userClaims.length > 0) {
              const claimDetails = userClaims.map(claim => {
                // Use type assertion to handle the claim data
                const claimData = claim as unknown as {
                  policy: PublicKey;
                  owner: PublicKey;
                  amount: BN;
                  submissionDate: BN;
                  resolutionDate: BN | null;
                  evidenceType: string;
                  evidenceDescription: string;
                  evidenceAttachments: string[];
                  status: any;
                  verdict: {
                    approved: boolean;
                    reason: string;
                    processedAt: BN;
                  } | null;
                };
                
                return {
                  policy: claimData.policy.toString(),
                  owner: claimData.owner.toString(),
                  amount: claimData.amount.toNumber() / LAMPORTS_PER_SOL,
                  submissionDate: new Date(claimData.submissionDate.toNumber() * 1000),
                  resolutionDate: claimData.resolutionDate ? new Date(claimData.resolutionDate.toNumber() * 1000) : null,
                  evidenceType: claimData.evidenceType,
                  evidenceDescription: claimData.evidenceDescription,
                  evidenceAttachments: claimData.evidenceAttachments,
                  status: claimData.status.pending ? 'pending' : claimData.status.approved ? 'approved' : 'rejected',
                  verdict: claimData.verdict ? {
                    approved: claimData.verdict.approved,
                    reason: claimData.verdict.reason,
                    processedAt: new Date(claimData.verdict.processedAt.toNumber() * 1000)
                  } : null
                };
              });
              setClaims(claimDetails);
            } else {
              setClaims([]);
            }
          }
        } catch (error) {
          console.warn('Error loading claims:', error);
          setClaims([]);
        }
        
        // Get payment verifications
        try {
          const verifications = await sdk.getPaymentVerifications('freelancer');
          
          if (verifications && verifications.length > 0) {
            const verificationDetails = verifications.map(v => {
              // Use type assertion to handle the verification data
              const vData = v as unknown as {
                freelancer: PublicKey;
                client: PublicKey;
                expectedAmount: BN;
                deadline: BN;
                status: any;
                createdAt: BN;
                paidAt: BN | null;
              };
              
              return {
                freelancer: vData.freelancer.toString(),
                client: vData.client.toString(),
                expectedAmount: vData.expectedAmount.toNumber() / LAMPORTS_PER_SOL,
                deadline: new Date(vData.deadline.toNumber() * 1000),
                status: vData.status.pending ? 'pending' : vData.status.paid ? 'paid' : 'missed',
                createdAt: new Date(vData.createdAt.toNumber() * 1000),
                paidAt: vData.paidAt ? new Date(vData.paidAt.toNumber() * 1000) : null
              };
            });
            setPaymentVerifications(verificationDetails);
          } else {
            setPaymentVerifications([]);
          }
        } catch (error) {
          console.warn('Error loading payment verifications:', error);
          setPaymentVerifications([]);
        }
        
      } catch (error) {
        console.error('Error loading user data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only load user data if SDK is initialized with a wallet
    if (sdk && sdk.wallet.publicKey) {
      loadUserData();
    } else {
      // Reset data if no wallet is connected
      setPolicies([]);
      setClaims([]);
      setRiskPoolMetrics(null);
      setPaymentVerifications([]);
    }
  }, [sdk]);

  // Refresh data when SDK is initialized or wallet changes
  useEffect(() => {
    if (sdk && publicKey) {
      refreshAllData();
    }
  }, [sdk, publicKey]);

  // Refresh all data
  const refreshAllData = async (): Promise<void> => {
    if (!sdk || !publicKey) return;

    try {
      setIsLoading(true);
      await Promise.all([
        refreshPolicy(),
        refreshClaims(),
        refreshRiskPoolMetrics(),
        refreshPaymentVerifications(),
        refreshPolicies()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    isInitialized,
    isLoading,
    error,
    initializationError,
    policy,
    claims,
    riskPoolMetrics,
    paymentVerifications,
    policies,
    transactionStatus,
    transactionSignature,

    // Actions
    initializeProgram,
    createPolicy,
    submitClaim,

    // Helpers
    refreshPolicy,
    refreshClaims,
    refreshRiskPoolMetrics,
    refreshPaymentVerifications,
    refreshPolicies,
    refreshAllData,
    estimatePremium,
  };
};
