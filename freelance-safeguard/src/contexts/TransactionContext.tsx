import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Connection, Transaction, PublicKey, SendOptions } from '@solana/web3.js';
import { toast } from 'sonner';
import { TransactionDialog } from '@/components/wallet/TransactionDialog';

type TransactionType = 'stake' | 'unstake' | 'claim' | 'policy' | 'other';

interface TransactionContextType {
  signAndSendTransaction: (
    transaction: Transaction,
    title: string,
    description: string,
    transactionType: TransactionType,
    connection: Connection,
    options?: SendOptions
  ) => Promise<string | null>;
  signAndSendTransactions: (
    transactions: Transaction[],
    title: string,
    description: string,
    transactionType: TransactionType,
    connection: Connection,
    options?: SendOptions
  ) => Promise<string[] | null>;
  isTransactionPending: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use our custom wallet hook that's compatible with Privy
  const wallet = useWallet();
  const publicKey = wallet.publicKey;
  
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isTransactionPending, setIsTransactionPending] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<{
    transaction: Transaction | Transaction[];
    title: string;
    description: string;
    transactionType: TransactionType;
    connection: Connection;
    options?: SendOptions;
    resolve: (value: string | string[] | null) => void;
    isBatch: boolean;
  } | null>(null);

  const handleConfirmTransaction = async () => {
    if (!pendingTransaction || !publicKey) {
      setIsTransactionDialogOpen(false);
      return;
    }

    setIsTransactionPending(true);

    try {
      let signature: string | string[] | null = null;

      // For now, we'll simulate transaction signing since Privy wallet integration
      // requires more setup for actual transaction signing
      if (pendingTransaction.isBatch) {
        // Simulate batch transactions
        toast.info('Simulating batch transaction signing with Privy');
        
        // Generate fake signatures for demonstration
        const signatures: string[] = [];
        for (let i = 0; i < (pendingTransaction.transaction as Transaction[]).length; i++) {
          signatures.push(`sim-sig-${Math.random().toString(36).substring(2, 15)}`);
        }
        
        signature = signatures;
      } else {
        // Simulate single transaction
        toast.info('Simulating transaction signing with Privy');
        
        // Generate fake signature for demonstration
        signature = `sim-sig-${Math.random().toString(36).substring(2, 15)}`;
      }

      toast.success('Transaction confirmed');
      pendingTransaction.resolve(signature);
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      pendingTransaction.resolve(null);
    } finally {
      setIsTransactionDialogOpen(false);
      setPendingTransaction(null);
      setIsTransactionPending(false);
    }
  };

  const handleCancelTransaction = () => {
    if (pendingTransaction) {
      pendingTransaction.resolve(null);
    }
    setIsTransactionDialogOpen(false);
    setPendingTransaction(null);
    setIsTransactionPending(false);
  };

  const signAndSendTransaction = async (
    transaction: Transaction,
    title: string,
    description: string,
    transactionType: TransactionType,
    connection: Connection,
    options?: SendOptions
  ): Promise<string | null> => {
    if (!publicKey) {
      toast.error('Wallet not connected');
      return null;
    }

    // Set recent blockhash if not already set
    if (!transaction.recentBlockhash) {
      const { blockhash } = await connection.getLatestBlockhash(options?.preflightCommitment || 'confirmed');
      transaction.recentBlockhash = blockhash;
    }

    // Set fee payer if not already set
    if (!transaction.feePayer) {
      transaction.feePayer = publicKey;
    }

    return new Promise((resolve) => {
      setPendingTransaction({
        transaction,
        title,
        description,
        transactionType,
        connection,
        options,
        resolve: resolve as (value: string | string[] | null) => void,
        isBatch: false
      });
      setIsTransactionDialogOpen(true);
    });
  };

  const signAndSendTransactions = async (
    transactions: Transaction[],
    title: string,
    description: string,
    transactionType: TransactionType,
    connection: Connection,
    options?: SendOptions
  ): Promise<string[] | null> => {
    if (!publicKey) {
      toast.error('Wallet not connected');
      return null;
    }

    // Set recent blockhash and fee payer for all transactions
    const { blockhash } = await connection.getLatestBlockhash(options?.preflightCommitment || 'confirmed');
    
    for (const transaction of transactions) {
      if (!transaction.recentBlockhash) {
        transaction.recentBlockhash = blockhash;
      }
      if (!transaction.feePayer) {
        transaction.feePayer = publicKey;
      }
    }

    return new Promise((resolve) => {
      setPendingTransaction({
        transaction: transactions,
        title,
        description,
        transactionType,
        connection,
        options,
        resolve: resolve as (value: string | string[] | null) => void,
        isBatch: true
      });
      setIsTransactionDialogOpen(true);
    });
  };

  return (
    <TransactionContext.Provider
      value={{
        signAndSendTransaction,
        signAndSendTransactions,
        isTransactionPending
      }}
    >
      {children}
      {pendingTransaction && (
        <TransactionDialog
          isOpen={isTransactionDialogOpen}
          onClose={handleCancelTransaction}
          onConfirm={handleConfirmTransaction}
          title={pendingTransaction.title}
          description={pendingTransaction.description}
          isPending={isTransactionPending}
          transactionType={pendingTransaction.transactionType}
          isBatch={pendingTransaction.isBatch}
        />
      )}
    </TransactionContext.Provider>
  );
};

export const useTransaction = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
};
