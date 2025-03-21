import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useInsuranceOperations } from '@/hooks/useInsuranceOperations';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import { NETWORK_CONFIG, RISK_WEIGHTS } from '@/lib/solana/constants';

export function TestnetDemo() {
  const { publicKey } = useWallet();
  const { policyDetails, claims, createPolicy, submitClaim } = useInsuranceOperations();
  
  const [coverageAmount, setCoverageAmount] = useState(10);
  const [periodDays, setPeriodDays] = useState(30);
  const [loading, setLoading] = useState(false);
  
  const handleCreatePolicy = async () => {
    if (!publicKey) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to create a policy',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      const result = await createPolicy(coverageAmount, periodDays);
      
      toast({
        title: 'Policy Created',
        description: `Successfully created policy with ${coverageAmount} SOL coverage for ${result.premium} SOL premium`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to create policy: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitClaim = async () => {
    if (!publicKey || !policyDetails) {
      toast({
        title: 'No Active Policy',
        description: 'You need an active policy to submit a claim',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      await submitClaim(coverageAmount * 0.5, {
        type: 'PAYMENT_BREACH',
        description: 'Client failed to pay for completed work',
        attachments: [],
      });
      
      toast({
        title: 'Claim Submitted',
        description: 'Your claim has been submitted for processing',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to submit claim: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Testnet Insurance Policy</CardTitle>
            <CardDescription>Create a new insurance policy on Solana Testnet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coverage">Coverage Amount (SOL)</Label>
              <div className="flex items-center gap-2">
                <Slider
                  id="coverage"
                  min={NETWORK_CONFIG.minCoverageAmount}
                  max={NETWORK_CONFIG.maxCoverageAmount}
                  step={1}
                  value={[coverageAmount]}
                  onValueChange={(value) => setCoverageAmount(value[0])}
                />
                <span className="w-12 text-right">{coverageAmount}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="period">Coverage Period (Days)</Label>
              <div className="flex items-center gap-2">
                <Slider
                  id="period"
                  min={NETWORK_CONFIG.minPeriodDays}
                  max={NETWORK_CONFIG.maxPeriodDays}
                  step={1}
                  value={[periodDays]}
                  onValueChange={(value) => setPeriodDays(value[0])}
                />
                <span className="w-12 text-right">{periodDays}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jobType">Job Type</Label>
              <Select defaultValue="SOFTWARE_DEVELOPMENT">
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(RISK_WEIGHTS.jobTypes).map((jobType) => (
                    <SelectItem key={jobType} value={jobType}>
                      {jobType.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select defaultValue="TECHNOLOGY">
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(RISK_WEIGHTS.industries).map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleCreatePolicy} 
              disabled={loading || !publicKey}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Create Policy'}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Policy & Claims</CardTitle>
            <CardDescription>View your active policy and submit claims</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {policyDetails ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Coverage:</span>
                  <span>{policyDetails.coverageAmount} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Premium:</span>
                  <span>{policyDetails.premium} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <span className="capitalize">{policyDetails.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Expiry:</span>
                  <span>{policyDetails.endDate.toLocaleDateString()}</span>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={handleSubmitClaim} 
                    disabled={loading || policyDetails.status !== 'active'}
                    variant="outline" 
                    className="w-full"
                  >
                    {loading ? 'Processing...' : 'Submit Claim'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No active policy found</p>
                <p className="text-sm text-muted-foreground mt-1">Create a policy to see details here</p>
              </div>
            )}
            
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-2">Recent Claims</h3>
              {claims && claims.length > 0 ? (
                <div className="space-y-3">
                  {claims.map((claim) => (
                    <div key={claim.claimId} className="border rounded-lg p-3">
                      <div className="flex justify-between text-sm">
                        <span>Amount:</span>
                        <span>{claim.amount} SOL</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Status:</span>
                        <span className="capitalize">{claim.status}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Date:</span>
                        <span>{claim.timestamp.toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No claims submitted yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Testnet Information</CardTitle>
          <CardDescription>Details about the Solana testnet configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="font-medium mb-2">Network</h3>
              <p className="text-sm text-muted-foreground">Connected to Solana {NETWORK_CONFIG.name}</p>
              <p className="text-sm text-muted-foreground mt-1">Using test program IDs for insurance operations</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Risk Pool</h3>
              <p className="text-sm text-muted-foreground">Base reserve ratio: {NETWORK_CONFIG.baseReserveRatio * 100}%</p>
              <p className="text-sm text-muted-foreground mt-1">Recommended buffer: {NETWORK_CONFIG.recommendedBuffer * 100}%</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Claims</h3>
              <p className="text-sm text-muted-foreground">Auto-process threshold: {NETWORK_CONFIG.autoProcessThreshold}</p>
              <p className="text-sm text-muted-foreground mt-1">Arbitration threshold: {NETWORK_CONFIG.arbitrationThreshold}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
