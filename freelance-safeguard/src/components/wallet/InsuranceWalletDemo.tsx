import React, { useState } from 'react';
import { useWalletIntegrationContext } from './WalletIntegrationProvider';
import { EnhancedWalletSelector } from './EnhancedWalletSelector';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, AlertCircle, CheckCircle, ShieldCheck, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { JobType, Industry, PolicyCreationParams } from '../../hooks/useSolanaInsurance';

export const InsuranceWalletDemo: React.FC = () => {
  const { walletInfo, isProcessing, insurance } = useWalletIntegrationContext();
  const [isCreatingPolicy, setIsCreatingPolicy] = useState(false);
  const [policyCreationError, setPolicyCreationError] = useState<string | null>(null);

  // Example policy parameters
  const examplePolicy: PolicyCreationParams = {
    coverageAmount: 1000, // 1000 USDC
    coveragePeriod: 30, // 30 days
    jobType: JobType.SOFTWARE_DEVELOPMENT,
    industry: Industry.TECHNOLOGY,
    projectName: 'Website Development',
    clientName: 'Acme Corp',
    description: 'Full-stack web application development project'
  };

  // Handle policy creation
  const handleCreatePolicy = async () => {
    if (!walletInfo.connected) {
      return;
    }

    setIsCreatingPolicy(true);
    setPolicyCreationError(null);

    try {
      // Estimate premium first
      const premium = insurance.estimatePremium(
        examplePolicy.coverageAmount,
        examplePolicy.coveragePeriod,
        examplePolicy.jobType as JobType,
        examplePolicy.industry as Industry
      );

      // Create the policy
      await insurance.createPolicy(examplePolicy);
    } catch (error) {
      console.error('Error creating policy:', error);
      setPolicyCreationError(error instanceof Error ? error.message : 'Failed to create policy');
    } finally {
      setIsCreatingPolicy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Insurance Protection</h2>
        <EnhancedWalletSelector />
      </div>

      {!walletInfo.connected ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wallet Not Connected</AlertTitle>
          <AlertDescription>
            Please connect your wallet to access insurance features.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {insurance.policy ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  Active Insurance Policy
                </CardTitle>
                <CardDescription>
                  Your freelance work is protected until {formatDate(insurance.policy.endDate)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Coverage Amount</p>
                    <p className="text-lg font-medium">
                      {formatCurrency(insurance.policy.coverageAmount, 'USDC')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Premium Paid</p>
                    <p className="text-lg font-medium">
                      {formatCurrency(insurance.policy.premiumAmount, 'SOL')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Project</p>
                    <p className="text-lg font-medium">
                      {insurance.policy.projectName || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="text-lg font-medium">
                      {insurance.policy.clientName || 'Not specified'}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Created on {formatDate(insurance.policy.startDate)}
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => insurance.refreshPolicy()}
                  disabled={insurance.isLoading}
                >
                  {insurance.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Create Insurance Policy</CardTitle>
                <CardDescription>
                  Protect your freelance work with our insurance coverage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Coverage Amount</p>
                    <p className="text-lg font-medium">
                      {formatCurrency(examplePolicy.coverageAmount, 'USDC')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Coverage Period</p>
                    <p className="text-lg font-medium">
                      {examplePolicy.coveragePeriod} days
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Job Type</p>
                    <p className="text-lg font-medium">
                      {examplePolicy.jobType.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Industry</p>
                    <p className="text-lg font-medium">
                      {examplePolicy.industry}
                    </p>
                  </div>
                </div>

                {policyCreationError && (
                  <Alert className="mt-4" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{policyCreationError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={handleCreatePolicy}
                  disabled={isCreatingPolicy || insurance.isLoading || isProcessing}
                >
                  {(isCreatingPolicy || insurance.isLoading) ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating Policy...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Create Policy
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          {insurance.riskPoolMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Risk Pool Metrics</CardTitle>
                <CardDescription>
                  Current status of the insurance risk pool
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Capital</p>
                    <p className="text-lg font-medium">
                      {formatCurrency(insurance.riskPoolMetrics.totalCapital, 'SOL')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Policies</p>
                    <p className="text-lg font-medium">
                      {insurance.riskPoolMetrics.totalPolicies}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Claims</p>
                    <p className="text-lg font-medium">
                      {insurance.riskPoolMetrics.totalClaims}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reserve Ratio</p>
                    <p className="text-lg font-medium">
                      {(insurance.riskPoolMetrics.reserveRatio * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

// Import the missing RefreshCw icon
import { RefreshCw } from 'lucide-react';
