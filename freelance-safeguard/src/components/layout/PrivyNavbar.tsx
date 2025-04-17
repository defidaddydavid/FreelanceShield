import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';
import PrivyAuthButton from '../auth/PrivyAuthButton';
import { Shield } from 'lucide-react';

interface PrivyNavbarProps {
  className?: string;
}

export const PrivyNavbar: React.FC<PrivyNavbarProps> = ({ className }) => {
  const { isDark } = useSolanaTheme();
  
  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b backdrop-blur-sm",
      isDark 
        ? "bg-black/80 border-gray-800" 
        : "bg-white/80 border-gray-200",
      className
    )}>
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#9945FF]" />
          <span className="font-bold text-lg">FreelanceShield</span>
        </Link>
        
        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/how-it-works" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-[#9945FF]",
              isDark ? "text-gray-200" : "text-gray-700"
            )}
          >
            How It Works
          </Link>
          <Link 
            to="/pricing" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-[#9945FF]",
              isDark ? "text-gray-200" : "text-gray-700"
            )}
          >
            Pricing
          </Link>
          <Link 
            to="/risk-pool" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-[#9945FF]",
              isDark ? "text-gray-200" : "text-gray-700"
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
