import React from 'react';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaProviders';
import { Card, CardContent } from '@/components/ui/card';

interface TokenCardProps {
  symbol: string;
  name: string;
  balance: number;
  usdValue?: number;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  symbol,
  name,
  balance,
  usdValue,
  icon,
  className,
  onClick,
}) => {
  const { isDark } = useSolanaTheme();
  
  // Format balance to max 6 decimal places for readability
  const formattedBalance = balance.toLocaleString(undefined, {
    maximumFractionDigits: 6,
    minimumFractionDigits: 2,
  });
  
  // Format USD value if provided
  const formattedUsdValue = usdValue 
    ? usdValue.toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      })
    : undefined;

  return (
    <Card 
      className={cn(
        'overflow-hidden transition-all duration-200 border',
        isDark 
          ? 'bg-gray-900 border-gray-800 hover:border-shield-blue/50' 
          : 'bg-white border-gray-200 hover:border-shield-purple/50',
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon ? (
              <div className={cn(
                'w-10 h-10 flex items-center justify-center rounded-full',
                isDark ? 'bg-gray-800' : 'bg-gray-100'
              )}>
                {icon}
              </div>
            ) : (
              <div className={cn(
                'w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg',
                isDark 
                  ? 'bg-shield-blue/20 text-shield-blue' 
                  : 'bg-shield-purple/20 text-shield-purple'
              )}>
                {symbol.slice(0, 2)}
              </div>
            )}
            
            <div className="flex flex-col">
              <span className={cn(
                'font-heading font-bold text-lg',
                isDark ? 'text-white' : 'text-gray-900'
              )}>
                {symbol}
              </span>
              <span className={cn(
                'text-sm',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                {name}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <span className={cn(
              'font-heading font-bold text-lg',
              isDark ? 'text-white' : 'text-gray-900'
            )}>
              {formattedBalance}
            </span>
            {formattedUsdValue && (
              <span className={cn(
                'text-sm',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                {formattedUsdValue}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
