import { useClaimsAndPool } from '@/hooks/useClaimsAndPool';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { formatSOL } from '@/lib/utils';

export default function InsurancePoolStats() {
  const { poolMetrics } = useClaimsAndPool();

  if (poolMetrics.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-8 w-[200px] mt-4" />
          </Card>
        ))}
      </div>
    );
  }

  if (poolMetrics.error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load insurance pool metrics. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const {
    totalStaked,
    totalCoverage,
    reserveRatio,
    activeStakers,
    yieldAPY,
    claimsPaid
  } = poolMetrics.data!;

  const reserveHealth = reserveRatio >= 0.5 ? 'Excellent' :
    reserveRatio >= 0.3 ? 'Good' :
    reserveRatio >= 0.2 ? 'Fair' : 'At Risk';

  const reserveHealthColor = reserveRatio >= 0.5 ? 'text-green-500' :
    reserveRatio >= 0.3 ? 'text-blue-500' :
    reserveRatio >= 0.2 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Value Locked</CardTitle>
            <CardDescription>Total SOL staked in risk pools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSOL(totalStaked)}</div>
            <div className="text-sm text-muted-foreground">
              {activeStakers} active stakers
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coverage Capacity</CardTitle>
            <CardDescription>Maximum insurance coverage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSOL(totalCoverage)}</div>
            <div className="text-sm text-muted-foreground">
              {claimsPaid} claims paid
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staking APY</CardTitle>
            <CardDescription>Current yield for stakers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{yieldAPY.toFixed(2)}%</div>
            <div className="text-sm text-muted-foreground">
              From DeFi integrations
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reserve Health</CardTitle>
          <CardDescription>Current reserve ratio and health status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className={`text-xl font-bold ${reserveHealthColor}`}>
                  {reserveHealth}
                </div>
                <div className="text-sm text-muted-foreground">
                  {(reserveRatio * 100).toFixed(1)}% of total coverage
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Target: 50%
              </div>
            </div>
            <Progress
              value={reserveRatio * 100}
              max={50}
              className="h-2"
              indicatorClassName={
                reserveRatio >= 0.5 ? 'bg-green-500' :
                reserveRatio >= 0.3 ? 'bg-blue-500' :
                reserveRatio >= 0.2 ? 'bg-yellow-500' : 'bg-red-500'
              }
            />
            <div className="grid grid-cols-3 text-sm">
              <div className="text-red-500">At Risk (&lt;20%)</div>
              <div className="text-center text-yellow-500">Fair (20-30%)</div>
              <div className="text-right text-green-500">Healthy (&gt;30%)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
