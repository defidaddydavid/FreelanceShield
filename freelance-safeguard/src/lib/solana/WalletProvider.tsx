import { FC, ReactNode, useMemo, useEffect } from 'react';
import { ConnectionProvider, WalletProvider as WalletProviderBase } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter, 
  SolflareWalletAdapter,
  GlowWalletAdapter,
  BackpackWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { toast } from 'sonner';

// Import Solana wallet styles
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletProvider: FC<Props> = ({ children }) => {
  const endpoint = process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl('mainnet-beta');
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new GlowWalletAdapter(),
      new BackpackWalletAdapter()
    ],
    []
  );

  // Set up global error handler for wallet-related errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (
        event.error?.message?.includes('Cannot read properties of null') ||
        event.error?.message?.includes('wallet adapter') ||
        event.error?.message?.includes('solana') ||
        event.error?.message?.includes('phantom')
      ) {
        console.warn('Intercepted wallet error:', event.error.message);
        event.preventDefault();
        event.stopPropagation();
        toast.error('Wallet connection issue. Try refreshing the page.');
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProviderBase wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProviderBase>
    </ConnectionProvider>
  );
};
