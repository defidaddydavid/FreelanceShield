import { usePrivyAuth } from './usePrivyAuth';
import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useUnifiedWallet } from './useUnifiedWallet';

/**
 * Custom hook that adapts Privy wallet to Solana wallet interface
 * This provides compatibility with existing Solana code
 */
export const useWallet = () => {
  const privyAuth = usePrivyAuth();
  const privy = usePrivy();
  const { 
    publicKey: unifiedPublicKey, 
    isConnected, 
    connect, 
    disconnect 
  } = useUnifiedWallet();
  
  // Create a compatible wallet interface
  const wallet = useMemo(() => {
    // Get Solana public key from unified wallet
    const publicKey = unifiedPublicKey ? new PublicKey(unifiedPublicKey) : null;
    
    return {
      // Connection state
      connected: isConnected,
      connecting: privy.ready && !privy.authenticated,
      disconnecting: false,
      
      // Wallet data
      publicKey,
      walletAddress: publicKey?.toString() || '',
      
      // Methods
      connect: () => connect('privy'),
      disconnect,
      
      // Original privy auth for advanced usage
      privyAuth
    };
  }, [privyAuth, privy, unifiedPublicKey, isConnected, connect, disconnect]);
  
  return wallet;
};

export default useWallet;
