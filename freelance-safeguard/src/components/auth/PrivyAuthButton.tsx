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
import PrivyLogo from '@/components/icons/PrivyLogo';

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
          "font-['NT_Brick_Sans'] inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shield-purple focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-shield-purple text-white hover:bg-shield-purple/90 h-10 px-4 py-2 bg-gradient-to-r from-[#9945FF] to-[#9945FF] hover:opacity-90 shadow-lg",
          className
        )}
      >
        <span className="mr-2">Connect</span>
        <PrivyLogo width={40} height={16} />
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
            "font-['NT_Brick_Sans'] flex items-center gap-2 px-3 py-2 rounded-full border",
            isDark 
              ? "border-shield-purple/30 hover:bg-gray-800/50" 
              : "border-shield-purple/20 hover:bg-gray-100/50",
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
      
      <DropdownMenuContent align="end" className="w-56 font-['NT_Brick_Sans']">
        <div className="px-2 py-1.5 flex items-center justify-between">
          <DropdownMenuLabel className="font-['NT_Brick_Sans'] p-0">My Account</DropdownMenuLabel>
          <div className={cn(
            "p-1 rounded",
            !isDark && "bg-gray-800"
          )}>
            <PrivyLogo width={40} height={16} />
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {user?.email?.address && (
          <DropdownMenuItem className="flex items-center gap-2 font-['NT_Brick_Sans']">
            <UserCircle className="h-4 w-4" />
            <span className="truncate">{user.email.address}</span>
          </DropdownMenuItem>
        )}
        
        {activeWallet && (
          <DropdownMenuItem className="flex items-center gap-2 font-['NT_Brick_Sans']">
            <Wallet className="h-4 w-4" />
            <span className="truncate">{activeWallet.address.slice(0, 6)}...{activeWallet.address.slice(-4)}</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={logout}
          className="text-red-500 focus:text-red-500 flex items-center gap-2 font-['NT_Brick_Sans']"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PrivyAuthButton;
