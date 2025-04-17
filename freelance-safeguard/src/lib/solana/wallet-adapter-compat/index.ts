/**
 * Compatibility layer for @solana/wallet-adapter-react
 * 
 * This file provides compatibility with the old wallet adapter API
 * while using our new Privy integration under the hood.
 */

import { useWallet as usePrivyWallet } from '../../../hooks/useWallet';
import { Connection, PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import React from 'react';

// Re-export the useWallet hook with the same API as @solana/wallet-adapter-react
export const useWallet = () => {
  const wallet = usePrivyWallet();
  
  return {
    publicKey: wallet.publicKey,
    connected: wallet.connected,
    connecting: false,
    disconnecting: false,
    
    // These methods are stubs for now, they will be properly implemented
    // as part of the full migration
    signTransaction: async () => {
      console.warn('signTransaction not fully implemented in Privy migration');
      return null;
    },
    signAllTransactions: async () => {
      console.warn('signAllTransactions not fully implemented in Privy migration');
      return [];
    },
    signMessage: async () => {
      console.warn('signMessage not fully implemented in Privy migration');
      return new Uint8Array();
    },
    
    // Connection methods
    connect: wallet.connect,
    disconnect: wallet.disconnect,
    
    // Wallet adapter properties
    wallet: null,
    adapter: null,
    ready: true,
    wallets: [],
    select: () => {},
  };
};

// Re-export the useConnection hook
export const useConnection = () => {
  // Create a default connection to devnet
  const connection = useMemo(() => {
    return new Connection(
      process.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );
  }, []);
  
  return { connection };
};

// Re-export the useAnchorWallet hook
export const useAnchorWallet = () => {
  const { publicKey } = useWallet();
  
  if (!publicKey) {
    return null;
  }
  
  return {
    publicKey,
    signTransaction: async () => {
      console.warn('signTransaction not fully implemented in Privy migration');
      return null;
    },
    signAllTransactions: async () => {
      console.warn('signAllTransactions not fully implemented in Privy migration');
      return [];
    },
  };
};

// Export a dummy WalletMultiButton component
export const WalletMultiButton = (props: any) => {
  return React.createElement('div', { ...props, className: 'wallet-adapter-button wallet-adapter-button-trigger' }, 'Connect Wallet');
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
