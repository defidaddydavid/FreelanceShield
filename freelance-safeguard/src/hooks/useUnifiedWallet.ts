import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { walletService, WalletInfo, WalletStatus } from '../lib/solana/UnifiedWalletService';
import { toast } from 'sonner';

// Define wallet types for Privy integration
export type WalletType = 'privy' | 'phantom-adapter' | 'solflare' | 'other' | 'ledger' | 'torus';

/**
 * Custom hook to use the UnifiedWalletService with Privy
 */
export const useUnifiedWallet = () => {
  const { user, authenticated, ready, login, logout } = usePrivy();
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [walletStatus, setWalletStatus] = useState<WalletStatus>({
    isConnected: false,
    isReady: false,
    hasError: false
  });
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize wallet when Privy user changes
  useEffect(() => {
    const initializeWallet = async () => {
      if (!ready) return;
      
      setIsInitializing(true);
      
      try {
        if (authenticated && user) {
          const success = await walletService.initializeFromPrivyUser(user);
          if (success) {
            setWalletInfo(walletService.getWalletInfo());
            setWalletStatus(walletService.getStatus());
          } else {
            setWalletInfo(null);
            setWalletStatus({
              isConnected: false,
              isReady: true,
              hasError: false
            });
          }
        } else {
          setWalletInfo(null);
          setWalletStatus({
            isConnected: false,
            isReady: ready,
            hasError: false
          });
        }
      } catch (error) {
        console.error('Error initializing wallet:', error);
        setWalletStatus({
          isConnected: false,
          isReady: true,
          hasError: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error initializing wallet'
        });
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeWallet();
  }, [user, authenticated, ready]);

  // Connect wallet
  const connect = useCallback(async (walletType: WalletType) => {
    try {
      // For Privy integration, we use the Privy login flow
      login();
      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
      return false;
    }
  }, [login]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      // For Privy integration, we use the Privy logout flow
      logout();
      return true;
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
      return false;
    }
  }, [logout]);

  // Refresh wallet balance
  const refreshBalance = useCallback(async () => {
    if (!walletInfo || !walletStatus.isConnected) {
      return 0;
    }
    
    try {
      const balance = await walletService.fetchBalance();
      setWalletInfo({
        ...walletInfo,
        balance
      });
      return balance;
    } catch (error) {
      console.error('Error refreshing balance:', error);
      toast.error('Failed to refresh balance');
      return walletInfo.balance;
    }
  }, [walletInfo, walletStatus.isConnected]);

  // Request airdrop (devnet only)
  const requestAirdrop = useCallback(async (amount: number = 1) => {
    if (!walletInfo || !walletStatus.isConnected) {
      toast.error('Wallet not connected');
      return null;
    }
    
    try {
      const signature = await walletService.requestAirdrop(amount);
      await refreshBalance();
      return signature;
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      toast.error('Failed to request airdrop');
      return null;
    }
  }, [walletInfo, walletStatus.isConnected, refreshBalance]);

  return {
    walletInfo: {
      ...walletInfo,
      walletType: 'privy' as WalletType // Default to privy for now
    },
    walletStatus,
    isInitializing,
    refreshBalance,
    requestAirdrop,
    walletService,
    // Connection methods
    connect,
    disconnect,
    // Convenience getters
    address: walletInfo?.address || null,
    publicKey: walletInfo?.publicKey || null,
    balance: walletInfo?.balance || 0,
    isConnected: walletStatus.isConnected,
    formatAddress: (address?: string) => walletService.formatAddress(address)
  };
};

export default useUnifiedWallet;
