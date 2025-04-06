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
        isScrolled ? 'bg-white dark:bg-gray-900 py-3 shadow-md' : 'bg-white dark:bg-gray-900 py-3'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div onClick={handleNavigation('/')} className="flex items-center space-x-2 group cursor-pointer">
          <Logo size={32} withText={true} textSize="text-xl" className="text-deep-purple" />
        </div>
        
        <nav className="hidden md:flex items-center space-x-8 ml-12">
          {navItems.map((item, index) => (
            <a 
              key={index} 
              href={item.path}
              onClick={handleNavigation(item.path, item.needsWallet)}
              className={`text-gray-700 dark:text-gray-300 hover:text-deep-purple dark:hover:text-deep-purple transition-colors ${
                location.pathname === item.path ? 'text-deep-purple font-["NT_Brick_Sans"]' : ''
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
        
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggleButton />
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
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 shadow-lg">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item, index) => (
                <a 
                  key={index} 
                  href={item.path}
                  onClick={handleNavigation(item.path, item.needsWallet)}
                  className={`text-gray-700 dark:text-gray-300 hover:text-deep-purple dark:hover:text-deep-purple transition-colors ${
                    location.pathname === item.path ? 'text-deep-purple font-["NT_Brick_Sans"]' : ''
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            
            <div className="flex flex-col space-y-3">
              {location.pathname !== '/dashboard' && (
                <Button 
                  variant="outline" 
                  className="w-full justify-center text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
                  onClick={handleDashboardClick}
                >
                  Dashboard
                </Button>
              )}
              <Button 
                className="w-full justify-center bg-deep-purple hover:bg-deep-purple/90 text-white"
                onClick={() => navigate('/connect')}
              >
                Select Wallet
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
