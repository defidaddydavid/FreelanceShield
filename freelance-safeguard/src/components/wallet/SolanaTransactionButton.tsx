import React, { useState, ReactNode } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSafeWallet } from '@/hooks/useSafeWallet';
import { Connection, Transaction, VersionedTransaction, SendOptions } from '@solana/web3.js';
import { formatSolanaErrorMessage } from '@/utils/errorHandling';
import { useSolanaTheme } from '@/contexts/SolanaProviders';

interface SolanaTransactionButtonProps extends Omit<ButtonProps, 'onClick'> {
  transaction?: Transaction | VersionedTransaction | null;
  connection?: Connection;
  onBeforeTransaction?: () => Promise<boolean> | boolean;
  onTransactionSent?: (signature: string) => void;
  onTransactionConfirmed?: (signature: string) => void;
  onTransactionError?: (error: any) => void;
  sendOptions?: SendOptions;
  showToast?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  confirmText?: string;
  children: ReactNode;
  retryOnError?: boolean;
  maxRetries?: number;
}

/**
 * SolanaTransactionButton Component
 * 
 * A button component that handles Solana transaction sending with proper error handling,
 * loading states, and retro-futuristic styling consistent with FreelanceShield's design system.
 */
const SolanaTransactionButton = ({
  transaction,
  connection,
  onBeforeTransaction,
  onTransactionSent,
  onTransactionConfirmed,
  onTransactionError,
  sendOptions = {},
  showToast = true,
  loadingText = 'Processing...',
  successText = 'Transaction confirmed',
  errorText = 'Transaction failed',
  confirmText = 'Confirming...',
  children,
  retryOnError = false,
  maxRetries = 2,
  disabled,
  variant = 'default',
  size = 'default',
  className,
  ...props
}: SolanaTransactionButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isError, setIsError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { isDark } = useSolanaTheme();
  
  // Get access to our safe wallet methods
  const safeWallet = useSafeWallet();

  const handleTransaction = async () => {
    if (!transaction || !safeWallet.connected || !safeWallet.publicKey || isLoading) {
      return;
    }

    // Run before-transaction hook if provided
    if (onBeforeTransaction) {
      try {
        const shouldProceed = await onBeforeTransaction();
        if (!shouldProceed) {
          return;
        }
      } catch (err) {
        console.error("Error in onBeforeTransaction:", err);
        if (onTransactionError) {
          onTransactionError(err);
        }
        return;
      }
    }

    setIsLoading(true);
    setIsError(false);

    try {
      // Use our enhanced safeSendTransaction method that provides error handling
      const signature = await safeWallet.safeSendTransaction(
        transaction,
        connection!,
        {
          ...sendOptions,
          showToast: false, // We'll handle toasts manually for more control
        }
      );

      if (!signature) {
        throw new Error("Failed to send transaction");
      }

      // Transaction was sent successfully
      setIsConfirming(true);
      
      if (showToast) {
        toast.success("Transaction sent", {
          description: confirmText,
          duration: 5000,
        });
      }
      
      if (onTransactionSent) {
        onTransactionSent(signature);
      }

      // Transaction was confirmed
      if (onTransactionConfirmed) {
        onTransactionConfirmed(signature);
      }

      if (showToast) {
        toast.success(successText, {
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

    } catch (err) {
      console.error("Transaction error:", err);
      setIsError(true);
      
      // Format error for display
      const errorMessage = formatSolanaErrorMessage(err);
      
      if (showToast) {
        toast.error(errorText, {
          description: errorMessage,
        });
      }
      
      if (onTransactionError) {
        onTransactionError(err);
      }
      
      // Handle retry logic
      if (retryOnError && retryCount < maxRetries) {
        setRetryCount(retryCount + 1);
        toast.info(`Retrying transaction (${retryCount + 1}/${maxRetries})...`);
        
        // Wait a moment before retrying
        setTimeout(() => {
          handleTransaction();
        }, 1500);
        
        return;
      }
    } finally {
      setIsLoading(false);
      setIsConfirming(false);
    }
  };

  // Determine button styling based on state
  const buttonClasses = cn(
    // Base styling
    "font-sans transition-all duration-200",
    
    // Error state styling with retro-futuristic red glow
    isError && variant === "default" && "bg-red-600 hover:bg-red-700 shadow-[0_0_10px_0_rgba(220,38,38,0.5)]",
    
    // Custom retro-future styling inspired by the design system
    variant === "gradient" && "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 dark:from-blue-500 dark:to-indigo-600 dark:hover:from-blue-600 dark:hover:to-indigo-700 text-white border-none",
    
    // Additional class passed from props
    className
  );

  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || isLoading || !safeWallet.connected || !transaction}
      onClick={handleTransaction}
      className={buttonClasses}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isConfirming ? confirmText : loadingText}
        </>
      ) : isError ? (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          {errorText}
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default SolanaTransactionButton;
