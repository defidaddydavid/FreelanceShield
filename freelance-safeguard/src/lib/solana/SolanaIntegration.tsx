import React, { ReactNode } from 'react';
import { WalletAdapterProvider } from './WalletAdapterProvider';
import { SolanaProvider } from './SolanaProvider';

interface SolanaIntegrationProps {
  children: ReactNode;
}

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
