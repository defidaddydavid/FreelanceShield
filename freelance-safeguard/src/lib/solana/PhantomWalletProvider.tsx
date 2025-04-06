import React, { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import { NETWORK_CONFIG } from './constants';
import { SolanaProvider } from './SolanaProvider';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Add Phantom wallet to the window type
declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom?: boolean;
        connect: () => Promise<{ publicKey: string }>;
        disconnect: () => Promise<void>;
      };
    };
  }
}

type PhantomWalletProviderProps = {
  children: ReactNode;
};

// Custom hook for using Phantom wallet
export const usePhantomWallet = () => {
  const wallet = useWallet();
  const [isPhantom, setIsPhantom] = useState(false);
  
  useEffect(() => {
    // Check if the connected wallet is Phantom
    if (wallet.wallet?.adapter) {
      setIsPhantom(wallet.wallet.adapter.name === 'Phantom');
    } else {
      setIsPhantom(false);
    }
  }, [wallet.wallet, wallet.connected]);
  
  return {
    ...wallet,
    isPhantom,
    isPhantomAvailable: typeof window !== 'undefined' && 
      window.phantom !== undefined
  };
};

export const PhantomWalletProvider: FC<PhantomWalletProviderProps> = ({ children }) => {
  // Use Devnet endpoint directly from clusterApiUrl for reliable connection
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
  
  // Create wallet adapters
  const wallets = useMemo(() => {
    try {
      return [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        new BackpackWalletAdapter()
      ];
    } catch (error) {
      console.error('Error initializing wallet adapters:', error);
      return [];
    }
  }, []);

  // Enhanced global error handler for wallet-related errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Check if the error is related to wallet adapters or ethereum
      if (
        event.error?.message?.includes('Cannot read properties of null') ||
        event.error?.message?.includes('wallet adapter') ||
        event.error?.message?.includes('solana') ||
        event.error?.message?.includes('phantom') ||
        event.error?.message?.includes('ethereum') ||
        event.error?.message?.includes('property') ||
        event.error?.message?.includes('type')
      ) {
        console.warn('Intercepted wallet/ethereum error:', event.error.message);
        // Prevent the error from crashing the app
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('error', handleError, { capture: true });
    
    return () => {
      window.removeEventListener('error', handleError, { capture: true });
    };
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          <SolanaProvider>
            {children}
          </SolanaProvider>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
