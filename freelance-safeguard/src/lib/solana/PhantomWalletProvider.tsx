import React, { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { Connection } from '@solana/web3.js';
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
  // Set up error handling
  const [walletInitialized, setWalletInitialized] = useState(false);

  // Setup connection to Solana network
  const endpoint = NETWORK_CONFIG.endpoint;
  const connection = useMemo(() => new Connection(endpoint, 'confirmed'), [endpoint]);

  // Create wallet adapters with error handling
  const wallets = useMemo(() => {
    try {
      // Safely initialize wallet adapters
      const adapters = [];
      
      // Only add adapters that successfully initialize
      try {
        adapters.push(new PhantomWalletAdapter());
      } catch (e) {
        console.warn('Failed to initialize Phantom wallet:', e);
      }
      
      try {
        adapters.push(new SolflareWalletAdapter());
      } catch (e) {
        console.warn('Failed to initialize Solflare wallet:', e);
      }
      
      try {
        adapters.push(new BackpackWalletAdapter());
      } catch (e) {
        console.warn('Failed to initialize Backpack wallet:', e);
      }
      
      setWalletInitialized(true);
      return adapters;
    } catch (error) {
      console.error('Error initializing wallet adapters:', error);
      setWalletInitialized(false);
      return [];
    }
  }, []);

  // Global error handler for wallet-related errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Prevent wallet adapter initialization errors from crashing the app
      if (event.error?.message?.includes('Cannot read properties of null') ||
          event.error?.message?.includes('wallet adapter')) {
        console.warn('Intercepted wallet adapter error:', event.error.message);
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <SolanaProvider>
            {children}
          </SolanaProvider>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
