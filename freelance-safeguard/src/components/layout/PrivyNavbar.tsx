import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';
import PrivyAuthButton from '../auth/PrivyAuthButton';
import { Shield } from 'lucide-react';

interface PrivyNavbarProps {
  className?: string;
}

export const PrivyNavbar: React.FC<PrivyNavbarProps> = ({ className }) => {
  const { isDark } = useSolanaTheme();
  const location = useLocation();
  
  // Function to check if a link is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b backdrop-blur-sm",
      isDark 
        ? "bg-black/80 border-gray-800" 
        : "bg-white/80 border-gray-200",
      className
    )}>
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="FreelanceShield Logo" 
            className="h-10 w-10 object-contain"
          />
          <span className="font-['NT_Brick_Sans'] text-lg font-bold tracking-wide">
            FreelanceShield
          </span>
        </Link>
        
        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link 
            to="/how-it-works" 
            className={cn(
              "font-['NT_Brick_Sans'] text-sm font-medium transition-colors hover:text-[#9945FF]",
              isActive('/how-it-works') 
                ? "text-[#9945FF]" 
                : isDark ? "text-gray-200" : "text-gray-700"
            )}
          >
            How It Works
          </Link>
          <Link 
            to="/pricing" 
            className={cn(
              "font-['NT_Brick_Sans'] text-sm font-medium transition-colors hover:text-[#9945FF]",
              isActive('/pricing') 
                ? "text-[#9945FF]" 
                : isDark ? "text-gray-200" : "text-gray-700"
            )}
          >
            Pricing
          </Link>
          <Link 
            to="/risk-pool" 
            className={cn(
              "font-['NT_Brick_Sans'] text-sm font-medium transition-colors hover:text-[#9945FF]",
              isActive('/risk-pool') 
                ? "text-[#9945FF]" 
                : isDark ? "text-gray-200" : "text-gray-700"
            )}
          >
            Risk Pool
          </Link>
        </nav>
        
        {/* Auth Button */}
        <div className="flex items-center gap-4">
          <PrivyAuthButton />
        </div>
      </div>
    </header>
  );
};

export default PrivyNavbar;
