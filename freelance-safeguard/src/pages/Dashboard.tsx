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
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          {/* Header with wallet status */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
              <p className="text-gray-400">
                Manage your insurance policies and claims
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <WalletStatus />
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing || !connected}
                className="bg-transparent border-electric-blue text-electric-blue hover:bg-electric-blue/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={() => navigate('/new-policy')}
                disabled={!connected}
                className="bg-deep-purple hover:bg-deep-purple/90 text-white"
              >
                Create Policy
              </Button>
            </div>
          </div>

          {/* Status cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Policy Status */}
            <Card className="bg-gray-800 border-gray-700 text-white shadow-lg hover:border-deep-purple/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Policies
                </CardTitle>
                <Shield className="h-4 w-4 text-deep-purple" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 bg-gray-700" />
                  ) : (
                    policies?.filter(p => p.status === PolicyStatus.ACTIVE).length || 0
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {hasActivePolicies ? 'Coverage active' : 'No active policies'}
                </p>
              </CardContent>
            </Card>

            {/* Claims Status */}
            <Card className="bg-gray-800 border-gray-700 text-white shadow-lg hover:border-deep-purple/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Claims
                </CardTitle>
                <Clock className="h-4 w-4 text-electric-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 bg-gray-700" />
                  ) : (
                    activeClaims.length
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {activeClaims.length > 0 ? 'Claims awaiting review' : 'No pending claims'}
                </p>
              </CardContent>
            </Card>

            {/* Total Coverage */}
            <Card className="bg-gray-800 border-gray-700 text-white shadow-lg hover:border-deep-purple/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Coverage
                </CardTitle>
                <DollarSign className="h-4 w-4 text-silver" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 bg-gray-700" />
                  ) : (
                    formatCurrency(riskPoolMetrics?.totalCoverage || 0)
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Protected value
                </p>
              </CardContent>
            </Card>

            {/* Solvency Ratio */}
            <Card className="bg-gray-800 border-gray-700 text-white shadow-lg hover:border-deep-purple/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Solvency Ratio
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-deep-purple" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16 bg-gray-700" />
                  ) : (
                    `${Math.round((riskPoolMetrics?.solvencyRatio || 0) * 100)}%`
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {solvencyStatus === 'excellent' && 'Excellent financial health'}
                  {solvencyStatus === 'good' && 'Good financial health'}
                  {solvencyStatus === 'moderate' && 'Moderate financial health'}
                  {solvencyStatus === 'at-risk' && 'At risk - needs attention'}
                  {solvencyStatus === 'unknown' && 'Calculating...'}
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
                    <Alert className="bg-gray-700 border-deep-purple">
                      <AlertTriangle className="h-4 w-4 text-deep-purple" />
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
                          onClick={() => navigate(`/policies/${policy.id}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-deep-purple mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Policies Found</h3>
                      <p className="text-gray-400 mb-4">
                        You don't have any insurance policies yet. Create your first policy to protect your freelance work.
                      </p>
                      <Button 
                        onClick={() => navigate('/new-policy')}
                        className="bg-deep-purple hover:bg-deep-purple/90 text-white"
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
                      onClick={() => navigate('/policies')}
                      className="w-full bg-transparent border-electric-blue text-electric-blue hover:bg-electric-blue/10"
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
                    <Alert className="bg-gray-700 border-deep-purple">
                      <AlertTriangle className="h-4 w-4 text-deep-purple" />
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
                            onClick={() => navigate(`/claims/${claim.id}`)}
                          >
                            <TableCell className="font-medium text-electric-blue">
                              {claim.id.substring(0, 8)}...
                            </TableCell>
                            <TableCell>{formatCurrency(claim.amount)}</TableCell>
                            <TableCell>{formatDate(claim.createdAt)}</TableCell>
                            <TableCell>
                              <Badge 
                                className={
                                  claim.status === ClaimStatus.APPROVED 
                                    ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" 
                                    : claim.status === ClaimStatus.REJECTED
                                    ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                                    : "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
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
                      <FileText className="h-12 w-12 text-electric-blue mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Claims Filed</h3>
                      <p className="text-gray-400 mb-4">
                        You haven't filed any insurance claims yet. If you experience a covered loss, file a claim for review.
                      </p>
                      <Button 
                        onClick={() => navigate('/new-claim')}
                        disabled={!hasActivePolicies}
                        className="bg-electric-blue hover:bg-electric-blue/90 text-white"
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
                      onClick={() => navigate('/claims')}
                      className="w-full bg-transparent border-electric-blue text-electric-blue hover:bg-electric-blue/10"
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
                    <Alert className="bg-gray-700 border-deep-purple">
                      <AlertTriangle className="h-4 w-4 text-deep-purple" />
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
                        <Users className="h-5 w-5 text-deep-purple mr-2" />
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
                        <Shield className="h-5 w-5 text-electric-blue mr-2" />
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
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
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
      </div>
    </DashboardLayout>
  );
}
