import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSolanaInsurance } from '@/hooks/useSolanaInsurance';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import { NETWORK_CONFIG, RISK_WEIGHTS } from '@/lib/solana/constants';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function TestnetDemo() {
  const { publicKey } = useWallet();
  const { 
    isInitialized,
    isLoading,
    error,
    policy,
    claims,
    riskPoolMetrics,
    
    initializeProgram,
    createPolicy,
    submitClaim,
    verifyPayment,
    confirmPayment,
    triggerMissedPaymentClaim,
    estimatePremium
  } = useSolanaInsurance();
  
  // Policy creation state
  const [coverageAmount, setCoverageAmount] = useState(10);
  const [periodDays, setPeriodDays] = useState(30);
  const [jobType, setJobType] = useState("SOFTWARE_DEVELOPMENT");
  const [industry, setIndustry] = useState("TECHNOLOGY");
  
  // Claim submission state
  const [claimAmount, setClaimAmount] = useState(0);
  const [evidenceType, setEvidenceType] = useState("PAYMENT_BREACH");
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [evidenceAttachments, setEvidenceAttachments] = useState<string[]>([]);
  
  // Payment verification state
  const [clientPublicKey, setClientPublicKey] = useState("");
  const [expectedAmount, setExpectedAmount] = useState(1);
  const [deadlineDays, setDeadlineDays] = useState(7);
  
  // Calculate estimated premium
  const estimatedPremium = estimatePremium(
    coverageAmount,
    periodDays,
    jobType,
    industry
  );
  
  // Initialize program if not already initialized
  const handleInitializeProgram = async () => {
    console.log('Initializing program...');
    if (!publicKey) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to initialize the program',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const txId = await initializeProgram();
      console.log('Program initialized with transaction ID:', txId);
      toast({
        title: 'Program Initialized',
        description: `Successfully initialized insurance program. Transaction ID: ${txId.slice(0, 8)}...`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error initializing program:', error);
      toast({
        title: 'Error',
        description: `Failed to initialize program: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };
  
  // Create a new insurance policy
  const handleCreatePolicy = async () => {
    if (!publicKey) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to create a policy',
        variant: 'destructive',
      });
      return;
    }
    
    if (!isInitialized) {
      toast({
        title: 'Program Not Initialized',
        description: 'Please initialize the program first',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const txId = await createPolicy(
        coverageAmount,
        periodDays,
        jobType,
        industry
      );
      
      toast({
        title: 'Policy Created',
        description: `Successfully created policy with ${coverageAmount} SOL coverage for ${estimatedPremium.toFixed(3)} SOL premium`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to create policy: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };
  
  // Submit a claim for an active policy
  const handleSubmitClaim = async () => {
    if (!publicKey || !policy) {
      toast({
        title: 'No Active Policy',
        description: 'You need an active policy to submit a claim',
        variant: 'destructive',
      });
      return;
    }
    
    if (policy.status !== 'Active') {
      toast({
        title: 'Policy Not Active',
        description: 'Your policy must be active to submit a claim',
        variant: 'destructive',
      });
      return;
    }
    
    if (claimAmount <= 0) {
      toast({
        title: 'Invalid Claim Amount',
        description: 'Please enter a valid claim amount',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const txId = await submitClaim(
        claimAmount,
        evidenceType,
        evidenceDescription,
        evidenceAttachments
      );
      
      toast({
        title: 'Claim Submitted',
        description: 'Your claim has been submitted for processing',
        variant: 'default',
      });
      
      // Reset form
      setClaimAmount(0);
      setEvidenceDescription("");
      setEvidenceAttachments([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to submit claim: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };
  
  // Verify payment for a contract
  const handleVerifyPayment = async () => {
    if (!publicKey) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to verify payment',
        variant: 'destructive',
      });
      return;
    }
    
    if (!clientPublicKey) {
      toast({
        title: 'Missing Client Address',
        description: 'Please enter the client\'s Solana address',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const txId = await verifyPayment(
        clientPublicKey,
        expectedAmount,
        deadlineDays
      );
      
      toast({
        title: 'Payment Verification Created',
        description: `Successfully created payment verification for ${expectedAmount} SOL`,
        variant: 'default',
      });
      
      // Reset form
      setClientPublicKey("");
      setExpectedAmount(1);
      setDeadlineDays(7);
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to verify payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">FreelanceShield Testnet Demo</h1>
        {!isInitialized && (
          <Button onClick={handleInitializeProgram} disabled={isLoading || !publicKey}>
            Initialize Insurance Program
          </Button>
        )}
      </div>
      
      {riskPoolMetrics && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Risk Pool Metrics</CardTitle>
            <CardDescription>Current status of the insurance risk pool</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Staked</p>
                <p className="text-xl font-medium">{riskPoolMetrics.totalStaked / NETWORK_CONFIG.lamportsPerSol} SOL</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Coverage</p>
                <p className="text-xl font-medium">{riskPoolMetrics.totalCoverage / NETWORK_CONFIG.lamportsPerSol} SOL</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Active Policies</p>
                <p className="text-xl font-medium">{riskPoolMetrics.activePolicies}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Reserve Ratio</p>
                <p className="text-xl font-medium">{(riskPoolMetrics.reserveRatio * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="policy">
        <TabsList className="mb-4">
          <TabsTrigger value="policy">Insurance Policy</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="payments">Payment Verification</TabsTrigger>
        </TabsList>
        
        <TabsContent value="policy">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Create Insurance Policy</CardTitle>
                <CardDescription>Protect your freelance work on Solana Testnet</CardDescription>
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
                  <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(RISK_WEIGHTS.jobTypes).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(RISK_WEIGHTS.industries).map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Estimated Premium:</span>
                    <span className="font-medium">{estimatedPremium.toFixed(3)} SOL</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Risk Weight (Job):</span>
                    <span>{RISK_WEIGHTS.jobTypes[jobType as keyof typeof RISK_WEIGHTS.jobTypes]}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Risk Weight (Industry):</span>
                    <span>{RISK_WEIGHTS.industries[industry as keyof typeof RISK_WEIGHTS.industries]}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleCreatePolicy} 
                  disabled={isLoading || !publicKey || !isInitialized}
                  className="w-full"
                >
                  {isLoading ? 'Processing...' : 'Create Policy'}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Your Active Policy</CardTitle>
                <CardDescription>View your current insurance policy details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {policy ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Status:</span>
                      <Badge variant={policy.status === 'Active' ? 'default' : 'secondary'}>
                        {policy.status}
                      </Badge>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Coverage Amount:</span>
                        <span>{policy.coverageAmount / NETWORK_CONFIG.lamportsPerSol} SOL</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Premium Paid:</span>
                        <span>{policy.premiumAmount / NETWORK_CONFIG.lamportsPerSol} SOL</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Start Date:</span>
                        <span>{policy.startDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Expiry Date:</span>
                        <span>{policy.endDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Job Type:</span>
                        <span>{policy.jobType.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Industry:</span>
                        <span>{policy.industry.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Claims Filed:</span>
                        <span>{policy.claimsCount}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No active policy found</p>
                    <p className="text-sm text-muted-foreground mt-2">Create a policy to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="claims">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Submit a Claim</CardTitle>
                <CardDescription>File a claim against your active policy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="claimAmount">Claim Amount (SOL)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="claimAmount"
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(parseFloat(e.target.value))}
                      disabled={!policy || policy.status !== 'Active'}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="evidenceType">Evidence Type</Label>
                  <Select 
                    value={evidenceType} 
                    onValueChange={setEvidenceType}
                    disabled={!policy || policy.status !== 'Active'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select evidence type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAYMENT_BREACH">Payment Breach</SelectItem>
                      <SelectItem value="CONTRACT_VIOLATION">Contract Violation</SelectItem>
                      <SelectItem value="SCOPE_CHANGE">Scope Change Without Compensation</SelectItem>
                      <SelectItem value="INTELLECTUAL_PROPERTY">Intellectual Property Theft</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="evidenceDescription">Evidence Description</Label>
                  <Textarea
                    id="evidenceDescription"
                    placeholder="Describe the evidence supporting your claim..."
                    value={evidenceDescription}
                    onChange={(e) => setEvidenceDescription(e.target.value)}
                    disabled={!policy || policy.status !== 'Active'}
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="evidenceAttachments">Evidence Attachments (URLs)</Label>
                  <Input
                    id="evidenceAttachment"
                    placeholder="Add URL to evidence (screenshots, documents, etc.)"
                    disabled={!policy || policy.status !== 'Active'}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        setEvidenceAttachments([...evidenceAttachments, e.currentTarget.value]);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  
                  {evidenceAttachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {evidenceAttachments.map((url, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="truncate">{url}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newAttachments = [...evidenceAttachments];
                              newAttachments.splice(index, 1);
                              setEvidenceAttachments(newAttachments);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSubmitClaim} 
                  disabled={isLoading || !policy || policy.status !== 'Active' || claimAmount <= 0 || !evidenceDescription}
                  className="w-full"
                >
                  {isLoading ? 'Processing...' : 'Submit Claim'}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Your Claims</CardTitle>
                <CardDescription>View your submitted claims and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {claims && claims.length > 0 ? (
                  <div className="space-y-4">
                    {claims.map((claim, index) => (
                      <div key={index} className="border rounded-md p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Claim #{index + 1}</span>
                          <Badge variant={
                            claim.status === 'Approved' ? 'default' :
                            claim.status === 'Rejected' ? 'destructive' :
                            claim.status === 'Arbitration' ? 'outline' : 'secondary'
                          }>
                            {claim.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount:</span>
                            <span>{claim.amount / NETWORK_CONFIG.lamportsPerSol} SOL</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span>{claim.evidenceType.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Submitted:</span>
                            <span>{claim.submissionDate.toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        {claim.verdict && (
                          <div className="mt-2 pt-2 border-t text-sm">
                            <div className="font-medium mb-1">Verdict: {claim.verdict.approved ? 'Approved' : 'Rejected'}</div>
                            <p className="text-muted-foreground">{claim.verdict.reason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No claims found</p>
                    <p className="text-sm text-muted-foreground mt-2">Submit a claim when you need it</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="payments">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Verify Payment</CardTitle>
                <CardDescription>Create a payment verification for a client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientAddress">Client Solana Address</Label>
                  <Input
                    id="clientAddress"
                    placeholder="Enter client's Solana address"
                    value={clientPublicKey}
                    onChange={(e) => setClientPublicKey(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expectedAmount">Expected Payment (SOL)</Label>
                  <Input
                    id="expectedAmount"
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={expectedAmount}
                    onChange={(e) => setExpectedAmount(parseFloat(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deadlineDays">Payment Deadline (Days)</Label>
                  <Input
                    id="deadlineDays"
                    type="number"
                    min={1}
                    step={1}
                    value={deadlineDays}
                    onChange={(e) => setDeadlineDays(parseInt(e.target.value))}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleVerifyPayment} 
                  disabled={isLoading || !publicKey || !clientPublicKey || expectedAmount <= 0}
                  className="w-full"
                >
                  {isLoading ? 'Processing...' : 'Create Payment Verification'}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Payment Verifications</CardTitle>
                <CardDescription>Track client payment verifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No payment verifications yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Create a payment verification to track client payments</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
