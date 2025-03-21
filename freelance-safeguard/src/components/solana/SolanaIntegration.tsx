import React, { ReactNode } from 'react';
import { WalletAdapterProvider } from '../../lib/solana/WalletAdapterProvider';
import { SolanaProvider } from '../../lib/solana/SolanaProvider';

interface SolanaIntegrationProps {
  children: ReactNode;
}

/**
 * SolanaIntegration component that wraps the application with both
 * WalletAdapterProvider and SolanaProvider to enable Solana blockchain
 * interactions throughout the application.
 */
export const SolanaIntegration: React.FC<SolanaIntegrationProps> = ({ children }) => {
  return (
    <WalletAdapterProvider>
      <SolanaProvider>
        {children}
      </SolanaProvider>
    </WalletAdapterProvider>
  );
};

export default SolanaIntegration;
