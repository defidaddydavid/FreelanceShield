import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';
import { Coins, ArrowUp, ArrowDown } from 'lucide-react';

interface TokenCardProps {
  token: {
    mint: string;
    symbol: string;
    name: string;
    balance: number;
    decimals: number;
    iconUrl?: string;
    usdValue?: number;
    priceChange24h?: number;
  };
  onClick?: () => void;
  className?: string;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  token,
  onClick,
  className,
}) => {
  const { isDark } = useSolanaTheme();
  
  // Format balance based on decimals
  const formattedBalance = token.decimals 
    ? (token.balance / Math.pow(10, token.decimals)).toFixed(token.decimals > 4 ? 4 : token.decimals) 
    : token.balance.toFixed(4);
  
  // Format USD value if available
  const formattedUsdValue = token.usdValue 
    ? `$${token.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
    : 'N/A';
  
  // Determine price change color and icon
  const isPriceUp = token.priceChange24h && token.priceChange24h > 0;
  const isPriceDown = token.priceChange24h && token.priceChange24h < 0;
  const priceChangeColor = isPriceUp 
    ? 'text-green-500' 
    : isPriceDown 
      ? 'text-red-500' 
      : 'text-gray-500';
  
  // Format price change percentage if available
  const formattedPriceChange = token.priceChange24h 
    ? `${token.priceChange24h > 0 ? '+' : ''}${token.priceChange24h.toFixed(2)}%` 
    : '0.00%';
  
  return (
    <div 
      className={cn(
        'p-4 rounded-lg transition-all',
        'border',
        isDark 
          ? 'bg-gray-800 border-shield-blue/20 hover:border-shield-blue/50' 
          : 'bg-white border-shield-purple/20 hover:border-shield-purple/50',
        'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {token.iconUrl ? (
            <img 
              src={token.iconUrl} 
              alt={token.symbol} 
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              isDark ? 'bg-shield-blue/20' : 'bg-shield-purple/20'
            )}>
              <Coins className="w-4 h-4" />
            </div>
          )}
          <div>
            <h3 className={cn(
              'font-heading font-medium',
              isDark ? 'text-white' : 'text-gray-900'
            )}>
              {token.symbol}
            </h3>
            <p className="text-xs text-gray-500">{token.name}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className={cn(
            'font-medium',
            isDark ? 'text-white' : 'text-gray-900'
          )}>
            {formattedBalance}
          </p>
          <div className="flex items-center gap-1 justify-end">
            <p className="text-xs text-gray-500">{formattedUsdValue}</p>
            {token.priceChange24h !== undefined && (
              <div className={cn('flex items-center text-xs', priceChangeColor)}>
                {isPriceUp && <ArrowUp className="w-3 h-3" />}
                {isPriceDown && <ArrowDown className="w-3 h-3" />}
                <span>{formattedPriceChange}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
