import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUnifiedWallet, WalletType, UnifiedWalletInfo, UnifiedWalletActions } from '../../lib/solana/UnifiedWalletService';

// Context type definition
interface WalletIntegrationContextType {
  walletInfo: UnifiedWalletInfo;
  walletActions: UnifiedWalletActions & {
    connect: (walletType: WalletType) => Promise<boolean>;
  };
  isProcessing: boolean;
}

// Create context with default values
const WalletIntegrationContext = createContext<WalletIntegrationContextType | undefined>(undefined);

// Provider component
export const WalletIntegrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletInfo, walletActions] = useUnifiedWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Enhanced wallet actions with processing state management
  const enhancedWalletActions = {
    ...walletActions,
    connect: async (walletType: WalletType) => {
      setIsProcessing(true);
      try {
        const result = await walletActions.connect(walletType);
        return result;
      } finally {
        setIsProcessing(false);
      }
    },
    disconnect: async () => {
      setIsProcessing(true);
      try {
        await walletActions.disconnect();
      } finally {
        setIsProcessing(false);
      }
    },
    refreshBalance: async () => {
      setIsProcessing(true);
      try {
        return await walletActions.refreshBalance();
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  return (
    <WalletIntegrationContext.Provider 
      value={{ 
        walletInfo, 
        walletActions: enhancedWalletActions,
        isProcessing
      }}
    >
      {children}
    </WalletIntegrationContext.Provider>
  );
};

// Custom hook to use the wallet integration context
export const useWalletIntegrationContext = () => {
  const context = useContext(WalletIntegrationContext);
  if (context === undefined) {
    throw new Error('useWalletIntegrationContext must be used within a WalletIntegrationProvider');
  }
  return context;
};
