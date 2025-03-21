import React from 'react';
import { PremiumCalculator } from '@/components/insurance/PremiumCalculator';
import { Container } from '@/components/ui/container';
import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: 'Premium Calculator | FreelanceShield',
  description: 'Calculate your insurance premium based on coverage, period, job type, and other risk factors',
};

export default function PremiumCalculatorPage() {
  return (
    <Container className="py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insurance Premium Calculator</h1>
          <p className="text-muted-foreground mt-2">
            Our hybrid risk-based pricing model uses logarithmic risk curves and Bayesian adjustments to calculate fair premiums.
          </p>
        </div>
        
        <Tabs defaultValue="calculator">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="model">Risk Model</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculator" className="mt-6">
            <PremiumCalculator />
          </TabsContent>
          
          <TabsContent value="model" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Hybrid Risk-Based Pricing Model</CardTitle>
                <CardDescription>
                  Understanding how our premium calculation works
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Logarithmic Risk Curves</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Our model uses logarithmic scaling to better handle varying coverage amounts and risk factors.
                    This approach ensures that premiums scale non-linearly with coverage, providing better value for
                    higher coverage amounts while maintaining adequate risk protection.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold">Bayesian Adjustments</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    We incorporate Bayesian adjustments to continuously learn from claims data and adjust risk factors.
                    This allows our model to adapt to changing market conditions and improve accuracy over time.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold">Key Formula Components</h3>
                  <div className="mt-2 p-4 bg-muted rounded-md font-mono text-sm">
                    Premium = BaseRate * CoverageFactor * PeriodFactor * RiskWeight * ReputationMultiplier * MarketAdjustment
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li><strong>BaseRate:</strong> Starting premium rate (0.1 SOL)</li>
                    <li><strong>CoverageFactor:</strong> Non-linear scaling based on coverage amount using logarithmic curve</li>
                    <li><strong>PeriodFactor:</strong> Exponential scaling based on coverage period</li>
                    <li><strong>RiskWeight:</strong> Combined risk from job type and industry with claims history adjustment</li>
                    <li><strong>ReputationMultiplier:</strong> Discount factor based on reputation score (0.7-1.0 range)</li>
                    <li><strong>MarketAdjustment:</strong> Factor accounting for current market volatility</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold">Risk Score Calculation</h3>
                  <div className="mt-2 p-4 bg-muted rounded-md font-mono text-sm">
                    RiskScore = (RiskWeight * 20 + ClaimsImpact * 15 + CoverageRatioImpact * 30 + ReputationImpact * 35)
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    The risk score provides a standardized measure (0-100) of the overall risk profile of a policy,
                    which helps in risk management and portfolio analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="faq" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Common questions about our premium calculation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">How is my premium calculated?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your premium is calculated using a hybrid risk-based pricing model that considers coverage amount,
                    period, job type, industry, reputation score, claims history, and market conditions. We use
                    logarithmic risk curves to ensure fair pricing across different coverage levels.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold">How can I reduce my premium?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You can reduce your premium by maintaining a high reputation score, selecting lower-risk job types
                    and industries, and maintaining a clean claims history. You can also adjust your coverage amount
                    and period to find the optimal balance between protection and cost.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold">What is a reputation score?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your reputation score is derived from your on-chain activity, client ratings, and other Web3
                    reputation metrics. A higher reputation score indicates lower risk and results in lower premiums.
                    New users start with a default score that improves over time with positive activity.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold">How does claims history affect my premium?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Each claim you make increases your risk profile and may result in higher premiums for future policies.
                    The impact decreases over time if you maintain a clean claims history. Our Bayesian model continuously
                    adjusts based on the frequency and severity of claims.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold">What are market conditions?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Market conditions reflect the current volatility and risk in the freelance market. These are
                    determined by on-chain data, economic indicators, and other market signals. Higher market
                    volatility may result in slightly higher premiums to account for increased uncertainty.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
}
