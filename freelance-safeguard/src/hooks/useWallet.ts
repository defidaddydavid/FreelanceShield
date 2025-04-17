import { usePrivyAuth } from './usePrivyAuth';
import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';

/**
 * Custom hook that adapts Privy wallet to Solana wallet interface
 * This provides compatibility with existing Solana code
 */
export const useWallet = () => {
  const privyAuth = usePrivyAuth();
  
  // Create a compatible wallet interface
  const wallet = useMemo(() => {
    const solanaWallet = privyAuth.solanaWallet;
    const walletAddress = solanaWallet?.address || '';
    
    // Create a PublicKey if we have a wallet address
    const publicKey = walletAddress ? new PublicKey(walletAddress) : null;
    
    return {
      // Connection state
      connected: !!solanaWallet,
      connecting: false,
      disconnecting: false,
      
      // Wallet data
      publicKey,
      walletAddress,
      
      // Methods
      connect: privyAuth.loginWithWallet,
      disconnect: privyAuth.logout,
      
      // Original privy auth for advanced usage
      privyAuth
    };
  }, [privyAuth]);
  
  return wallet;
};

export default useWallet;
