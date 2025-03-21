import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  AlertCircle, 
  CheckCircle, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Coins, 
  TrendingUp, 
  Calendar,
  Info
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useStaking } from '@/hooks/useStaking';
import { format } from 'date-fns';
import WalletConnect from '@/components/wallet/WalletConnect';
import RiskPoolMetrics from '@/components/staking/RiskPoolMetrics';

const StakingPage: React.FC = () => {
  const { connected } = useWallet();
  const { 
    stakingState, 
    stakerInfo, 
    supportedTokens, 
    totalRewards,
    isLoading, 
    isRefreshing,
    fetchStakingData,
    getTokenApy,
    stakeTokens,
    unstakeTokens,
    claimRewards,
    claimAllRewards,
    formatTokenAmount,
    isPositionLocked,
    getTimeRemaining,
    getProgressPercentage,
    riskPoolMetrics
  } = useStaking();

  // State variables for staking form
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [lockPeriod, setLockPeriod] = useState<number>(30);
  const [autoCompound, setAutoCompound] = useState<boolean>(false);
  const [estimatedApy, setEstimatedApy] = useState<number>(0);

  // Set default selected token when supported tokens are loaded
  useEffect(() => {
    if (supportedTokens.length > 0 && !selectedToken) {
      setSelectedToken(supportedTokens[0]?.mint.toString() || '');
    }
  }, [supportedTokens, selectedToken]);

  // Calculate APY when lock period or selected token changes
  useEffect(() => {
    const calculateApy = async () => {
      if (!selectedToken) return;
      
      try {
        const apy = await getTokenApy(selectedToken, lockPeriod);
        setEstimatedApy(apy);
      } catch (error) {
        console.error("Error calculating APY:", error);
      }
    };
    
    calculateApy();
  }, [selectedToken, lockPeriod, getTokenApy]);

  // Handle staking
  const handleStake = async () => {
    if (!selectedToken || !stakeAmount) return;
    
    try {
      const amount = parseFloat(stakeAmount) * 1_000_000; // Convert to lamports/smallest unit
      
      await stakeTokens(amount, lockPeriod, selectedToken);
      
      // Clear form
      setStakeAmount('');
    } catch (error) {
      console.error("Error staking tokens:", error);
    }
  };

  // Render staking statistics
  const renderStakingStats = () => {
    if (!stakingState) return null;
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Staked</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatTokenAmount(stakingState.totalStakedAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stakers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stakingState.totalStakers.toString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Base APY</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(stakingState.baseRewardRate / 100).toFixed(2)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Premium Share</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stakingState.premiumSharePercent}%</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render risk pool metrics
  const renderRiskPoolMetricsSection = () => {
    return (
      <RiskPoolMetrics
        metrics={riskPoolMetrics}
        isRefreshing={isRefreshing}
        onRefresh={fetchStakingData}
      />
    );
  };

  // Render user staking overview
  const renderUserStakingOverview = () => {
    if (!stakerInfo) return null;
    
    const activePositions = stakerInfo.positions.filter(p => p.isActive);
    const totalStaked = stakerInfo.stakedAmount;
    
    return (
      <Card className="mb-6 bg-gradient-to-r from-shield-blue-light/10 to-shield-blue/5">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Your Total Staked</h3>
              <p className="text-2xl font-bold">{formatTokenAmount(totalStaked)}</p>
              <p className="text-sm text-muted-foreground">
                Active Positions: {activePositions.length}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Estimated Rewards</h3>
              <p className="text-2xl font-bold">{totalRewards.toFixed(6)}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={claimAllRewards}
                disabled={totalRewards <= 0 || isRefreshing}
              >
                Claim All Rewards
              </Button>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Staked</h3>
              <p className="text-lg">
                {stakerInfo.lastStakeTime.toString() !== '0' 
                  ? format(new Date(Number(stakerInfo.lastStakeTime) * 1000), 'MMM dd, yyyy')
                  : 'Never'
                }
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={fetchStakingData}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render staking positions
  const renderStakingPositions = () => {
    if (!stakerInfo || stakerInfo.positions.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">You don't have any staking positions yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Stake your tokens to earn rewards and support the FreelanceShield network.
          </p>
        </div>
      );
    }

    return stakerInfo.positions
      .filter(position => position.isActive)
      .map((position) => {
        const locked = isPositionLocked(position);
        const timeRemaining = getTimeRemaining(position);
        const progressPercentage = getProgressPercentage(position);
        const tokenName = supportedTokens.find(t => 
          t.mint.toString() === position.tokenMint.toString()
        )?.name || "Token";
        
        return (
          <Card key={position.id.toString()} className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{tokenName} Position #{position.id.toString()}</CardTitle>
                <Badge variant={locked ? "outline" : "default"}>
                  {locked ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                  {locked ? "Locked" : "Unlocked"}
                </Badge>
              </div>
              <CardDescription>
                {locked ? `Unlocks ${timeRemaining}` : "Available for withdrawal"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-lg font-medium">{formatTokenAmount(position.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lock Period</p>
                  <p className="text-lg font-medium">{position.lockPeriodDays} days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bonus</p>
                  <p className="text-lg font-medium">+{position.bonusMultiplier}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="text-lg font-medium">
                    {format(new Date(Number(position.startTime) * 1000), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              
              {locked && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              )}
              
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => claimRewards(position.id, position.tokenMint)}
                  disabled={isRefreshing}
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Claim Rewards
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => unstakeTokens(position.id, position.tokenMint)}
                  disabled={isRefreshing || (locked && !stakingState?.isPaused)}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Unstake
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Staking</h1>
        
        {!connected ? (
          <div className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-semibold mb-4">Connect your wallet to start staking</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Stake your tokens to earn rewards and help secure the FreelanceShield network.
              The more you stake and the longer you lock, the higher your rewards.
            </p>
            <WalletConnect />
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {renderStakingStats()}
                
                {/* Add Risk Pool Metrics here */}
                {renderRiskPoolMetricsSection()}
                
                {renderUserStakingOverview()}
                
                <Tabs defaultValue="stake" className="mb-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="stake">Stake Tokens</TabsTrigger>
                    <TabsTrigger value="positions">Your Positions</TabsTrigger>
                  </TabsList>
                  <TabsContent value="stake">
                    <Card>
                      <CardHeader>
                        <CardTitle>Stake Your Tokens</CardTitle>
                        <CardDescription>
                          Stake your tokens to earn rewards and support the FreelanceShield network.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="token">Select Token</Label>
                            <Select
                              value={selectedToken}
                              onValueChange={setSelectedToken}
                              disabled={isRefreshing || supportedTokens.length === 0}
                            >
                              <SelectTrigger id="token">
                                <SelectValue placeholder="Select a token" />
                              </SelectTrigger>
                              <SelectContent>
                                {supportedTokens.map((token) => (
                                  <SelectItem 
                                    key={token.mint.toString()} 
                                    value={token.mint.toString()}
                                  >
                                    {token.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <div className="flex space-x-2">
                              <Input
                                id="amount"
                                type="number"
                                placeholder="0.0"
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                disabled={isRefreshing || stakingState?.isPaused}
                              />
                              <Button
                                variant="outline"
                                onClick={() => setStakeAmount('1')}
                                disabled={isRefreshing || stakingState?.isPaused}
                              >
                                Max
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label htmlFor="lock-period">Lock Period: {lockPeriod} days</Label>
                              <span className="text-sm text-muted-foreground">
                                Unlock Date: {format(new Date(Date.now() + lockPeriod * 24 * 60 * 60 * 1000), 'MMM dd, yyyy')}
                              </span>
                            </div>
                            <Slider
                              id="lock-period"
                              min={stakingState?.minStakePeriodDays || 30}
                              max={365}
                              step={1}
                              value={[lockPeriod]}
                              onValueChange={(value) => setLockPeriod(value[0])}
                              disabled={isRefreshing || stakingState?.isPaused}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Min ({stakingState?.minStakePeriodDays || 30} days)</span>
                              <span>1 Year (365 days)</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="auto-compound"
                              checked={autoCompound}
                              onCheckedChange={setAutoCompound}
                              disabled={isRefreshing || stakingState?.isPaused}
                            />
                            <Label htmlFor="auto-compound">Auto-compound rewards</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    When enabled, your rewards will be automatically reinvested to compound your returns.
                                    This can significantly increase your overall yield over time.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          
                          <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Estimated APY: {estimatedApy.toFixed(2)}%</AlertTitle>
                            <AlertDescription>
                              Longer lock periods provide higher rewards. Early unstaking incurs a 
                              {stakingState?.earlyUnstakePenaltyPercent || 10}% penalty.
                            </AlertDescription>
                          </Alert>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full" 
                          onClick={handleStake}
                          disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || isRefreshing || stakingState?.isPaused}
                        >
                          {isRefreshing ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Stake Tokens'
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                  <TabsContent value="positions">
                    <div className="space-y-4">
                      {isRefreshing ? (
                        <div className="flex justify-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        renderStakingPositions()
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StakingPage;
