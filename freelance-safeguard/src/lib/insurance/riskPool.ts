import { PublicKey, Connection, Transaction, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { NETWORK_CONFIG, RISK_POOL_PROGRAM_ID } from '@/lib/solana/constants';

// Constants for risk pool management
const MIN_RESERVE_RATIO = 0.2; // 20% minimum reserve ratio
const TARGET_RESERVE_RATIO = 0.5; // 50% recommended buffer
const MAX_POLICY_EXPOSURE = 100_000; // Maximum total coverage in SOL

interface RiskPoolMetrics {
  totalStaked: number;
  totalCoverage: number;
  reserveRatio: number;
  activeStakers: number;
  yieldAPY: number;
  claimsPaid: number;
}

interface StakingPosition {
  staker: PublicKey;
  amount: number;
  startDate: number;
  lockupPeriod: number;
  rewards: number;
}

export class RiskPoolManager {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection: Connection, programId: PublicKey) {
    this.connection = connection;
    this.programId = programId;
  }

  async getPoolMetrics(): Promise<RiskPoolMetrics> {
    // Find PDA for pool state account
    const [poolStatePDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('pool_state')],
      this.programId
    );

    const poolInfo = await this.connection.getAccountInfo(poolStatePDA);
    if (!poolInfo) {
      throw new Error('Pool state account not found');
    }

    // Decode pool data
    const dataView = new DataView(poolInfo.data.buffer);
    const totalStaked = dataView.getFloat64(0, true);
    const totalCoverage = dataView.getFloat64(8, true);
    const activeStakers = dataView.getUint32(16, true);
    const claimsPaid = dataView.getFloat64(20, true);
    const yieldAPY = dataView.getFloat64(28, true);

    return {
      totalStaked,
      totalCoverage,
      reserveRatio: totalStaked / totalCoverage,
      activeStakers,
      yieldAPY,
      claimsPaid
    };
  }

  async calculateRequiredReserves(newCoverageAmount: number): Promise<number> {
    const metrics = await this.getPoolMetrics();
    
    // Non-linear scaling of reserve requirements based on total coverage
    const scalingFactor = Math.pow(
      (metrics.totalCoverage + newCoverageAmount) / NETWORK_CONFIG.maxCoverageAmount,
      1.5
    );
    
    const baseReserve = newCoverageAmount * NETWORK_CONFIG.baseReserveRatio;
    const scaledReserve = baseReserve * (1 + scalingFactor);
    
    return Math.min(
      scaledReserve,
      newCoverageAmount * NETWORK_CONFIG.recommendedBuffer
    );
  }

  async initializePolicy(
    owner: PublicKey,
    coverageAmount: number,
    premium: number,
    periodDays: number
  ): Promise<TransactionInstruction> {
    // Find PDA for the policy account
    const [policyPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('policy'), owner.toBuffer()],
      this.programId
    );

    // Create instruction to initialize policy
    return new TransactionInstruction({
      keys: [
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: policyPDA, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data: Buffer.from([
        0, // instruction index for initialize_policy
        ...new Uint8Array(new Float64Array([coverageAmount]).buffer),
        ...new Uint8Array(new Float64Array([premium]).buffer),
        ...new Uint8Array(new Uint32Array([periodDays]).buffer),
      ])
    });
  }

  async canProcessClaim(amount: number): Promise<boolean> {
    const metrics = await this.getPoolMetrics();
    
    // Check if pool has sufficient liquidity
    if (amount > metrics.totalStaked * 0.1) {
      return false; // Single claim cannot exceed 10% of pool
    }
    
    // Ensure minimum reserve ratio is maintained after claim
    const remainingReserves = metrics.totalStaked - amount;
    const remainingRatio = remainingReserves / metrics.totalCoverage;
    
    return remainingRatio >= NETWORK_CONFIG.baseReserveRatio;
  }

  async getStakingPosition(staker: PublicKey): Promise<StakingPosition | null> {
    // Find PDA for staking position
    const [stakingPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('staking'), staker.toBuffer()],
      this.programId
    );

    const stakingInfo = await this.connection.getAccountInfo(stakingPDA);
    if (!stakingInfo) return null;

    // Decode staking position data
    const dataView = new DataView(stakingInfo.data.buffer);
    return {
      staker,
      amount: dataView.getFloat64(0, true),
      startDate: dataView.getUint32(8, true),
      lockupPeriod: dataView.getUint32(16, true),
      rewards: dataView.getFloat64(24, true)
    };
  }
}
