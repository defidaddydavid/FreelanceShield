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
import { RefreshCw, AlertTriangle, CheckCircle2, Shield, Clock, BarChart3 } from 'lucide-react';
import { Layout } from '../components/layout';
import { WalletStatus } from '../components/wallet/WalletStatus';
import { formatCurrency, formatDate, timeAgo } from '../lib/utils/format';
import { useInsuranceOperations } from '../hooks/useInsuranceOperations';
import RiskAssessment from '../components/RiskAssessment';
import { Policy, Claim, PolicyStatus, ClaimStatus, RiskPoolMetrics } from '../types/insurance';

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
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          {/* Header with wallet status */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your insurance policies and claims
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <WalletStatus />
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing || !connected}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={() => navigate('/new-policy')}
                disabled={!connected}
              >
                Create Policy
              </Button>
            </div>
          </div>

          {/* Status cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Policy Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Policies
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    policies?.filter(p => p.status === PolicyStatus.ACTIVE).length || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {hasActivePolicies ? 'Coverage active' : 'No active policies'}
                </p>
              </CardContent>
            </Card>

            {/* Claims Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Claims
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    activeClaims.length
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeClaims.length > 0 ? 'Awaiting processing' : 'No pending claims'}
                </p>
              </CardContent>
            </Card>

            {/* Coverage Amount */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Coverage
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(policies?.reduce((sum, policy) => sum + policy.coverageAmount, 0) || 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total insured value
                </p>
              </CardContent>
            </Card>

            {/* Risk Pool Health */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pool Health
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      {solvencyStatus === 'excellent' && (
                        <Badge className="bg-green-500">Excellent</Badge>
                      )}
                      {solvencyStatus === 'good' && (
                        <Badge className="bg-blue-500">Good</Badge>
                      )}
                      {solvencyStatus === 'moderate' && (
                        <Badge className="bg-yellow-500">Moderate</Badge>
                      )}
                      {solvencyStatus === 'at-risk' && (
                        <Badge variant="destructive">At Risk</Badge>
                      )}
                      {solvencyStatus === 'unknown' && (
                        <Badge variant="outline">Unknown</Badge>
                      )}
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {riskPoolMetrics ? `${Math.round(riskPoolMetrics.solvencyRatio * 100)}% solvency ratio` : 'Solvency data unavailable'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main content tabs */}
          <Tabs defaultValue="policies" className="space-y-4">
            <TabsList>
              <TabsTrigger value="policies">My Policies</TabsTrigger>
              <TabsTrigger value="claims">My Claims</TabsTrigger>
              <TabsTrigger value="riskpool">Risk Pool</TabsTrigger>
            </TabsList>
            
            {/* Policies tab */}
            <TabsContent value="policies">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Insurance Policies
                  </CardTitle>
                  <CardDescription>
                    View and manage your active insurance policies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : !connected ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Wallet not connected</AlertTitle>
                      <AlertDescription>
                        Connect your wallet to view your insurance policies
                      </AlertDescription>
                    </Alert>
                  ) : !hasActivePolicies ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>No policies found</AlertTitle>
                      <AlertDescription>
                        You don't have any insurance policies yet. Create one to get started.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Table>
                      <TableCaption>A list of your insurance policies</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Coverage</TableHead>
                          <TableHead>Premium</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Expiry</TableHead>
                          <TableHead>Project</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {policies.map((policy: Policy) => (
                          <TableRow key={policy.policyId}>
                            <TableCell className="font-medium">
                              {formatCurrency(policy.coverageAmount)} USDC
                            </TableCell>
                            <TableCell>
                              {formatCurrency(policy.premiumAmount)} USDC
                            </TableCell>
                            <TableCell>
                              {policy.status === PolicyStatus.ACTIVE && (
                                <Badge className="bg-green-500">Active</Badge>
                              )}
                              {policy.status === PolicyStatus.EXPIRED && (
                                <Badge variant="outline">Expired</Badge>
                              )}
                              {policy.status === PolicyStatus.PENDING && (
                                <Badge variant="secondary">Pending</Badge>
                              )}
                              {policy.status === PolicyStatus.CANCELLED && (
                                <Badge variant="destructive">Cancelled</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {formatDate(policy.expiryTime)}
                            </TableCell>
                            <TableCell>
                              {policy.projectName}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
                {hasActivePolicies && (
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/policy-details/' + activePolicy?.policyId)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            {/* Claims tab */}
            <TabsContent value="claims">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Insurance Claims
                  </CardTitle>
                  <CardDescription>
                    View and manage your submitted claims
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : !connected ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Wallet not connected</AlertTitle>
                      <AlertDescription>
                        Connect your wallet to view your insurance claims
                      </AlertDescription>
                    </Alert>
                  ) : !hasClaims ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>No claims found</AlertTitle>
                      <AlertDescription>
                        You haven't submitted any claims yet.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Table>
                      <TableCaption>A list of your insurance claims</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Evidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {claims.map((claim: Claim) => (
                          <TableRow key={claim.claimId}>
                            <TableCell className="font-medium">
                              {formatCurrency(claim.amount)} USDC
                            </TableCell>
                            <TableCell>
                              {claim.status === ClaimStatus.PENDING && (
                                <Badge variant="secondary">Pending</Badge>
                              )}
                              {claim.status === ClaimStatus.PROCESSING && (
                                <Badge variant="outline">Processing</Badge>
                              )}
                              {claim.status === ClaimStatus.APPROVED && (
                                <Badge className="bg-green-500">Approved</Badge>
                              )}
                              {claim.status === ClaimStatus.REJECTED && (
                                <Badge variant="destructive">Rejected</Badge>
                              )}
                              {claim.status === ClaimStatus.ARBITRATION && (
                                <Badge variant="outline" className="bg-yellow-500">Arbitration</Badge>
                              )}
                              {claim.status === ClaimStatus.PAID && (
                                <Badge className="bg-blue-500">Paid</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {timeAgo(claim.submissionTime)}
                            </TableCell>
                            <TableCell>
                              {claim.evidenceType}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
                {activeClaims.length > 0 && (
                  <CardFooter>
                    <p className="text-sm text-muted-foreground">
                      You have {activeClaims.length} pending claim{activeClaims.length !== 1 ? 's' : ''}
                    </p>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            {/* Risk Pool tab */}
            <TabsContent value="riskpool">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Risk Pool Health
                  </CardTitle>
                  <CardDescription>
                    View the current status of the insurance risk pool
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-[300px] w-full" />
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    </div>
                  ) : !riskMetrics ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Data unavailable</AlertTitle>
                      <AlertDescription>
                        Risk pool metrics could not be loaded from the blockchain
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-6">
                      <RiskAssessment metrics={riskMetrics} />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h3 className="text-sm font-medium mb-2">Pool Balance</h3>
                          <p className="text-2xl font-bold">{formatCurrency(riskMetrics.poolBalance)} USDC</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Total funds available for claims
                          </p>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h3 className="text-sm font-medium mb-2">Total Coverage</h3>
                          <p className="text-2xl font-bold">{formatCurrency(riskMetrics.totalCoverage)} USDC</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Total coverage amount across all policies
                          </p>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h3 className="text-sm font-medium mb-2">Policies</h3>
                          <p className="text-2xl font-bold">{riskMetrics.totalPolicies}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {riskMetrics.activePolicies} active out of {riskMetrics.totalPolicies} total
                          </p>
                        </div>
                        
                        <div className="border rounded-lg p-4">
                          <h3 className="text-sm font-medium mb-2">Claims</h3>
                          <p className="text-2xl font-bold">{riskMetrics.claimCount}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {Math.round(riskMetrics.claimApprovalRate * 100)}% approval rate
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
