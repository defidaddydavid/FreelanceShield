/**
 * Navbar Component
 * 
 * A responsive navigation bar with dark/light mode support that integrates with
 * Solana UI components and FreelanceShield's brand colors.
 * 
 * Features:
 * - Responsive design with mobile menu
 * - Dark/light mode theme switching
 * - Active link indicators
 * - Wallet connection integration
 * - Smooth transitions between states
 * - Consistent brand colors (shield-purple for light, shield-blue for dark)
 */

import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectWalletPopover } from '@/components/wallet/ConnectWalletPopover';
import { ConnectWalletDialog } from '@/components/wallet/ConnectWalletDialog';
import Logo from '@/components/ui/logo';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';

const Navbar = () => {
  // State for scroll detection and mobile menu
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Hooks for navigation and wallet connection
  const location = useLocation();
  const navigate = useNavigate();
  const { connected } = useWallet();
  
  // Theme state from Solana Theme Provider
  const { isDark, setTheme } = useSolanaTheme();

  // Detect scroll position for styling changes
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  /**
   * Handles navigation to dashboard with wallet connection check
   */
  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!connected) {
      toast.error('Please connect your wallet to access the dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  /**
   * Generic navigation handler with optional wallet connection requirement
   */
  const handleNavigation = (path: string, needsWallet: boolean = false) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (needsWallet && !connected) {
      toast.error('Please connect your wallet to access this feature');
    } else {
      navigate(path);
    }
  };

  /**
   * Toggles between light and dark theme
   */
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  // Navigation items configuration
  const navItems = [
    { path: '/', label: 'Home', needsWallet: false },
    { path: '/about', label: 'About', needsWallet: false },
    { path: '/how-it-works', label: 'How It Works', needsWallet: false },
    { path: '/risk-pool', label: 'Risk Pool', needsWallet: false },
    { path: '/regulatory-compliance', label: 'Compliance', needsWallet: true },
    { path: '/reputation-score', label: 'Reputation Score', needsWallet: false },
    { path: '/pricing', label: 'Pricing', needsWallet: false }
  ];

  /**
   * Checks if a navigation item is currently active
   */
  const isActive = (path: string) => location.pathname === path;

  return (
    <header 
      className={cn(
        // Base styles
        "sticky top-0 z-50 w-full transition-all duration-200",
        "border-b backdrop-blur supports-[backdrop-filter]:bg-opacity-80",
        // Theme-specific styles
        isDark 
          ? "border-shield-blue/20 bg-gray-900/95 text-gray-100" 
          : "border-shield-purple/20 bg-white/95 text-gray-800",
        // Conditional shadow on scroll
        isScrolled && "shadow-sm"
      )}
    >
      {/* Main Navbar Container */}
      <div className="container flex h-16 items-center justify-between">
        {/* Left Side: Logo and Desktop Navigation */}
        <div className="flex items-center space-x-4">
          {/* Logo and Brand Name */}
          <div 
            onClick={handleNavigation('/')} 
            className={cn(
              "flex items-center space-x-2 cursor-pointer",
              "transition-transform hover:scale-105"
            )}
          >
            <Logo className={cn(
              "h-6 w-6",
              isDark ? "text-shield-blue" : "text-shield-purple"
            )} />
            <span className={cn(
              "font-heading text-xl font-bold",
              isDark ? "text-shield-blue" : "text-shield-purple"
            )}>
              FreelanceShield
            </span>
          </div>
          
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                className={cn(
                  // Base styles
                  "text-sm font-medium transition-colors relative py-1",
                  // Active state styling
                  isActive(item.path) 
                    ? isDark 
                      ? "text-shield-blue font-semibold" 
                      : "text-shield-purple font-semibold"
                    : "hover:text-shield-purple dark:hover:text-shield-blue",
                  // Active indicator line
                  isActive(item.path) && "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5",
                  isActive(item.path) && (isDark ? "after:bg-shield-blue" : "after:bg-shield-purple")
                )}
                onClick={item.needsWallet ? handleNavigation(item.path, true) : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Right Side: Actions and Controls */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={cn(
              // Base styles
              "p-2 rounded-md transition-colors duration-200",
              "border flex items-center justify-center",
              // Theme-specific styles
              isDark 
                ? "border-gray-700 bg-gray-800 hover:bg-gray-700 text-shield-blue" 
                : "border-gray-200 bg-gray-100 hover:bg-gray-200 text-shield-purple"
            )}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          
          {/* Wallet Connection Components */}
          {!connected && (
            <>
              {/* Desktop: Popover, Mobile: Dialog */}
              <div className="hidden md:block">
                <ConnectWalletPopover 
                  className={cn(
                    "border transition-colors",
                    isDark 
                      ? "border-shield-blue text-shield-blue hover:bg-shield-blue/20" 
                      : "border-shield-purple text-shield-purple hover:bg-shield-purple/10"
                  )} 
                />
              </div>
              <div className="md:hidden">
                <ConnectWalletDialog 
                  className={cn(
                    "border transition-colors",
                    isDark 
                      ? "border-shield-blue text-shield-blue hover:bg-shield-blue/20" 
                      : "border-shield-purple text-shield-purple hover:bg-shield-purple/10"
                  )} 
                />
              </div>
            </>
          )}
          
          {/* Dashboard Button - only show if not on dashboard */}
          {location.pathname !== '/dashboard' && (
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                "transition-colors font-medium",
                isDark 
                  ? "text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-white" 
                  : "text-gray-700 border-gray-300 hover:bg-gray-100"
              )}
              onClick={handleDashboardClick}
            >
              Dashboard
            </Button>
          )}
          
          {/* Primary Action Button */}
          <Button 
            className={cn(
              "text-white font-medium transition-colors",
              isDark 
                ? "bg-shield-blue hover:bg-shield-blue/90" 
                : "bg-shield-purple hover:bg-shield-purple/90"
            )}
            onClick={() => navigate('/connect')}
          >
            Select Wallet
          </Button>
          
          {/* Mobile Menu Toggle Button */}
          <button
            className={cn(
              "md:hidden p-2 rounded-md",
              isDark 
                ? "text-gray-300 hover:bg-gray-800" 
                : "text-gray-700 hover:bg-gray-100"
            )}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation Menu (Conditional Render) */}
      {mobileMenuOpen && (
        <div className={cn(
          "md:hidden py-4 px-6 space-y-4 border-t transition-all",
          isDark 
            ? "bg-gray-900 border-gray-800" 
            : "bg-white border-gray-200"
        )}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "block py-2 text-base font-medium transition-colors",
                isActive(item.path) 
                  ? isDark 
                    ? "text-shield-blue font-semibold" 
                    : "text-shield-purple font-semibold"
                  : isDark 
                    ? "text-gray-300 hover:text-shield-blue" 
                    : "text-gray-700 hover:text-shield-purple"
              )}
              onClick={item.needsWallet ? handleNavigation(item.path, true) : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;
