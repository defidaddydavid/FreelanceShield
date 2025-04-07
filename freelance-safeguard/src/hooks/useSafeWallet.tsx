import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";

/**
 * Custom hook for safely accessing wallet properties with proper null checks
 * and lifecycle management to prevent "Cannot read properties of null" errors
 */
export function useSafeWallet() {
  const wallet = useWallet();
  const [mounted, setMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  // Handle component mounting to prevent hydration mismatches
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Check wallet readiness after component is mounted
  useEffect(() => {
    if (!mounted) return;
    
    const checkWalletReadiness = () => {
      // Only proceed if wallet adapter exists
      if (wallet?.adapter) {
        const ready = 
          wallet.adapter.readyState === WalletReadyState.Installed || 
          wallet.adapter.readyState === WalletReadyState.Loadable;
        
        setIsReady(ready);
      } else {
        setIsReady(false);
      }
    };
    
    // Initial check
    checkWalletReadiness();
    
    // Set up event listeners for wallet changes
    if (wallet) {
      wallet.adapter?.on('readyStateChange', checkWalletReadiness);
      return () => {
        wallet.adapter?.off('readyStateChange', checkWalletReadiness);
      };
    }
  }, [wallet, mounted]);
  
  // Safe access to wallet properties
  const safeWallet = {
    publicKey: wallet?.publicKey || null,
    connected: wallet?.connected || false,
    connecting: wallet?.connecting || false,
    disconnecting: wallet?.disconnecting || false,
    isReady,
    walletName: wallet?.adapter?.name || 'Unknown Wallet',
    walletIcon: wallet?.adapter?.icon || null,
    
    // Wrapped methods with null checks
    connect: async () => {
      if (mounted && wallet?.connect) {
        try {
          await wallet.connect();
        } catch (error) {
          console.error("Wallet connection error:", error);
        }
      }
    },
    
    disconnect: async () => {
      if (mounted && wallet?.disconnect) {
        try {
          await wallet.disconnect();
        } catch (error) {
          console.error("Wallet disconnection error:", error);
        }
      }
    },
    
    // Helper method to safely get wallet adapter property
    getAdapterProperty: (propertyName) => {
      if (!mounted || !wallet?.adapter) return null;
      return wallet.adapter[propertyName] || null;
    }
  };
  
  return { ...safeWallet, mounted };
}
