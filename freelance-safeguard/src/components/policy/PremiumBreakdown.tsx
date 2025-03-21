
import { TrendingUp, Calendar, Scale, Award, BarChart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatSOL, getMultiplierDescription } from '@/utils/premiumCalculation';

interface PremiumBreakdownProps {
  premium: {
    value: number;
    breakdown: {
      coverageRatioMultiplier: number;
      periodMultiplier: number;
      riskMultiplier: number;
      reputationAdjustment: number;
    } | null;
  };
  coveragePeriod: string;
  riskTolerance: number;
}

export const PremiumBreakdown = ({ premium, coveragePeriod, riskTolerance }: PremiumBreakdownProps) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6 space-y-4 border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">Premium Calculation</h3>
      </div>
      
      {premium.breakdown && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-shield-blue" />
            <div>
              <p className="text-sm font-medium">Coverage Ratio</p>
              <p className="text-xs text-muted-foreground">
                {getMultiplierDescription('Coverage ratio', premium.breakdown.coverageRatioMultiplier, false)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-shield-blue" />
            <div>
              <p className="text-sm font-medium">Coverage Period</p>
              <p className="text-xs text-muted-foreground">
                {getMultiplierDescription('Longer coverage period', premium.breakdown.periodMultiplier)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-shield-blue" />
            <div>
              <p className="text-sm font-medium">Risk Level</p>
              <p className="text-xs text-muted-foreground">
                {getMultiplierDescription('Your risk preference', premium.breakdown.riskMultiplier, false)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-shield-blue" />
            <div>
              <p className="text-sm font-medium">Reputation Score</p>
              <p className="text-xs text-muted-foreground">
                {getMultiplierDescription('Your reputation', premium.breakdown.reputationAdjustment)}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4">
        <h3 className="flex items-center text-sm font-medium mb-2">
          <BarChart className="h-4 w-4 text-shield-blue mr-1" />
          Risk Assessment
        </h3>
        <div className="space-y-2">
          <Progress value={riskTolerance} className="h-2" />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Conservative</span>
            <span>Balanced</span>
            <span>Aggressive</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center py-4 border-t border-gray-200 dark:border-gray-800 mt-4">
        <div>
          <p className="text-sm font-medium">Estimated Premium</p>
          <p className="text-xs text-muted-foreground">
            Based on your inputs and market conditions
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-shield-blue">
            {premium.value ? formatSOL(premium.value) : '—'}
          </p>
          <p className="text-sm text-shield-gray-dark">
            per {coveragePeriod ? coveragePeriod.replace(/([0-9])([a-z])/, '$1 $2') : 'coverage period'}
          </p>
        </div>
      </div>
    </div>
  );
};
