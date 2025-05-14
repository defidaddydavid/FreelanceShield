/**
 * Privy-only wallet adapter compatibility layer
 * 
 * This file provides Privy-based implementations of the Solana wallet adapter interfaces
 * to make the transition to Privy-only authentication smoother.
 */

import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { PublicKey } from '@solana/web3.js';

// Basic wallet interface compatible with existing code
export interface PrivyWalletAdapter {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}

// Wallet adapter hook that uses Privy
export const useWallet = (): PrivyWalletAdapter => {
  const { user, authenticated, ready, login, logout } = usePrivy();
  
  // Extract Solana wallet from Privy user
  // @ts-ignore - Privy typing doesn't explicitly include solana but it's available
  const solanaWallet = (user as any)?.wallet?.solana || null;
  const publicKey = solanaWallet?.publicKey ? new PublicKey(solanaWallet.publicKey) : null;
  
  return {
    publicKey,
    connected: !!authenticated && !!solanaWallet,
    connecting: !ready && !authenticated,
    disconnecting: false,
    connect: async () => {
      if (!authenticated) {
        await login();
      }
    },
    disconnect: async () => {
      if (authenticated) {
        await logout();
      }
    },
    signTransaction: async (transaction: any) => {
      if (!solanaWallet) throw new Error('Wallet not connected');
      // This is a placeholder - would need to implement with Privy's actual methods
      console.warn('signTransaction not fully implemented with Privy');
      return transaction;
    },
    signAllTransactions: async (transactions: any[]) => {
      if (!solanaWallet) throw new Error('Wallet not connected');
      // This is a placeholder - would need to implement with Privy's actual methods
      console.warn('signAllTransactions not fully implemented with Privy');
      return transactions;
    },
    signMessage: async (message: Uint8Array) => {
      if (!solanaWallet) throw new Error('Wallet not connected');
      // This is a placeholder - would need to implement with Privy's actual methods
      console.warn('signMessage not fully implemented with Privy');
      return message;
    }
  };
};

// Connection provider hook
export const useConnection = () => {
  return {
    connection: {
      getBalance: async (publicKey: PublicKey) => {
        console.log('Getting balance for', publicKey.toString());
        return 0; // Placeholder - would need to implement with Privy
      },
      getRecentBlockhash: async () => {
        return { blockhash: '', lastValidBlockHeight: 0 };
      },
      confirmTransaction: async () => {
        return { value: { err: null } };
      }
    }
  };
};

// Anchor wallet hook
export const useAnchorWallet = () => {
  const { publicKey, signTransaction } = useWallet();
  
  if (!publicKey) return null;
  
  return {
    publicKey,
    signTransaction
  };
};

// Constants to match wallet adapter
export const WalletAdapterNetwork = {
  Mainnet: 'mainnet-beta',
  Testnet: 'testnet',
  Devnet: 'devnet',
};

export const WalletReadyState = {
  Installed: 'Installed',
  NotDetected: 'NotDetected',
  Loadable: 'Loadable',
  Unsupported: 'Unsupported',
};

// UI components
export const WalletMultiButton = (props: any) => {
  const { login, authenticated, logout } = usePrivy();
  
  if (!authenticated) {
    return React.createElement(
      'button',
      {
        onClick: () => login(),
        className: `px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 ${props?.className || ''}`,
      },
      'Connect Wallet'
    );
  }
  
  return React.createElement(
    'button',
    {
      onClick: () => logout(),
      className: `px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 ${props?.className || ''}`,
    },
    'Disconnect'
  );
};

// Provider components (no-op since Privy handles this)
export const ConnectionProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

export const WalletModalProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

// Export everything from this file as the default export
export default {
  useWallet,
  useConnection,
  useAnchorWallet,
  WalletAdapterNetwork,
  WalletReadyState,
  WalletMultiButton,
  ConnectionProvider,
  WalletProvider,
  WalletModalProvider
};
