import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wallet, 
  Shield, 
  CheckCircle, 
  FileText, 
  Calculator, 
  Clock, 
  Coins, 
  Award,
  ArrowRight,
  ArrowDown,
  ChevronDown,
  BarChart4,
  DollarSign,
  User,
  Zap,
  Lock,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Landmark,
  Vote,
  Database,
  FileQuestion,
  ArrowDownRight,
  ArrowUpRight,
  Percent,
  UploadCloud,
  FileCheck,
  Users,
  MessageSquare,
  AlertCircle,
  Info,
  Loader2,
  Unlock,
  Minus
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { NETWORK_CONFIG, RISK_WEIGHTS } from '@/lib/solana/constants';
import { useRiskPoolData } from '@/lib/solana/hooks/useRiskPoolData';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const RiskPoolDashboard = () => {
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const wallet = useWallet();
  const { connected } = wallet;
  
  // Use the risk pool data hook to get real-time data from Solana
  const poolState = useRiskPoolData();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
  };

  // Render connection status message
  const renderConnectionStatus = () => {
    if (poolState.isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading risk pool data from Solana...</p>
        </div>
      );
    }
    
    if (poolState.error) {
      return (
        <Alert variant="destructive" className="max-w-2xl mx-auto my-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            {poolState.error}. Please try refreshing the page or check your network connection.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!connected) {
      return (
        <Alert className="max-w-2xl mx-auto my-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle>Viewing Public Risk Pool Data</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            You're viewing public risk pool metrics. Connect your wallet to access personalized features and your stake information.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Navbar />
      
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative py-20 px-6 md:px-10 max-w-7xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <Badge variant="outline" className="mb-4 px-3 py-1 border-primary/20 bg-primary/5 text-primary">
            <Database className="w-4 h-4 mr-1" /> Risk Pool Dashboard
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            FreelanceShield Risk Pool
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Real-time metrics and insights into the decentralized risk pool that powers FreelanceShield's insurance policies.
          </p>
        </motion.div>
        
        {/* Connection status and loading states */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {renderConnectionStatus()}
        </motion.div>

        {/* Dashboard content visible to all users regardless of connection status */}
        {!poolState.isLoading && !poolState.error && (
          <>
            {/* Key Metrics Section */}
            <section className="py-12">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* TVL Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <Card className="h-full border-2 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          Total Value Locked
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(poolState.totalValueLocked)} USDC
                        </div>
                        {poolState.weeklyGrowth > 0 ? (
                          <div className="flex items-center gap-1 mt-2 text-sm text-green-600 dark:text-green-400">
                            <ArrowUpRight className="h-4 w-4" />
                            <span>+{poolState.weeklyGrowth}% this week</span>
                          </div>
                        ) : poolState.weeklyGrowth < 0 ? (
                          <div className="flex items-center gap-1 mt-2 text-sm text-red-600 dark:text-red-400">
                            <ArrowDownRight className="h-4 w-4" />
                            <span>{poolState.weeklyGrowth}% this week</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <Minus className="h-4 w-4" />
                            <span>No change this week</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Active Policies Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card className="h-full border-2 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          Active Policies
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                          {poolState.activePolicies}
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-sm text-green-600 dark:text-green-400">
                          <TrendingUp className="h-4 w-4" />
                          <span>+{poolState.newPoliciesWeekly} this week</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Claims Paid Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    <Card className="h-full border-2 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          Claims Paid
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                          {poolState.claimsPaid}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          Last: {formatRelativeTime(poolState.lastClaimDate)}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Solvency Ratio Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    viewport={{ once: true }}
                  >
                    <Card className="h-full border-2 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          Solvency Ratio
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                          {poolState.solvencyRatio}%
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-sm text-green-600 dark:text-green-400">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Very Strong</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Pool Visualization Section */}
            <section className="py-12 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20 mx-4 md:mx-8 lg:mx-12">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* Left side - Pool Visualization */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="bg-white dark:bg-background rounded-xl p-6 shadow-md"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        Risk Pool Allocation
                      </h3>
                      <span className="text-xs text-muted-foreground">Updated {formatRelativeTime(poolState.lastUpdateTime)}</span>
                    </div>

                    <div className="h-[300px] relative">
                      {/* Circular progress visualization similar to How It Works page */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full max-w-[250px] aspect-square rounded-full border-8 border-indigo-200 dark:border-indigo-800/50 relative">
                          <motion.div 
                            className="absolute inset-0 rounded-full border-8 border-t-indigo-600 dark:border-t-indigo-400 border-r-transparent border-b-transparent border-l-transparent"
                            initial={{ rotate: 0 }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                          />
                          
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{poolState.solvencyRatio}%</span>
                            <span className="text-sm text-muted-foreground">Solvency</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Active Coverage</div>
                        <div className="text-lg font-semibold">{formatCurrency(poolState.activeCoverageAmount)} USDC</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Reserve Ratio</div>
                        <div className="text-lg font-semibold">{poolState.reserveRatio}%</div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Yield Generated</div>
                        <div className="text-lg font-semibold">{formatCurrency(poolState.yieldGenerated)} USDC</div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Avg Premium</div>
                        <div className="text-lg font-semibold">{formatCurrency(poolState.averagePremium)} USDC</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Right side - Pool Information */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-2xl font-semibold mb-4">How Our Risk Pool Works</h3>
                      <p className="text-muted-foreground mb-6">
                        FreelanceShield's risk pool is a smart contract-based system that aggregates premiums and manages claims transparently on the Solana blockchain.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mt-0.5">
                          1
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Premium Collection</h4>
                          <p className="text-sm text-muted-foreground">All premiums are collected in a transparent on-chain pool in USDC</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mt-0.5">
                          2
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Risk Diversification</h4>
                          <p className="text-sm text-muted-foreground">The pool diversifies risk across many freelancers and projects</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mt-0.5">
                          3
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Claim Processing</h4>
                          <p className="text-sm text-muted-foreground">Valid claims are paid directly from the pool via smart contracts</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mt-0.5">
                          4
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Yield Generation</h4>
                          <p className="text-sm text-muted-foreground">Idle funds generate yield to strengthen the pool and reduce premiums</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
                        <Link to="/staking">
                          <Landmark className="mr-2 h-4 w-4" />
                          Stake in Risk Pool
                        </Link>
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Recent Transactions Section */}
            <section className="py-12">
              <div className="container mx-auto px-4">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Recent Pool Transactions
                </h2>

                <div className="bg-white dark:bg-background rounded-xl overflow-hidden border border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Amount (USDC)</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Transaction</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {poolState.recentTransactions.map((tx, index) => (
                          <tr key={index} className="hover:bg-muted/20">
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                {tx.type === 'premium' ? (
                                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  </div>
                                ) : tx.type === 'claim' ? (
                                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Coins className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                )}
                                <span>{tx.type === 'premium' ? 'Premium Payment' : tx.type === 'claim' ? 'Claim Payout' : 'Yield'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={tx.type === 'premium' ? 'text-green-600 dark:text-green-400' : tx.type === 'claim' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}>
                                {tx.type === 'premium' ? '+' : tx.type === 'claim' ? '-' : '+'}
                                {formatCurrency(tx.amount)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {formatRelativeTime(tx.date)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant={tx.status === 'confirmed' ? 'success' : tx.status === 'pending' ? 'outline' : 'secondary'}>
                                {tx.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <a 
                                href={`https://explorer.solana.com/tx/${tx.txHash}?cluster=devnet`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                View
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </section>
      
      <Footer />
    </div>
  );
};

export default RiskPoolDashboard;
