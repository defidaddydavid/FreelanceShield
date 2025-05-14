import React, { ReactNode, useMemo, createContext, useContext } from 'react';
import { Connection, clusterApiUrl, Commitment } from '@solana/web3.js';
import { NETWORK_CONFIG } from './constants';

// Create a context for the Solana connection
interface SolanaConnectionContextType {
  connection: Connection;
}

const SolanaConnectionContext = createContext<SolanaConnectionContextType | null>(null);

// Hook to use the Solana connection
export const useSolanaConnection = () => {
  const context = useContext(SolanaConnectionContext);
  if (!context) {
    throw new Error('useSolanaConnection must be used within a SolanaConnectionProvider');
  }
  return context.connection;
};

interface WalletAdapterProviderProps {
  children: ReactNode;
}

/**
 * Simplified WalletAdapterProvider that only provides the Solana connection
 * without any wallet adapter dependencies, since we're using Privy for wallet management
 */
export const WalletAdapterProvider: React.FC<WalletAdapterProviderProps> = ({ children }) => {
  // Create a connection to the Solana network
  const connection = useMemo(() => {
    const endpoint = NETWORK_CONFIG.endpoint || clusterApiUrl('devnet');
    return new Connection(endpoint, {
      commitment: NETWORK_CONFIG.connectionConfig.commitment as Commitment,
      confirmTransactionInitialTimeout: 60000
    });
  }, []);

  return (
    <SolanaConnectionContext.Provider value={{ connection }}>
      {children}
    </SolanaConnectionContext.Provider>
  );
};

export default WalletAdapterProvider;
