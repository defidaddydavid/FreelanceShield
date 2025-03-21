import { useWallet } from '@solana/wallet-adapter-react';
import { usePhantomWallet } from './PhantomWalletProvider';
import { NETWORK_CONFIG } from './constants';
import { PublicKey, Transaction, Connection, Commitment } from '@solana/web3.js';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export type WalletType = 'phantom-embedded' | 'phantom-adapter' | 'solflare' | 'ledger' | 'torus' | 'other' | null;

export interface UnifiedWalletInfo {
  connected: boolean;
  publicKey: string | null;
  walletType: WalletType;
  balance: number | null;
  isLoading: boolean;
}

export interface UnifiedWalletActions {
  connect: (walletType: WalletType | null) => Promise<boolean>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: Transaction) => Promise<Transaction | null>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[] | null>;
  sendTransaction: (transaction: Transaction) => Promise<string | null>;
  refreshBalance: () => Promise<number | null>;
}

/**
 * UnifiedWalletService provides a consistent interface for interacting with
 * different wallet providers (Phantom, Solflare, etc.)
 */
export const useUnifiedWallet = (): [UnifiedWalletInfo, UnifiedWalletActions] => {
  // Get wallet contexts
  const { 
    publicKey, 
    connected, 
    signTransaction: adapterSignTransaction,
    signAllTransactions: adapterSignAllTransactions,
    sendTransaction: adapterSendTransaction,
    disconnect: adapterDisconnect,
    wallet
  } = useWallet();
  
  const phantomWallet = usePhantomWallet();
  
  // State
  const [walletInfo, setWalletInfo] = useState<UnifiedWalletInfo>({
    connected: false,
    publicKey: null,
    walletType: null,
    balance: null,
    isLoading: false
  });
  
  // Create connection
  const connection = new Connection(
    NETWORK_CONFIG.endpoint,
    { commitment: NETWORK_CONFIG.connectionConfig.commitment as Commitment }
  );
  
  // No longer checking for Ethereum provider conflicts since we're handling that in main.tsx
  // by temporarily removing the ethereum property
  
  // Determine current wallet type
  useEffect(() => {
    let walletType: WalletType = null;
    let isConnected = false;
    let pubKey: string | null = null;
    
    // Check standard wallet adapter connection
    if (connected && wallet && publicKey) {
      isConnected = true;
      pubKey = publicKey.toBase58();
      
      // Determine wallet type based on adapter name
      const walletName = wallet.adapter.name.toLowerCase();
      if (walletName.includes('phantom')) {
        walletType = 'phantom-adapter';
      } else if (walletName.includes('solflare')) {
        walletType = 'solflare';
      } else if (walletName.includes('ledger')) {
        walletType = 'ledger';
      } else if (walletName.includes('torus')) {
        walletType = 'torus';
      } else {
        walletType = 'other';
      }
    } 
    // Check Phantom SDK connection
    else if (phantomWallet.isConnected && phantomWallet.publicKey) {
      isConnected = true;
      pubKey = phantomWallet.publicKey;
      walletType = 'phantom-embedded';
    }
    
    setWalletInfo(prev => ({
      ...prev,
      connected: isConnected,
      publicKey: pubKey,
      walletType: walletType
    }));
    
    // Fetch balance if connected
    if (isConnected && pubKey) {
      refreshBalance();
    }
  }, [connected, wallet, publicKey, phantomWallet.isConnected, phantomWallet.publicKey]);
  
  // Refresh balance
  const refreshBalance = useCallback(async (): Promise<number | null> => {
    if (!walletInfo.connected || !walletInfo.publicKey) return null;
    
    setWalletInfo(prev => ({ ...prev, isLoading: true }));
    
    try {
      let balance: number | null = null;
      
      if (walletInfo.walletType === 'phantom-embedded') {
        // Use Phantom SDK
        balance = await phantomWallet.refreshBalance();
      } else {
        // Use wallet adapter connection
        const pubKey = new PublicKey(walletInfo.publicKey);
        const balanceInLamports = await connection.getBalance(pubKey);
        balance = balanceInLamports / NETWORK_CONFIG.lamportsPerSol;
      }
      
      setWalletInfo(prev => ({ ...prev, balance, isLoading: false }));
      return balance;
    } catch (error) {
      console.error('Error refreshing balance:', error);
      setWalletInfo(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  }, [walletInfo.connected, walletInfo.publicKey, walletInfo.walletType, connection, phantomWallet]);
  
  // Connect wallet
  const connect = useCallback(async (walletType: WalletType = null): Promise<boolean> => {
    setWalletInfo(prev => ({ ...prev, isLoading: true }));
    
    try {
      // For Phantom embedded wallet, we can initiate the connection
      if (walletType === 'phantom-embedded' && !phantomWallet.isConnected) {
        const connected = await phantomWallet.connectWallet();
        if (!connected) {
          throw new Error('Failed to connect to Phantom wallet');
        }
      }
      
      // For other wallet types, the connection is initiated by clicking
      // the wallet adapter button, so we just return true
      
      setWalletInfo(prev => ({ ...prev, isLoading: false }));
      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setWalletInfo(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [phantomWallet]);
  
  // Disconnect wallet
  const disconnect = useCallback(async (): Promise<void> => {
    setWalletInfo(prev => ({ ...prev, isLoading: true }));
    
    try {
      if (walletInfo.walletType === 'phantom-embedded') {
        // Use Phantom SDK
        phantomWallet.disconnectWallet();
      } else if (connected) {
        // Use wallet adapter
        await adapterDisconnect();
      }
      
      // Reset wallet info
      setWalletInfo({
        connected: false,
        publicKey: null,
        walletType: null,
        balance: null,
        isLoading: false
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      setWalletInfo(prev => ({ ...prev, isLoading: false }));
    }
  }, [walletInfo.walletType, connected, adapterDisconnect, phantomWallet]);
  
  // Sign transaction
  const signTransaction = useCallback(async (transaction: Transaction): Promise<Transaction | null> => {
    if (!walletInfo.connected) return null;
    
    setWalletInfo(prev => ({ ...prev, isLoading: true }));
    
    try {
      let signedTransaction: Transaction | null = null;
      
      if (walletInfo.walletType === 'phantom-embedded') {
        // Use Phantom SDK
        signedTransaction = await phantomWallet.signTransaction(transaction);
      } else if (adapterSignTransaction) {
        // Use wallet adapter
        signedTransaction = await adapterSignTransaction(transaction);
      }
      
      setWalletInfo(prev => ({ ...prev, isLoading: false }));
      return signedTransaction;
    } catch (error) {
      console.error('Error signing transaction:', error);
      setWalletInfo(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  }, [walletInfo.connected, walletInfo.walletType, adapterSignTransaction, phantomWallet]);
  
  // Sign all transactions
  const signAllTransactions = useCallback(async (transactions: Transaction[]): Promise<Transaction[] | null> => {
    if (!walletInfo.connected) return null;
    
    setWalletInfo(prev => ({ ...prev, isLoading: true }));
    
    try {
      let signedTransactions: Transaction[] | null = null;
      
      if (walletInfo.walletType === 'phantom-embedded') {
        // Use Phantom SDK - handle one by one
        const results = await Promise.all(
          transactions.map(tx => phantomWallet.signTransaction(tx))
        );
        
        // Check if any transaction failed to sign
        if (results.some(tx => tx === null)) {
          throw new Error('Failed to sign one or more transactions');
        }
        
        signedTransactions = results as Transaction[];
      } else if (adapterSignAllTransactions) {
        // Use wallet adapter
        signedTransactions = await adapterSignAllTransactions(transactions);
      }
      
      setWalletInfo(prev => ({ ...prev, isLoading: false }));
      return signedTransactions;
    } catch (error) {
      console.error('Error signing transactions:', error);
      setWalletInfo(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  }, [walletInfo.connected, walletInfo.walletType, adapterSignAllTransactions, phantomWallet]);
  
  // Send transaction
  const sendTransaction = useCallback(async (transaction: Transaction): Promise<string | null> => {
    if (!walletInfo.connected) return null;
    
    setWalletInfo(prev => ({ ...prev, isLoading: true }));
    
    try {
      let signature: string | null = null;
      
      if (walletInfo.walletType === 'phantom-embedded') {
        // Use Phantom SDK
        signature = await phantomWallet.sendTransaction(transaction);
      } else if (adapterSendTransaction) {
        // Use wallet adapter
        signature = await adapterSendTransaction(transaction, connection);
      }
      
      setWalletInfo(prev => ({ ...prev, isLoading: false }));
      return signature;
    } catch (error) {
      console.error('Error sending transaction:', error);
      setWalletInfo(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  }, [walletInfo.connected, walletInfo.walletType, adapterSendTransaction, connection, phantomWallet]);
  
  return [
    walletInfo,
    {
      connect,
      disconnect,
      signTransaction,
      signAllTransactions,
      sendTransaction,
      refreshBalance
    }
  ];
};
