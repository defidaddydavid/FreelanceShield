import React, { useState } from 'react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface AIPremiumBreakdownProps {
  factors: {
    baseRate: number;
    coverageRatio: number;
    periodAdjustment: number;
    riskAdjustment: number;
    reputationFactor: number;
    wriAdjustment: number;
    fivfAdjustment: number;
    marketSentimentAdjustment: number;
    socialRiskPoolAdjustment: number;
    escrowDiscountAdjustment: number;
    osriAdjustment: number;
    bayesianAdjustment: number;
    monteCarloRiskAdjustment: number;
    srprAdjustment: number;
    loyaltyAdjustment: number;
    conditionalRiskAdjustment: number;
  };
}

export const AIPremiumBreakdown: React.FC<AIPremiumBreakdownProps> = ({ factors }) => {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  // Format factor value for display
  const formatFactor = (value: number): string => {
    // If value is exactly 1, it has no impact
    if (value === 1) return "No Impact (1.00×)";
    
    // If value is less than 1, it reduces premium
    if (value < 1) {
      const reduction = ((1 - value) * 100).toFixed(2);
      return `Reduces Premium by ${reduction}% (${value.toFixed(2)}×)`;
    }
    
    // If value is greater than 1, it increases premium
    const increase = ((value - 1) * 100).toFixed(2);
    return `Increases Premium by ${increase}% (${value.toFixed(2)}×)`;
  };

  // Get color based on factor impact
  const getFactorColor = (value: number): string => {
    if (value === 1) return "#64748b"; // Neutral
    if (value < 1) return "#10b981";   // Green for reduction
    return "#ef4444";                  // Red for increase
  };

  // Prepare data for chart visualization
  const chartData = Object.entries(factors).map(([key, value]) => {
    // Convert camelCase to readable format
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/Adjustment/g, '')
      .replace(/Wri/, 'WRI')
      .replace(/Fivf/, 'FIVF')
      .replace(/Osri/, 'OSRI')
      .replace(/Srpr/, 'SRPR');
    
    return {
      name: label,
      value: value,
      impact: value === 1 ? 0 : value < 1 ? -((1 - value) * 100) : ((value - 1) * 100)
    };
  });

  // Sort factors by their impact (absolute value)
  const sortedFactors = [...chartData].sort((a, b) => 
    Math.abs(b.impact) - Math.abs(a.impact)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Premium Calculation Breakdown</h3>
        <div className="flex space-x-2">
          <Button 
            variant={viewMode === 'table' ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
          <Button 
            variant={viewMode === 'chart' ? "default" : "outline"} 
            size="sm"
            onClick={() => setViewMode('chart')}
          >
            Chart
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factor</TableHead>
              <TableHead>Impact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFactors.map((factor) => (
              <TableRow key={factor.name}>
                <TableCell className="font-medium">{factor.name}</TableCell>
                <TableCell 
                  style={{ color: getFactorColor(factor.value) }}
                  className="font-medium"
                >
                  {formatFactor(factor.value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedFactors}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                domain={[-100, 100]} 
                tickFormatter={(value) => `${value}%`} 
              />
              <YAxis type="category" dataKey="name" width={150} />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Impact']}
                labelFormatter={(label) => `Factor: ${label}`}
              />
              <Bar dataKey="impact">
                {sortedFactors.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getFactorColor(entry.value)} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="explanation">
          <AccordionTrigger>Factor Explanations</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Base Rate:</strong> The starting premium amount before adjustments.
              </div>
              <div>
                <strong>Coverage Ratio:</strong> Adjustment based on the coverage amount requested.
              </div>
              <div>
                <strong>Period Adjustment:</strong> Modification based on the coverage duration.
              </div>
              <div>
                <strong>Risk Adjustment:</strong> Factor based on the job type and industry risk profiles.
              </div>
              <div>
                <strong>Reputation Factor:</strong> Adjustment based on your on-chain reputation score.
              </div>
              <div>
                <strong>WRI Adjustment:</strong> Weighted Reputation Index impact on premium.
              </div>
              <div>
                <strong>FIVF Adjustment:</strong> Freelancer Income Volatility Factor impact.
              </div>
              <div>
                <strong>Market Sentiment:</strong> Adjustment based on current market conditions.
              </div>
              <div>
                <strong>Social Risk Pool:</strong> Modification based on your risk pool performance.
              </div>
              <div>
                <strong>Escrow Discount:</strong> Reduction for using escrow services.
              </div>
              <div>
                <strong>OSRI Adjustment:</strong> On-chain Solvency Ratio Index impact.
              </div>
              <div>
                <strong>Bayesian Adjustment:</strong> Impact from Bayesian inference model.
              </div>
              <div>
                <strong>Monte Carlo Risk:</strong> Adjustment from Monte Carlo simulations.
              </div>
              <div>
                <strong>SRPR Adjustment:</strong> Stable Reserve-to-Premium Ratio impact.
              </div>
              <div>
                <strong>Loyalty Adjustment:</strong> Discount based on your history with FreelanceShield.
              </div>
              <div>
                <strong>Conditional Risk:</strong> Adjustment based on personalized risk profile segmentation.
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
