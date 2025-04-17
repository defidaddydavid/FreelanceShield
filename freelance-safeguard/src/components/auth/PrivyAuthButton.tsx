import React from 'react';
import { Button } from '@/components/ui/button';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { UserCircle, LogOut, Wallet } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';

interface PrivyAuthButtonProps {
  className?: string;
}

export const PrivyAuthButton: React.FC<PrivyAuthButtonProps> = ({ className }) => {
  const { isAuthenticated, user, login, logout, activeWallet } = usePrivyAuth();
  const { isDark } = useSolanaTheme();
  
  if (!isAuthenticated) {
    return (
      <Button 
        onClick={login}
        className={cn(
          "bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:opacity-90",
          className
        )}
      >
        Connect
      </Button>
    );
  }
  
  // User is authenticated, show profile dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-full border",
            isDark 
              ? "border-gray-700 hover:bg-gray-800" 
              : "border-gray-200 hover:bg-gray-100",
            className
          )}
        >
          <Avatar className="h-6 w-6">
            <AvatarImage src={user?.email?.address ? `https://www.gravatar.com/avatar/${btoa(user.email.address)}?d=mp` : ''} alt="User" />
            <AvatarFallback>
              <UserCircle className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate max-w-[100px]">
            {user?.email?.address ? user.email.address.split('@')[0] : 'User'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {user?.email?.address && (
          <DropdownMenuItem className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span className="truncate">{user.email.address}</span>
          </DropdownMenuItem>
        )}
        
        {activeWallet && (
          <DropdownMenuItem className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="truncate">{activeWallet.address.slice(0, 6)}...{activeWallet.address.slice(-4)}</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={logout}
          className="text-red-500 focus:text-red-500 flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PrivyAuthButton;
