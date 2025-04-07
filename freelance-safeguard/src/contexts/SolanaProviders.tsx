import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  SlopeWalletAdapter,
  CoinbaseWalletAdapter,
  BraveWalletAdapter
  // BackpackWalletAdapter is not exported from this package
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { SolanaThemeProvider } from './SolanaThemeProvider';
import { NETWORK_CONFIG } from '@/lib/solana/constants';

// Import required CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const SolanaProviders: FC<Props> = ({ children }) => {
  // Set up network and endpoint
  const network = NETWORK_CONFIG.network || 'devnet';
  const endpoint = useMemo(() => {
    return NETWORK_CONFIG.rpcEndpoint || clusterApiUrl(network);
  }, [network]);

  // Set up wallet adapters
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
    new LedgerWalletAdapter()
  ], []);

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
