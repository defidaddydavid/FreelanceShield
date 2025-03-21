import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWallet } from '@solana/wallet-adapter-react';
import { z } from 'zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AIPremiumResults } from './AIPremiumResults';
import { AIPremiumBreakdown } from './AIPremiumBreakdown';
import { AIPremiumRecommendations } from './AIPremiumRecommendations';
import MonteCarloVisualizer from './MonteCarloVisualizer';
import DynamicRiskAdjustments from './DynamicRiskAdjustments';
import { 
  AIPremiumInput, 
  AIPremiumInputSchema, 
  calculateAIPremium,
  calculateWRI
} from '@/lib/insurance/aiRiskModeling';
import { 
  simulateClaimProbability,
  adjustPremiumUsingMonteCarlo,
  MonteCarloSimulationResult,
  SimulationPath,
  ConvergenceMetrics
} from '@/lib/insurance/monteCarloSimulation';
import { AlertCircle, AlertTriangle, Check, ChevronRight, Info } from 'lucide-react';
import { useSolanaInsurance } from '@/lib/solana/hooks/useSolanaInsurance';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RISK_WEIGHTS } from '@/lib/solana/constants';
import { useRiskPoolData } from '@/lib/solana/hooks/useRiskPoolData';

// Type for market conditions
interface MarketConditions {
  usdcLiquidity: number;
  transactionFailureRate: number;
  sentiment: number;
}

interface AdjustedPremiumResult {
  adjustedPremium: number;
  riskFactors: any[];
  volatilityAdjustment: number;
  marketConditions?: MarketConditions;
}

interface RiskAdjustmentFactor {
  name: string;
  value: number;
  description: string;
  impact: number;
}

interface DynamicRiskAdjustmentsProps {
  riskFactors: RiskAdjustmentFactor[];
  basePremium: number;
  adjustedPremium: number;
  volatilityAdjustment: number;
  reputationFactor: number;
  escrowDiscount: number;
  marketConditions?: MarketConditions;
}

