import React, { useState } from 'react';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MONTE_CARLO_CONFIG } from '@/lib/insurance/monteCarloSimulation';

interface RiskAdjustmentFactor {
  name: string;
  value: number;
  impact: number; // -1 to 1, where -1 is maximum reduction, 1 is maximum increase
  description: string;
}

interface DynamicRiskAdjustmentsProps {
  basePremium: number;
  adjustedPremium: number;
  riskFactors: RiskAdjustmentFactor[];
  volatilityAdjustment: number;
  reputationFactor: number;
  escrowDiscount: number;
  marketConditions: {
    usdcLiquidity: number;
    transactionFailureRate: number;
    sentiment: number;
  };
  onSimulateChange?: (factor: string, newValue: number) => void;
}

const DynamicRiskAdjustments: React.FC<DynamicRiskAdjustmentsProps> = ({
  basePremium,
  adjustedPremium,
  riskFactors,
  volatilityAdjustment,
  reputationFactor,
  escrowDiscount,
  marketConditions,
  onSimulateChange
}) => {
  const [activeTab, setActiveTab] = useState('factors');
  const [simulatedValues, setSimulatedValues] = useState<Record<string, number>>({});
  
  // Calculate total adjustment percentage
  const totalAdjustmentPct = ((adjustedPremium / basePremium) - 1) * 100;
  
  // Sort risk factors by absolute impact
  const sortedRiskFactors = [...riskFactors].sort((a, b) => 
    Math.abs(b.impact) - Math.abs(a.impact)
  );
  
  // Helper function to get color based on impact
  const getImpactColor = (impact: number) => {
    if (impact < -0.2) return 'text-green-500';
    if (impact > 0.2) return 'text-red-500';
    return 'text-yellow-500';
  };
  
  // Helper function to get badge variant based on impact
  const getImpactBadge = (impact: number) => {
    if (impact < -0.2) return 'success';
    if (impact > 0.2) return 'destructive';
    return 'warning';
  };
  
  // Helper function to format percentage
  const formatPct = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };
  
  // Handle slider change
  const handleSliderChange = (factor: string, newValue: number) => {
    setSimulatedValues({
      ...simulatedValues,
      [factor]: newValue
    });
    
    if (onSimulateChange) {
      onSimulateChange(factor, newValue);
    }
  };
  
  // Reset simulations
  const resetSimulations = () => {
    setSimulatedValues({});
    
    if (onSimulateChange) {
      Object.keys(simulatedValues).forEach(factor => {
        onSimulateChange(factor, 0); // Reset to default
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Dynamic Risk Adjustments</CardTitle>
        <CardDescription>
          See how different risk factors affect your premium in real-time
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Base Premium</div>
            <div className="text-2xl font-bold">{basePremium.toFixed(2)} USDC</div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Total Adjustment</div>
            <div className={`text-2xl font-bold ${totalAdjustmentPct >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              {formatPct(totalAdjustmentPct)}
            </div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Final Premium</div>
            <div className="text-2xl font-bold">{adjustedPremium.toFixed(2)} USDC</div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="factors">Risk Factors</TabsTrigger>
            <TabsTrigger value="market">Market Conditions</TabsTrigger>
            <TabsTrigger value="simulate">Simulate Changes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="factors">
            <Accordion type="single" collapsible className="w-full">
              {sortedRiskFactors.map((factor, index) => (
                <AccordionItem key={factor.name} value={`item-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between items-center w-full pr-4">
                      <span>{factor.name}</span>
                      <Badge variant={getImpactBadge(factor.impact)}>
                        {formatPct(factor.impact * 100)}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      <p className="text-sm text-muted-foreground">{factor.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Current Value: {factor.value.toFixed(2)}</span>
                        <span className={`text-sm font-medium ${getImpactColor(factor.impact)}`}>
                          Premium Impact: {formatPct(factor.impact * 100)}
                        </span>
                      </div>
                      <Progress 
                        value={50 + (factor.impact * 50)} 
                        className="h-2" 
                        indicatorClassName={factor.impact < 0 ? 'bg-green-500' : 'bg-red-500'}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            <div className="mt-6 space-y-4">
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm font-medium">Volatility Adjustment</div>
                  <div className={`text-xl font-medium ${volatilityAdjustment >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {formatPct(volatilityAdjustment * 100)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on USDC liquidity and market conditions
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="text-sm font-medium">Reputation Discount</div>
                  <div className="text-xl font-medium text-green-500">
                    {formatPct(-((1 - reputationFactor) * 100))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on your on-chain reputation and history
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="text-sm font-medium">Escrow Discount</div>
                  <div className="text-xl font-medium text-green-500">
                    {formatPct(-escrowDiscount * 100)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Discount for using escrow in previous transactions
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="market">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">USDC Liquidity</span>
                    <span className="text-sm">{(marketConditions.usdcLiquidity * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={marketConditions.usdcLiquidity * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Higher liquidity means lower volatility risk
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Network Health</span>
                    <span className="text-sm">{((1 - marketConditions.transactionFailureRate) * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={(1 - marketConditions.transactionFailureRate) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Based on Solana transaction success rate
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Market Sentiment</span>
                    <span className="text-sm">
                      {marketConditions.sentiment > 0 ? 'Positive' : 
                       marketConditions.sentiment < 0 ? 'Negative' : 'Neutral'}
                    </span>
                  </div>
                  <Progress 
                    value={(marketConditions.sentiment + 1) * 50} 
                    className="h-2"
                    indicatorClassName={
                      marketConditions.sentiment > 0.3 ? 'bg-green-500' : 
                      marketConditions.sentiment < -0.3 ? 'bg-red-500' : 'bg-yellow-500'
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Current market sentiment affects risk pricing
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 border rounded-lg">
                <h3 className="text-sm font-medium mb-2">Risk Bucket Thresholds</h3>
                <div className="space-y-4">
                  {Object.entries(MONTE_CARLO_CONFIG.RISK_BUCKETS).map(([bucket, { threshold, premiumMultiplier }]) => (
                    <div key={bucket} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{bucket.charAt(0) + bucket.slice(1).toLowerCase()} Risk</span>
                        <span>Premium Multiplier: {premiumMultiplier.toFixed(2)}x</span>
                      </div>
                      <Progress 
                        value={threshold} 
                        className="h-2"
                        indicatorClassName={
                          bucket === 'LOW' ? 'bg-green-500' : 
                          bucket === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="simulate">
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Adjust the sliders below to simulate how changes to your risk profile would affect your premium
              </p>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Reputation Score</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current: {riskFactors.find(f => f.name === 'Reputation Score')?.value || 0}</span>
                      <span>Simulated: {simulatedValues['reputation'] || riskFactors.find(f => f.name === 'Reputation Score')?.value || 0}</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[simulatedValues['reputation'] || riskFactors.find(f => f.name === 'Reputation Score')?.value || 0]}
                      onValueChange={(value) => handleSliderChange('reputation', value[0])}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Escrow Usage</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current: {riskFactors.find(f => f.name === 'Escrow Usage')?.value || 0}%</span>
                      <span>Simulated: {simulatedValues['escrow'] || riskFactors.find(f => f.name === 'Escrow Usage')?.value || 0}%</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={[simulatedValues['escrow'] || riskFactors.find(f => f.name === 'Escrow Usage')?.value || 0]}
                      onValueChange={(value) => handleSliderChange('escrow', value[0])}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Transaction History</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current: {riskFactors.find(f => f.name === 'Transaction Count')?.value || 0}</span>
                      <span>Simulated: {simulatedValues['transactions'] || riskFactors.find(f => f.name === 'Transaction Count')?.value || 0}</span>
                    </div>
                    <Slider
                      min={0}
                      max={200}
                      step={5}
                      value={[simulatedValues['transactions'] || riskFactors.find(f => f.name === 'Transaction Count')?.value || 0]}
                      onValueChange={(value) => handleSliderChange('transactions', value[0])}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Claim History</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current: {riskFactors.find(f => f.name === 'Claim History')?.value || 0}</span>
                      <span>Simulated: {simulatedValues['claims'] || riskFactors.find(f => f.name === 'Claim History')?.value || 0}</span>
                    </div>
                    <Slider
                      min={0}
                      max={10}
                      step={1}
                      value={[simulatedValues['claims'] || riskFactors.find(f => f.name === 'Claim History')?.value || 0]}
                      onValueChange={(value) => handleSliderChange('claims', value[0])}
                    />
                  </div>
                </div>
              </div>
              
              {Object.keys(simulatedValues).length > 0 && (
                <div className="flex justify-end">
                  <Button variant="outline" onClick={resetSimulations}>
                    Reset Simulations
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-6">
        <p className="text-sm text-muted-foreground">
          All adjustments are calculated in real-time based on our AI risk model
        </p>
      </CardFooter>
    </Card>
  );
};

export default DynamicRiskAdjustments;
