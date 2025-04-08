import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { toast } from '../components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { RefreshCw, AlertTriangle, CheckCircle2, Shield, Clock, BarChart3, DollarSign, FileText, Users } from 'lucide-react';
import { DashboardLayout } from '../components/layout/dashboard-layout';
import { WalletStatus } from '../components/wallet/WalletStatus';
import { formatCurrency, formatDate, timeAgo } from '../lib/utils/format';
import { useInsuranceOperations } from '../hooks/useInsuranceOperations';
import RiskAssessment from '../components/RiskAssessment';
import { Policy, Claim, PolicyStatus, ClaimStatus, RiskPoolMetrics } from '../types/insurance';
import { InsuranceCard } from '../components/ui/insurance-card';
import { FreelanceShieldLogo } from '../components/ui/freelance-shield-logo';

// Define the PoolMetrics interface to match what RiskAssessment component expects
interface PoolMetrics {
  totalPolicies: number;
  activePolicies: number;
  totalCoverage: number;
  poolBalance: number;
  totalPremiums: number;
  totalClaims: number;
  claimCount: number;
  claimApprovalRate: number;
  solvencyRatio: number;
  averagePremium: number;
  averageCoverage: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    policies, 
    claims, 
    riskPoolMetrics,
    isLoading,
    error,
    refreshData
  } = useInsuranceOperations();

  // Calculate solvency status based on metrics
  const solvencyStatus = useMemo(() => {
    if (!riskPoolMetrics) return 'unknown';
    
    const { solvencyRatio } = riskPoolMetrics;
    
    if (solvencyRatio >= 0.7) return 'excellent';
    if (solvencyRatio >= 0.5) return 'good';
    if (solvencyRatio >= 0.3) return 'moderate';
    return 'at-risk';
  }, [riskPoolMetrics]);

  // Handle data refresh with proper error handling
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      toast({
        title: "Dashboard updated",
        description: "Latest on-chain data has been loaded",
      });
    } catch (err) {
      console.error('Refresh failed:', err);
      toast({
        title: "Refresh failed",
        description: "Could not retrieve the latest data from the blockchain",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show toast for any data fetching errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Connection error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error]);

  // Add network connection check
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      toast({
        title: "Network connection lost",
        description: "Please check your internet connection to access blockchain data",
        variant: "destructive",
      });
    }
  }, [isOnline]);

  const hasActivePolicies = policies && policies.length > 0;
  const activePolicy = hasActivePolicies ? policies[0] : null;
  const activeClaims = claims?.filter(claim => claim.status === ClaimStatus.PENDING) || [];
  const hasClaims = claims && claims.length > 0;

  const riskMetrics = useMemo(() => {
    if (!riskPoolMetrics) return null;
    return {
      totalPolicies: riskPoolMetrics.totalPolicies,
      activePolicies: riskPoolMetrics.activePolicies,
      totalCoverage: riskPoolMetrics.totalCoverage,
      poolBalance: riskPoolMetrics.poolBalance,
      totalPremiums: riskPoolMetrics.totalPremiums,
      totalClaims: riskPoolMetrics.totalClaims,
      claimCount: riskPoolMetrics.claimCount,
      claimApprovalRate: riskPoolMetrics.claimApprovalRate,
      solvencyRatio: riskPoolMetrics.solvencyRatio,
      averagePremium: riskPoolMetrics.averagePremium,
      averageCoverage: riskPoolMetrics.averageCoverage
    } as PoolMetrics;
  }, [riskPoolMetrics]);

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4">
        {/* Dashboard Header - Using brand colors */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-shield-purple to-shield-blue text-transparent bg-clip-text font-display">
              Freelancer Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Secure your work with blockchain-backed insurance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 text-shield-blue border-shield-blue/30 hover:bg-shield-blue/10 transition-all"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing && "animate-spin"}`} />
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
            <Button 
              onClick={() => navigate('/new-policy')} 
              size="sm" 
              className="bg-shield-purple hover:bg-shield-purple/90 text-white transition-all"
            >
              <Shield className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </div>
        </div>

        {/* No Wallet Connected State */}
        {!connected && (
          <Card className="border-0 bg-gray-900/80 shadow-lg overflow-hidden relative mb-8">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]"></div>
            <CardContent className="p-8 text-center relative z-10">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-shield-purple/10 mb-4">
                <FreelanceShieldLogo className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Connect Your Wallet</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Connect your Solana wallet to access your dashboard, manage policies and claims, and interact with the FreelanceShield protocol.
              </p>
              <WalletStatus refreshOnLoad />
            </CardContent>
          </Card>
        )}

        {/* Offline Warning */}
        {!isOnline && (
          <Alert className="mb-6 border-orange-500 bg-orange-500/10">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <AlertTitle>Offline Mode</AlertTitle>
            <AlertDescription>
              You're currently offline. Some blockchain data may not be available until your connection is restored.
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {error && connected && (
          <Alert className="mb-6 border-shield-purple bg-shield-purple/10">
            <AlertTriangle className="h-4 w-4 text-shield-purple" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {error}
              <Button 
                variant="link" 
                onClick={handleRefresh} 
                className="p-0 h-auto font-normal text-shield-blue"
              >
                Try refreshing
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State - No Policies or Claims */}
        {connected && !isLoading && !hasActivePolicies && !hasClaims && !error && (
          <Card className="border-0 bg-gray-900/80 shadow-lg overflow-hidden relative mb-8">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]"></div>
            <CardContent className="p-8 text-center relative z-10">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-shield-purple/10 mb-4">
                <Shield className="h-8 w-8 text-shield-purple" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Get Started with FreelanceShield</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Create your first insurance policy to protect your freelance work from unexpected issues like non-payment, scope creep, and contract disputes.
              </p>
              <Button 
                onClick={() => navigate('/new-policy')}
                className="bg-shield-purple hover:bg-shield-purple/90 text-white"
              >
                Create Your First Policy
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Wallet Status Card */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <WalletStatus refreshOnLoad />
        </div>

        {/* Stats Overview Cards - Using brand colors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Active Policies Card */}
          <Card className="border-0 bg-gray-900/80 shadow-lg shadow-shield-purple/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]"></div>
            <CardHeader className="pb-2 relative z-10">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-shield-purple" />
                  Active Policies
                </CardTitle>
                <div className="h-6 w-6 rounded-full flex items-center justify-center bg-shield-purple/10">
                  <span className="text-xs text-shield-purple">i</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-white">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : policies?.length || 0}
                </div>
                <div className="text-sm text-gray-400 ml-2">
                  {isLoading ? '' : 'policies'}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {policies?.length === 0 && !isLoading ? 'No active policies' : 
                 policies?.length === 1 && !isLoading ? '1 active protection plan' : 
                 !isLoading ? `${policies?.length} active protection plans` : ''}
              </p>
            </CardContent>
          </Card>

          {/* Pending Claims Card */}
          <Card className="border-0 bg-gray-900/80 shadow-lg shadow-shield-blue/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]"></div>
            <CardHeader className="pb-2 relative z-10">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-shield-blue" />
                  Pending Claims
                </CardTitle>
                <div className="h-6 w-6 rounded-full flex items-center justify-center bg-shield-blue/10">
                  <span className="text-xs text-shield-blue">i</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-white">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : activeClaims?.length || 0}
                </div>
                <div className="text-sm text-gray-400 ml-2">
                  {isLoading ? '' : 'claims'}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {activeClaims?.length === 0 && !isLoading ? 'No pending claims' : 
                 activeClaims?.length === 1 && !isLoading ? '1 claim awaiting review' : 
                 !isLoading ? `${activeClaims?.length} claims awaiting review` : ''}
              </p>
            </CardContent>
          </Card>

          {/* Total Coverage Card */}
          <Card className="border-0 bg-gray-900/80 shadow-lg shadow-silver/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]"></div>
            <CardHeader className="pb-2 relative z-10">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-silver" />
                  Total Coverage
                </CardTitle>
                <div className="h-6 w-6 rounded-full flex items-center justify-center bg-silver/10">
                  <span className="text-xs text-silver">i</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-white">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(riskPoolMetrics?.totalCoverage || 0)
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Protected value</p>
            </CardContent>
          </Card>

          {/* Solvency Ratio Card */}
          <Card className="border-0 bg-gray-900/80 shadow-lg shadow-shield-purple/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]"></div>
            <CardHeader className="pb-2 relative z-10">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-shield-purple" />
                  Solvency Ratio
                </CardTitle>
                <div className="h-6 w-6 rounded-full flex items-center justify-center bg-shield-purple/10">
                  <span className="text-xs text-shield-purple">i</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-white">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    `${Math.round((riskPoolMetrics?.solvencyRatio || 0) * 100)}%`
                  )}
                </div>
              </div>
              <p className="text-xs flex items-center gap-1 mt-1">
                {solvencyStatus === 'excellent' && (
                  <span className="text-shield-blue">Excellent financial health</span>
                )}
                {solvencyStatus === 'good' && (
                  <span className="text-shield-blue">Good financial health</span>
                )}
                {solvencyStatus === 'moderate' && (
                  <span className="text-silver">Moderate financial health</span>
                )}
                {solvencyStatus === 'at-risk' && (
                  <span className="text-shield-purple">At-risk financial health</span>
                )}
                {solvencyStatus === 'unknown' && (
                  <span className="text-gray-400">Financial health unknown</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main content area */}
        <div className="grid gap-6 md:grid-cols-7">
          {/* Left column - 4/7 width */}
          <div className="md:col-span-4 space-y-6">
            <Card className="bg-gray-800 border-gray-700 text-white shadow-lg">
              <CardHeader>
                <CardTitle>Your Insurance Policies</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your active and pending insurance policies
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-[200px] w-full bg-gray-700" />
                    <Skeleton className="h-[200px] w-full bg-gray-700" />
                  </div>
                ) : !connected ? (
                  <Alert className="bg-gray-700 border-shield-purple">
                    <AlertTriangle className="h-4 w-4 text-shield-purple" />
                    <AlertTitle>Wallet not connected</AlertTitle>
                    <AlertDescription>
                      Connect your Solana wallet to view your insurance policies
                    </AlertDescription>
                  </Alert>
                ) : hasActivePolicies ? (
                  <div className="space-y-4">
                    {policies.map((policy) => (
                      <InsuranceCard
                        key={policy.id}
                        title={policy.name}
                        description={policy.description}
                        premium={formatCurrency(policy.premium)}
                        coverage={formatCurrency(policy.coverageAmount)}
                        duration={`${policy.durationDays} days`}
                        status={policy.status === PolicyStatus.ACTIVE ? 'active' : policy.status === PolicyStatus.PENDING ? 'pending' : 'expired'}
                        onClick={() => navigate(`/risk-analysis?policy=${policy.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-shield-purple mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Policies Found</h3>
                    <p className="text-gray-400 mb-4">
                      You don't have any insurance policies yet. Create your first policy to protect your freelance work.
                    </p>
                    <Button 
                      onClick={() => navigate('/new-policy')}
                      className="bg-shield-purple hover:bg-shield-purple/90 text-white"
                    >
                      Create Your First Policy
                    </Button>
                  </div>
                )}
              </CardContent>
              {hasActivePolicies && (
                <CardFooter className="border-t border-gray-700 bg-gray-800/50">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/risk-analysis')}
                    className="w-full bg-transparent border-shield-blue text-shield-blue hover:bg-shield-blue/10"
                  >
                    View All Policies
                  </Button>
                </CardFooter>
              )}
            </Card>

            <Card className="bg-gray-800 border-gray-700 text-white shadow-lg">
              <CardHeader>
                <CardTitle>Recent Claims</CardTitle>
                <CardDescription className="text-gray-400">
                  Track the status of your recent insurance claims
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[200px] w-full bg-gray-700" />
                ) : !connected ? (
                  <Alert className="bg-gray-700 border-shield-purple">
                    <AlertTriangle className="h-4 w-4 text-shield-purple" />
                    <AlertTitle>Wallet not connected</AlertTitle>
                    <AlertDescription>
                      Connect your Solana wallet to view your claims
                    </AlertDescription>
                  </Alert>
                ) : hasClaims ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700 hover:bg-gray-700/50">
                        <TableHead className="text-gray-400">Claim ID</TableHead>
                        <TableHead className="text-gray-400">Amount</TableHead>
                        <TableHead className="text-gray-400">Date</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims.slice(0, 5).map((claim) => (
                        <TableRow 
                          key={claim.id} 
                          className="border-gray-700 hover:bg-gray-700/50 cursor-pointer"
                          onClick={() => navigate(`/risk-analysis?claim=${claim.id}`)}
                        >
                          <TableCell className="font-medium text-shield-blue">
                            {claim.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>{formatCurrency(claim.amount)}</TableCell>
                          <TableCell>{formatDate(claim.createdAt)}</TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                claim.status === ClaimStatus.APPROVED 
                                  ? "bg-shield-blue/20 text-shield-blue hover:bg-shield-blue/30" 
                                  : claim.status === ClaimStatus.REJECTED
                                  ? "bg-shield-purple/20 text-shield-purple hover:bg-shield-purple/30"
                                  : "bg-silver/20 text-silver hover:bg-silver/30"
                              }
                            >
                              {claim.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-shield-blue mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Claims Filed</h3>
                    <p className="text-gray-400 mb-4">
                      You haven't filed any insurance claims yet. If you experience a covered loss, file a claim for review.
                    </p>
                    <Button 
                      onClick={() => navigate('/risk-analysis?tab=new-claim')}
                      disabled={!hasActivePolicies}
                      className="bg-shield-blue hover:bg-shield-blue/90 text-white"
                    >
                      File a Claim
                    </Button>
                  </div>
                )}
              </CardContent>
              {hasClaims && (
                <CardFooter className="border-t border-gray-700 bg-gray-800/50">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/risk-analysis')}
                    className="w-full bg-transparent border-shield-blue text-shield-blue hover:bg-shield-blue/10"
                  >
                    View All Claims
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>

          {/* Right column - 3/7 width */}
          <div className="md:col-span-3 space-y-6">
            <Card className="bg-gray-800 border-gray-700 text-white shadow-lg">
              <CardHeader>
                <CardTitle>Risk Pool Health</CardTitle>
                <CardDescription className="text-gray-400">
                  Current status of the FreelanceShield insurance pool
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full bg-gray-700" />
                ) : riskMetrics ? (
                  <RiskAssessment metrics={riskMetrics} />
                ) : (
                  <Alert className="bg-gray-700 border-shield-purple">
                    <AlertTriangle className="h-4 w-4 text-shield-purple" />
                    <AlertTitle>Data Unavailable</AlertTitle>
                    <AlertDescription>
                      Risk pool metrics are currently unavailable. Please try again later.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 text-white shadow-lg">
              <CardHeader>
                <CardTitle>Community Stats</CardTitle>
                <CardDescription className="text-gray-400">
                  FreelanceShield community activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-shield-purple mr-2" />
                      <span>Active Members</span>
                    </div>
                    <span className="font-bold">
                      {isLoading ? (
                        <Skeleton className="h-6 w-12 bg-gray-700 inline-block" />
                      ) : (
                        riskPoolMetrics?.activePolicies || 0
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-shield-blue mr-2" />
                      <span>Total Policies</span>
                    </div>
                    <span className="font-bold">
                      {isLoading ? (
                        <Skeleton className="h-6 w-12 bg-gray-700 inline-block" />
                      ) : (
                        riskPoolMetrics?.totalPolicies || 0
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-silver mr-2" />
                      <span>Claims Filed</span>
                    </div>
                    <span className="font-bold">
                      {isLoading ? (
                        <Skeleton className="h-6 w-12 bg-gray-700 inline-block" />
                      ) : (
                        riskPoolMetrics?.claimCount || 0
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-shield-blue mr-2" />
                      <span>Claim Approval Rate</span>
                    </div>
                    <span className="font-bold">
                      {isLoading ? (
                        <Skeleton className="h-6 w-12 bg-gray-700 inline-block" />
                      ) : (
                        `${Math.round((riskPoolMetrics?.claimApprovalRate || 0) * 100)}%`
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-700 bg-gray-800/50">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/community')}
                  className="w-full bg-transparent border-silver text-silver hover:bg-silver/10"
                >
                  View Community
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
