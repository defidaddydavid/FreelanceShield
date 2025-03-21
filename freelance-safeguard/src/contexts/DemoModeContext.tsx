// This file has been deprecated and is no longer used.
// The application now exclusively uses real Solana blockchain connections.
// This file is kept as a placeholder to prevent import errors until all references are removed.

import React, { createContext, useContext, ReactNode } from 'react';

// Simplified context with only the necessary properties to prevent errors
type DemoModeContextType = {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  isWalletConnected: boolean;
  networkName: string;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  shouldShowWalletPrompt: boolean;
};

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

// Simplified provider that always returns isDemoMode as false
export const DemoModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Always connected to real Solana blockchain
  return (
    <DemoModeContext.Provider value={{ 
      isDemoMode: false, 
      toggleDemoMode: () => {},
      isWalletConnected: true,
      networkName: "Solana Devnet",
      enableDemoMode: () => {},
      disableDemoMode: () => {},
      shouldShowWalletPrompt: false
    }}>
      {children}
    </DemoModeContext.Provider>
  );
};

export const useDemoMode = (): DemoModeContextType => {
  const context = useContext(DemoModeContext);
  if (context === undefined) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};
