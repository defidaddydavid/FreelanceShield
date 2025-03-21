import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WalletConnect from '@/components/wallet/WalletConnect';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import Logo from '@/components/ui/logo';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { connected } = useWallet();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!connected) {
      toast.error('Please connect your wallet to access the dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleNavigation = (path: string, needsWallet: boolean = false) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (needsWallet && !connected) {
      toast.error('Please connect your wallet to access this feature');
    } else {
      navigate(path);
    }
  };

  // Navigation items with wallet requirements
  const navItems = [
    { path: '/', label: 'Home', needsWallet: false },
    { path: '/about', label: 'About', needsWallet: false },
    { path: '/how-it-works', label: 'How It Works', needsWallet: false },
    { path: '/risk-pool', label: 'Risk Pool', needsWallet: false },
    { path: '/regulatory-compliance', label: 'Compliance', needsWallet: true },
    { path: '/reputation-score', label: 'Reputation Score', needsWallet: false },
    { path: '/pricing', label: 'Pricing', needsWallet: false }
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass-effect py-3 shadow-md' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div onClick={handleNavigation('/')} className="flex items-center space-x-2 group cursor-pointer">
          <Logo size={32} className="text-shield-blue dark:text-blue-500 group-hover:animate-spin-slow transition-all duration-300" />
          <span className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 opacity-90 group-hover:opacity-100 transition-all duration-300">FreelanceShield</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item, index) => (
            <a 
              key={index} 
              href={item.path}
              onClick={handleNavigation(item.path, item.needsWallet)}
              className={`text-foreground/80 hover:text-foreground transition-colors relative group overflow-hidden ${
                location.pathname === item.path ? 'text-blue-600 dark:text-blue-400 font-medium' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 group-hover:w-full transition-all duration-300"></span>
            </a>
          ))}
        </nav>
        
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggleButton />
          {location.pathname !== '/dashboard' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="hover-lift hover-glow"
              onClick={handleDashboardClick}
            >
              Dashboard
            </Button>
          )}
          {connected && (
            <Button 
              variant="outline" 
              size="sm" 
              className="hover-lift hover-glow flex items-center gap-1"
              onClick={handleNavigation('/staking')}
            >
              <Coins className="h-4 w-4" />
              <span>Staking</span>
            </Button>
          )}
          <div className="animate-fade-in">
            <WalletConnect />
          </div>
        </div>
        
        <button 
          className="md:hidden text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="h-6 w-6 animate-fade-in" /> : <Menu className="h-6 w-6 animate-fade-in" />}
        </button>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-effect mt-3 p-4 mx-4 rounded-xl animate-fade-in-up shadow-lg">
          <nav className="flex flex-col space-y-4">
            {navItems.map((item, index) => (
              <a 
                key={index} 
                href={item.path}
                onClick={handleNavigation(item.path, item.needsWallet)}
                className={`text-foreground/80 hover:text-foreground transition-colors p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                  location.pathname === item.path ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-2 border-t border-border flex flex-col space-y-3">
              <div className="flex items-center justify-between p-2">
                <span className="text-foreground/80">Theme</span>
                <ThemeToggleButton />
              </div>
              {location.pathname !== '/dashboard' && (
                <Button 
                  variant="outline" 
                  className="w-full hover-lift"
                  onClick={handleDashboardClick}
                >
                  Dashboard
                </Button>
              )}
              {connected && (
                <Button 
                  variant="outline" 
                  className="w-full hover-lift flex items-center justify-center gap-1"
                  onClick={handleNavigation('/staking')}
                >
                  <Coins className="h-4 w-4" />
                  <span>Staking</span>
                </Button>
              )}
              <div className="w-full">
                <WalletConnect />
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
