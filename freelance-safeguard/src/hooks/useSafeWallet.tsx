import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  SendOptions,
  Commitment,
  VersionedTransaction,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { toast } from "sonner";
import { useSolanaTheme } from "@/contexts/SolanaProviders";
import { formatSolanaErrorMessage, trackSolanaError } from "@/utils/errorHandling";

/**
 * Enhanced hook for safely accessing wallet properties with proper error handling
 * and improved transaction management
 */
export function useSafeWallet() {
  const wallet = useWallet();
  const { isDark } = useSolanaTheme();
  const [mounted, setMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  // Handle component mounting to prevent hydration mismatches
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Check wallet readiness after component is mounted
  useEffect(() => {
    if (!mounted) return;
    
    // We'll check for readiness whenever wallet state changes
    if (wallet && wallet.wallet) {
      const ready = 
        wallet.wallet.readyState === WalletReadyState.Installed || 
        wallet.wallet.readyState === WalletReadyState.Loadable;
      
      setIsReady(ready);
    } else {
      setIsReady(false);
    }
  }, [wallet, wallet?.wallet, wallet?.connected, mounted]);
  
  // Safe access to wallet properties
  const safeWallet = {
    publicKey: wallet?.publicKey || null,
    connected: wallet?.connected || false,
    connecting: wallet?.connecting || false,
    disconnecting: wallet?.disconnecting || false,
    isReady,
    error,
    isSending,
    // Access wallet name safely
    walletName: wallet?.wallet ? (wallet.wallet as any).name || 'Unknown Wallet' : 'Unknown Wallet',
  };

  // Get SOL balance with error handling
  const getSolBalance = useCallback(async (connection?: Connection): Promise<number> => {
    try {
      if (!wallet.publicKey) return 0;
      
      // Use provided connection or wallet's connection
      const conn = connection || new Connection(
        import.meta.env.VITE_SOLANA_RPC_URL || "https://api.devnet.solana.com", 
        "confirmed"
      );
      
      const balance = await conn.getBalance(wallet.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (err) {
      console.error("Error fetching SOL balance:", err);
      setError(err as Error);
      return 0;
    }
  }, [wallet.publicKey]);

  // Enhanced transaction sending with error handling and retries
  const safeSendTransaction = useCallback(async (
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options: SendOptions & { showToast?: boolean } = {}
  ) => {
    const { showToast = true, ...sendOptions } = options;
    
    if (!wallet.publicKey || !wallet.signTransaction) {
      const error = new Error("Wallet not connected or doesn't support signing");
      setError(error);
      if (showToast) {
        toast.error("Wallet not connected");
      }
      return null;
    }
    
    setIsSending(true);
    setError(null);
    
    // Show processing toast
    let toastId;
    if (showToast) {
      toastId = toast.loading("Processing transaction...", {
        duration: 60000, // 60 seconds
      });
    }
    
    try {
      // Sign transaction
      let signedTransaction;
      if (transaction instanceof VersionedTransaction) {
        // Handle versioned transaction
        signedTransaction = await wallet.signTransaction(transaction);
      } else {
        // Handle legacy transaction
        if (!transaction.feePayer) {
          transaction.feePayer = wallet.publicKey;
        }
        
        // Add recent blockhash if not already set
        if (!transaction.recentBlockhash) {
          const { blockhash } = await connection.getLatestBlockhash();
          transaction.recentBlockhash = blockhash;
        }
        
        signedTransaction = await wallet.signTransaction(transaction);
      }
      
      // Send transaction
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        sendOptions
      );
      
      // Update toast to processing
      if (showToast && toastId) {
        toast.success("Transaction sent", {
          id: toastId,
          description: "Confirming transaction...",
          duration: 5000,
        });
      }
      
      // Wait for confirmation
      const commitment: Commitment = sendOptions.preflightCommitment || "confirmed";
      await connection.confirmTransaction(signature, commitment);
      
      // Show success toast
      if (showToast) {
        toast.success("Transaction confirmed", {
          description: (
            <div>
              <span className="block truncate">{signature.slice(0, 8)}...{signature.slice(-8)}</span>
              <a 
                href={`https://explorer.solana.com/tx/${signature}${import.meta.env.VITE_SOLANA_NETWORK !== 'mainnet-beta' ? `?cluster=${import.meta.env.VITE_SOLANA_NETWORK || 'devnet'}` : ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs underline mt-1 block ${isDark ? 'text-blue-300' : 'text-blue-600'}`}
              >
                View on Explorer
              </a>
            </div>
          ),
          duration: 8000,
        });
      }
      
      return signature;
    } catch (err) {
      console.error("Transaction error:", err);
      setError(err as Error);
      
      // Format error for user display
      const errorMessage = formatSolanaErrorMessage(err);
      
      // Track error for monitoring
      trackSolanaError(err, "safeSendTransaction");
      
      // Show error toast
      if (showToast) {
        toast.error("Transaction failed", {
          id: toastId,
          description: errorMessage,
          duration: 8000,
        });
      }
      
      return null;
    } finally {
      setIsSending(false);
    }
  }, [wallet.publicKey, wallet.signTransaction, isDark]);
  
  return {
    ...safeWallet,
    getSolBalance,
    safeSendTransaction,
  };
}
