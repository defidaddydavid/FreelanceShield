import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { FreelanceInsuranceSDK } from './freelanceInsurance';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

// Interface for Solana wallet adapter
interface SolanaWallet {
  publicKey: PublicKey | null;
  signTransaction: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>;
  signAllTransactions?: <T extends Transaction | VersionedTransaction>(transactions: T[]) => Promise<T[]>;
}

// Create a context for the SDK
const FreelanceInsuranceSDKContext = createContext<FreelanceInsuranceSDK | null>(null);

interface SDKProviderProps {
  children: ReactNode;
}

/**
 * Provider component for the FreelanceInsurance SDK
 * Initializes the SDK with a real Solana connection and wallet
 */
export function FreelanceInsuranceSDKProvider({ children }: SDKProviderProps) {
  const { connection } = useConnection();
  const wallet = useWallet();

  // Initialize SDK when connection and wallet are available
  const sdk = useMemo(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return null;
    
    // Create SDK even without publicKey for initial app loading
    // The SDK will handle null publicKey cases internally
    try {
      console.log('Initializing FreelanceInsurance SDK with Privy/Solana integration');
      return new FreelanceInsuranceSDK(connection, wallet as SolanaWallet);
    } catch (err) {
      console.error('Error initializing FreelanceInsurance SDK:', err);
      return null;
    }
  }, [connection, wallet]);

  return (
    <FreelanceInsuranceSDKContext.Provider value={sdk}>
      {children}
    </FreelanceInsuranceSDKContext.Provider>
  );
}

/**
 * Hook to access the FreelanceInsurance SDK
 * @returns The SDK instance or null if not initialized
 */
export function useFreelanceInsuranceSDK(): FreelanceInsuranceSDK | null {
  const context = useContext(FreelanceInsuranceSDKContext);
  
  if (context === undefined) {
    throw new Error('useFreelanceInsuranceSDK must be used within a FreelanceInsuranceSDKProvider');
  }
  
  return context;
}
