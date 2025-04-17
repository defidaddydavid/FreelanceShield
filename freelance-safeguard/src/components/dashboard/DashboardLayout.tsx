import { ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useInsuranceOperations } from '@/hooks/useInsuranceOperations';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, daysRemaining, formatAddress } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ThemeToggleButton } from '@/components/ui/theme-toggle-button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Logo from '@/components/ui/logo';
import GlassCard from '@/components/ui/GlassCard';
import { 
  LayoutDashboard, 
  Shield, 
  FileText, 
  BarChart2, 
  Settings, 
  HelpCircle, 
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Home,
  ExternalLink,
  MonitorPlay,
  Coins,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { DashboardWalletInfo } from '@/components/wallet/DashboardWalletInfo';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { publicKey, disconnect } = useWallet();
  const { 
    policyDetails, 
    claims, 
    riskPoolMetrics,
    isPolicyLoading, 
    isClaimsLoading,
    isMetricsLoading,
    isWalletConnected
  } = useInsuranceOperations();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Get active claims count
  const activeClaims = claims.filter(claim => claim.status === 'pending' || claim.status === 'arbitration');
  
  // Calculate policy time remaining percentage
  const getTimeRemainingPercentage = () => {
    if (!policyDetails) return 0;
    const totalDays = (policyDetails.endDate.getTime() - policyDetails.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysLeft = daysRemaining(policyDetails.endDate);
    return Math.max(0, Math.min(100, (daysLeft / totalDays) * 100));
  };

  // Calculate reputation score
  const getReputationScore = () => {
    return {
      score: 785,
      max: 1000,
      percentage: 78.5,
      factors: [
        { name: "Premium Discount", value: "15%", score: 0 },
        { name: "On-time Delivery", value: "4.9", score: 0 },
        { name: "Payment History", value: "5", score: 0 },
        { name: "Claim History", value: "4.7", score: 0 }
      ]
    };
  };

  const reputationData = getReputationScore();

  // Navigation items
  const navItems = [
    { name: "Overview", icon: <LayoutDashboard className="w-5 h-5" />, path: "/dashboard" },
    { name: "My Policies", icon: <Shield className="w-5 h-5" />, path: "/dashboard" },
    { name: "Risk Analysis", icon: <BarChart2 className="w-5 h-5" />, path: "/risk-analysis" },
    { name: "Staking", icon: <Coins className="w-5 h-5" />, path: "/staking" },
  ];

  const settingsItems = [
    { name: "Settings", icon: <Settings className="w-5 h-5" />, path: "/settings" },
    { name: "Help", icon: <HelpCircle className="w-5 h-5" />, path: "/help" },
  ];

  // Handle scroll event to change header appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-background dark:bg-background">
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar-background border-r border-sidebar-border transition-transform duration-300 ease-in-out transform",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo and close button for mobile */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <div className="flex items-center">
              <Logo className="h-8 w-8 mr-2" />
              <span className="font-bold text-lg">FreelanceShield</span>
            </div>
            <button 
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
              onClick={toggleMobileMenu}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Navigation links */}
          <div className="flex-1 py-6 px-4 overflow-y-auto">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start mb-1",
                    location.pathname === item.path ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Button>
              ))}
            </div>
            
            <div className="mt-10">
              <h3 className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Settings
              </h3>
              <div className="space-y-1">
                {settingsItems.map((item) => (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          {/* User wallet info */}
          {isWalletConnected ? (
            <div className="p-4 border-t border-sidebar-border">
              <DashboardWalletInfo />
              <Button 
                variant="outline" 
                className="w-full mt-2 text-muted-foreground hover:text-destructive hover:border-destructive/50 flex items-center justify-center"
                onClick={() => disconnect()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="p-4 border-t border-sidebar-border">
              <WalletMultiButton className="w-full" />
            </div>
          )}
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={cn(
          "sticky top-0 z-40 w-full transition-all duration-200",
          isScrolled ? "bg-background/80 backdrop-blur-md border-b shadow-sm" : "bg-transparent"
        )}>
          <div className="flex h-16 items-center justify-between px-4">
            {/* Mobile menu button */}
            <button 
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Header actions */}
            <div className="flex items-center ml-auto space-x-4">
              <ThemeToggleButton />
              
              {isWalletConnected ? (
                <div className="hidden md:flex items-center space-x-1">
                  <Badge variant="outline" className="font-mono bg-primary/10 text-primary">
                    {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
                  </Badge>
                </div>
              ) : (
                <WalletMultiButton className="hidden md:flex" />
              )}
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {children}
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="border-t border-border py-6 px-4">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <Logo className="h-6 w-6 mr-2" />
                <span className="font-medium">FreelanceShield</span>
                <span className="text-muted-foreground text-sm ml-2"> 2023</span>
              </div>
              
              <div className="flex space-x-6">
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
