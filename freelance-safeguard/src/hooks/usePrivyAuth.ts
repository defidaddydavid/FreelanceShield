import { usePrivy } from '@privy-io/react-auth';
import { useCallback } from 'react';

/**
 * Custom hook for Privy authentication that provides simplified access to auth state and methods
 */
export const usePrivyAuth = () => {
  const privy = usePrivy();
  
  // Check if user is authenticated
  const isAuthenticated = privy.authenticated;
  
  // Get user data
  const user = privy.user;
  
  // Login methods
  const login = useCallback(() => {
    privy.login();
  }, [privy]);
  
  const loginWithEmail = useCallback((email: string) => {
    // Use standard login and let Privy UI handle the email input
    privy.login();
  }, [privy]);
  
  const loginWithWallet = useCallback(() => {
    // Use standard login and let Privy UI handle wallet selection
    privy.login();
  }, [privy]);
  
  // Logout method
  const logout = useCallback(() => {
    privy.logout();
  }, [privy]);
  
  // Get wallet information from the user object
  const wallets = user?.linkedAccounts?.filter(account => 
    account.type === 'wallet'
  ) || [];
  
  // Get connected wallets
  const connectedWallets = wallets || [];
  
  // Get the active wallet (first one)
  const activeWallet = connectedWallets[0];
  
  // Get Solana wallet if available
  const solanaWallet = connectedWallets.find(wallet => 
    wallet.walletClientType === 'solana'
  );
  
  // Connect wallet - this is a placeholder as Privy handles wallet connections
  const connectWallet = useCallback(() => {
    // In Privy, you use the login method to connect wallets
    privy.login();
  }, [privy]);
  
  return {
    isAuthenticated,
    user,
    login,
    loginWithEmail,
    loginWithWallet,
    logout,
    wallets,
    connectedWallets,
    activeWallet,
    solanaWallet,
    connectWallet,
    ready: privy.ready,
    // Expose the original privy object for advanced usage
    privy
  };
};

export default usePrivyAuth;
