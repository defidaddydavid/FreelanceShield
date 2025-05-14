import { usePrivy } from '@privy-io/react-auth';
import { useCallback, useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';

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
    // Use the standard login method and let Privy handle the email input
    privy.login();
  }, [privy]);
  
  const loginWithWallet = useCallback(() => {
    // Use the standard login method and let Privy handle wallet selection
    privy.login();
  }, [privy]);
  
  // Logout method
  const logout = useCallback(() => {
    privy.logout();
  }, [privy]);
  
  // Get wallet information from the user object
  const wallets = useMemo(() => {
    return user?.linkedAccounts?.filter(account => 
      account.type === 'wallet'
    ) || [];
  }, [user?.linkedAccounts]);
  
  // Get connected wallets
  const connectedWallets = wallets;
  
  // Get the active wallet (first one)
  const activeWallet = connectedWallets[0];
  
  // Get Solana wallet if available
  const solanaWallet = useMemo(() => {
    return connectedWallets.find(wallet => 
      (wallet as any).walletClientType === 'solana'
    );
  }, [connectedWallets]);
  
  // Get Solana public key if available
  const solanaPublicKey = useMemo(() => {
    if (solanaWallet && (solanaWallet as any).address) {
      try {
        return new PublicKey((solanaWallet as any).address);
      } catch (error) {
        console.error('Invalid Solana address:', error);
        return null;
      }
    }
    return null;
  }, [solanaWallet]);
  
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
    solanaPublicKey,
    ready: privy.ready,
    // Expose the original privy object for advanced usage
    privy
  };
};

export default usePrivyAuth;
