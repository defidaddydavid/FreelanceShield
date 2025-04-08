import React from 'react';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaProviders';
import { Loader2, AlertCircle, CheckCircle, Clock, ExternalLink, X } from 'lucide-react';

interface TxnToastProps {
  status: 'processing' | 'success' | 'error';
  message?: string;
  txId?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const TxnToast: React.FC<TxnToastProps> = ({
  status,
  message,
  txId,
  onClose,
  autoClose = true,
  duration = 6000,
}) => {
  const { isDark } = useSolanaTheme();
  
  // Shorten transaction signature for display
  const shortenedTxId = txId ? `${txId.slice(0, 4)}...${txId.slice(-4)}` : null;
  
  // Status-specific styling and icons
  const statusConfig = {
    processing: {
      icon: <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />,
      title: 'Transaction Processing',
      description: message || 'Your transaction is being processed...',
      className: isDark 
        ? 'border-yellow-500/20 bg-yellow-950/30 text-yellow-200' 
        : 'border-yellow-500/30 bg-yellow-50 text-yellow-800',
    },
    success: {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      title: 'Transaction Successful',
      description: message || 'Your transaction has been confirmed',
      className: isDark 
        ? 'border-green-500/20 bg-green-950/30 text-green-200' 
        : 'border-green-500/30 bg-green-50 text-green-800',
    },
    error: {
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      title: 'Transaction Failed',
      description: message || 'Your transaction failed to process',
      className: isDark 
        ? 'border-red-500/20 bg-red-950/30 text-red-200' 
        : 'border-red-500/30 bg-red-50 text-red-800',
    },
  };
  
  const config = statusConfig[status];
  
  // Auto close after duration
  React.useEffect(() => {
    if (autoClose && status !== 'processing' && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose, status]);
  
  // Function to view transaction in explorer
  const viewInExplorer = () => {
    if (!txId) return;
    
    // Get network from environment or default to devnet
    const network = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
    const baseUrl = network === 'mainnet-beta' 
      ? `https://explorer.solana.com/tx/${txId}` 
      : `https://explorer.solana.com/tx/${txId}?cluster=${network}`;
      
    window.open(baseUrl, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <div className={cn(
      'p-4 rounded-lg border shadow-md',
      'relative flex items-start gap-3',
      config.className
    )}>
      {/* Close button */}
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      
      <div className="flex-shrink-0 mt-0.5">
        {config.icon}
      </div>
      
      <div className="flex-1 pr-4">
        <h4 className="font-heading font-bold mb-1">
          {config.title}
        </h4>
        
        <p className={cn(
          "text-sm mb-2 opacity-90",
          isDark ? "text-gray-300" : "text-gray-600"
        )}>
          {config.description}
        </p>
        
        {txId && (
          <div className="flex items-center gap-2 text-xs">
            <span className={cn(
              "font-mono",
              isDark ? "text-gray-400" : "text-gray-500"
            )}>
              {shortenedTxId}
            </span>
            
            <button
              onClick={viewInExplorer}
              className={cn(
                'text-xs flex items-center gap-1 underline',
                isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'
              )}
            >
              <span>View</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
