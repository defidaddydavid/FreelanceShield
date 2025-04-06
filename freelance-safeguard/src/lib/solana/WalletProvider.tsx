import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as WalletProviderBase } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { toast } from 'sonner';

// Import Solana wallet styles
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletProvider: FC<Props> = ({ children }) => {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  // Set up global error handler for wallet-related errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Check if the error is related to wallet adapters
      if (
        event.error?.message?.includes('Cannot read properties of null') ||
        event.error?.message?.includes('wallet adapter') ||
        event.error?.message?.includes('solana') ||
        event.error?.message?.includes('phantom')
      ) {
        console.warn('Intercepted wallet error:', event.error.message);
        // Prevent the error from crashing the app
        event.preventDefault();
        event.stopPropagation();
        
        // Optionally show a user-friendly error
        toast.error('Wallet connection issue. Try refreshing the page.');
      }
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <ConnectionProvider endpoint={clusterApiUrl('mainnet-beta')}>
      <WalletProviderBase wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProviderBase>
    </ConnectionProvider>
  );
};
