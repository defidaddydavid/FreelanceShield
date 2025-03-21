import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, sendAndConfirmTransaction, Keypair, SystemProgram } from '@solana/web3.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RiskPoolManager } from '@/lib/insurance/riskPool';
import { ClaimsProcessor } from '@/lib/insurance/claimsProcessor';
import { NETWORK_CONFIG, INSURANCE_PROGRAM_ID, RISK_POOL_PROGRAM_ID } from '@/lib/solana/constants';
import { toast } from 'sonner';

// Use the program IDs from the constants
const RISK_POOL_ADDRESS = new PublicKey(NETWORK_CONFIG.programIds.riskPoolAddress);
const YIELD_POOL_ADDRESS = new PublicKey(NETWORK_CONFIG.programIds.yieldPoolAddress);

export function useClaimsAndPool() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const queryClient = useQueryClient();

  // Initialize managers
  const riskPoolManager = new RiskPoolManager(
    connection,
    RISK_POOL_PROGRAM_ID
  );

  const claimsProcessor = new ClaimsProcessor(
    connection,
    INSURANCE_PROGRAM_ID,
    riskPoolManager
  );

  // Ensure user has enough SOL for transactions
  const ensureTransactionBalance = async () => {
    if (!publicKey) return false;
    
    try {
      // Check if user has enough SOL for transaction fees
      const balance = await connection.getBalance(publicKey);
      const minimumBalance = 0.05 * NETWORK_CONFIG.lamportsPerSol; // 0.05 SOL for transaction fees
      
      if (balance < minimumBalance) {
        toast.error("Insufficient SOL for transaction fees", {
          description: "Please ensure you have enough SOL to cover transaction fees."
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  };

  // Query pool metrics
  const poolMetrics = useQuery({
    queryKey: ['poolMetrics'],
    queryFn: () => riskPoolManager.getPoolMetrics(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Query user's staking position
  const stakingPosition = useQuery({
    queryKey: ['stakingPosition', publicKey?.toBase58()],
    queryFn: () => publicKey ? riskPoolManager.getStakingPosition(publicKey) : null,
    enabled: !!publicKey,
    refetchInterval: 60000, // Refresh every minute
  });

  // Submit claim mutation
  const submitClaim = useMutation({
    mutationFn: async ({
      policyId,
      amount,
      evidence
    }: {
      policyId: PublicKey;
      amount: number;
      evidence: {
        type: 'PAYMENT_BREACH' | 'CONTRACT_VIOLATION' | 'EQUIPMENT_DAMAGE';
        description: string;
        attachments: string[];
      };
    }) => {
      if (!publicKey || !signTransaction) throw new Error('Wallet not connected');

      // Ensure user has enough SOL for transaction fees
      await ensureTransactionBalance();

      // Generate a deterministic claim ID based on policy and timestamp
      const claimSeed = Buffer.from(`claim-${Date.now()}`);
      const [claimId] = await PublicKey.findProgramAddress(
        [publicKey.toBuffer(), policyId.toBuffer(), claimSeed],
        INSURANCE_PROGRAM_ID
      );

      // Get claim processing instruction
      const claimInstruction = await claimsProcessor.getClaimInstruction(
        policyId,
        claimId,
        amount,
        {
          ...evidence,
          timestamp: Date.now(),
        }
      );

      // Create and sign transaction
      const transaction = new Transaction().add(claimInstruction);
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;

      try {
        // Sign and send transaction
        const signedTransaction = await signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        
        // Wait for confirmation
        await connection.confirmTransaction({
          signature,
          ...latestBlockhash
        });

        // Refresh claims data
        queryClient.invalidateQueries({ queryKey: ['claims'] });
        
        toast.success("Claim Submitted", {
          description: `Your claim has been submitted successfully. Transaction: ${signature.slice(0, 8)}...`,
        });

        // Return the claim verdict from the processor
        return claimsProcessor.getClaimStatus(claimId);
      } catch (error) {
        console.error('Error submitting claim transaction:', error);
        toast.error("Claim Submission Failed", {
          description: `Error: ${error.message}`
        });
        throw error;
      }
    }
  });

  // Submit arbitration vote mutation
  const submitArbitrationVote = useMutation({
    mutationFn: async ({
      claimId,
      vote,
      comments
    }: {
      claimId: PublicKey;
      vote: boolean;
      comments: string;
    }) => {
      if (!publicKey || !signTransaction) throw new Error('Wallet not connected');

      // Ensure user has enough SOL for transaction fees
      await ensureTransactionBalance();

      // Get arbitration vote instruction
      const voteInstruction = await claimsProcessor.submitArbitrationVote(
        publicKey,
        claimId,
        vote,
        comments
      );

      // Create and sign transaction
      const transaction = new Transaction().add(voteInstruction);
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;

      try {
        // Sign and send transaction
        const signedTransaction = await signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        
        // Wait for confirmation
        await connection.confirmTransaction({
          signature,
          ...latestBlockhash
        });

        // Refresh claim status
        queryClient.invalidateQueries({ queryKey: ['claimStatus', claimId.toBase58()] });
        
        toast.success("Vote Submitted", {
          description: `Your arbitration vote has been submitted successfully.`,
        });

        return { success: true, signature };
      } catch (error) {
        console.error('Error submitting arbitration vote:', error);
        toast.error("Vote Submission Failed", {
          description: `Error: ${error.message}`
        });
        throw error;
      }
    }
  });

  // Query claim status
  const useClaimStatus = (claimId?: PublicKey) => {
    return useQuery({
      queryKey: ['claimStatus', claimId?.toBase58()],
      queryFn: async () => {
        if (!claimId) return null;
        return claimsProcessor.getClaimStatus(claimId);
      },
      enabled: !!claimId,
      refetchInterval: (data: any) => {
        // Refresh more frequently for pending claims or those in arbitration
        return data?.arbitrationRequired ? 15000 : 60000;
      },
    });
  };

  // Calculate required reserves for new policy
  const calculateRequiredReserves = async (coverageAmount: number) => {
    return riskPoolManager.calculateRequiredReserves(coverageAmount);
  };

  return {
    // Pool metrics and staking
    poolMetrics: {
      data: poolMetrics.data,
      isLoading: poolMetrics.isLoading,
      error: poolMetrics.error,
    },
    stakingPosition: {
      data: stakingPosition.data,
      isLoading: stakingPosition.isLoading,
      error: stakingPosition.error,
    },
    // Claims management
    submitClaim: {
      mutate: submitClaim.mutate,
      isLoading: submitClaim.isPending,
      error: submitClaim.error,
    },
    submitArbitrationVote: {
      mutate: submitArbitrationVote.mutate,
      isLoading: submitArbitrationVote.isPending,
      error: submitArbitrationVote.error,
    },
    useClaimStatus,
    calculateRequiredReserves,
    ensureTransactionBalance,
  };
}
