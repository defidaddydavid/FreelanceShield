import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils/format";
import { calculateRiskPoolHealth } from "@/lib/utils/insurance-calculations";

interface RiskFactorProps {
  label: string;
  value: number;
  maxValue: number;
  infoText?: string;
  colorVariant?: 'default' | 'success' | 'warning' | 'danger';
}

const RiskFactor: React.FC<RiskFactorProps> = ({ 
  label, 
  value, 
  maxValue, 
  infoText,
  colorVariant = 'default'
}) => {
  const percentage = Math.min(100, (value / maxValue) * 100);
  
  // Determine color based on variant
  const getProgressColor = () => {
    switch(colorVariant) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-amber-500';
      case 'danger':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">{label}</span>
          {infoText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">{infoText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <span className="text-sm font-medium">{value.toFixed(1)}/{maxValue}</span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2"
        indicatorClassName={getProgressColor()}
      />
    </div>
  );
};

export interface PoolMetrics {
  totalPolicies: number;
  totalCoverage: number;
  poolBalance: number;
  totalPremiums: number;
  totalClaims: number;
  claimCount: number;
  claimApprovalRate: number;
  solvencyRatio: number;
}

interface RiskAssessmentProps {
  metrics: PoolMetrics;
  isLoading?: boolean;
}

const RiskAssessment: React.FC<RiskAssessmentProps> = ({ 
  metrics,
  isLoading = false
}) => {
  const poolHealth = useMemo(() => {
    if (!metrics) return null;
    
    return calculateRiskPoolHealth(
      metrics.totalPolicies,
      metrics.totalCoverage,
      metrics.poolBalance,
      metrics.totalPremiums
    );
  }, [metrics]);

  const getRiskLevelLabel = (score: number) => {
    if (score < 30) return 'Low Risk';
    if (score < 60) return 'Moderate Risk';
    if (score < 80) return 'High Risk';
    return 'Critical Risk';
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'success';
    if (score < 60) return 'default';
    if (score < 80) return 'warning';
    return 'danger';
  };

  const getSolvencyColor = (ratio: number) => {
    if (ratio >= 0.7) return 'success';
    if (ratio >= 0.5) return 'default';
    if (ratio >= 0.3) return 'warning';
    return 'danger';
  };

  if (isLoading) {
    return (
      <Card className="w-full h-full flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading risk assessment data...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Risk Pool Health</CardTitle>
          <CardDescription>
            Current status of the insurance risk pool
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-1 mb-4">
              <span className="text-lg font-medium">Solvency Status</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-sm font-medium ${
                  poolHealth?.solvencyStatus === 'excellent' ? 'bg-green-100 text-green-800' :
                  poolHealth?.solvencyStatus === 'good' ? 'bg-blue-100 text-blue-800' :
                  poolHealth?.solvencyStatus === 'moderate' ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {poolHealth?.solvencyStatus || 'Unknown'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {((poolHealth?.solvencyRatio || 0) * 100).toFixed(1)}% of coverage
                </span>
              </div>
            </div>
            
            <RiskFactor 
              label="Solvency Ratio" 
              value={(poolHealth?.solvencyRatio || 0) * 100} 
              maxValue={100}
              infoText="Pool balance as a percentage of total coverage amount"
              colorVariant={getSolvencyColor(poolHealth?.solvencyRatio || 0)}
            />
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="border rounded p-3">
                <div className="text-sm text-muted-foreground">Pool Balance</div>
                <div className="text-xl font-semibold mt-1">
                  {formatCurrency(metrics.poolBalance)} SOL
                </div>
              </div>
              
              <div className="border rounded p-3">
                <div className="text-sm text-muted-foreground">Coverage</div>
                <div className="text-xl font-semibold mt-1">
                  {formatCurrency(metrics.totalCoverage)} SOL
                </div>
              </div>
              
              <div className="border rounded p-3">
                <div className="text-sm text-muted-foreground">Active Policies</div>
                <div className="text-xl font-semibold mt-1">
                  {metrics.totalPolicies}
                </div>
              </div>
              
              <div className="border rounded p-3">
                <div className="text-sm text-muted-foreground">Claims Rate</div>
                <div className="text-xl font-semibold mt-1">
                  {(metrics.claimApprovalRate * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskAssessment;
