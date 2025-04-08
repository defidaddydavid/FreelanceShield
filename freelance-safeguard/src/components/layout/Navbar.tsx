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
import ConnectWalletButton from '@/components/wallet/ConnectWalletButton';
import Logo from '@/components/ui/logo';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';
import ThemeToggleDropdown from '@/components/ui/ThemeToggleDropdown';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

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
          ? "border-shield-blue/30 bg-gray-900 text-white" 
          : "border-shield-purple/20 bg-background/95 text-foreground",
        // Conditional shadow on scroll
        isScrolled && "shadow-sm"
      )}
    >
      {/* Purple underline accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px]">
        <div className={cn(
          "h-full w-full max-w-[50%] mx-auto",
          isDark 
            ? "bg-gradient-to-r from-transparent via-shield-blue to-transparent" 
            : "bg-gradient-to-r from-transparent via-shield-purple to-transparent"
        )} />
      </div>
      
      {/* Main Navbar Container */}
      <div className="container flex h-18 items-center justify-between py-2 mx-auto max-w-full">
        {/* Left Side: Logo and Desktop Navigation */}
        <div className="flex w-full items-center justify-between">
          {/* Logo and Brand Name */}
          <div 
            onClick={handleNavigation('/')} 
            className={cn(
              "flex items-center cursor-pointer min-w-[200px]",
              "transition-transform hover:scale-105"
            )}
          >
            <Logo 
              size={55}
              className="text-shield-purple"
              withText
              textSize="text-lg"
              textColor={isDark ? "text-white" : "text-black"}
              textMargin="ml-4"
            />
          </div>
          
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-10 flex-grow justify-center">
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
                    : isDark
                      ? "text-gray-100 hover:text-shield-blue"
                      : "text-gray-700 hover:text-shield-purple",
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
        <div className="flex items-center space-x-5 min-w-[200px] justify-end">
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-5 ml-4">
            {/* Theme Toggle */}
            <ThemeToggleDropdown className="mr-3" />
            
            {/* Dashboard Button */}
            <Button 
              variant="link" 
              onClick={handleDashboardClick}
              className={cn(
                "text-lg font-medium",
                isActive('/dashboard') 
                  ? "text-shield-purple dark:text-shield-blue" 
                  : "text-foreground/80 hover:text-shield-purple dark:hover:text-shield-blue"
              )}
            >
              Dashboard
            </Button>
            
            {/* Connect Wallet Button */}
            <ConnectWalletButton />
          </div>
          
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                className={cn(
                  "px-0 text-base hover:bg-transparent focus:bg-transparent md:hidden",
                  isDark ? "text-white hover:text-white/80" : "text-gray-700 hover:text-gray-900"
                )}
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className={cn(
                "w-[300px] px-6",
                isDark ? "bg-gray-900 text-white border-r border-shield-blue/30" : "bg-white text-foreground"
              )}
            >
              <SheetHeader className="mb-8">
                <SheetTitle className="text-left">
                  <Link to="/" className="flex items-center text-2xl" onClick={() => setMobileMenuOpen(false)}>
                    <img src="/logo.svg" alt="FreelanceShield Logo" className="w-8 h-8 mr-2" />
                    <span className={cn(
                      "font-bold font-heading", 
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      FreelanceShield
                    </span>
                  </Link>
                </SheetTitle>
                <SheetDescription className={cn(
                  "text-left", 
                  isDark ? "text-gray-300" : "text-gray-500"
                )}>
                  Decentralized Freelance Insurance
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <a
                    key={item.path}
                    href={item.path}
                    onClick={item.needsWallet ? handleNavigation(item.path, true) : handleNavigation(item.path)}
                    className={cn(
                      "px-3 py-2 rounded-md text-lg font-medium",
                      isActive(item.path)
                        ? "bg-shield-purple/10 dark:bg-shield-blue/10 text-shield-purple dark:text-shield-blue"
                        : "text-foreground/80 hover:bg-shield-purple/5 dark:hover:bg-shield-blue/5 hover:text-shield-purple dark:hover:text-shield-blue"
                    )}
                  >
                    {item.label}
                  </a>
                ))}
                
                {/* Theme Toggle in Mobile Menu */}
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-lg font-medium">Theme</span>
                  <ThemeToggleDropdown />
                </div>
                
                {/* Dashboard in Mobile Menu */}
                <a
                  href="/dashboard"
                  onClick={handleDashboardClick}
                  className={cn(
                    "px-3 py-2 rounded-md text-lg font-medium",
                    isActive('/dashboard')
                      ? "bg-shield-purple/10 dark:bg-shield-blue/10 text-shield-purple dark:text-shield-blue"
                      : "text-foreground/80 hover:bg-shield-purple/5 dark:hover:bg-shield-blue/5 hover:text-shield-purple dark:hover:text-shield-blue"
                  )}
                >
                  Dashboard
                </a>
                
                {/* Mobile Wallet Connection */}
                <div className="px-3 py-2">
                  <ConnectWalletButton className="w-full" />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
