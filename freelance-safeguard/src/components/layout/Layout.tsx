import React from 'react';
import PrivyNavbar from './PrivyNavbar';
import Footer from './Footer';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Layout component that provides a consistent structure for all pages
 * Includes the navbar and footer with proper dark/light mode styling
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isDark } = useSolanaTheme();
  
  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      isDark ? "bg-[#0a0a0a] text-white" : "bg-white text-foreground"
    )}>
      <PrivyNavbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
