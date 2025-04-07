import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface TxnToastProps {
  signature: string;
  status: 'processing' | 'confirmed' | 'error';
  message?: string;
  explorerUrl?: string;
}

export const TxnToast: React.FC<TxnToastProps> = ({
  signature,
  status,
  message,
  explorerUrl,
}) => {
  const { isDark } = useSolanaTheme();
  
  // Shorten transaction signature for display
  const shortenedSignature = `${signature.slice(0, 4)}...${signature.slice(-4)}`;
  
  // Status-specific styling and icons
  const statusConfig = {
    processing: {
      icon: <Clock className="h-5 w-5 text-yellow-500" />,
      title: 'Transaction Processing',
      description: message || 'Your transaction is being processed...',
      className: isDark ? 'border-yellow-500/20 bg-yellow-500/10' : 'border-yellow-500/30 bg-yellow-500/5',
    },
    confirmed: {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      title: 'Transaction Confirmed',
      description: message || 'Your transaction has been confirmed',
      className: isDark ? 'border-green-500/20 bg-green-500/10' : 'border-green-500/30 bg-green-500/5',
    },
    error: {
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      title: 'Transaction Failed',
      description: message || 'Your transaction failed to process',
      className: isDark ? 'border-red-500/20 bg-red-500/10' : 'border-red-500/30 bg-red-500/5',
    },
  };
  
  const config = statusConfig[status];
  
  // Function to view transaction in explorer
  const viewInExplorer = () => {
    if (explorerUrl) {
      window.open(explorerUrl, '_blank');
    } else {
      // Default to Solana Explorer if no URL provided
      const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
      const baseUrl = network === 'mainnet-beta' 
        ? 'https://explorer.solana.com/tx/' 
        : `https://explorer.solana.com/tx/${signature}?cluster=${network}`;
      window.open(baseUrl, '_blank');
    }
  };
  
  return (
    <div className={cn(
      'p-4 rounded-lg border',
      'flex items-start gap-3',
      config.className
    )}>
      <div className="flex-shrink-0 mt-0.5">
        {config.icon}
      </div>
      
      <div className="flex-1">
        <h4 className={cn(
          'font-heading font-medium mb-1',
          isDark ? 'text-white' : 'text-gray-900'
        )}>
          {config.title}
        </h4>
        
        <p className="text-sm text-gray-500 mb-2">
          {config.description}
        </p>
        
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">Tx: {shortenedSignature}</span>
          
          <button
            onClick={viewInExplorer}
            className={cn(
              'text-xs underline',
              isDark ? 'text-shield-blue hover:text-shield-blue/80' : 'text-shield-purple hover:text-shield-purple/80'
            )}
          >
            View in Explorer
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to show transaction toasts
export const showTxnToast = (props: TxnToastProps) => {
  toast.custom(() => <TxnToast {...props} />);
};
