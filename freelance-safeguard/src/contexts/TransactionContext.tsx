import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
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
  const { signTransaction, signAllTransactions, publicKey } = useWallet();
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

      // Real transaction signing
      if (pendingTransaction.isBatch) {
        // Handle batch of transactions
        if (!signAllTransactions) {
          toast.error('Wallet does not support signing multiple transactions');
          setIsTransactionDialogOpen(false);
          pendingTransaction.resolve(null);
          return;
        }

        const transactions = pendingTransaction.transaction as Transaction[];
        const signedTransactions = await signAllTransactions(transactions);
        
        const signatures: string[] = [];
        for (const signedTx of signedTransactions) {
          const sig = await pendingTransaction.connection.sendRawTransaction(
            signedTx.serialize(),
            pendingTransaction.options
          );
          signatures.push(sig);
          
          // Wait for confirmation if needed
          if (pendingTransaction.options?.preflightCommitment) {
            await pendingTransaction.connection.confirmTransaction(sig, pendingTransaction.options.preflightCommitment);
          }
        }
        
        signature = signatures;
      } else {
        // Handle single transaction
        if (!signTransaction) {
          toast.error('Wallet does not support transaction signing');
          setIsTransactionDialogOpen(false);
          pendingTransaction.resolve(null);
          return;
        }

        const transaction = pendingTransaction.transaction as Transaction;
        const signedTransaction = await signTransaction(transaction);
        
        signature = await pendingTransaction.connection.sendRawTransaction(
          signedTransaction.serialize(),
          pendingTransaction.options
        );
        
        // Wait for confirmation if needed
        if (pendingTransaction.options?.preflightCommitment) {
          await pendingTransaction.connection.confirmTransaction(signature, pendingTransaction.options.preflightCommitment);
        }
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
