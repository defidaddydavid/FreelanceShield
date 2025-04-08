import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';
import { cn } from '@/lib/utils';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import Logo from '@/components/ui/logo';

// Icons
import { 
  HomeIcon, 
  ShieldCheckIcon, 
  CurrencyDollarIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  CogIcon, 
  Bars3Icon as MenuIcon, 
  XMarkIcon as XIcon,
  BellIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
  const { isDark } = useSolanaTheme();
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full px-4 py-3 rounded-md transition-colors",
        active 
          ? isDark 
            ? "bg-shield-blue text-white" 
            : "bg-shield-purple text-white"
          : isDark
            ? "text-gray-300 hover:bg-shield-blue/20 hover:text-white"
            : "text-gray-700 hover:bg-shield-purple/20 hover:text-gray-900"
      )}
    >
      <div className="w-6 h-6 mr-3">{icon}</div>
      <span className="font-medium">{label}</span>
    </button>
  );
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { isDark, setTheme } = useSolanaTheme();

  // Fetch wallet balance when connected
  useEffect(() => {
    if (connected && publicKey && connection) {
      const fetchBalance = async () => {
        try {
          const balance = await connection.getBalance(publicKey);
          setBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error('Error fetching balance:', error);
          setBalance(null);
        }
      };
      
      fetchBalance();
      
      // Set up interval to refresh balance
      const intervalId = setInterval(fetchBalance, 30000);
      return () => clearInterval(intervalId);
    }
  }, [connected, publicKey, connection]);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const navItems = [
    { 
      icon: <HomeIcon className="w-6 h-6" />, 
      label: 'Dashboard', 
      path: '/dashboard' 
    },
    { 
      icon: <ShieldCheckIcon className="w-6 h-6" />, 
      label: 'Insurance', 
      path: '/new-policy' 
    },
    { 
      icon: <CurrencyDollarIcon className="w-6 h-6" />, 
      label: 'Claims', 
      path: '/claims-system' 
    },
    { 
      icon: <DocumentTextIcon className="w-6 h-6" />, 
      label: 'Contracts', 
      path: '/risk-analysis?tab=contracts' 
    },
    { 
      icon: <UserGroupIcon className="w-6 h-6" />, 
      label: 'Community', 
      path: '/community' 
    },
    { 
      icon: <CogIcon className="w-6 h-6" />, 
      label: 'Settings', 
      path: '/settings' 
    },
  ];

  return (
    <div className={cn(
      "flex h-screen",
      isDark 
        ? "bg-gray-900 text-white" 
        : "bg-gray-50 text-gray-900"
    )}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isDark 
            ? "bg-gray-800" 
            : "bg-white",
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn(
            "flex items-center justify-between h-16 px-4 border-b",
            isDark 
              ? "border-gray-700" 
              : "border-gray-200"
          )}>
            <Logo 
              withText={false} 
              size={32} 
              className="cursor-pointer"
              onClick={() => navigate('/')}
            />
            <button 
              className={cn(
                "p-1 rounded-md lg:hidden",
                isDark 
                  ? "hover:bg-gray-700" 
                  : "hover:bg-gray-100"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                path={item.path}
                active={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
              />
            ))}
          </nav>

          {/* User section */}
          <div className={cn(
            "p-4 border-t",
            isDark 
              ? "border-gray-700" 
              : "border-gray-200"
          )}>
            {connected ? (
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserCircleIcon className={cn(
                    "w-10 h-10",
                    isDark 
                      ? "text-shield-blue" 
                      : "text-shield-purple"
                  )} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">Connected Wallet</p>
                  <p className={cn(
                    "text-xs",
                    isDark 
                      ? "text-gray-400" 
                      : "text-gray-500"
                  )}>
                    {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <WalletMultiButton className={cn(
                  "w-full !transition-colors",
                  isDark 
                    ? "!bg-shield-blue hover:!bg-shield-blue/90" 
                    : "!bg-shield-purple hover:!bg-shield-purple/90"
                )} />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className={cn(
          "flex items-center justify-between h-16 px-6 border-b",
          isDark 
            ? "bg-gray-800 border-gray-700" 
            : "bg-white border-gray-200"
        )}>
          <div className="flex items-center">
            <button
              className={cn(
                "p-1 mr-4 rounded-md lg:hidden",
                isDark 
                  ? "hover:bg-gray-700" 
                  : "hover:bg-gray-100"
              )}
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-heading font-semibold">FreelanceShield</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className={cn(
                "p-2 rounded-md transition-colors",
                isDark 
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>
            
            <button className={cn(
              "p-1 rounded-md",
              isDark 
                ? "hover:bg-gray-700" 
                : "hover:bg-gray-100"
            )}>
              <BellIcon className="w-6 h-6" />
            </button>
            <div className="hidden lg:block">
              <WalletMultiButton className={cn(
                "!transition-colors",
                isDark 
                  ? "!bg-shield-blue hover:!bg-shield-blue/90" 
                  : "!bg-shield-purple hover:!bg-shield-purple/90"
              )} />
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className={cn(
          "flex-1 overflow-y-auto p-6",
          isDark 
            ? "bg-gray-900" 
            : "bg-gray-50"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
