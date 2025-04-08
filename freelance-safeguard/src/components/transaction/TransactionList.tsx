import React from 'react';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaProviders';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Transaction {
  signature: string;
  status: 'confirmed' | 'processing' | 'failed';
  timestamp: number;
  type?: string;
  amount?: number;
  symbol?: string;
}

interface TransactionListProps {
  transactions?: Transaction[];
  isLoading?: boolean;
  limit?: number;
  className?: string;
  emptyStateMessage?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions = [],
  isLoading = false,
  limit = 10,
  className,
  emptyStateMessage = "No transactions found"
}) => {
  const { isDark } = useSolanaTheme();
  
  // Function to view transaction in explorer
  const viewInExplorer = (signature: string) => {
    const network = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
    const baseUrl = network === 'mainnet-beta' 
      ? `https://explorer.solana.com/tx/${signature}` 
      : `https://explorer.solana.com/tx/${signature}?cluster=${network}`;
      
    window.open(baseUrl, '_blank', 'noopener,noreferrer');
  };
  
  // Status icon component
  const StatusIcon = ({ status }: { status: Transaction['status'] }) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map((i) => (
          <Skeleton 
            key={i}
            className={cn(
              'w-full h-16',
              isDark ? 'bg-gray-800' : 'bg-gray-200'
            )} 
          />
        ))}
      </div>
    );
  }
  
  // Empty state
  if (transactions.length === 0) {
    return (
      <div className={cn(
        'p-6 text-center rounded-lg border',
        isDark 
          ? 'bg-gray-900 border-gray-800 text-gray-400' 
          : 'bg-gray-50 border-gray-200 text-gray-500',
        className
      )}>
        <p className="text-lg font-heading">{emptyStateMessage}</p>
      </div>
    );
  }
  
  // Limit transactions to display
  const displayTransactions = transactions.slice(0, limit);
  
  return (
    <div className={cn('space-y-2', className)}>
      {displayTransactions.map((tx) => (
        <div
          key={tx.signature}
          className={cn(
            'p-3 rounded-lg border flex items-center justify-between transition-colors',
            isDark 
              ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' 
              : 'bg-white border-gray-200 hover:bg-gray-50',
          )}
        >
          <div className="flex items-center gap-3">
            <StatusIcon status={tx.status} />
            
            <div>
              <div className={cn(
                'font-medium mb-0.5',
                isDark ? 'text-white' : 'text-gray-900'
              )}>
                {tx.type || 'Transaction'}
                {tx.amount && tx.symbol && (
                  <span> • {tx.amount} {tx.symbol}</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-xs font-mono',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                )}>
                  {`${tx.signature.slice(0, 4)}...${tx.signature.slice(-4)}`}
                </span>
                
                <span className={cn(
                  'text-xs',
                  isDark ? 'text-gray-400' : 'text-gray-500'
                )}>
                  {formatTimestamp(tx.timestamp)}
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => viewInExplorer(tx.signature)}
            className={cn(
              'p-1.5 rounded-full transition-colors',
              isDark 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            )}
            aria-label="View in Explorer"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
