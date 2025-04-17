import { SolanaThemeProvider } from './contexts/SolanaThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo, useEffect } from 'react';
import { TransactionProvider } from './contexts/TransactionContext';
import { FreelanceInsuranceSDKProvider } from './lib/solana/sdk/context';
import { Home } from './pages/Home';
import Dashboard from './pages/Dashboard';
import RiskAnalysis from './pages/RiskAnalysis';
import NewPolicy from './pages/NewPolicy';
import AIPremiumCalculator from './pages/AIPremiumCalculator';
import Index from './pages/Index';
import HowItWorksPage from './pages/HowItWorksPage';
import PricingPage from './pages/Pricing';
import StakingPage from './pages/StakingPage';
import RiskPoolDashboard from './pages/RiskPoolDashboard';
import ReputationScorePage from './pages/ReputationScorePage';
import RegulatoryCompliancePage from './pages/RegulatoryCompliancePage';
import SolanaTestPage from './pages/SolanaTestPage';
import ClaimsSystem from './pages/ClaimsSystem';
import ComingSoonPage from './pages/ComingSoonPage';
import { Toaster as SonnerToaster } from 'sonner';
import { ErrorBoundary } from 'react-error-boundary';
import { cn } from "@/lib/utils";
import { SolanaErrorBoundary } from './components/SolanaErrorBoundary';
import { useSolanaTheme } from './contexts/SolanaThemeProvider';
import { initializeTheme } from './utils/theme-utils';

// Import Privy authentication
import { PrivyProvider } from '@privy-io/react-auth';
import { usePrivyAuth } from './hooks/usePrivyAuth';

// Unified SolanaProviders component
const SolanaProviders = ({ children }) => {
  // Set up network for Solana connection
  const network = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
  const endpoint = useMemo(() => {
    return import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(network);
  }, [network]);

  return (
    <SolanaThemeProvider>
      {children}
    </SolanaThemeProvider>
  );
};

// Protected route component that redirects to home if not authenticated with Privy
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, ready } = usePrivyAuth();
  
  // Show nothing while Privy is initializing
  if (!ready) {
    return null;
  }
  
  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Improved error fallback with theme support
function ErrorFallback({ error }) {
  const { isDark } = useSolanaTheme();
  
  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-4",
      "bg-background text-foreground",
      isDark ? "bg-[#0a0a0a]" : "bg-white"
    )}>
      <div className={cn(
        "max-w-md w-full p-6 rounded-lg border shadow-lg",
        isDark 
          ? "bg-gray-800 border-gray-700" 
          : "bg-white border-gray-200"
      )}>
        <h2 className={cn(
          "text-xl font-heading font-bold mb-4",
          isDark ? "text-white" : "text-gray-900"
        )}>
          Something went wrong
        </h2>
        <p className={cn(
          "mb-4",
          isDark ? "text-gray-300" : "text-gray-600"
        )}>
          An error occurred while rendering the application:
        </p>
        <pre className={cn(
          "p-4 rounded overflow-auto text-sm",
          isDark 
            ? "bg-gray-900 text-gray-300" 
            : "bg-gray-100 text-gray-800"
        )}>
          {error.message}
        </pre>
        <button 
          onClick={() => window.location.reload()}
          className={cn(
            "mt-4 px-4 py-2 rounded-md text-white font-medium",
            isDark 
              ? "bg-shield-blue hover:bg-shield-blue/90" 
              : "bg-shield-purple hover:bg-shield-purple/90"
          )}
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

// Launch gate component to redirect all traffic to coming soon page
// Set isPreLaunch to false when ready to launch the full app
const LaunchGate = () => {
  // Set to false to show the actual app, true to show the coming soon page
  const isPreLaunch = false;
  
  // Check if developer mode is enabled via localStorage
  const bypassEnabled = localStorage.getItem('freelanceShield_devBypass') === 'true';
  
  // An allowlist of paths that bypass the gate (for development/testing)
  const allowedPaths = ['/coming-soon'];
  
  // Skip the gate if we're on an allowed path or developer bypass is enabled
  const pathname = window.location.pathname;
  const isAllowedPath = allowedPaths.includes(pathname);
  
  if (isPreLaunch && !isAllowedPath && !bypassEnabled) {
    return <Navigate to="/coming-soon" replace />;
  }
  
  return <Outlet />;
};

