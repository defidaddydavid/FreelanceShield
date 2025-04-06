import React, { useState } from 'react';
import { FreelanceShieldLogo } from '../ui/freelance-shield-logo';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

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
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-3 rounded-md transition-colors ${
        active 
          ? 'bg-deep-purple text-white' 
          : 'text-gray-300 hover:bg-deep-purple/20 hover:text-white'
      }`}
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
  const navigate = useNavigate();
  const location = useLocation();
  const { connected } = useWallet();

  const navItems = [
    { 
      icon: <HomeIcon className="w-6 h-6" />, 
      label: 'Dashboard', 
      path: '/dashboard' 
    },
    { 
      icon: <ShieldCheckIcon className="w-6 h-6" />, 
      label: 'Insurance', 
      path: '/insurance' 
    },
    { 
      icon: <CurrencyDollarIcon className="w-6 h-6" />, 
      label: 'Claims', 
      path: '/claims' 
    },
    { 
      icon: <DocumentTextIcon className="w-6 h-6" />, 
      label: 'Contracts', 
      path: '/contracts' 
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
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-gray-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
            <FreelanceShieldLogo />
            <button 
              className="p-1 rounded-md lg:hidden hover:bg-gray-700"
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
          <div className="p-4 border-t border-gray-700">
            {connected ? (
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserCircleIcon className="w-10 h-10 text-electric-blue" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">Connected Wallet</p>
                  <p className="text-xs text-gray-400">Solana</p>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <WalletMultiButton className="w-full !bg-deep-purple hover:!bg-deep-purple/90" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center">
            <button
              className="p-1 mr-4 rounded-md lg:hidden hover:bg-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold">FreelanceShield</h1>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-1 rounded-md hover:bg-gray-700">
              <BellIcon className="w-6 h-6" />
            </button>
            <div className="hidden lg:block">
              <WalletMultiButton className="!bg-deep-purple hover:!bg-deep-purple/90" />
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-900 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
