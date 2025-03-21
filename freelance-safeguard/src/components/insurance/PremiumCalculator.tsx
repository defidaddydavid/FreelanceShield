import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InsuranceProgram } from '@/lib/solana/contracts/insuranceProgram.fixed';
import { JobType, Industry } from '@/lib/solana/contracts/types';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

// Chart components
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function PremiumCalculator() {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  // Premium calculation parameters
  const [coverageAmount, setCoverageAmount] = useState<number>(1 * LAMPORTS_PER_SOL); // 1 SOL
  const [periodDays, setPeriodDays] = useState<number>(30); // 30 days
  const [jobType, setJobType] = useState<JobType>(JobType.SoftwareDevelopment);
  const [industry, setIndustry] = useState<Industry>(Industry.Technology);
  const [reputationScore, setReputationScore] = useState<number>(70); // 0-100
  const [claimsHistory, setClaimsHistory] = useState<number>(0); // 0-5
  const [marketConditions, setMarketConditions] = useState<number>(10); // 0-20
  
  // Premium calculation results
  const [premium, setPremium] = useState<number>(0);
  const [riskScore, setRiskScore] = useState<number>(0);
  const [breakdownFactors, setBreakdownFactors] = useState<any>(null);
  const [factorContributions, setFactorContributions] = useState<any[]>([]);
  
  // Calculate premium
  useEffect(() => {
    const calculatePremium = async () => {
      if (!wallet.publicKey) return;
      
      try {
        const insuranceProgram = new InsuranceProgram(
          connection,
          wallet as any
        );
        
        const result = await insuranceProgram.calculatePremium(
          coverageAmount,
          periodDays,
          jobType,
          industry,
          reputationScore,
          claimsHistory,
          marketConditions
        );
        
        setPremium(result.premiumSOL);
        setRiskScore(result.riskScore);
        setBreakdownFactors(result.breakdownFactors);
        
        // Calculate factor contributions for visualization
        if (result.breakdownFactors) {
          const { baseRate, coverageFactor, periodFactor, riskWeight, reputationMultiplier, marketAdjustment } = result.breakdownFactors;
          
          const contributions = [
            { name: 'Base Rate', value: baseRate },
            { name: 'Coverage', value: coverageFactor - 1 }, // Subtract 1 to show contribution
            { name: 'Period', value: periodFactor - 1 }, // Subtract 1 to show contribution
            { name: 'Risk Weight', value: riskWeight - 1 }, // Subtract 1 to show contribution
            { name: 'Reputation', value: reputationMultiplier - 0.7 }, // Normalize to show contribution
            { name: 'Market', value: marketAdjustment - 1 }, // Subtract 1 to show contribution
          ];
          
          setFactorContributions(contributions);
        }
      } catch (error) {
        console.error('Error calculating premium:', error);
      }
    };
    
    calculatePremium();
  }, [connection, wallet, coverageAmount, periodDays, jobType, industry, reputationScore, claimsHistory, marketConditions]);
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Insurance Premium Calculator</CardTitle>
          <CardDescription>
            Calculate your insurance premium based on coverage, period, job type, and other risk factors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Coverage Amount */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="coverage">Coverage Amount</Label>
              <span>{(coverageAmount / LAMPORTS_PER_SOL).toFixed(2)} SOL</span>
            </div>
            <Slider
              id="coverage"
              min={0.1 * LAMPORTS_PER_SOL}
              max={10 * LAMPORTS_PER_SOL}
              step={0.1 * LAMPORTS_PER_SOL}
              value={[coverageAmount]}
              onValueChange={(value) => setCoverageAmount(value[0])}
            />
          </div>
          
          {/* Period Days */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="period">Coverage Period</Label>
              <span>{periodDays} days</span>
            </div>
            <Slider
              id="period"
              min={7}
              max={365}
              step={1}
              value={[periodDays]}
              onValueChange={(value) => setPeriodDays(value[0])}
            />
          </div>
          
          {/* Job Type */}
          <div className="space-y-2">
            <Label htmlFor="jobType">Job Type</Label>
            <Select
              value={jobType.toString()}
              onValueChange={(value) => setJobType(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={JobType.SoftwareDevelopment.toString()}>Software Development</SelectItem>
                <SelectItem value={JobType.Design.toString()}>Design</SelectItem>
                <SelectItem value={JobType.Writing.toString()}>Writing</SelectItem>
                <SelectItem value={JobType.Marketing.toString()}>Marketing</SelectItem>
                <SelectItem value={JobType.Consulting.toString()}>Consulting</SelectItem>
                <SelectItem value={JobType.Other.toString()}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Industry */}
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select
              value={industry.toString()}
              onValueChange={(value) => setIndustry(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Industry.Technology.toString()}>Technology</SelectItem>
                <SelectItem value={Industry.Healthcare.toString()}>Healthcare</SelectItem>
                <SelectItem value={Industry.Finance.toString()}>Finance</SelectItem>
                <SelectItem value={Industry.Education.toString()}>Education</SelectItem>
                <SelectItem value={Industry.Retail.toString()}>Retail</SelectItem>
                <SelectItem value={Industry.Entertainment.toString()}>Entertainment</SelectItem>
                <SelectItem value={Industry.Other.toString()}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Reputation Score */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="reputation">Reputation Score</Label>
              <span>{reputationScore}</span>
            </div>
            <Slider
              id="reputation"
              min={0}
              max={100}
              step={1}
              value={[reputationScore]}
              onValueChange={(value) => setReputationScore(value[0])}
            />
          </div>
          
          {/* Claims History */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="claims">Claims History</Label>
              <span>{claimsHistory}</span>
            </div>
            <Slider
              id="claims"
              min={0}
              max={5}
              step={1}
              value={[claimsHistory]}
              onValueChange={(value) => setClaimsHistory(value[0])}
            />
          </div>
          
          {/* Market Conditions */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="market">Market Volatility</Label>
              <span>{marketConditions}</span>
            </div>
            <Slider
              id="market"
              min={0}
              max={20}
              step={1}
              value={[marketConditions]}
              onValueChange={(value) => setMarketConditions(value[0])}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-4">
          <div className="flex flex-col space-y-1 w-full">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Premium:</span>
              <span className="font-semibold">{premium.toFixed(5)} SOL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Risk Score:</span>
              <span className="font-semibold">{riskScore}/100</span>
            </div>
          </div>
        </CardFooter>
      </Card>
      
      {/* Premium Breakdown Visualization */}
      {breakdownFactors && (
        <Card>
          <CardHeader>
            <CardTitle>Premium Breakdown</CardTitle>
            <CardDescription>
              Visualization of how different factors contribute to your premium
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={factorContributions}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [(value as number).toFixed(3), 'Contribution']} />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Factor Impact" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Pie Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={factorContributions}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {factorContributions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [(value as number).toFixed(3), 'Contribution']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-muted-foreground">
              <p>The premium is calculated using a logarithmic risk curve model that considers multiple risk factors.</p>
              <p>Higher reputation scores and lower risk factors result in lower premiums.</p>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
