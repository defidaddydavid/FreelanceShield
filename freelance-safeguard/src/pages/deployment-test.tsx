import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { ContractVerifier } from '@/components/deployment/ContractVerifier';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { 
  INSURANCE_PROGRAM_ID, 
  RISK_POOL_PROGRAM_ID, 
  CLAIMS_PROCESSOR_PROGRAM_ID,
  NETWORK_CONFIG
} from '@/lib/solana/constants';
import { useSolanaInsurance } from '@/lib/solana/hooks/useSolanaInsurance';
import { useRiskPoolData } from '@/lib/solana/hooks/useRiskPoolData';

export default function DeploymentTestPage() {
  const { connected, publicKey } = useWallet();
  const { metrics, isLoading: isLoadingRiskPool } = useRiskPoolData();
  const { createPolicy, submitClaim, isLoading: isLoadingInsurance } = useSolanaInsurance();
  const [activeTab, setActiveTab] = useState('verifier');

  const handleCreateTestPolicy = async () => {
    if (!connected || !publicKey) return;
    
    try {
      await createPolicy({
        coverageAmount: 100,
        periodDays: 30,
        jobType: 'development',
        industry: 'technology',
        description: 'Test policy for deployment verification'
      });
      alert('Test policy created successfully!');
    } catch (error) {
      console.error('Error creating test policy:', error);
      alert(`Error creating test policy: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSubmitTestClaim = async () => {
    if (!connected || !publicKey) return;
    
    try {
      await submitClaim({
        policyId: 'test-policy-id', // This would be a real policy ID in production
        claimAmount: 50,
        description: 'Test claim for deployment verification'
      });
      alert('Test claim submitted successfully!');
    } catch (error) {
      console.error('Error submitting test claim:', error);
      alert(`Error submitting test claim: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">FreelanceShield Deployment Test</h1>
      
      <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Network Configuration</CardTitle>
            <CardDescription>Current Solana network settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Network Endpoint</h3>
                <p className="text-sm text-muted-foreground">{NETWORK_CONFIG.endpoint}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">Network Type</h3>
                <p className="text-sm text-muted-foreground">
                  {NETWORK_CONFIG.endpoint.includes('devnet') 
                    ? 'Devnet' 
                    : NETWORK_CONFIG.endpoint.includes('localhost') 
                      ? 'Local' 
                      : 'Mainnet'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Insurance Program</h3>
                <p className="text-xs text-muted-foreground truncate">{INSURANCE_PROGRAM_ID.toString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">Risk Pool Program</h3>
                <p className="text-xs text-muted-foreground truncate">{RISK_POOL_PROGRAM_ID.toString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">Claims Processor</h3>
                <p className="text-xs text-muted-foreground truncate">{CLAIMS_PROCESSOR_PROGRAM_ID.toString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Wallet Connection</CardTitle>
            <CardDescription>Connect your wallet to interact with the contracts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {connected ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Wallet Connected</AlertTitle>
                <AlertDescription>
                  Address: {publicKey?.toString()}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Wallet Not Connected</AlertTitle>
                <AlertDescription>
                  Please connect your wallet to continue
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-center">
              <WalletMultiButton />
            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="verifier">Contract Verifier</TabsTrigger>
            <TabsTrigger value="riskPool">Risk Pool Data</TabsTrigger>
            <TabsTrigger value="interactions">Test Interactions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="verifier">
            <ContractVerifier />
          </TabsContent>
          
          <TabsContent value="riskPool">
            <Card>
              <CardHeader>
                <CardTitle>Risk Pool Metrics</CardTitle>
                <CardDescription>
                  {isLoadingRiskPool 
                    ? 'Loading risk pool data...' 
                    : 'Current metrics from the risk pool'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingRiskPool ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : metrics.error ? (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Risk Pool Data</AlertTitle>
                    <AlertDescription>
                      {metrics.error}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Total Value Locked</h3>
                      <p className="text-lg font-semibold">{metrics.totalValueLocked.toFixed(2)} SOL</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Active Policies</h3>
                      <p className="text-lg font-semibold">{metrics.activePolicies}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Claims Paid</h3>
                      <p className="text-lg font-semibold">{metrics.claimsPaid}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Solvency Ratio</h3>
                      <p className="text-lg font-semibold">{(metrics.solvencyRatio * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Available Funds</h3>
                      <p className="text-lg font-semibold">{metrics.poolAllocation.available.toFixed(2)} SOL</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Reserved for Claims</h3>
                      <p className="text-lg font-semibold">{metrics.poolAllocation.reservedForClaims.toFixed(2)} SOL</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="interactions">
            <Card>
              <CardHeader>
                <CardTitle>Test Contract Interactions</CardTitle>
                <CardDescription>Create test policies and claims to verify contract functionality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!connected ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Wallet Not Connected</AlertTitle>
                    <AlertDescription>
                      Please connect your wallet to test contract interactions
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="text-sm font-medium mb-2">Create Test Policy</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        This will create a test policy with 100 SOL coverage for 30 days
                      </p>
                      <Button 
                        onClick={handleCreateTestPolicy}
                        disabled={isLoadingInsurance}
                      >
                        {isLoadingInsurance ? 'Processing...' : 'Create Test Policy'}
                      </Button>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h3 className="text-sm font-medium mb-2">Submit Test Claim</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        This will submit a test claim for 50 SOL
                      </p>
                      <Button 
                        onClick={handleSubmitTestClaim}
                        disabled={isLoadingInsurance}
                        variant="outline"
                      >
                        {isLoadingInsurance ? 'Processing...' : 'Submit Test Claim'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-xs text-muted-foreground">
                  Note: These test interactions will create real transactions on the Solana network
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