function AIPremiumSimulator() {
  const { connected } = useWallet();
  const { estimatePremium } = useSolanaInsurance();
  const riskPoolMetrics = useRiskPoolData();
  
  const [premiumResult, setPremiumResult] = useState<any>(null);
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloSimulationResult | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [basePremium, setBasePremium] = useState<number>(0);
  const [adjustedPremium, setAdjustedPremium] = useState<number>(0);
  const [riskFactors, setRiskFactors] = useState<RiskAdjustmentFactor[]>([]);
  const [volatilityAdjustment, setVolatilityAdjustment] = useState<number>(0);
  const [reputationFactor, setReputationFactor] = useState<number>(1);
  const [escrowDiscount, setEscrowDiscount] = useState<number>(0);
  const [simulationInProgress, setSimulationInProgress] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [walletHistory, setWalletHistory] = useState<{
    age: number;
    transactions: number;
    verifications: number;
    escrowUsage: number;
  }>({
    age: 0,
    transactions: 0,
    verifications: 0,
    escrowUsage: 0
  });
  
  const [marketConditions, setMarketConditions] = useState<MarketConditions>({
    usdcLiquidity: 0,
    transactionFailureRate: 0,
    sentiment: 0
  });
  
  const [activeTab, setActiveTab] = useState('basic');
  
  // Initialize form with default values
  const form = useForm<AIPremiumInput>({
    resolver: zodResolver(AIPremiumInputSchema),
    defaultValues: {
      coverageAmount: 5000,
      periodDays: 90,
      jobType: 'SOFTWARE_DEVELOPMENT',
      industry: 'TECHNOLOGY',
      reputationScore: 70,
      claimHistory: 0,
      walletAgeInDays: walletHistory.age,
      transactionCount: walletHistory.transactions,
      verifiedClientCount: walletHistory.verifications,
      escrowTransactionCount: walletHistory.escrowUsage,
      marketSentiment: marketConditions.sentiment,
      solanaNetworkHealth: 1 - marketConditions.transactionFailureRate
    }
  });
  
  // Fetch wallet history when wallet connects
  useEffect(() => {
    const fetchWalletHistory = async () => {
      if (!connected) return;
      
      try {
        // Simulate fetching wallet history from blockchain
        // In a real implementation, this would query the Solana blockchain
        
        // Get wallet age (for demo, we'll use a random value between 30-500 days)
        const walletAge = Math.floor(Math.random() * 470) + 30;
        
        // Get transaction count (random value between 10-200)
        const txCount = Math.floor(Math.random() * 190) + 10;
        
        // Get verified clients (random value between 0-15)
        const verifiedClients = Math.floor(Math.random() * 16);
        
        // Get escrow usage (random value between 0-10)
        const escrowUsage = Math.floor(Math.random() * 11);
        
        setWalletHistory({
          age: walletAge,
          transactions: txCount,
          verifications: verifiedClients,
          escrowUsage: escrowUsage
        });
        
        // Update form with new values
        form.setValue('walletAgeInDays', walletAge);
        form.setValue('transactionCount', txCount);
        form.setValue('verifiedClientCount', verifiedClients);
        form.setValue('escrowTransactionCount', escrowUsage);
        
      } catch (error) {
        console.error('Error fetching wallet history:', error);
      }
    };
    
    fetchWalletHistory();
    
    // Simulate fetching market conditions
    const fetchMarketConditions = async () => {
      try {
        // In a real implementation, this would query external APIs
        // For demo purposes, we'll use simulated values
        
        // Sentiment ranges from -1 (negative) to 1 (positive)
        const sentiment = (Math.random() * 2) - 1;
        
        // USDC liquidity (0.5 to 1.0)
        const liquidity = 0.5 + (Math.random() * 0.5);
        
        // Transaction failure rate (0.01 to 0.1)
        const failureRate = 0.01 + (Math.random() * 0.09);
        
        setMarketConditions({
          usdcLiquidity: liquidity,
          transactionFailureRate: failureRate,
          sentiment: sentiment
        });
        
        // Update form
        form.setValue('marketSentiment', sentiment);
        form.setValue('solanaNetworkHealth', 1 - failureRate);
        
      } catch (error) {
        console.error('Error fetching market conditions:', error);
      }
    };
    
    fetchMarketConditions();
  }, [connected, form]);
  
  // Calculate premium
  const calculatePremium = async (data: AIPremiumInput) => {
    setIsCalculating(true);
    setError(null);
    
    try {
      const result = await calculateAIPremium(data, {
        totalReserves: riskPoolMetrics?.totalValueLocked || 100000,
        outstandingCoverage: riskPoolMetrics?.poolAllocation?.reservedForClaims || 50000,
        usdcLiquidity: marketConditions.usdcLiquidity,
        transactionFailureRate: marketConditions.transactionFailureRate,
        poolDefaultRate: 0.05, // Default value
        successfulProjects: data.verifiedClientCount || 0,
        totalProjects: (data.verifiedClientCount || 0) + 2 // Add 2 as baseline
      });
      
      setPremiumResult(result);
    } catch (err) {
      console.error('Error calculating premium:', err);
      setError('Failed to calculate premium. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Calculate WRI score for display
  const wriScore = calculateWRI({
    walletAgeInDays: form.watch('walletAgeInDays'),
    transactionCount: form.watch('transactionCount'),
    verifiedClientCount: form.watch('verifiedClientCount'),
    escrowTransactionCount: form.watch('escrowTransactionCount')
  } as AIPremiumInput);
  
  // Function to calculate capital adequacy
  const calculateCapitalAdequacy = useCallback(() => {
    if (!riskPoolMetrics || !form.getValues()) return null;
    
    const formValues = form.getValues();
    const requiredCapital = formValues.coverageAmount * 0.2; // 20% reserve requirement
    const currentCapital = riskPoolMetrics.totalValueLocked || 100000;
    const surplusDeficit = currentCapital - requiredCapital;
    const adequacyRatio = currentCapital / requiredCapital;
    
    return {
      requiredCapital,
      currentCapital,
      surplusDeficit,
      adequacyRatio
    };
  }, [riskPoolMetrics, form]);
  
  // Run Monte Carlo simulation
  const runMonteCarloSimulation = useCallback(() => {
    if (!premiumResult) return;
    
    setSimulationInProgress(true);
    
    // Get form values
    const formValues = form.getValues();
    
    setTimeout(() => {
      try {
        // Perform real Monte Carlo simulation
        const jobTypeRisk = RISK_WEIGHTS.jobTypes[formValues.jobType as keyof typeof RISK_WEIGHTS.jobTypes] || 1;
        const industryRisk = RISK_WEIGHTS.industries[formValues.industry as keyof typeof RISK_WEIGHTS.industries] || 1;
        
        // Create input object for simulation
        const simInput: AIPremiumInput = {
          coverageAmount: formValues.coverageAmount,
          periodDays: formValues.periodDays,
          jobType: formValues.jobType,
          industry: formValues.industry,
          reputationScore: wriScore / 100,
          claimHistory: formValues.claimHistory || 0,
          walletAgeInDays: formValues.walletAgeInDays,
          transactionCount: formValues.transactionCount,
          verifiedClientCount: formValues.verifiedClientCount,
          escrowTransactionCount: formValues.escrowTransactionCount,
          marketSentiment: formValues.marketSentiment,
          solanaNetworkHealth: formValues.solanaNetworkHealth
        };
        
        const simulationResult = simulateClaimProbability(
          simInput,
          1000,  // iterations
          0.05   // base failure rate
        );
        
        // Apply adjustments based on simulation results
        const adjustedPremium = adjustPremiumUsingMonteCarlo(
          simulationResult,
          premiumResult.premium
        );
        
        // Create compatible object for the component state
        const enhancedResult = {
          ...simulationResult,
          // Add additional properties needed by the UI
          riskFactors: [
            { name: "Job Type Risk", value: jobTypeRisk, description: `Risk factor for ${formValues.jobType}`, impact: (jobTypeRisk - 1) * 100 },
            { name: "Industry Risk", value: industryRisk, description: `Risk factor for ${formValues.industry}`, impact: (industryRisk - 1) * 100 }
          ],
          volatilityAdjustment: 0.05, // Default value
          expectedLosses: [
            { percentile: 50, value: formValues.coverageAmount * simulationResult.claimProbability },
            { percentile: 95, value: formValues.coverageAmount * (simulationResult.claimProbability + simulationResult.tailRisk) }
          ],
          capitalAdequacy: calculateCapitalAdequacy() || {
            requiredCapital: 0,
            currentCapital: 0,
            surplusDeficit: 0,
            adequacyRatio: 0
          }
        };
        
        // Update state with simulation results
        setMonteCarloResult(enhancedResult);
        setBasePremium(premiumResult.premium);
        setAdjustedPremium(adjustedPremium);
        setRiskFactors(enhancedResult.riskFactors);
        setVolatilityAdjustment(enhancedResult.volatilityAdjustment || 0);
        
        // Set active tab to Monte Carlo
        setActiveTab('monteCarlo');
      } catch (err) {
        console.error('Error running Monte Carlo simulation:', err);
        setError('Failed to run risk simulation. Please try again.');
      } finally {
        setSimulationInProgress(false);
      }
    }, 1500); // Simulate calculation time
  }, [premiumResult, form, wriScore, riskPoolMetrics]);
  
  // Run a new simulation with updated parameters
  const runNewSimulation = () => {
    if (!premiumResult) return;
    runMonteCarloSimulation();
  };

  // Update market conditions
  const updateMarketConditions = (value: number, type: 'usdcLiquidity' | 'transactionFailureRate' | 'sentiment') => {
    setMarketConditions(prev => ({
      ...prev,
      [type]: value
    }));
  };

  // Handle market condition slider change
  const handleMarketConditionChange = (value: number, type: 'usdcLiquidity' | 'transactionFailureRate' | 'sentiment') => {
    updateMarketConditions(value, type);
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            AI-Powered Premium Simulator
          </CardTitle>
          <CardDescription>
            Our advanced AI risk engine calculates your premium based on on-chain data, 
            market conditions, and risk simulations
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
              <TabsTrigger value="monteCarlo" disabled={!monteCarloResult}>
                Monte Carlo
              </TabsTrigger>
            </TabsList>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(calculatePremium)} className="space-y-6">
                <TabsContent value="basic">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Coverage Amount */}
                    <FormField
                      control={form.control}
                      name="coverageAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coverage Amount (USDC)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            The maximum amount you can claim
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Period Days */}
                    <FormField
                      control={form.control}
                      name="periodDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coverage Period (Days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={30}
                              max={365}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Duration of coverage (30-365 days)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Job Type */}
                    <FormField
                      control={form.control}
                      name="jobType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select job type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.keys(RISK_WEIGHTS.jobTypes).map((jobType) => (
                                <SelectItem key={jobType} value={jobType}>
                                  {jobType.replace('_', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Different job types have different risk profiles
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Industry */}
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.keys(RISK_WEIGHTS.industries).map((industry) => (
                                <SelectItem key={industry} value={industry}>
                                  {industry.replace('_', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Industry sector affects payment reliability
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Reputation Score */}
                    <FormField
                      control={form.control}
                      name="reputationScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reputation Score (0-100)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                              />
                              <div className="flex justify-between">
                                <span>0</span>
                                <span className="font-medium">{field.value}</span>
                                <span>100</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Higher reputation scores reduce premiums
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Claim History */}
                    <FormField
                      control={form.control}
                      name="claimHistory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Previous Claims</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of previous claims filed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Wallet Age */}
                    <FormField
                      control={form.control}
                      name="walletAgeInDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wallet Age (Days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Older wallets indicate more established users
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Transaction Count */}
                    <FormField
                      control={form.control}
                      name="transactionCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transaction Count</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of transactions from this wallet
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Verified Clients */}
                    <FormField
                      control={form.control}
                      name="verifiedClientCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verified Clients</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of verified clients you've worked with
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Escrow Transactions */}
                    <FormField
                      control={form.control}
                      name="escrowTransactionCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Escrow Transactions</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of escrow-based payments received
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Weighted Reputation Index Display */}
                    <div className="col-span-2">
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">Weighted Reputation Index (WRI)</h3>
                          <Badge variant={wriScore > 0.75 ? "default" : wriScore > 0.5 ? "secondary" : "destructive"}>
                            {wriScore.toFixed(2)}
                          </Badge>
                        </div>
                        <Progress value={wriScore * 100} className="h-2" />
                        <p className="text-sm text-muted-foreground mt-2">
                          WRI combines on-chain metrics to assess your reputation. Higher is better.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="monteCarlo" className="space-y-4">
                  {monteCarloResult ? (
                    <>
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Monte Carlo Simulation Results</h3>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={runNewSimulation}
                          disabled={simulationInProgress}
                        >
                          {simulationInProgress ? 'Running...' : 'Run New Simulation'}
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Premium Adjustment</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Base Premium:</span>
                                <span className="font-medium">{basePremium.toFixed(4)} SOL</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Adjusted Premium:</span>
                                <span className="font-medium">{adjustedPremium.toFixed(4)} SOL</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Volatility Adjustment:</span>
                                <span className="font-medium">{(volatilityAdjustment * 100).toFixed(2)}%</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Simulation Statistics</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Iterations:</span>
                                <span className="font-medium">1000</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Convergence Rate:</span>
                                <span className="font-medium">{(monteCarloResult?.claimProbability || 0).toFixed(4)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Confidence Level:</span>
                                <span className="font-medium">95%</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <MonteCarloVisualizer 
                        simulationResult={monteCarloResult}
                        basePremium={basePremium}
                        adjustedPremium={adjustedPremium}
                        onRunNewSimulation={runNewSimulation}
                      />
                      
                      <DynamicRiskAdjustments 
                        riskFactors={riskFactors}
                        basePremium={basePremium}
                        adjustedPremium={adjustedPremium}
                        volatilityAdjustment={volatilityAdjustment}
                        reputationFactor={reputationFactor}
                        escrowDiscount={escrowDiscount}
                        marketConditions={marketConditions}
                      />
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground mb-4">
                        Run a premium calculation first, then click "Run Monte Carlo Simulation" to see the results.
                      </p>
                      <Button 
                        onClick={runMonteCarloSimulation} 
                        disabled={!premiumResult || simulationInProgress}
                      >
                        {simulationInProgress ? 'Running...' : 'Run Monte Carlo Simulation'}
                      </Button>
                    </div>
                  )}
                </TabsContent>
                
                <div className="flex justify-end">
                  <Button type="submit" size="lg" disabled={isCalculating}>
                    {isCalculating ? 'Calculating...' : 'Calculate Premium'}
                  </Button>
                </div>
              </form>
            </Form>
          </Tabs>
        </CardContent>
        
        {premiumResult && (
          <CardFooter className="flex flex-col">
            <Separator className="my-6" />
            <AIPremiumResults 
              premium={premiumResult?.premium || 0}
              riskScore={premiumResult?.riskScore || 0}
              riskDecile={premiumResult?.riskDecile || 0}
              claimProbability={premiumResult?.claimProbability || 0}
              confidenceInterval={premiumResult?.confidenceInterval || [0, 0]}
              timeBasedProjections={premiumResult?.timeBasedProjections || {
                threeMonths: 0,
                sixMonths: 0,
                twelveMonths: 0
              }}
            />
            <Separator className="my-6" />
            <AIPremiumBreakdown factors={premiumResult.breakdownFactors} />
            <Separator className="my-6" />
            <AIPremiumRecommendations 
              recommendations={premiumResult?.recommendations || []}
              riskScore={premiumResult?.riskScore || 0}
            />
            
            {!monteCarloResult && (
              <>
                <Separator className="my-6" />
                <div className="flex justify-center w-full">
                  <Button 
                    onClick={runMonteCarloSimulation} 
                    disabled={simulationInProgress}
                    className="w-full max-w-md"
                  >
                    {simulationInProgress ? 'Running Monte Carlo Simulation...' : 'Run Monte Carlo Simulation'}
                  </Button>
                </div>
              </>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default AIPremiumSimulator;
