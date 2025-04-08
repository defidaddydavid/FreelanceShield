import React, { useState, useEffect, useCallback } from 'react';
import { 
  Connection, 
  ConfirmedSignatureInfo, 
  TransactionSignature,
  PublicKey
} from '@solana/web3.js';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  FileText,
  Wallet,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSafeWallet } from '@/hooks/useSafeWallet';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';
import { formatSolanaErrorMessage, trackSolanaError } from '@/utils/errorHandling';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { NetworkBadge } from '@/components/wallet';
import { toast } from 'sonner';
import { NETWORK_CONFIG } from '@/lib/solana/constants';

interface TransactionHistoryProps {
  connection: Connection;
  limit?: number;
  className?: string;
  showControls?: boolean;
  showEmpty?: boolean;
  onFetchError?: (error: any) => void;
}

type TransactionType = 'all' | 'sent' | 'received' | 'contract' | 'escrow' | 'policy' | 'claim';

interface TransactionFilters {
  type: TransactionType;
  status: 'all' | 'success' | 'error';
  search: string;
}

/**
 * TransactionHistory Component
 * 
 * Displays a user's transaction history with filters, search, and retro-futuristic
 * styling consistent with FreelanceShield's design system.
 */
const TransactionHistory = ({
  connection,
  limit = 10,
  className,
  showControls = true,
  showEmpty = true,
  onFetchError
}: TransactionHistoryProps) => {
  const { isDark } = useSolanaTheme();
  const safeWallet = useSafeWallet();
  
  const [transactions, setTransactions] = useState<ConfirmedSignatureInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'all',
    status: 'all',
    search: ''
  });

  // Determine if we're on testnet based on endpoint or env var
  const isTestnet = NETWORK_CONFIG.endpoint.includes('devnet') || 
                  NETWORK_CONFIG.endpoint.includes('testnet') || 
                  import.meta.env.VITE_SOLANA_NETWORK !== 'mainnet-beta';

  // Fetch transaction history
  const fetchTransactions = useCallback(async () => {
    if (!safeWallet.connected || !safeWallet.publicKey) {
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch transaction signatures
      const signatures = await connection.getSignaturesForAddress(
        safeWallet.publicKey,
        { limit },
        'confirmed'
      );

      setTransactions(signatures);
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError(err as Error);
      trackSolanaError(err, 'fetchTransactionHistory');
      
      if (onFetchError) {
        onFetchError(err);
      }
      
      toast.error('Failed to fetch transaction history', {
        description: formatSolanaErrorMessage(err)
      });
    } finally {
      setIsLoading(false);
    }
  }, [connection, safeWallet.publicKey, safeWallet.connected, limit, onFetchError]);

  // Fetch transactions on mount and when wallet changes
  useEffect(() => {
    if (safeWallet.connected && safeWallet.publicKey) {
      fetchTransactions();
    }
  }, [safeWallet.connected, safeWallet.publicKey, fetchTransactions]);

  // Filter transactions based on current filters
  const filteredTransactions = transactions.filter((tx) => {
    // Apply type filter
    if (filters.type !== 'all') {
      // This is simplified - in a real app, you'd parse the transaction data
      // to determine the proper categorization
      if (filters.type === 'sent' && !tx.memo?.includes('sent')) {
        return false;
      } else if (filters.type === 'received' && !tx.memo?.includes('received')) {
        return false;
      }
      // Add more specific filters for FreelanceShield program categories
    }

    // Apply status filter
    if (filters.status !== 'all') {
      if (filters.status === 'success' && tx.err) {
        return false;
      } else if (filters.status === 'error' && !tx.err) {
        return false;
      }
    }

    // Apply search filter
    if (filters.search && !tx.signature.includes(filters.search)) {
      return false;
    }

    return true;
  });

  // Format transaction date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Get transaction type icon (simplified for demo)
  const getTransactionTypeIcon = (tx: ConfirmedSignatureInfo) => {
    // In a real app, you'd parse the transaction to determine the type
    if (tx.memo?.includes('escrow')) {
      return <ShieldCheck className="h-4 w-4 text-purple-500 dark:text-purple-400" />;
    } else if (tx.memo?.includes('policy')) {
      return <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />;
    } else if (tx.memo?.includes('claim')) {
      return <AlertCircle className="h-4 w-4 text-orange-500 dark:text-orange-400" />;
    } 
    
    // Default icons for simple send/receive 
    return tx.memo?.includes('sent') ? (
      <ArrowUpRight className="h-4 w-4 text-pink-500 dark:text-pink-400" />
    ) : (
      <ArrowDownLeft className="h-4 w-4 text-green-500 dark:text-green-400" />
    );
  };

  // Render transaction status
  const getTransactionStatus = (tx: ConfirmedSignatureInfo) => {
    if (tx.confirmationStatus === 'finalized') {
      return tx.err ? (
        <XCircle className="h-4 w-4 text-red-500" />
      ) : (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      );
    }
    
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  // Generate explorer link for transaction
  const getExplorerLink = (signature: string) => {
    return `https://explorer.solana.com/tx/${signature}${isTestnet ? `?cluster=${import.meta.env.VITE_SOLANA_NETWORK || 'devnet'}` : ''}`;
  };

  // Handle filter changes
  const handleFilterChange = (filterType: keyof TransactionFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Filter types with their corresponding labels
  const filterTypes: { value: TransactionType; label: string; icon: JSX.Element }[] = [
    { value: 'all', label: 'All', icon: <Search className="h-4 w-4" /> },
    { value: 'sent', label: 'Sent', icon: <ArrowUpRight className="h-4 w-4" /> },
    { value: 'received', label: 'Received', icon: <ArrowDownLeft className="h-4 w-4" /> },
    { value: 'escrow', label: 'Escrow', icon: <ShieldCheck className="h-4 w-4" /> },
    { value: 'policy', label: 'Policy', icon: <FileText className="h-4 w-4" /> },
    { value: 'claim', label: 'Claim', icon: <AlertCircle className="h-4 w-4" /> },
  ];

  // Render loading skeletons
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {showControls && (
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading text-lg text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 dark:from-blue-400 dark:to-teal-300">
              Transaction History
            </h3>
            <NetworkBadge status="connected" />
          </div>
        )}
        
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className={cn("p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20", className)}>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-medium">Error loading transactions</h3>
        </div>
        <p className="mt-2 text-sm text-red-600/80 dark:text-red-400/80">
          {formatSolanaErrorMessage(error)}
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchTransactions} 
          className="mt-3 bg-white dark:bg-gray-900 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Display empty state
  if (showEmpty && (!transactions.length || !filteredTransactions.length)) {
    return (
      <div className={cn("space-y-3", className)}>
        {showControls && (
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading text-lg text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 dark:from-blue-400 dark:to-teal-300">
              Transaction History
            </h3>
            <NetworkBadge status={safeWallet.connected ? 'connected' : 'disconnected'} />
          </div>
        )}
        
        <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
          <Wallet className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="font-medium text-gray-700 dark:text-gray-300">No transactions found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
            {safeWallet.connected 
              ? "We couldn't find any transactions for your wallet" 
              : "Connect your wallet to view your transactions"}
          </p>
          {safeWallet.connected && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchTransactions} 
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Main transaction list
  return (
    <div className={cn("space-y-3", className)}>
      {showControls && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading text-lg text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 dark:from-blue-400 dark:to-teal-300">
              Transaction History
            </h3>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchTransactions} 
                className="h-8"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <NetworkBadge status={safeWallet.connected ? 'connected' : 'disconnected'} />
            </div>
          </div>
          
          {/* Filter buttons with retro-futuristic styling */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
            {filterTypes.map((filter) => (
              <Button
                key={filter.value}
                variant={filters.type === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('type', filter.value)}
                className={cn(
                  "rounded-full px-3 transition-all",
                  filters.type === filter.value 
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 dark:from-blue-500 dark:to-indigo-600 text-white border-transparent shadow-[0_0_10px_0_rgba(219,39,119,0.3)] dark:shadow-[0_0_10px_0_rgba(37,99,235,0.3)]" 
                    : "border-gray-200 dark:border-gray-800 hover:border-pink-300 dark:hover:border-blue-700 bg-white/80 dark:bg-gray-900/80"
                )}
              >
                <span className="flex items-center gap-1.5">
                  {filter.icon}
                  {filter.label}
                </span>
              </Button>
            ))}
          </div>
        </>
      )}
      
      {/* Transaction list */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        {filteredTransactions.map((tx) => (
          <div 
            key={tx.signature} 
            className={cn(
              "flex items-center justify-between p-3 transition-colors",
              "hover:bg-gray-50 dark:hover:bg-gray-900/50",
              tx.err ? "bg-red-50/50 dark:bg-red-900/10" : ""
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full",
                "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900",
                "border border-gray-200 dark:border-gray-700"
              )}>
                {getTransactionTypeIcon(tx)}
              </div>
              
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-medium truncate max-w-[120px] sm:max-w-[200px]">
                    {tx.signature.slice(0, 8)}...{tx.signature.slice(-8)}
                  </span>
                  {getTransactionStatus(tx)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {tx.blockTime ? formatDate(tx.blockTime) : 'Processing...'}
                </p>
              </div>
            </div>
            
            <a 
              href={getExplorerLink(tx.signature)} 
              target="_blank" 
              rel="noopener noreferrer"
              className={cn(
                "p-1.5 rounded-md transition-colors",
                "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              aria-label="View on Explorer"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;
