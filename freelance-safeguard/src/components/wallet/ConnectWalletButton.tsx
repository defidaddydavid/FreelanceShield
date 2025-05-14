import React, { useMemo } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { WalletMultiButton } from '@/lib/solana/wallet-adapter-compat';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';
import { cn } from '@/lib/utils';

/**
 * Enhanced ConnectWalletButton component
 * 
 * A styled wrapper around the Solana wallet adapter button that follows
 * FreelanceShield's retro-futuristic design system.
 */
const ConnectWalletButton: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { connected } = useWallet();
  const { isDark } = useSolanaTheme();
  
  // Generate dynamic styles based on the current theme
  const buttonStyles = useMemo(() => cn(
    // Base styles
    "wallet-adapter-button",
    "font-heading font-semibold text-sm rounded-md transition-all duration-200",
    "hover:scale-[1.02] active:scale-[0.98]",
    
    // Theme-specific styling (retro-futuristic with neon accents)
    isDark 
      ? "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white border border-blue-400/30 shadow-[0_0_15px_0_rgba(37,99,235,0.2)]" 
      : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white border border-pink-400/30 shadow-[0_0_15px_0_rgba(219,39,119,0.2)]",
    
    // Additional custom class
    className
  ), [isDark, className]);
  
  // Style for the icon container
  const iconStyles = cn(
    "wallet-adapter-button-start-icon mr-2",
    isDark ? "text-blue-200" : "text-pink-200"
  );
  
  return (
    <WalletMultiButton 
      className={buttonStyles}
      startIcon={
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={iconStyles}
        >
          <path 
            d="M21 7.5V6.75C21 5.09315 19.6569 3.75 18 3.75H6C4.34315 3.75 3 5.09315 3 6.75V17.25C3 18.9069 4.34315 20.25 6 20.25H18C19.6569 20.25 21 18.9069 21 17.25V16.5" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
          />
          <path 
            d="M15 12C15 10.3431 16.3431 9 18 9C19.6569 9 21 10.3431 21 12C21 13.6569 19.6569 15 18 15C16.3431 15 15 13.6569 15 12Z" 
            stroke="currentColor" 
            strokeWidth="1.5" 
          />
        </svg>
      }
    />
  );
};

export default ConnectWalletButton;
