import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Connection, PublicKey, ConnectionConfig, Commitment, clusterApiUrl } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { NETWORK_CONFIG } from './constants';
import { FreelanceInsuranceSDK } from './sdk/freelanceInsurance';

// Define the context type
interface SolanaContextType {
  connection: Connection | null;
  sdk: FreelanceInsuranceSDK | null;
  isConnecting: boolean;
  error: string | null;
}

// Create the context with default values
const SolanaContext = createContext<SolanaContextType>({
  connection: null,
  sdk: null,
  isConnecting: false,
  error: null,
});

// Hook for using the Solana context
export const useSolana = () => useContext(SolanaContext);

interface SolanaProviderProps {
  children: ReactNode;
}

export const SolanaProvider: React.FC<SolanaProviderProps> = ({ children }) => {
  const wallet = useWallet();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [sdk, setSdk] = useState<FreelanceInsuranceSDK | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize connection when the component mounts
  useEffect(() => {
    try {
      // Use direct devnet endpoint for reliable connection
      const endpoint = clusterApiUrl('devnet');
      
      // Simplify connection config for more reliable startup
      const connectionConfig: ConnectionConfig = {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000 // 60 seconds
      };
      
      const newConnection = new Connection(endpoint, connectionConfig);
      setConnection(newConnection);
      console.log('Solana connection established to:', endpoint);
    } catch (err) {
      console.error('Failed to initialize Solana connection:', err);
      setError('Failed to connect to Solana network');
    }
  }, []);

  // Initialize SDK when wallet is connected and connection is available
  useEffect(() => {
    if (!connection || !wallet.connected || !wallet.publicKey) {
      setSdk(null);
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Create a wallet adapter that matches what our SDK expects
      const walletAdapter = {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      };

      // Initialize the SDK with connection and wallet
      const newSdk = new FreelanceInsuranceSDK(connection, walletAdapter);
      setSdk(newSdk);
      console.log('FreelanceInsurance SDK initialized with wallet:', wallet.publicKey.toString());
    } catch (err) {
      console.error('Failed to initialize FreelanceInsurance SDK:', err);
      setError('Failed to initialize FreelanceInsurance SDK');
    } finally {
      setIsConnecting(false);
    }
  }, [connection, wallet.connected, wallet.publicKey, wallet.signTransaction, wallet.signAllTransactions]);

  // Provide the context values to children
  return (
    <SolanaContext.Provider value={{ connection, sdk, isConnecting, error }}>
      {children}
    </SolanaContext.Provider>
  );
};

export default SolanaProvider;
