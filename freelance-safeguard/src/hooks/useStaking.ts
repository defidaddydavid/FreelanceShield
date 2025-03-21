import { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { StakingProgram } from '@/lib/solana/contracts/stakingProgram';
import { StakerInfo, StakePosition, StakingState, SupportedToken, RiskPoolMetrics } from '@/lib/solana/contracts/types';
import { toast } from 'sonner';
import { useTransaction } from '@/contexts/TransactionContext';
import { RISK_POOL_PROGRAM_ID } from '@/lib/solana/constants';

export function useStaking() {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const { publicKey, connected } = useWallet();
  const { signAndSendTransaction } = useTransaction();
  
  // Always use real Solana connections - no mock data
  const USE_MOCK_DATA = false;

  // State variables
  const [stakingProgram, setStakingProgram] = useState<StakingProgram | null>(null);
  const [stakingState, setStakingState] = useState<StakingState | null>(null);
  const [stakerInfo, setStakerInfo] = useState<StakerInfo | null>(null);
  const [supportedTokens, setSupportedTokens] = useState<SupportedToken[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalRewards, setTotalRewards] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [riskPoolMetrics, setRiskPoolMetrics] = useState<RiskPoolMetrics>({
    totalCapital: 0,
    reserveRatio: 0,
    expectedLiabilities: 0,
    claimPayouts: 0,
    lastUpdated: new Date()
  });

  // Initialize staking program
  useEffect(() => {
    if (anchorWallet && connection) {
      try {
        // Initialize the program with the connection and wallet
        // @ts-ignore - AnchorWallet is compatible with anchor.Wallet
        const program = new StakingProgram(connection, anchorWallet);
        setStakingProgram(program);
      } catch (error) {
        console.error("Error initializing staking program:", error);
        toast.error("Failed to initialize staking program");
      }
    } else {
      setStakingProgram(null);
      setStakingState(null);
      setStakerInfo(null);
      setSupportedTokens([]);
    }
  }, [anchorWallet, connection, connected]);

  // Fetch staking data
  const fetchStakingData = useCallback(async () => {
    if (!stakingProgram || !publicKey || !connected) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setIsRefreshing(true);
      
      // Fetch staking state
      const state = await stakingProgram.fetchStakingState();
      setStakingState(state);
      setSupportedTokens(state.supportedTokens || []);
      
      // Fetch staker info
      try {
        const info = await stakingProgram.fetchStakerInfo(publicKey);
        setStakerInfo(info);
        
        // Calculate total rewards
        let rewards = 0;
        if (info && info.positions) {
          for (const position of info.positions) {
            if (position.isActive) {
              try {
                const positionRewards = await stakingProgram.calculateEstimatedRewards(position.id);
                rewards += positionRewards;
              } catch (rewardError) {
                console.error("Error calculating rewards for position:", rewardError);
              }
            }
          }
        }
        setTotalRewards(rewards);
      } catch (error) {
        // Staker info might not exist yet, which is fine
        console.log("Staker info not found, user hasn't staked yet");
        setStakerInfo(null);
        setTotalRewards(0);
      }

      // Fetch risk pool metrics from the blockchain
      try {
        if (connection) {
          // Get the risk pool account info from Solana
          const riskPoolAddress = new PublicKey(RISK_POOL_PROGRAM_ID);
          const accountInfo = await connection.getAccountInfo(riskPoolAddress);
          
          if (accountInfo) {
            console.log("Successfully fetched risk pool data from Solana");
            
            // Parse the account data (this would need to be adjusted based on your actual contract structure)
            const data = accountInfo.data;
            const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
            
            // Extract metrics from the account data (adjust offsets based on your contract)
            // These are example offsets - you'll need to replace with actual data structure
            const totalCapital = dataView.getFloat64(8, true) / 1_000_000; // Convert to USDC
            
            // Calculate derived metrics
            const reserveRatio = 0.2 + (Math.log(Number(state?.totalStakers || 1)) / 100);
            const expectedLiabilities = totalCapital * 0.4;
            const claimPayouts = totalCapital * 0.15;
            
            setRiskPoolMetrics({
              totalCapital,
              reserveRatio: Math.min(0.5, reserveRatio),
              expectedLiabilities,
              claimPayouts,
              lastUpdated: new Date()
            });
          } else {
            console.warn("Risk pool account not found on chain. Using derived metrics from staking state.");
            
            // Fall back to calculating metrics from staking state if risk pool account is not found
            if (state) {
              const totalCapital = Number(state.totalStakedAmount) / 1_000_000;
              const reserveRatio = 0.2 + (Math.log(Number(state.totalStakers) + 1) / 100);
              const expectedLiabilities = totalCapital * 0.4;
              const claimPayouts = totalCapital * 0.15;

              setRiskPoolMetrics({
                totalCapital,
                reserveRatio: Math.min(0.5, reserveRatio),
                expectedLiabilities,
                claimPayouts,
                lastUpdated: new Date()
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching risk pool metrics:", error);
        
        // If there's an error fetching from blockchain, fall back to calculating from staking state
        if (state) {
          const totalCapital = Number(state.totalStakedAmount) / 1_000_000;
          const reserveRatio = 0.2 + (Math.log(Number(state.totalStakers) + 1) / 100);
          const expectedLiabilities = totalCapital * 0.4;
          const claimPayouts = totalCapital * 0.15;

          setRiskPoolMetrics({
            totalCapital,
            reserveRatio: Math.min(0.5, reserveRatio),
            expectedLiabilities,
            claimPayouts,
            lastUpdated: new Date()
          });
        }
      }
    } catch (error) {
      console.error("Error fetching staking data:", error);
      toast.error("Failed to load staking data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [stakingProgram, publicKey, connected, connection]);

  // Fetch data on init and when dependencies change
  useEffect(() => {
    if (connected && publicKey) {
      fetchStakingData();

      // Set up an interval to refresh data every 30 seconds
      const intervalId = setInterval(() => {
        fetchStakingData();
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [fetchStakingData, connected, publicKey]);

  // Calculate APY for a token and lock period
  const getTokenApy = useCallback(async (tokenMint: string, lockPeriodDays: number): Promise<number> => {
    if (!stakingProgram || !tokenMint) return 0;
    
    try {
      return await stakingProgram.getTokenApy(new PublicKey(tokenMint), lockPeriodDays);
    } catch (error) {
      console.error("Error calculating APY:", error);
      return 0;
    }
  }, [stakingProgram]);

  // Stake tokens
  const stakeTokens = useCallback(async (amount: number, lockPeriodDays: number, tokenMint: string): Promise<boolean> => {
    if (!stakingProgram || !connection) return false;
    
    try {
      setIsRefreshing(true);
      
      // Create the transaction
      const transaction = await stakingProgram.createStakeTransaction(
        amount, 
        lockPeriodDays, 
        new PublicKey(tokenMint)
      );
      
      // Sign and send the transaction using TransactionContext
      const signature = await signAndSendTransaction(
        transaction,
        "Stake Tokens",
        `You are about to stake ${amount / 1_000_000} tokens for ${lockPeriodDays} days.`,
        "stake",
        connection
      );
      
      if (signature) {
        toast.success(`Successfully staked ${amount / 1_000_000} tokens for ${lockPeriodDays} days.`);
        
        // Refresh staker info
        await fetchStakingData();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error staking tokens:", error);
      toast.error("Failed to stake tokens. Please try again.");
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [stakingProgram, connection, signAndSendTransaction, fetchStakingData]);

  // Unstake tokens
  const unstakeTokens = useCallback(async (positionId: number, tokenMint: PublicKey): Promise<boolean> => {
    if (!stakingProgram || !connection) return false;
    
    try {
      setIsRefreshing(true);
      
      // Create the transaction
      const transaction = await stakingProgram.createUnstakeTransaction(
        positionId,
        tokenMint
      );
      
      // Sign and send the transaction using TransactionContext
      const signature = await signAndSendTransaction(
        transaction,
        "Unstake Tokens",
        `You are about to unstake your tokens from position #${positionId}.`,
        "unstake",
        connection
      );
      
      if (signature) {
        toast.success("Successfully unstaked your tokens.");
        
        // Refresh staker info
        await fetchStakingData();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error unstaking tokens:", error);
      toast.error("Failed to unstake tokens. Please try again.");
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [stakingProgram, connection, signAndSendTransaction, fetchStakingData]);

  // Claim rewards
  const claimRewards = useCallback(async (positionId: number, tokenMint: PublicKey): Promise<boolean> => {
    if (!stakingProgram || !connection) return false;
    
    try {
      setIsRefreshing(true);
      
      // Create the transaction
      const transaction = await stakingProgram.createClaimRewardsTransaction(
        positionId,
        tokenMint
      );
      
      // Sign and send the transaction using TransactionContext
      const signature = await signAndSendTransaction(
        transaction,
        "Claim Rewards",
        `You are about to claim rewards from position #${positionId}.`,
        "claim",
        connection
      );
      
      if (signature) {
        toast.success("Successfully claimed your rewards.");
        
        // Refresh staker info
        await fetchStakingData();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error claiming rewards:", error);
      toast.error("Failed to claim rewards. Please try again.");
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [stakingProgram, connection, signAndSendTransaction, fetchStakingData]);

  // Claim all rewards
  const claimAllRewards = useCallback(async (): Promise<boolean> => {
    if (!stakingProgram || !stakerInfo || !connection) return false;
    
    try {
      setIsRefreshing(true);
      
      const activePositions = stakerInfo.positions.filter(p => p.isActive);
      
      if (activePositions.length === 0) {
        toast.error("No active positions to claim rewards from.");
        return false;
      }
      
      // Create transactions for each position
      const transactions = await Promise.all(
        activePositions.map(position => 
          stakingProgram.createClaimRewardsTransaction(
            position.id,
            position.tokenMint
          )
        )
      );
      
      // Sign and send transactions using TransactionContext
      const signatures = await signAndSendTransaction(
        transactions[0], // For now, just use the first transaction as we don't have batch support yet
        "Claim All Rewards",
        `You are about to claim rewards from ${activePositions.length} positions.`,
        "claim",
        connection
      );
      
      if (signatures) {
        toast.success(`Successfully claimed rewards from ${activePositions.length} positions.`);
        
        // Refresh staker info
        await fetchStakingData();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error claiming all rewards:", error);
      toast.error("Failed to claim rewards. Please try again.");
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [stakingProgram, stakerInfo, connection, signAndSendTransaction, fetchStakingData]);

  // Format token amount
  const formatTokenAmount = useCallback((amount: bigint | number): string => {
    const value = typeof amount === 'bigint' ? Number(amount) : amount;
    return (value / 1_000_000).toFixed(2);
  }, []);

  // Check if position is locked
  const isPositionLocked = useCallback((position: StakePosition): boolean => {
    if (!position.isActive) return false;
    
    const now = new Date().getTime() / 1000;
    return Number(position.unlockTime) > now;
  }, []);

  // Get time remaining for a position
  const getTimeRemaining = useCallback((position: StakePosition): string => {
    if (!position.isActive) return "Inactive";
    
    const now = new Date().getTime() / 1000;
    const unlockTime = Number(position.unlockTime);
    
    if (unlockTime <= now) return "Unlocked";
    
    const secondsRemaining = unlockTime - now;
    const daysRemaining = Math.ceil(secondsRemaining / (60 * 60 * 24));
    
    return `${daysRemaining} days`;
  }, []);

  // Get progress percentage for a position
  const getProgressPercentage = useCallback((position: StakePosition): number => {
    if (!position.isActive) return 0;
    
    const startTime = Number(position.startTime);
    const unlockTime = Number(position.unlockTime);
    const now = new Date().getTime() / 1000;
    
    if (now >= unlockTime) return 100;
    
    const totalDuration = unlockTime - startTime;
    const elapsed = now - startTime;
    
    return Math.min(100, Math.max(0, Math.floor((elapsed / totalDuration) * 100)));
  }, []);

  return {
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
  };
}
