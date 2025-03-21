import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Shield, 
  BarChart3, 
  Brain, 
  Wallet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AIPremiumSimulator from '@/components/insurance/AIPremiumSimulator';
import { AIPremiumDemo } from '@/components/insurance/AIPremiumDemo';

const AIPremiumCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('simulator');
  
  useEffect(() => {
    // Update the document title when the component mounts
    document.title = 'AI Premium Calculator | FreelanceShield';
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Link to="/dashboard">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        
        <div className="mt-4 flex items-center">
          <Sparkles className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-3xl font-bold">AI-Powered Premium Calculator</h1>
        </div>
        
        <p className="mt-2 text-muted-foreground max-w-3xl">
          Our advanced AI risk engine uses on-chain data analysis, Monte Carlo simulations, and 
          Bayesian inference to calculate the most accurate premium for your freelance insurance.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-muted rounded-lg p-4 flex items-start">
          <Shield className="h-5 w-5 mr-3 mt-0.5 text-primary" />
          <div>
            <h3 className="font-medium">USDC-Based Pricing</h3>
            <p className="text-sm text-muted-foreground mt-1">
              All premiums are calculated in USDC to eliminate crypto volatility risks
            </p>
          </div>
        </div>
        
        <div className="bg-muted rounded-lg p-4 flex items-start">
          <BarChart3 className="h-5 w-5 mr-3 mt-0.5 text-primary" />
          <div>
            <h3 className="font-medium">10,000+ Risk Simulations</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Monte Carlo modeling runs thousands of scenarios to determine optimal pricing
            </p>
          </div>
        </div>
        
        <div className="bg-muted rounded-lg p-4 flex items-start">
          <Wallet className="h-5 w-5 mr-3 mt-0.5 text-primary" />
          <div>
            <h3 className="font-medium">On-Chain Reputation</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your wallet history and transaction patterns are analyzed for better pricing
            </p>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="simulator">Premium Simulator</TabsTrigger>
          <TabsTrigger value="demo">Demo Profiles</TabsTrigger>
        </TabsList>
        <TabsContent value="simulator">
          <AIPremiumSimulator />
        </TabsContent>
        <TabsContent value="demo">
          <AIPremiumDemo />
        </TabsContent>
      </Tabs>
      
      <div className="mt-12 bg-muted p-6 rounded-lg">
        <div className="flex items-center mb-4">
          <Brain className="h-6 w-6 mr-2 text-primary" />
          <h2 className="text-2xl font-bold">How Our AI Risk Engine Works</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-2">Dynamic Risk Assessment</h3>
            <p className="text-muted-foreground">
              Unlike traditional insurance that relies on historical claims data, our AI engine 
              creates a synthetic risk model that adapts in real-time. We analyze your Solana 
              wallet transaction history, on-chain proof of work verification, and assign a 
              Weighted Reputation Index (WRI) to determine your risk profile.
            </p>
            
            <h3 className="text-lg font-medium mt-6 mb-2">Social Risk Pooling</h3>
            <p className="text-muted-foreground">
              Freelancers with similar WRI scores are grouped into collective risk pools. 
              This creates a decentralized risk-sharing model where premiums adjust based on 
              group performance, incentivizing positive behaviors across the entire pool.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">USDC Financial Modeling</h3>
            <p className="text-muted-foreground">
              Our system uses a Stable Reserve-to-Premium Ratio (SRPR) to ensure solvency 
              while keeping premiums fair. We also analyze your income volatility to determine 
              a Freelancer Income Volatility Factor (FIVF) that adjusts your premium based on 
              your cash flow stability.
            </p>
            
            <h3 className="text-lg font-medium mt-6 mb-2">Conditional Probability & Loyalty</h3>
            <p className="text-muted-foreground">
              Our enhanced premium calculation now includes conditional probability segmentation
              that creates personalized risk profiles based on project value and risk factors.
              We also offer loyalty discounts that reward returning customers and claim-free periods,
              encouraging long-term relationships with freelancers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPremiumCalculator;
