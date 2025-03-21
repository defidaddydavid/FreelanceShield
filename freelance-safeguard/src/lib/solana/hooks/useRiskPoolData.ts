import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Connection } from '@solana/web3.js';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { NETWORK_CONFIG, RISK_POOL_PROGRAM_ID, formatUSDC } from '../constants';
import { toast } from 'sonner';

export interface RiskPoolTransaction {
  type: 'premium' | 'claim' | 'yield' | 'stake' | 'unstake';
  amount: number;
  timestamp: Date;
  txSignature?: string;
}

export interface RiskPoolMetrics {
  totalValueLocked: number;
  activePolicies: number;
  claimsPaid: number;
  solvencyRatio: number;
  weeklyGrowth: number;
  newPoliciesThisWeek: number;
  lastClaimTimestamp: Date;
  poolAllocation: {
    available: number;
    reservedForClaims: number;
  };
  capitalReserves: {
    liquidReserves: number;
    stakedReserves: number;
    yieldGenerating: number;
  };
  riskMetrics: {
    averagePremium: number;
    averageCoverage: number;
    claimFrequency: number;
    averageClaimAmount: number;
  };
  recentTransactions: RiskPoolTransaction[];
  yourStake: {
    stakedAmount: string;
    stakedAmountPercentage: number;
    unstakedAmount: string;
    unstakedAmountPercentage: number;
    totalBalance: string;
  };
  isLoading: boolean;
  error: string | null;
}

const defaultMetrics: RiskPoolMetrics = {
  totalValueLocked: 0,
  activePolicies: 0,
  claimsPaid: 0,
  solvencyRatio: 0,
  weeklyGrowth: 0,
  newPoliciesThisWeek: 0,
  lastClaimTimestamp: new Date(),
  poolAllocation: {
    available: 0,
    reservedForClaims: 0,
  },
  capitalReserves: {
    liquidReserves: 0,
    stakedReserves: 0,
    yieldGenerating: 0,
  },
  riskMetrics: {
    averagePremium: 0,
    averageCoverage: 0,
    claimFrequency: 0,
    averageClaimAmount: 0,
  },
  recentTransactions: [],
  yourStake: {
    stakedAmount: "0",
    stakedAmountPercentage: 0,
    unstakedAmount: "0",
    unstakedAmountPercentage: 0,
    totalBalance: "0",
  },
  isLoading: true,
  error: null
};

export function useRiskPoolData(refreshInterval = 30000): RiskPoolMetrics {
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();
  const [metrics, setMetrics] = useState<RiskPoolMetrics>(defaultMetrics);

  // NEVER use mock data - always use real Solana connections
  const USE_MOCK_DATA = false;

  // Fetch risk pool data from Solana
  const fetchRiskPoolData = async () => {
    try {
      setMetrics(prev => ({ ...prev, isLoading: true, error: null }));

      // Always attempt to fetch real data from Solana
      try {
        const riskPoolAddress = new PublicKey(RISK_POOL_PROGRAM_ID);
        
        if (!connection) {
          throw new Error("No connection to Solana network");
        }
        
        // Log connection attempt
        console.log(`Connecting to Solana ${NETWORK_CONFIG.endpoint} to fetch risk pool data...`);
        
        // Fetch the account info from blockchain
        const accountInfo = await connection.getAccountInfo(riskPoolAddress);
        
        if (!accountInfo) {
          console.error("Risk pool account not found on chain. The contract may not be deployed yet.");
          setMetrics(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: "Risk pool contract not found on Solana devnet. Please ensure the contract is deployed."
          }));
          return;
        }
        
        console.log("Successfully fetched risk pool data from Solana");
        
        // Deserialize account data using Anchor
        try {
          // Get program ID and account data
          const programId = RISK_POOL_PROGRAM_ID;
          const data = accountInfo.data;
          
          // Parse the account data
          // Note: This is a simplified example. In a real implementation,
          // you would use Anchor's Program.account.* methods to deserialize
          // the account data based on your IDL
          
          // Example structure (adjust based on your actual contract structure)
          const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
          
          // Extract basic metrics (these offsets would be based on your actual account structure)
          const totalValueLocked = dataView.getFloat64(8, true); // Example offset
          const activePolicies = dataView.getUint32(16, true); // Example offset
          const claimsPaid = dataView.getUint32(20, true); // Example offset
          
          // Calculate derived metrics
          const solvencyRatio = totalValueLocked > 0 ? 
            (totalValueLocked * 0.8) / (activePolicies * 100) : 0;
          
          // Create real risk pool data object
          const realPoolData = {
            totalValueLocked,
            activePolicies,
            claimsPaid,
            solvencyRatio,
            weeklyGrowth: 0, // This might need to be calculated from historical data
            newPoliciesThisWeek: 0, // This would need historical data
            lastClaimTimestamp: new Date(),
            poolAllocation: {
              available: totalValueLocked * 0.7,
              reservedForClaims: totalValueLocked * 0.3,
            },
            capitalReserves: {
              liquidReserves: totalValueLocked * 0.5,
              stakedReserves: totalValueLocked * 0.3,
              yieldGenerating: totalValueLocked * 0.2,
            },
            riskMetrics: {
              averagePremium: 0,
              averageCoverage: 0,
              claimFrequency: 0,
              averageClaimAmount: 0,
            },
            recentTransactions: [],
            yourStake: {
              stakedAmount: "0",
              stakedAmountPercentage: 0,
              unstakedAmount: "0",
              unstakedAmountPercentage: 0,
              totalBalance: "0",
            },
            isLoading: false,
            error: null
          };
          
          // Update metrics with real data
          setMetrics(realPoolData);
          
        } catch (parseError) {
          console.error("Error parsing risk pool data:", parseError);
          setMetrics(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: `Error parsing risk pool data: ${parseError.message}`
          }));
        }
      } catch (solanaError) {
        console.error("Error fetching data from Solana:", solanaError);
        setMetrics(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: `Error connecting to Solana: ${solanaError.message}`
        }));
        
        // Show toast notification for connection error
        toast.error("Solana Connection Error", {
          description: `Failed to connect to Solana ${NETWORK_CONFIG.endpoint}. Please check your network connection.`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Unexpected error in useRiskPoolData:", error);
      setMetrics(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `Unexpected error: ${error.message}`
      }));
    }
  };

  // Fetch data on component mount and when wallet connects
  useEffect(() => {
    fetchRiskPoolData();
    
    // Set up interval for refreshing data
    const intervalId = setInterval(fetchRiskPoolData, refreshInterval);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [connection, connected, publicKey, refreshInterval]);

  return metrics;
}
