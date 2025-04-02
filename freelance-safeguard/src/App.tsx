import { ThemeProvider } from './components/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletProvider } from './lib/solana/WalletProvider';
import { WalletIntegrationProvider, useWalletIntegrationContext } from './components/wallet/WalletIntegrationProvider';
import { TransactionProvider } from './contexts/TransactionContext';
import { FreelanceInsuranceSDKProvider } from './lib/solana/sdk/context';
import { TestnetDemo } from './pages/TestnetDemo';
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
import WalletDemo from './pages/WalletDemo';
import RegulatoryCompliancePage from './pages/RegulatoryCompliancePage';
import SolanaTestPage from './pages/SolanaTestPage';
import { Toaster as SonnerToaster } from 'sonner';

// Protected route component that redirects to home if wallet is not connected
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
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

if (typeof window.ethereum === 'undefined') {
  // Inject your wallet provider logic here
}

export default function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="freelance-shield-theme">
          <WalletProvider>
            <WalletIntegrationProvider>
              <FreelanceInsuranceSDKProvider>
                <TransactionProvider>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/how-it-works" element={<HowItWorksPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/wallet-demo" element={<WalletDemo />} />
                    
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
                    <Route path="/testnet" element={
                      <ProtectedRoute>
                        <TestnetDemo />
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
                  <Toaster />
                  <SonnerToaster position="top-right" richColors />
                </TransactionProvider>
              </FreelanceInsuranceSDKProvider>
            </WalletIntegrationProvider>
          </WalletProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Router>
  );
}
