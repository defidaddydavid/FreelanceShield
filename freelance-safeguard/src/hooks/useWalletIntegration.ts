import { useCallback, useEffect, useState } from 'react';
import { useUnifiedWallet } from '../lib/solana/UnifiedWalletService';
import { Transaction, PublicKey, Connection, Commitment } from '@solana/web3.js';
import { NETWORK_CONFIG } from '../lib/solana/constants';
import { toast } from 'sonner';

/**
 * Hook that provides wallet integration functionality for the insurance system
 */
export const useWalletIntegration = () => {
  const [walletInfo, walletActions] = useUnifiedWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Create connection
  const connection = new Connection(
    NETWORK_CONFIG.endpoint,
    { commitment: NETWORK_CONFIG.connectionConfig.commitment as Commitment }
  );
  
  // Check if wallet is ready for transactions
  const isWalletReady = useCallback(() => {
    if (!walletInfo.connected || !walletInfo.publicKey) {
      toast.error('Please connect your wallet to continue');
      return false;
    }
    
    if (walletInfo.balance === null || walletInfo.balance === 0) {
      toast.error('Insufficient balance in your wallet');
      return false;
    }
    
    return true;
  }, [walletInfo.connected, walletInfo.publicKey, walletInfo.balance]);
  
  // Send and confirm transaction
  const sendAndConfirmTransaction = useCallback(async (transaction: Transaction): Promise<string | null> => {
    if (!isWalletReady()) return null;
    
    setIsProcessing(true);
    try {
      // Send transaction
      const signature = await walletActions.sendTransaction(transaction);
      
      if (!signature) {
        throw new Error('Failed to send transaction');
      }
      
      // Confirm transaction
      const confirmation = await connection.confirmTransaction(signature);
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }
      
      // Refresh balance after successful transaction
      await walletActions.refreshBalance();
      
      return signature;
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error('Transaction failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [connection, isWalletReady, walletActions]);
  
  // Create policy transaction
  const createPolicyTransaction = useCallback(async (
    policyParams: {
      coverageAmount: number;
      periodDays: number;
      jobType: string;
      industry: string;
      premiumAmount: number;
    }
  ): Promise<string | null> => {
    if (!isWalletReady() || !walletInfo.publicKey) return null;
    
    setIsProcessing(true);
    try {
      // Create a new transaction
      const transaction = new Transaction();
      
      // Add instructions for policy creation
      // Note: This is a placeholder. The actual implementation would depend on your smart contract
      // and would likely use @solana/spl-token for token transfers and your program's instruction creation
      
      // Example instruction (this would need to be replaced with your actual program instruction):
      /*
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: new PublicKey(walletInfo.publicKey), isSigner: true, isWritable: true },
          { pubkey: RISK_POOL_ADDRESS, isSigner: false, isWritable: true },
          // Add other accounts as needed
        ],
        programId: INSURANCE_PROGRAM_ID,
        data: Buffer.from(...), // Serialized instruction data
      });
      
      transaction.add(instruction);
      */
      
      // Send and confirm the transaction
      return await sendAndConfirmTransaction(transaction);
    } catch (error) {
      console.error('Error creating policy:', error);
      toast.error('Failed to create policy: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isWalletReady, walletInfo.publicKey, sendAndConfirmTransaction]);
  
  // Submit claim transaction
  const submitClaimTransaction = useCallback(async (
    claimParams: {
      policyId: string;
      claimAmount: number;
      reason: string;
      evidence: string;
    }
  ): Promise<string | null> => {
    if (!isWalletReady() || !walletInfo.publicKey) return null;
    
    setIsProcessing(true);
    try {
      // Create a new transaction
      const transaction = new Transaction();
      
      // Add instructions for claim submission
      // Note: This is a placeholder. The actual implementation would depend on your smart contract
      
      // Send and confirm the transaction
      return await sendAndConfirmTransaction(transaction);
    } catch (error) {
      console.error('Error submitting claim:', error);
      toast.error('Failed to submit claim: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isWalletReady, walletInfo.publicKey, sendAndConfirmTransaction]);
  
  // Cancel policy transaction
  const cancelPolicyTransaction = useCallback(async (
    policyId: string
  ): Promise<string | null> => {
    if (!isWalletReady() || !walletInfo.publicKey) return null;
    
    setIsProcessing(true);
    try {
      // Create a new transaction
      const transaction = new Transaction();
      
      // Add instructions for policy cancellation
      // Note: This is a placeholder. The actual implementation would depend on your smart contract
      
      // Send and confirm the transaction
      return await sendAndConfirmTransaction(transaction);
    } catch (error) {
      console.error('Error cancelling policy:', error);
      toast.error('Failed to cancel policy: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isWalletReady, walletInfo.publicKey, sendAndConfirmTransaction]);
  
  // Stake in risk pool transaction
  const stakeInRiskPoolTransaction = useCallback(async (
    amount: number
  ): Promise<string | null> => {
    if (!isWalletReady() || !walletInfo.publicKey) return null;
    
    setIsProcessing(true);
    try {
      // Create a new transaction
      const transaction = new Transaction();
      
      // Add instructions for staking
      // Note: This is a placeholder. The actual implementation would depend on your smart contract
      
      // Send and confirm the transaction
      return await sendAndConfirmTransaction(transaction);
    } catch (error) {
      console.error('Error staking in risk pool:', error);
      toast.error('Failed to stake: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isWalletReady, walletInfo.publicKey, sendAndConfirmTransaction]);
  
  // Unstake from risk pool transaction
  const unstakeFromRiskPoolTransaction = useCallback(async (
    amount: number
  ): Promise<string | null> => {
    if (!isWalletReady() || !walletInfo.publicKey) return null;
    
    setIsProcessing(true);
    try {
      // Create a new transaction
      const transaction = new Transaction();
      
      // Add instructions for unstaking
      // Note: This is a placeholder. The actual implementation would depend on your smart contract
      
      // Send and confirm the transaction
      return await sendAndConfirmTransaction(transaction);
    } catch (error) {
      console.error('Error unstaking from risk pool:', error);
      toast.error('Failed to unstake: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [isWalletReady, walletInfo.publicKey, sendAndConfirmTransaction]);
  
  return {
    // Wallet state
    walletInfo,
    walletActions,
    isProcessing,
    
    // Transaction methods
    createPolicyTransaction,
    submitClaimTransaction,
    cancelPolicyTransaction,
    stakeInRiskPoolTransaction,
    unstakeFromRiskPoolTransaction,
    
    // Utility methods
    isWalletReady,
    sendAndConfirmTransaction,
  };
};
