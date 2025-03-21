import React from 'react';
import { 
  Card, 
  CardContent
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AIPremiumResultsProps {
  premium: number;
  riskScore: number;
  riskDecile: number;
  claimProbability: number;
  confidenceInterval: [number, number];
  timeBasedProjections: {
    threeMonths: number;
    sixMonths: number;
    twelveMonths: number;
  };
}

export const AIPremiumResults: React.FC<AIPremiumResultsProps> = ({ 
  premium, 
  riskScore, 
  riskDecile, 
  claimProbability,
  confidenceInterval,
  timeBasedProjections
}) => {
  // Helper function to determine risk level color
  const getRiskLevelColor = (score: number) => {
    if (score < 30) return "bg-green-500";
    if (score < 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Helper function to determine risk level text
  const getRiskLevelText = (score: number) => {
    if (score < 30) return "Low Risk";
    if (score < 60) return "Medium Risk";
    return "High Risk";
  };

  // Helper function to format probability as percentage
  const formatProbability = (prob: number) => {
    return (prob * 100).toFixed(2) + "%";
  };

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Premium Result */}
        <Card className="col-span-1 md:col-span-1">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-muted-foreground">Premium</h3>
              <div className="mt-2 flex items-center justify-center">
                <span className="text-4xl font-bold">{premium}</span>
                <span className="ml-2 text-xl font-medium">USDC</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Per coverage period
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Risk Score */}
        <Card className="col-span-1 md:col-span-1">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-muted-foreground">Risk Score</h3>
              <div className="mt-2">
                <span className="text-4xl font-bold">{riskScore}</span>
                <span className="text-xl">/100</span>
              </div>
              <div className="mt-2">
                <Badge 
                  className={`${getRiskLevelColor(riskScore)} hover:${getRiskLevelColor(riskScore)}`}
                >
                  {getRiskLevelText(riskScore)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Claim Probability */}
        <Card className="col-span-1 md:col-span-1">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-muted-foreground">Claim Probability</h3>
              <div className="mt-2">
                <span className="text-4xl font-bold">{formatProbability(claimProbability)}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Confidence: {formatProbability(confidenceInterval[0])} - {formatProbability(confidenceInterval[1])}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Decile */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-2">Risk Decile: {riskDecile}/10</h3>
          <div className="space-y-2">
            <Progress value={riskDecile * 10} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low Risk</span>
              <span>Medium Risk</span>
              <span>High Risk</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time-based Projections */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Premium Projections</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">3 Months</div>
              <div className="text-xl font-semibold">{timeBasedProjections.threeMonths} USDC</div>
              <div className="text-xs text-muted-foreground mt-1">
                {timeBasedProjections.threeMonths < premium 
                  ? `${((1 - timeBasedProjections.threeMonths / premium) * 100).toFixed(1)}% savings` 
                  : `${((timeBasedProjections.threeMonths / premium - 1) * 100).toFixed(1)}% increase`}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">6 Months</div>
              <div className="text-xl font-semibold">{timeBasedProjections.sixMonths} USDC</div>
              <div className="text-xs text-muted-foreground mt-1">
                {timeBasedProjections.sixMonths < premium 
                  ? `${((1 - timeBasedProjections.sixMonths / premium) * 100).toFixed(1)}% savings` 
                  : `${((timeBasedProjections.sixMonths / premium - 1) * 100).toFixed(1)}% increase`}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">12 Months</div>
              <div className="text-xl font-semibold">{timeBasedProjections.twelveMonths} USDC</div>
              <div className="text-xs text-muted-foreground mt-1">
                {timeBasedProjections.twelveMonths < premium 
                  ? `${((1 - timeBasedProjections.twelveMonths / premium) * 100).toFixed(1)}% savings` 
                  : `${((timeBasedProjections.twelveMonths / premium - 1) * 100).toFixed(1)}% increase`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
