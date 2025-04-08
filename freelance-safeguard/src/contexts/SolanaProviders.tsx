import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  LedgerWalletAdapter,
  SlopeWalletAdapter,
  TorusWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { SolanaThemeProvider } from './SolanaThemeProvider';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface SolanaProvidersProps {
  children: ReactNode;
}

export const SolanaProviders: FC<SolanaProvidersProps> = ({ children }) => {
  // Set up network and wallet adapters
  const network = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
  const endpoint = useMemo(() => {
    return import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(network);
  }, [network]);

  // Set up wallet adapters with error handling
  const wallets = useMemo(() => {
    try {
      return [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        new LedgerWalletAdapter(),
        new SlopeWalletAdapter(),
        new TorusWalletAdapter()
      ];
    } catch (error) {
      console.error('Error initializing wallet adapters:', error);
      // Return at least the most common adapters
      return [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter()
      ];
    }
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: 'confirmed' }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SolanaThemeProvider>
            {children}
          </SolanaThemeProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// Export the useSolanaTheme hook for easy access
export { useSolanaTheme } from './SolanaThemeProvider';
