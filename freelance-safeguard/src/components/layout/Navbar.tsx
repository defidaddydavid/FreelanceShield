import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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
    <header className="sticky top-0 z-50 w-full border-b border-shield-purple/20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-shield-blue/20 dark:bg-gray-900/95">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div onClick={handleNavigation('/')} className="flex items-center space-x-2 cursor-pointer">
            <Logo className="h-6 w-6 text-shield-purple dark:text-shield-blue" />
            <span className="font-heading text-xl font-bold text-shield-purple dark:text-shield-blue">
              FreelanceShield
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-sm font-medium transition-colors hover:text-shield-purple dark:hover:text-shield-blue">
              Dashboard
            </Link>
            <Link to="/risk-pool" className="text-sm font-medium transition-colors hover:text-shield-purple dark:hover:text-shield-blue">
              Risk Pool
            </Link>
            <Link to="/how-it-works" className="text-sm font-medium transition-colors hover:text-shield-purple dark:hover:text-shield-blue">
              How It Works
            </Link>
            <Link to="/regulatory-compliance" className="text-sm font-medium transition-colors hover:text-shield-purple dark:hover:text-shield-blue">
              Compliance
            </Link>
            <Link to="/about" className="text-sm font-medium transition-colors hover:text-shield-purple dark:hover:text-shield-blue">
              About
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggleButton />
          <WalletConnect 
            className="border-shield-purple text-shield-purple hover:bg-shield-purple/10 
                      dark:border-shield-blue dark:text-shield-blue dark:hover:bg-shield-blue/20" 
          />
          {location.pathname !== '/dashboard' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={handleDashboardClick}
            >
              Dashboard
            </Button>
          )}
          <Button 
            className="bg-deep-purple hover:bg-deep-purple/90 text-white"
            onClick={() => navigate('/connect')}
          >
            Select Wallet
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
