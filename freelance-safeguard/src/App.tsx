import { SolanaThemeProvider } from './contexts/SolanaThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { useWallet, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BraveWalletAdapter,
  CoinbaseWalletAdapter,
  LedgerWalletAdapter,
  SlopeWalletAdapter,
  TorusWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { ConnectionProvider } from '@solana/wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';
import { WalletIntegrationProvider, useWalletIntegrationContext } from './components/wallet/WalletIntegrationProvider';
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
import { Toaster as SonnerToaster } from 'sonner';
import { ErrorBoundary } from 'react-error-boundary';
import { cn } from "@/lib/utils";

// Unified SolanaProviders component
const SolanaProviders = ({ children }) => {
  // Set up network and wallet adapters
  const network = process.env.VITE_SOLANA_NETWORK || 'devnet';
  const endpoint = useMemo(() => {
    return process.env.VITE_SOLANA_RPC_URL || clusterApiUrl(network);
  }, [network]);

  // Set up wallet adapters
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new BackpackWalletAdapter(),
    new BraveWalletAdapter(),
    new CoinbaseWalletAdapter(),
    new LedgerWalletAdapter(),
    new SlopeWalletAdapter(),
    new TorusWalletAdapter()
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: 'confirmed' }}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SolanaThemeProvider>
            {children}
          </SolanaThemeProvider>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

// Protected route component that redirects to home if wallet is not connected
const ProtectedRoute = ({ children }) => {
  // Use both wallet adapters for compatibility during transition
  const { connected } = useWallet();
  const { walletInfo } = useWalletIntegrationContext();
  
  // Allow access if either wallet is connected
  if (!connected && !walletInfo.connected) {
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
      isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
    )}>
      <div className={cn(
        "max-w-md w-full p-6 rounded-lg border shadow-lg",
        isDark 
          ? "bg-gray-800 border-gray-700" 
          : "bg-white border-gray-200"
      )}>
        <h2 className={cn(
          "text-xl font-heading font-bold mb-4",
          isDark ? "text-shield-blue" : "text-shield-purple"
        )}>
          Something went wrong
        </h2>
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

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Router>
        <QueryClientProvider client={queryClient}>
          <SolanaProviders>
            <WalletIntegrationProvider>
              <FreelanceInsuranceSDKProvider>
                <TransactionProvider>
                  <Routes>
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
                  </Routes>
                  
                  {/* Unified toast system */}
                  <SonnerToaster 
                    position="top-right" 
                    richColors 
                    className="toaster-wrapper" 
                  />
                </TransactionProvider>
              </FreelanceInsuranceSDKProvider>
            </WalletIntegrationProvider>
          </SolanaProviders>
        </QueryClientProvider>
      </Router>
    </ErrorBoundary>
  );
}
