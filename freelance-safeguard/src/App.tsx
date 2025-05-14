import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { useMemo, useEffect, useState } from 'react';
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
import RiskPoolDashboard from './pages/RiskPoolDashboard';
import ReputationScorePage from './pages/ReputationScorePage';
import RegulatoryCompliancePage from './pages/RegulatoryCompliancePage';
import ClaimsSystem from './pages/ClaimsSystem';
import ComingSoonPage from './pages/ComingSoonPage';
import PrivyTestPage from './pages/PrivyTestPage';
import EthosTestPage from './pages/EthosTestPage';
import { Toaster as SonnerToaster } from 'sonner';
import { ErrorBoundary } from 'react-error-boundary';
import { cn } from "@/lib/utils";
import { initializeTheme } from './utils/theme-utils';
import MainLogo from '@/assets/wallets/Main logo.png';
import PhantomIcon from '@/assets/wallets/phantom.svg';

// Import Privy authentication
import { usePrivyAuth } from './hooks/usePrivyAuth';
import { useAuthRedirect } from './hooks/useAuthRedirect';
import { PrivyProvider } from '@privy-io/react-auth';

// Protected route component that redirects to home if not authenticated with Privy
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, ready } = usePrivyAuth();
  
  // Show loading indicator while Privy is initializing
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Simple auth redirect component to handle redirecting authenticated users to dashboard
const AuthRedirect = ({ children }) => {
  const { isAuthenticated, ready } = usePrivyAuth();
  const navigate = useNavigate();
  
  // Only redirect if authenticated and ready
  useEffect(() => {
    if (ready && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [ready, isAuthenticated, navigate]);
  
  // Show loading spinner while Privy is initializing
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
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
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
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
          We apologize for the inconvenience. Please try refreshing the page or contact support if the issue persists.
        </p>
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-sm text-red-800 font-mono whitespace-pre-wrap break-all">
            {error.message}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

// Launch gate component to redirect all traffic to coming soon page
// Set isPreLaunch to false when ready to launch the full app
const LaunchGate = () => {
  const isPreLaunch = false;
  return isPreLaunch ? <ComingSoonPage /> : <Outlet />;
};

function App() {
  // Initialize theme on app load
  useEffect(() => {
    initializeTheme();
  }, []);

  // Privy configuration
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID || 'clqd6kcfk00ztl80fpw2l6pmn';
  
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="app">
        <PrivyProvider
          appId={privyAppId}
          config={{
            appearance: {
              accentColor: "#9945FF",
              theme: "dark",
              showWalletLoginFirst: true,
              logo: MainLogo,
              walletChainType: "solana-only",
            },
            loginMethods: ['email', 'google', 'twitter', 'github', 'wallet'],
            embeddedWallets: {
              createOnLogin: 'users-without-wallets',
            },
            externalWallets: {
              solana: {
                connectors: ['phantom', 'solflare', 'backpack', 'solana'],
              },
            },
          }}
        >
          <QueryClientProvider client={queryClient}>
            <Router>
              <TransactionProvider>
                <FreelanceInsuranceSDKProvider>
                  <Routes>
                    <Route element={<LaunchGate />}>
                      {/* Public routes wrapped in AuthRedirect to handle authenticated users */}
                      <Route path="/" element={
                        <AuthRedirect>
                          <Index />
                        </AuthRedirect>
                      } />
                      <Route path="/how-it-works" element={
                        <AuthRedirect>
                          <HowItWorksPage />
                        </AuthRedirect>
                      } />
                      <Route path="/pricing" element={
                        <AuthRedirect>
                          <PricingPage />
                        </AuthRedirect>
                      } />
                      
                      {/* Risk Pool Dashboard is public for transparency */}
                      <Route path="/risk-pool" element={<RiskPoolDashboard />} />
                      
                      {/* Privy Integration Test Page */}
                      <Route path="/privy-test" element={<PrivyTestPage />} />
                      
                      {/* Ethos Integration Test Page */}
                      <Route path="/ethos-test" element={<EthosTestPage />} />
                      
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
                      {/* [DISABLED] Staking route removed for initial launch
                      <Route path="/staking" element={
                        <ProtectedRoute>
                          <StakingPage />
                        </ProtectedRoute>
                      } />
                      */}
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
                </FreelanceInsuranceSDKProvider>
              </TransactionProvider>
            </Router>
          </QueryClientProvider>
        </PrivyProvider>
      </div>
    </ErrorBoundary>
  );
}

export default App;