export default function App() {
  const { isDark, setTheme } = useSolanaTheme();

  // Initialize the application with dark mode as default
  useEffect(() => {
    // Apply the theme immediately to prevent flash of light theme
    initializeTheme();
    
    // Ensure dark mode is set as the default theme
    setTheme('dark');
    
    // Add dark mode meta tag for better mobile integration
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      const newMeta = document.createElement('meta');
      newMeta.name = 'theme-color';
      newMeta.content = '#0a0a0a'; // Dark background color
      document.head.appendChild(newMeta);
    }
  }, [setTheme]);

  // Privy configuration
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID || '';

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className={cn(
        "min-h-screen",
        isDark ? "bg-[#0a0a0a]" : "bg-white"
      )}>
        <Router>
          <QueryClientProvider client={queryClient}>
            <PrivyProvider
              appId={privyAppId}
              config={{
                loginMethods: ['email', 'wallet'],
                appearance: {
                  theme: isDark ? 'dark' : 'light',
                  accentColor: '#9945FF',
                  logo: '/logo.svg',
                },
                embeddedWallets: {
                  createOnLogin: 'users-without-wallets',
                },
              }}
            >
              <SolanaProviders>
                <FreelanceInsuranceSDKProvider>
                  <TransactionProvider>
                    <Routes>
                      {/* Coming Soon page */}
                      <Route path="/coming-soon" element={<ComingSoonPage />} />
                      
                      {/* All other routes are wrapped in the LaunchGate */}
                      <Route element={<LaunchGate />}>
                        <Route path="/" element={<Index />} />
                        <Route path="/how-it-works" element={<HowItWorksPage />} />
                        <Route path="/pricing" element={<PricingPage />} />
                        
                        {/* Risk Pool Dashboard is public for transparency */}
                        <Route path="/risk-pool" element={<RiskPoolDashboard />} />
                        
                        {/* Solana Integration Test Page */}
                        <Route path="/solana-test" element={<SolanaTestPage />} />
                        
                        {/* All routes below require wallet connection */}
                        <Route path="/reputation-score" element={
                          <ProtectedRoute>
                            <ReputationScorePage />
                          </ProtectedRoute>
                        } />
                        <Route path="/dashboard" element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        } />
                        <Route path="/risk-analysis" element={
                          <ProtectedRoute>
                            <RiskAnalysis />
                          </ProtectedRoute>
                        } />
                        <Route path="/claims-system" element={
                          <ProtectedRoute>
                            <ClaimsSystem />
                          </ProtectedRoute>
                        } />
                        <Route path="/new-policy" element={
                          <ProtectedRoute>
                            <NewPolicy />
                          </ProtectedRoute>
                        } />
                        <Route path="/ai-premium-calculator" element={
                          <ProtectedRoute>
                            <AIPremiumCalculator />
                          </ProtectedRoute>
                        } />
                        <Route path="/staking" element={
                          <ProtectedRoute>
                            <StakingPage />
                          </ProtectedRoute>
                        } />
                        <Route path="/regulatory-compliance" element={
                          <ProtectedRoute>
                            <Navigate to="/regulatory-compliance/new" replace />
                          </ProtectedRoute>
                        } />
                        <Route path="/regulatory-compliance/new" element={
                          <ProtectedRoute>
                            <RegulatoryCompliancePage />
                          </ProtectedRoute>
                        } />
                        {/* Redirect all unknown routes to home */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Route>
                    </Routes>
                    
                    {/* Unified toast system */}
                    <SonnerToaster 
                      position="top-right" 
                      richColors 
                      className="toaster-wrapper" 
                    />
                  </TransactionProvider>
                </FreelanceInsuranceSDKProvider>
              </SolanaProviders>
            </PrivyProvider>
          </QueryClientProvider>
        </Router>
      </div>
    </ErrorBoundary>
  );
}
