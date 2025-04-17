import React from 'react';
import { Button } from '@/components/ui/button';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { Wallet } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';

interface PrivyWalletButtonProps {
  className?: string;
}

export const PrivyWalletButton: React.FC<PrivyWalletButtonProps> = ({ className }) => {
  const { isAuthenticated, wallets, connectWallet, activeWallet, loginWithWallet } = usePrivyAuth();
  const { isDark } = useSolanaTheme();
  
  // If not authenticated, show a connect wallet button
  if (!isAuthenticated) {
    return (
      <Button 
        onClick={loginWithWallet}
        className={cn(
          "bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:opacity-90",
          className
        )}
      >
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }
  
  // If authenticated but no wallet is connected
  if (!activeWallet) {
    return (
      <Button 
        onClick={loginWithWallet}
        className={cn(
          "bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:opacity-90",
          className
        )}
      >
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }
  
  // User is authenticated and has a wallet connected
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "flex items-center gap-2",
            isDark 
              ? "border-gray-700 hover:bg-gray-800" 
              : "border-gray-200 hover:bg-gray-100",
            className
          )}
        >
          <Wallet className="h-4 w-4" />
          <span className="text-sm font-medium truncate max-w-[100px]">
            {activeWallet.address.slice(0, 6)}...{activeWallet.address.slice(-4)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Connected Wallet</DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="flex items-center gap-2">
          <span className="font-mono truncate">{activeWallet.address}</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Available Wallets</DropdownMenuLabel>
        
        {wallets?.map((wallet, index) => (
          <DropdownMenuItem 
            key={index}
            onClick={connectWallet}
            className="flex items-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            <span>{wallet.walletClientType || 'Wallet'}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PrivyWalletButton;
