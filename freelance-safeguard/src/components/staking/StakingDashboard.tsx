import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import * as anchor from '@project-serum/anchor';
import { StakingProgram } from '../../lib/solana/contracts/stakingProgram';
import { StakerInfo, StakePosition, StakingState, SupportedToken } from '../../lib/solana/contracts/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { AlertCircle, CheckCircle, Clock, Lock, Unlock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useToast } from '../ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

const StakingDashboard: React.FC = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const { publicKey } = useWallet();
  const { toast } = useToast();

  // State variables
  const [stakingProgram, setStakingProgram] = useState<StakingProgram | null>(null);
  const [stakingState, setStakingState] = useState<StakingState | null>(null);
  const [stakerInfo, setStakerInfo] = useState<StakerInfo | null>(null);
  const [supportedTokens, setSupportedTokens] = useState<SupportedToken[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [lockPeriod, setLockPeriod] = useState<number>(30);
  const [estimatedApy, setEstimatedApy] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize staking program
  useEffect(() => {
    if (anchorWallet && connection) {
      try {
        // Create a provider
        const provider = new anchor.AnchorProvider(
          connection,
          anchorWallet,
          { commitment: 'confirmed' }
        );
        
        // Initialize the program with the provider
        const program = new StakingProgram(provider);
        setStakingProgram(program);
      } catch (error) {
        console.error("Error initializing staking program:", error);
        toast({
          title: "Error",
          description: "Failed to initialize staking program",
          variant: "destructive",
        });
      }
    }
  }, [anchorWallet, connection, toast]);

  // Fetch staking data
  useEffect(() => {
    const fetchStakingData = async () => {
      if (!stakingProgram || !publicKey) return;
      
      try {
        setIsLoading(true);
        
        // Fetch staking state
        const state = await stakingProgram.fetchStakingState();
        setStakingState(state);
        setSupportedTokens(state.supportedTokens);
        
        // Set default selected token if available
        if (state.supportedTokens.length > 0 && !selectedToken) {
          setSelectedToken(state.supportedTokens[0].mint.toString());
        }
        
        // Fetch staker info
        try {
          const info = await stakingProgram.fetchStakerInfo(publicKey);
          setStakerInfo(info);
        } catch (error) {
          // Staker info might not exist yet, which is fine
          console.log("Staker info not found, user hasn't staked yet");
        }
      } catch (error) {
        console.error("Error fetching staking data:", error);
        toast({
          title: "Error",
          description: "Failed to load staking data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStakingData();
  }, [stakingProgram, publicKey, toast]);

  // Calculate APY when lock period or selected token changes
  useEffect(() => {
    const calculateApy = async () => {
      if (!stakingProgram || !selectedToken) return;
      
      try {
        const apy = await stakingProgram.getTokenApy(new PublicKey(selectedToken), lockPeriod);
        setEstimatedApy(apy);
      } catch (error) {
        console.error("Error calculating APY:", error);
      }
    };
    
    calculateApy();
  }, [stakingProgram, selectedToken, lockPeriod]);

  // Handle staking
  const handleStake = async () => {
    if (!stakingProgram || !selectedToken || !stakeAmount) return;
    
    try {
      setIsLoading(true);
      
      const amount = parseFloat(stakeAmount) * 1_000_000; // Convert to lamports/smallest unit
      
      await stakingProgram.stake(
        amount, 
        lockPeriod, 
        new PublicKey(selectedToken)
      );
      
      toast({
        title: "Success",
        description: `Successfully staked ${stakeAmount} tokens for ${lockPeriod} days.`,
        variant: "default",
      });
      
      // Refresh staker info
      const info = await stakingProgram.fetchStakerInfo(publicKey!);
      setStakerInfo(info);
      
      // Clear form
      setStakeAmount('');
    } catch (error) {
      console.error("Error staking tokens:", error);
      toast({
        title: "Error",
        description: "Failed to stake tokens. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle unstaking
  const handleUnstake = async (positionId: number, tokenMint: PublicKey) => {
    if (!stakingProgram) return;
    
    try {
      setIsLoading(true);
      
      await stakingProgram.unstake(positionId, tokenMint);
      
      toast({
        title: "Success",
        description: "Successfully unstaked your tokens.",
        variant: "default",
      });
      
      // Refresh staker info
      const info = await stakingProgram.fetchStakerInfo(publicKey!);
      setStakerInfo(info);
    } catch (error) {
      console.error("Error unstaking tokens:", error);
      toast({
        title: "Error",
        description: "Failed to unstake tokens. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle claiming rewards
  const handleClaimRewards = async (positionId: number, tokenMint: PublicKey) => {
    if (!stakingProgram) return;
    
    try {
      setIsLoading(true);
      
      await stakingProgram.claimRewards(positionId, tokenMint);
      
      toast({
        title: "Success",
        description: "Successfully claimed your rewards.",
        variant: "default",
      });
      
      // Refresh staker info
      const info = await stakingProgram.fetchStakerInfo(publicKey!);
      setStakerInfo(info);
    } catch (error) {
      console.error("Error claiming rewards:", error);
      toast({
        title: "Error",
        description: "Failed to claim rewards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format token amount for display
  const formatTokenAmount = (amount: bigint): string => {
    return (Number(amount) / 1_000_000).toFixed(2);
  };

  // Check if position is locked
  const isPositionLocked = (position: StakePosition): boolean => {
    const now = Date.now() / 1000;
    return Number(position.unlockTime) > now;
  };

  // Get time remaining until unlock
  const getTimeRemaining = (position: StakePosition): string => {
    const unlockDate = new Date(Number(position.unlockTime) * 1000);
    return formatDistanceToNow(unlockDate, { addSuffix: true });
  };

  // Render staking positions
  const renderStakingPositions = () => {
    if (!stakerInfo || stakerInfo.positions.length === 0) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No staking positions</AlertTitle>
          <AlertDescription>
            You haven't staked any tokens yet. Start staking to earn rewards!
          </AlertDescription>
        </Alert>
      );
    }

    return stakerInfo.positions
      .filter(position => position.isActive)
      .map((position) => {
        const locked = isPositionLocked(position);
        const timeRemaining = getTimeRemaining(position);
        
        return (
          <Card key={position.id} className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Position #{position.id.toString()}</CardTitle>
                <Badge variant={locked ? "outline" : "default"}>
                  {locked ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                  {locked ? "Locked" : "Unlocked"}
                </Badge>
              </div>
              <CardDescription>
                {supportedTokens.find(t => t.mint.toString() === position.tokenMint.toString())?.name || "Token"}
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
                    {new Date(Number(position.startTime) * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {locked && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Unlock {timeRemaining}</span>
                    <span className="text-sm font-medium">
                      {Math.round((Date.now()/1000 - Number(position.startTime)) / 
                      (Number(position.unlockTime) - Number(position.startTime)) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.round((Date.now()/1000 - Number(position.startTime)) / 
                    (Number(position.unlockTime) - Number(position.startTime)) * 100)} 
                    className="h-2" 
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => handleClaimRewards(Number(position.id), position.tokenMint)}
                disabled={isLoading}
              >
                Claim Rewards
              </Button>
              <Button 
                variant={locked ? "outline" : "default"} 
                onClick={() => handleUnstake(Number(position.id), position.tokenMint)}
                disabled={isLoading || locked}
              >
                {locked ? "Locked" : "Unstake"}
              </Button>
            </CardFooter>
          </Card>
        );
      });
  };

  // Render staking stats
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

  if (!publicKey) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Staking Dashboard</CardTitle>
            <CardDescription>Connect your wallet to start staking</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Wallet not connected</AlertTitle>
              <AlertDescription>
                Please connect your wallet to access the staking dashboard.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Staking Dashboard</h1>
      
      {renderStakingStats()}
      
      <Tabs defaultValue="stake" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stake">Stake</TabsTrigger>
          <TabsTrigger value="positions">My Positions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stake">
          <Card>
            <CardHeader>
              <CardTitle>Stake Tokens</CardTitle>
              <CardDescription>
                Stake your tokens to earn rewards from insurance premiums
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="token">Token</Label>
                  <Select
                    value={selectedToken}
                    onValueChange={setSelectedToken}
                    disabled={supportedTokens.length === 0 || isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedTokens.map((token) => (
                        <SelectItem key={token.mint.toString()} value={token.mint.toString()}>
                          {token.name} (Weight: {token.weight})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="lockPeriod">Lock Period: {lockPeriod} days</Label>
                    <span className="text-sm text-muted-foreground">
                      Min: {stakingState?.minStakePeriodDays || 30} days
                    </span>
                  </div>
                  <Slider
                    id="lockPeriod"
                    min={stakingState?.minStakePeriodDays || 30}
                    max={365}
                    step={1}
                    value={[lockPeriod]}
                    onValueChange={(value) => setLockPeriod(value[0])}
                    disabled={isLoading}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Min ({stakingState?.minStakePeriodDays || 30} days)</span>
                    <span>1 Year (365 days)</span>
                  </div>
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
                disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || isLoading}
              >
                {isLoading ? "Processing..." : "Stake Tokens"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="positions">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Your Staking Positions</h3>
              {stakerInfo && (
                <Badge variant="secondary" className="text-xs">
                  Total Staked: {formatTokenAmount(stakerInfo.stakedAmount)}
                </Badge>
              )}
            </div>
            
            <Separator className="my-4" />
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p>Loading your staking positions...</p>
              </div>
            ) : (
              renderStakingPositions()
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StakingDashboard;
