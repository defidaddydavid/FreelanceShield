import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Shield, RefreshCw } from 'lucide-react';
import { RiskPoolMetrics as RiskPoolMetricsType } from '@/lib/solana/contracts/types';

interface RiskPoolMetricsProps {
  metrics: RiskPoolMetricsType;
  isRefreshing: boolean;
  onRefresh: () => void;
}

const RiskPoolMetrics: React.FC<RiskPoolMetricsProps> = ({
  metrics,
  isRefreshing,
  onRefresh
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-shield-blue" />
          Risk Pool Metrics
        </CardTitle>
        <CardDescription>
          Current state of the FreelanceShield risk pool
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Capital</h3>
              <p className="text-2xl font-bold">{metrics.totalCapital.toFixed(2)} SOL</p>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-muted-foreground">Reserve Ratio</h3>
                <span className="text-sm">{(metrics.reserveRatio * 100).toFixed(2)}%</span>
              </div>
              <Progress value={metrics.reserveRatio * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: 20-50% (Higher is safer)
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
              <p className="text-sm">
                {metrics.lastUpdated ? format(metrics.lastUpdated, 'MMM d, yyyy HH:mm:ss') : 'Never'}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-2 h-6 w-6" 
                  onClick={onRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Capital Allocation</h3>
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs">Available Reserves</span>
                  <span className="text-xs font-medium">
                    {(metrics.totalCapital * metrics.reserveRatio).toFixed(2)} SOL
                  </span>
                </div>
                <div className="h-2 bg-shield-blue rounded-full" style={{ width: `${metrics.reserveRatio * 100}%` }}></div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs">Expected Liabilities</span>
                  <span className="text-xs font-medium">
                    {metrics.expectedLiabilities.toFixed(2)} SOL
                  </span>
                </div>
                <div className="h-2 bg-amber-500 rounded-full" style={{ width: `${(metrics.expectedLiabilities / metrics.totalCapital) * 100}%` }}></div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs">Claim Payouts (YTD)</span>
                  <span className="text-xs font-medium">
                    {metrics.claimPayouts.toFixed(2)} SOL
                  </span>
                </div>
                <div className="h-2 bg-red-500 rounded-full" style={{ width: `${(metrics.claimPayouts / metrics.totalCapital) * 100}%` }}></div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-muted rounded-md">
              <h4 className="text-xs font-medium mb-1">Risk Assessment</h4>
              <p className="text-xs text-muted-foreground">
                Current reserve ratio is {metrics.reserveRatio < 0.2 ? 'below' : 'above'} the minimum recommended level of 20%.
                {metrics.reserveRatio < 0.2 
                  ? ' Consider increasing your stake to improve pool solvency.'
                  : ' The risk pool is well-capitalized to handle expected claims.'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskPoolMetrics;
