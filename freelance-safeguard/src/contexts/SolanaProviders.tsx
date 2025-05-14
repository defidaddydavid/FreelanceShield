import { FC, ReactNode } from 'react';
import { SolanaThemeProvider } from './SolanaThemeProvider';
import { PrivyConfig } from './PrivyConfig';
import { WalletAdapterProvider } from '../lib/solana/WalletAdapterProvider';

interface SolanaProvidersProps {
  children: ReactNode;
}

/**
 * SolanaProviders component that wraps the application with all necessary providers
 * for Solana integration with Privy authentication
 */
export const SolanaProviders: FC<SolanaProvidersProps> = ({ children }) => {
  return (
    <PrivyConfig>
      <WalletAdapterProvider>
        <SolanaThemeProvider>
          {children}
        </SolanaThemeProvider>
      </WalletAdapterProvider>
    </PrivyConfig>
  );
};

// Export the useSolanaTheme hook for easy access
export { useSolanaTheme } from './SolanaThemeProvider';
export { useSolanaConnection } from '../lib/solana/WalletAdapterProvider';
