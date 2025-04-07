import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';
import { Button } from '@/components/ui/button';
import { Wallet, Loader2 } from 'lucide-react';

interface ConnectWalletButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  variant = 'default',
  size = 'md',
  className,
}) => {
  const { connected, connecting, wallet, select, wallets } = useWallet();
  const { isDark } = useSolanaTheme();
  
  // Don't render if already connected
  if (connected) return null;
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  // Variant classes with theme support
  const variantClasses = {
    default: cn(
      'bg-shield-purple text-white hover:bg-shield-purple/90',
      isDark && 'bg-shield-blue hover:bg-shield-blue/90'
    ),
    outline: cn(
      'border border-shield-purple text-shield-purple hover:bg-shield-purple/10',
      isDark && 'border-shield-blue text-shield-blue hover:bg-shield-blue/10'
    ),
    ghost: cn(
      'text-shield-purple hover:bg-shield-purple/10',
      isDark && 'text-shield-blue hover:bg-shield-blue/10'
    ),
  };
  
  const handleClick = () => {
    // If there's only one wallet, select it directly
    if (wallets.length === 1) {
      select(wallets[0].adapter.name);
    } else {
      // Otherwise, open the wallet selection dialog
      // This would typically be handled by your wallet modal component
      // For example: openWalletModal()
    }
  };
  
  return (
    <Button
      className={cn(
        'font-heading font-medium rounded-lg transition-colors',
        'flex items-center gap-2',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      onClick={handleClick}
      disabled={connecting}
    >
      {connecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wallet className="h-4 w-4" />
      )}
      Connect Wallet
    </Button>
  );
};
