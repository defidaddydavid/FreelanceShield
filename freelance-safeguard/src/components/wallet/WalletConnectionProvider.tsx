// This file is now obsolete. All wallet logic is handled by Privy.

import React from "react";

interface WalletConnectionProviderProps {
  children: React.ReactNode;
}

export const WalletConnectionProvider: React.FC<WalletConnectionProviderProps> = ({ children }) => {
  return <>{children}</>;
};

export default WalletConnectionProvider;
