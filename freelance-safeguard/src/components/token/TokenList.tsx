import React from 'react';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaProviders';
import { TokenCard } from './TokenCard';
import { Skeleton } from '@/components/ui/skeleton';

interface TokenData {
  symbol: string;
  name: string;
  balance: number;
  usdValue?: number;
  icon?: React.ReactNode;
}

interface TokenListProps {
  tokens: TokenData[];
  isLoading?: boolean;
  onSelectToken?: (token: TokenData) => void;
  className?: string;
  emptyStateMessage?: string;
}

export const TokenList: React.FC<TokenListProps> = ({
  tokens,
  isLoading = false,
  onSelectToken,
  className,
  emptyStateMessage = "No tokens found"
}) => {
  const { isDark } = useSolanaTheme();
  
  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map((i) => (
          <Skeleton 
            key={i}
            className={cn(
              'w-full h-24',
              isDark ? 'bg-gray-800' : 'bg-gray-200'
            )} 
          />
        ))}
      </div>
    );
  }
  
  // Empty state
  if (tokens.length === 0) {
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
  
  // Render token list
  return (
    <div className={cn('space-y-3', className)}>
      {tokens.map((token, index) => (
        <TokenCard
          key={`${token.symbol}-${index}`}
          symbol={token.symbol}
          name={token.name}
          balance={token.balance}
          usdValue={token.usdValue}
          icon={token.icon}
          onClick={onSelectToken ? () => onSelectToken(token) : undefined}
        />
      ))}
    </div>
  );
};
