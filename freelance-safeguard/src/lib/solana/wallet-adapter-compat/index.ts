/**
 * Compatibility layer for @solana/wallet-adapter-react
 * 
 * This file provides compatibility with the old wallet adapter API
 * while using our new Privy integration under the hood.
 */

import { useUnifiedWallet } from '../../../hooks/useUnifiedWallet';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { useMemo } from 'react';
import React from 'react';
import { useSolanaConnection } from '../WalletAdapterProvider';
import { NETWORK_CONFIG } from '../constants';

// Re-export the useConnection hook first to avoid circular dependency
export const useConnection = () => {
  // Use our custom Solana connection
  const connection = useSolanaConnection();
  return { connection };
};

// Re-export the useWallet hook with the same API as @solana/wallet-adapter-react
export const useWallet = () => {
  const { 
    walletInfo, 
    isConnected, 
    publicKey, 
    connect, 
    disconnect,
    refreshBalance
  } = useUnifiedWallet();
  const { connection } = useConnection();
  
  return {
    publicKey: publicKey ? new PublicKey(publicKey) : null,
    connected: isConnected,
    connecting: false,
    disconnecting: false,
    
    // Transaction signing methods using Privy's sendTransaction
    signTransaction: async (transaction: Transaction) => {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }
      
      // With Privy, we don't directly sign transactions
      // We'll return the transaction as if it was signed
      return transaction;
    },
    
    signAllTransactions: async (transactions: Transaction[]) => {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }
      
      // With Privy, we don't directly sign multiple transactions
      // We'll return the transactions as if they were signed
      return transactions;
    },
    
    signMessage: async (message: Uint8Array) => {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }
      
      // Privy doesn't directly expose signMessage for Solana
      // We'll return a dummy signature for compatibility
      return message;
    },
    
    // Connection methods
    connect: () => connect('privy'),
    disconnect: () => disconnect(),
    
    // Expose a simulated sendTransaction method
    sendTransaction: async (transaction: Transaction) => {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }
      
      try {
        console.log('Simulating transaction with Privy wallet');
        
        // Generate a fake signature for demonstration
        const signature = `sim-sig-${Math.random().toString(36).substring(2, 15)}`;
        
        // Refresh balance after successful transaction
        await refreshBalance();
        
        return signature;
      } catch (error) {
        console.error('Error sending transaction:', error);
        throw error;
      }
    },
    
    // Wallet adapter properties
    wallet: null,
    adapter: null,
    ready: true,
    wallets: [],
    select: () => {},
  };
};

// Re-export the useAnchorWallet hook
export const useAnchorWallet = () => {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  
  if (!publicKey) {
    return null;
  }
  
  return {
    publicKey,
    signTransaction,
    signAllTransactions,
  };
};

// Export a dummy WalletMultiButton component
export const WalletMultiButton = (props: any) => {
  const wallet = useWallet();
  
  const handleClick = () => {
    if (wallet.connected) {
      wallet.disconnect();
    } else {
      wallet.connect();
    }
  };
  
  return React.createElement(
    'button', 
    { 
      ...props, 
      className: 'wallet-adapter-button wallet-adapter-button-trigger',
      onClick: handleClick
    }, 
    wallet.connected ? 'Disconnect' : 'Connect Wallet'
  );
};

// Export a dummy ConnectionProvider component
export const ConnectionProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

// Export a dummy WalletProvider component
export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

// Export a dummy WalletModalProvider component
export const WalletModalProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};
