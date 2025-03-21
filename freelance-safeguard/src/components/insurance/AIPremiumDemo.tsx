import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIPremiumResults } from './AIPremiumResults';
import { AIPremiumBreakdown } from './AIPremiumBreakdown';
import { AIPremiumRecommendations } from './AIPremiumRecommendations';
import { calculateAIPremium } from '@/lib/insurance/aiPremiumCalculation';
import { AIPremiumInput } from '@/lib/insurance/riskModels';

// Sample freelancer profiles for demo
const SAMPLE_PROFILES = {
  newFreelancer: {
    coverageAmount: 2000,
    periodDays: 30,
    jobType: 'development',
    industry: 'technology',
    reputationScore: 70,
    claimHistory: 0,
    walletAgeInDays: 30,
    transactionCount: 5,
    verifiedClientCount: 1,
    escrowTransactionCount: 2,
    disputeResolutionCount: 0,
    positiveDisputeOutcomes: 0,
    marketSentiment: 0,
    solanaNetworkHealth: 0.9,
  },
  experiencedFreelancer: {
    coverageAmount: 5000,
    periodDays: 60,
    jobType: 'design',
    industry: 'marketing',
    reputationScore: 90,
    claimHistory: 0,
    walletAgeInDays: 365,
    transactionCount: 120,
    verifiedClientCount: 15,
    escrowTransactionCount: 30,
    disputeResolutionCount: 2,
    positiveDisputeOutcomes: 2,
    marketSentiment: 0.2,
    solanaNetworkHealth: 0.9,
    consecutiveClaimFreeMonths: 12,
    policyAgeInMonths: 12,
    previousPolicies: 2,
    projectCompletionRate: 0.98,
    transactionHistory: [
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 6, amount: 1000, type: 'payment', counterpartyVerified: true },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 5, amount: 1500, type: 'payment', counterpartyVerified: true },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 4, amount: 2000, type: 'escrow', counterpartyVerified: true },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 3, amount: 1800, type: 'payment', counterpartyVerified: true },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 2, amount: 2500, type: 'escrow', counterpartyVerified: true },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 1, amount: 3000, type: 'payment', counterpartyVerified: true },
    ],
    incomeTransactions: [
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 6, amount: 1000 },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 5, amount: 1500 },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 4, amount: 2000 },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 3, amount: 1800 },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 2, amount: 2500 },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 1, amount: 3000 },
    ],
  },
  riskyFreelancer: {
    coverageAmount: 10000,
    periodDays: 90,
    jobType: 'consulting',
    industry: 'finance',
    reputationScore: 60,
    claimHistory: 2,
    walletAgeInDays: 180,
    transactionCount: 50,
    verifiedClientCount: 5,
    escrowTransactionCount: 3,
    disputeResolutionCount: 3,
    positiveDisputeOutcomes: 1,
    marketSentiment: -0.3,
    solanaNetworkHealth: 0.7,
    monthsSinceLastClaim: 2,
    projectCompletionRate: 0.85,
    transactionHistory: [
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 6, amount: 2000, type: 'payment', counterpartyVerified: true },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 5, amount: 3000, type: 'payment', counterpartyVerified: false },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 4, amount: 5000, type: 'claim', counterpartyVerified: false },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 3, amount: 4000, type: 'payment', counterpartyVerified: true },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 2, amount: 6000, type: 'claim', counterpartyVerified: false },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 1, amount: 3500, type: 'payment', counterpartyVerified: true },
    ],
    incomeTransactions: [
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 6, amount: 2000 },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 5, amount: 3000 },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 4, amount: 0 },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 3, amount: 4000 },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 2, amount: 0 },
      { timestamp: Date.now() - 1000 * 60 * 60 * 24 * 30 * 1, amount: 3500 },
    ],
  }
} as const;

type ProfileType = keyof typeof SAMPLE_PROFILES;

export function AIPremiumDemo() {
  const [activeProfile, setActiveProfile] = useState<ProfileType>('newFreelancer');
  const [calculationResult, setCalculationResult] = useState<ReturnType<typeof calculateAIPremium> | null>(null);
  const [activeTab, setActiveTab] = useState('results');
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = () => {
    setIsCalculating(true);
    
    // Simulate calculation delay for demo purposes
    setTimeout(() => {
      try {
        const result = calculateAIPremium(SAMPLE_PROFILES[activeProfile] as AIPremiumInput);
        setCalculationResult(result);
        setActiveTab('results');
      } catch (error) {
        console.error('Error calculating premium:', error);
      } finally {
        setIsCalculating(false);
      }
    }, 1500);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">AI Premium Calculator Demo</h1>
        <p className="text-muted-foreground">
          Experience our advanced AI-powered premium calculation system with sample freelancer profiles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {(Object.keys(SAMPLE_PROFILES) as ProfileType[]).map((profile) => (
          <Card 
            key={profile} 
            className={`cursor-pointer transition-all ${activeProfile === profile ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
            onClick={() => setActiveProfile(profile)}
          >
            <CardHeader>
              <CardTitle>
                {profile === 'newFreelancer' && 'New Freelancer'}
                {profile === 'experiencedFreelancer' && 'Experienced Freelancer'}
                {profile === 'riskyFreelancer' && 'High-Risk Freelancer'}
              </CardTitle>
              <CardDescription>
                {profile === 'newFreelancer' && 'Just starting out with minimal history'}
                {profile === 'experiencedFreelancer' && 'Established with excellent reputation'}
                {profile === 'riskyFreelancer' && 'Multiple claims and volatile income'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Coverage:</span> ${SAMPLE_PROFILES[profile].coverageAmount} USDC</div>
              <div><span className="font-medium">Period:</span> {SAMPLE_PROFILES[profile].periodDays} days</div>
              <div><span className="font-medium">Reputation:</span> {SAMPLE_PROFILES[profile].reputationScore}/100</div>
              <div><span className="font-medium">Claims:</span> {SAMPLE_PROFILES[profile].claimHistory}</div>
            </CardContent>
            <CardFooter>
              <div className={`w-full h-2 rounded-full ${
                profile === 'newFreelancer' ? 'bg-yellow-400' : 
                profile === 'experiencedFreelancer' ? 'bg-green-500' : 
                'bg-red-500'
              }`}></div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="flex justify-center mb-8">
        <Button 
          size="lg" 
          onClick={handleCalculate} 
          disabled={isCalculating}
          className="w-full md:w-auto"
        >
          {isCalculating ? 'Calculating...' : 'Calculate Premium'}
        </Button>
      </div>

      {calculationResult && (
        <div className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>
            <TabsContent value="results">
              <AIPremiumResults 
                premium={calculationResult.premiumUSDC}
                riskScore={calculationResult.riskScore}
                riskDecile={calculationResult.riskDecile}
                claimProbability={calculationResult.simulationResults.claimProbability}
                confidenceInterval={calculationResult.simulationResults.confidenceInterval}
                timeBasedProjections={calculationResult.timeBasedProjections}
              />
            </TabsContent>
            <TabsContent value="breakdown">
              <AIPremiumBreakdown 
                factors={calculationResult.breakdownFactors}
                varianceContributions={calculationResult.simulationResults.varianceContributions}
                riskSegmentation={calculationResult.riskSegmentation}
              />
            </TabsContent>
            <TabsContent value="recommendations">
              <AIPremiumRecommendations 
                recommendations={calculationResult.recommendedActions}
                riskScore={calculationResult.riskScore}
                premium={calculationResult.premiumUSDC}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
