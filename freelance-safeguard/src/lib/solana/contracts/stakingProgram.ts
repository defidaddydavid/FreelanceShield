import { 
  Connection, 
  PublicKey, 
  SystemProgram, 
  Transaction, 
  TransactionInstruction,
  LAMPORTS_PER_SOL,
  Keypair
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction 
} from '@solana/spl-token';
import * as anchor from '@project-serum/anchor';
import { BN } from 'bn.js';
import { PROGRAM_IDS } from './types';

// Define supported token types
export enum StakingTokenType {
  SOL = 0,
  USDC = 1,
  STAKED_SOL = 2
}

// Define stake position interface
export interface StakePosition {
  id: number;
  amount: bigint;
  tokenMint: PublicKey;
  startTime: bigint;
  unlockTime: bigint;
  lockPeriodDays: number;
  bonusMultiplier: number;
  claimedRewards: bigint;
  isActive: boolean;
}

// Define staker info interface
export interface StakerInfo {
  staker: PublicKey;
  stakedAmount: bigint;
  nextPositionId: bigint;
  lastStakeTime: bigint;
  positions: StakePosition[];
  bump: number;
}

// Define supported token interface
export interface SupportedToken {
  mint: PublicKey;
  name: string;
  weight: number;
  totalStaked: bigint;
  isActive: boolean;
}

// Define staking state interface
export interface StakingState {
  authority: PublicKey;
  riskPoolId: PublicKey;
  daoGovernanceId: PublicKey;
  minStakePeriodDays: number;
  earlyUnstakePenaltyPercent: number;
  rewardDistributionInterval: bigint;
  baseRewardRate: number;
  performanceMultiplierCap: number;
  totalStakedAmount: bigint;
  totalStakers: bigint;
  totalRewardsDistributed: bigint;
  lastRewardDistribution: bigint;
  premiumSharePercent: number;
  isPaused: boolean;
  supportedTokens: SupportedToken[];
  bump: number;
}

export class StakingProgram {
  private connection: Connection;
  private wallet: anchor.Wallet;
  private program: anchor.Program;

  constructor(
    connection: Connection,
    wallet: anchor.Wallet,
    programId: PublicKey = PROGRAM_IDS.STAKING_PROGRAM
  ) {
    this.connection = connection;
    this.wallet = wallet;

    // Initialize Anchor program
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { commitment: 'confirmed' }
    );
    
    // @ts-ignore - Anchor types issue
    this.program = new anchor.Program(
      require('../idl/staking_program.json'),
      programId,
      provider
    );
  }

  /**
   * Initialize the staking program
   */
  async initialize(
    riskPoolId: PublicKey,
    daoGovernanceId: PublicKey,
    minStakePeriodDays: number,
    earlyUnstakePenaltyPercent: number,
    rewardDistributionInterval: number,
    baseRewardRate: number,
    performanceMultiplierCap: number
  ): Promise<string> {
    try {
      // Derive the staking state PDA
      const [stakingStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('staking_state')],
        PROGRAM_IDS.STAKING_PROGRAM
      );

      // Create the transaction
      const tx = await this.program.methods
        .initialize(
          riskPoolId,
          daoGovernanceId,
          minStakePeriodDays,
          earlyUnstakePenaltyPercent,
          new BN(rewardDistributionInterval),
          baseRewardRate,
          performanceMultiplierCap
        )
        .accounts({
          authority: this.wallet.publicKey,
          stakingState: stakingStatePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error initializing staking program:', error);
      throw error;
    }
  }

  /**
   * Add a supported token for staking
   */
  async addSupportedToken(
    tokenMint: PublicKey,
    tokenName: string,
    weight: number
  ): Promise<string> {
    try {
      // Derive the staking state PDA
      const [stakingStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('staking_state')],
        PROGRAM_IDS.STAKING_PROGRAM
      );

      // Create the transaction
      const tx = await this.program.methods
        .addSupportedToken(
          tokenMint,
          tokenName,
          weight
        )
        .accounts({
          authority: this.wallet.publicKey,
          stakingState: stakingStatePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error adding supported token:', error);
      throw error;
    }
  }

  /**
   * Create a transaction to stake tokens
   */
  async createStakeTransaction(
    amount: number,
    lockPeriodDays: number,
    tokenMint: PublicKey
  ): Promise<Transaction> {
    try {
      // Derive the staking state PDA
      const [stakingStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('staking_state')],
        PROGRAM_IDS.STAKING_PROGRAM
      );

      // Derive the staker info PDA
      const [stakerInfoPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from('staker_info'),
          this.wallet.publicKey.toBuffer()
        ],
        PROGRAM_IDS.STAKING_PROGRAM
      );

      // Get the associated token account for the user
      const userTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        this.wallet.publicKey
      );

      // Get the associated token account for the staking program
      const stakingTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        stakingStatePda,
        true // allowOwnerOffCurve
      );

      // Create a new transaction
      const transaction = new Transaction();

      // Check if the staker info account exists
      const stakerInfoAccount = await this.connection.getAccountInfo(stakerInfoPda);
      if (!stakerInfoAccount) {
        // Add instruction to initialize staker info if it doesn't exist
        transaction.add(
          await this.program.methods
            .initializeStakerInfo()
            .accounts({
              staker: this.wallet.publicKey,
              stakerInfo: stakerInfoPda,
              stakingState: stakingStatePda,
              systemProgram: SystemProgram.programId,
            })
            .instruction()
        );
      }

      // Check if the staking token account exists
      const stakingTokenAccountInfo = await this.connection.getAccountInfo(stakingTokenAccount);
      if (!stakingTokenAccountInfo) {
        // Add instruction to create the associated token account if it doesn't exist
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.wallet.publicKey, // payer
            stakingTokenAccount, // associatedToken
            stakingStatePda, // owner
            tokenMint // mint
          )
        );
      }

      // Add the stake instruction
      transaction.add(
        await this.program.methods
          .stake(
            new BN(amount),
            lockPeriodDays
          )
          .accounts({
            staker: this.wallet.publicKey,
            stakerInfo: stakerInfoPda,
            stakingState: stakingStatePda,
            tokenMint: tokenMint,
            userTokenAccount: userTokenAccount,
            stakingTokenAccount: stakingTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .instruction()
      );

      return transaction;
    } catch (error) {
      console.error('Error creating stake transaction:', error);
      throw error;
    }
  }

  /**
   * Create a transaction to unstake tokens
   */
  async createUnstakeTransaction(
    positionId: number,
    tokenMint: PublicKey
  ): Promise<Transaction> {
    try {
      // Derive the staking state PDA
      const [stakingStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('staking_state')],
        PROGRAM_IDS.STAKING_PROGRAM
      );

      // Derive the staker info PDA
      const [stakerInfoPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from('staker_info'),
          this.wallet.publicKey.toBuffer()
        ],
        PROGRAM_IDS.STAKING_PROGRAM
      );

      // Get the associated token account for the user
      const userTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        this.wallet.publicKey
      );

      // Get the associated token account for the staking program
      const stakingTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        stakingStatePda,
        true // allowOwnerOffCurve
      );

      // Create a new transaction
      const transaction = new Transaction();

      // Check if the user token account exists
      const userTokenAccountInfo = await this.connection.getAccountInfo(userTokenAccount);
      if (!userTokenAccountInfo) {
        // Add instruction to create the associated token account if it doesn't exist
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.wallet.publicKey, // payer
            userTokenAccount, // associatedToken
            this.wallet.publicKey, // owner
            tokenMint // mint
          )
        );
      }

      // Add the unstake instruction
      transaction.add(
        await this.program.methods
          .unstake(
            new BN(positionId)
          )
          .accounts({
            staker: this.wallet.publicKey,
            stakerInfo: stakerInfoPda,
            stakingState: stakingStatePda,
            tokenMint: tokenMint,
            userTokenAccount: userTokenAccount,
            stakingTokenAccount: stakingTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .instruction()
      );

      return transaction;
    } catch (error) {
      console.error('Error creating unstake transaction:', error);
      throw error;
    }
  }

  /**
   * Create a transaction to claim rewards
   */
  async createClaimRewardsTransaction(
    positionId: number,
    tokenMint: PublicKey
  ): Promise<Transaction> {
    try {
      // Derive the staking state PDA
      const [stakingStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('staking_state')],
        PROGRAM_IDS.STAKING_PROGRAM
      );

      // Derive the staker info PDA
      const [stakerInfoPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from('staker_info'),
          this.wallet.publicKey.toBuffer()
        ],
        PROGRAM_IDS.STAKING_PROGRAM
      );

      // Get the associated token account for the user
      const userTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        this.wallet.publicKey
      );

      // Get the associated token account for the staking program
      const stakingTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        stakingStatePda,
        true // allowOwnerOffCurve
      );

      // Create a new transaction
      const transaction = new Transaction();

      // Check if the user token account exists
      const userTokenAccountInfo = await this.connection.getAccountInfo(userTokenAccount);
      if (!userTokenAccountInfo) {
        // Add instruction to create the associated token account if it doesn't exist
        transaction.add(
          createAssociatedTokenAccountInstruction(
            this.wallet.publicKey, // payer
            userTokenAccount, // associatedToken
            this.wallet.publicKey, // owner
            tokenMint // mint
          )
        );
      }

      // Add the claim rewards instruction
      transaction.add(
        await this.program.methods
          .claimRewards(
            new BN(positionId)
          )
          .accounts({
            staker: this.wallet.publicKey,
            stakerInfo: stakerInfoPda,
            stakingState: stakingStatePda,
            tokenMint: tokenMint,
            userTokenAccount: userTokenAccount,
            stakingTokenAccount: stakingTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .instruction()
      );

      return transaction;
    } catch (error) {
      console.error('Error creating claim rewards transaction:', error);
      throw error;
    }
  }

  /**
   * Stake tokens into the pool
   */
  async stake(
    amount: number,
    lockPeriodDays: number,
    tokenMint: PublicKey
  ): Promise<string> {
    try {
      const transaction = await this.createStakeTransaction(amount, lockPeriodDays, tokenMint);
      
      // Sign and send the transaction
      const tx = await this.program.provider.sendAndConfirm(transaction);
      
      return tx;
    } catch (error) {
      console.error('Error staking tokens:', error);
      throw error;
    }
  }

  /**
   * Unstake tokens from the pool
   */
  async unstake(
    positionId: number,
    tokenMint: PublicKey
  ): Promise<string> {
    try {
      const transaction = await this.createUnstakeTransaction(positionId, tokenMint);
      
      // Sign and send the transaction
      const tx = await this.program.provider.sendAndConfirm(transaction);
      
      return tx;
    } catch (error) {
      console.error('Error unstaking tokens:', error);
      throw error;
    }
  }

  /**
   * Claim rewards for a specific stake position
   */
  async claimRewards(
    positionId: number,
    tokenMint: PublicKey
  ): Promise<string> {
    try {
      const transaction = await this.createClaimRewardsTransaction(positionId, tokenMint);
      
      // Sign and send the transaction
      const tx = await this.program.provider.sendAndConfirm(transaction);
      
      return tx;
    } catch (error) {
      console.error('Error claiming rewards:', error);
      throw error;
    }
  }

  /**
   * Update staking configuration
   */
  async updateStakingConfig(
    params: {
      minStakePeriodDays?: number,
      earlyUnstakePenaltyPercent?: number,
      rewardDistributionInterval?: number,
      baseRewardRate?: number,
      performanceMultiplierCap?: number,
      premiumSharePercent?: number,
      isPaused?: boolean
    }
  ): Promise<string> {
    try {
      // Derive the staking state PDA
      const [stakingStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('staking_state')],
        PROGRAM_IDS.STAKING_PROGRAM
      );

      // Create the transaction
      const tx = await this.program.methods
        .updateStakingConfig(
          params.minStakePeriodDays ? params.minStakePeriodDays : null,
          params.earlyUnstakePenaltyPercent ? params.earlyUnstakePenaltyPercent : null,
          params.rewardDistributionInterval ? new BN(params.rewardDistributionInterval) : null,
          params.baseRewardRate ? params.baseRewardRate : null,
          params.performanceMultiplierCap ? params.performanceMultiplierCap : null,
          params.premiumSharePercent ? params.premiumSharePercent : null,
          params.isPaused !== undefined ? params.isPaused : null
        )
        .accounts({
          authority: this.wallet.publicKey,
          stakingState: stakingStatePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error updating staking config:', error);
      throw error;
    }
  }

  /**
   * Update token configuration
   */
  async updateTokenConfig(
    tokenMint: PublicKey,
    weight?: number,
    isActive?: boolean
  ): Promise<string> {
    try {
      // Derive the staking state PDA
      const [stakingStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('staking_state')],
        PROGRAM_IDS.STAKING_PROGRAM
      );

      // Create the transaction
      const tx = await this.program.methods
        .updateTokenConfig(
          tokenMint,
          weight !== undefined ? weight : null,
          isActive !== undefined ? isActive : null
        )
        .accounts({
          authority: this.wallet.publicKey,
          stakingState: stakingStatePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error updating token config:', error);
      throw error;
    }
  }

  /**
   * Fetch staking state
   */
  async fetchStakingState(): Promise<StakingState> {
    try {
      // Derive the staking state PDA
      const [stakingStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('staking_state')],
        PROGRAM_IDS.STAKING_PROGRAM
      );

      const stateAccount = await this.program.account.stakingState.fetch(stakingStatePda);
      return this.transformStakingState(stateAccount);
    } catch (error) {
      console.error('Error fetching staking state:', error);
      throw error;
    }
  }

  /**
   * Fetch staker info
   */
  async fetchStakerInfo(stakerPublicKey: PublicKey = this.wallet.publicKey): Promise<StakerInfo> {
    try {
      // Derive the staker info PDA
      const [stakerInfoPda] = await PublicKey.findProgramAddress(
        [Buffer.from('staker_info'), stakerPublicKey.toBuffer()],
        PROGRAM_IDS.STAKING_PROGRAM
      );

      const stakerAccount = await this.program.account.stakerInfo.fetch(stakerInfoPda);
      return this.transformStakerInfo(stakerAccount);
    } catch (error) {
      console.error('Error fetching staker info:', error);
      throw error;
    }
  }

  /**
   * Calculate estimated rewards for a position
   */
  async calculateEstimatedRewards(positionId: number): Promise<number> {
    try {
      const stakerInfo = await this.fetchStakerInfo();
      const stakingState = await this.fetchStakingState();
      
      // Find the position
      const position = stakerInfo.positions.find(p => p.id === positionId && p.isActive);
      if (!position) {
        throw new Error('Position not found');
      }
      
      // Calculate rewards using the same formula as the smart contract
      const now = Math.floor(Date.now() / 1000);
      const timeStaked = now - Number(position.startTime);
      
      // Get token weight
      const tokenWeight = stakingState.supportedTokens.find(t => 
        t.mint.toString() === position.tokenMint.toString()
      )?.weight || 10; // Default weight
      
      // Calculate base rewards
      const secondsPerYear = 365 * 24 * 60 * 60;
      const baseRewardRate = stakingState.baseRewardRate;
      
      const rewards = (Number(position.amount) * baseRewardRate * timeStaked / secondsPerYear / 10000) *
                     (100 + position.bonusMultiplier) / 100 *
                     tokenWeight / 10;
      
      return rewards - Number(position.claimedRewards);
    } catch (error) {
      console.error('Error calculating estimated rewards:', error);
      throw error;
    }
  }

  /**
   * Get APY for a specific token and lock period
   */
  async getTokenApy(tokenMint: PublicKey, lockPeriodDays: number): Promise<number> {
    try {
      const stakingState = await this.fetchStakingState();
      
      // Get token weight
      const tokenWeight = stakingState.supportedTokens.find(t => 
        t.mint.toString() === tokenMint.toString()
      )?.weight || 10; // Default weight
      
      // Calculate bonus multiplier based on lock period
      const maxBonus = 100; // 100% bonus (2x) for 365 days
      const bonusMultiplier = Math.min(
        (lockPeriodDays * maxBonus) / 365,
        maxBonus
      );
      
      // Calculate APY
      // Formula: baseRewardRate * (1 + bonusMultiplier/100) * (tokenWeight/10)
      const baseApy = stakingState.baseRewardRate / 100; // Convert basis points to percentage
      const apy = baseApy * (1 + bonusMultiplier/100) * (tokenWeight/10);
      
      return apy;
    } catch (error) {
      console.error('Error calculating token APY:', error);
      throw error;
    }
  }

  /**
   * Transform staking state account data
   */
  private transformStakingState(account: any): StakingState {
    return {
      authority: account.authority,
      riskPoolId: account.riskPoolId,
      daoGovernanceId: account.daoGovernanceId,
      minStakePeriodDays: account.minStakePeriodDays,
      earlyUnstakePenaltyPercent: account.earlyUnstakePenaltyPercent,
      rewardDistributionInterval: account.rewardDistributionInterval,
      baseRewardRate: account.baseRewardRate,
      performanceMultiplierCap: account.performanceMultiplierCap,
      totalStakedAmount: account.totalStakedAmount,
      totalStakers: account.totalStakers,
      totalRewardsDistributed: account.totalRewardsDistributed,
      lastRewardDistribution: account.lastRewardDistribution,
      premiumSharePercent: account.premiumSharePercent,
      isPaused: account.isPaused,
      supportedTokens: account.supportedTokens.map((token: any) => ({
        mint: token.mint,
        name: token.name,
        weight: token.weight,
        totalStaked: token.totalStaked,
        isActive: token.isActive,
      })),
      bump: account.bump,
    };
  }

  /**
   * Transform staker info account data
   */
  private transformStakerInfo(account: any): StakerInfo {
    return {
      staker: account.staker,
      stakedAmount: account.stakedAmount,
      nextPositionId: account.nextPositionId,
      lastStakeTime: account.lastStakeTime,
      positions: account.positions.map((position: any) => ({
        id: position.id,
        amount: position.amount,
        tokenMint: position.tokenMint,
        startTime: position.startTime,
        unlockTime: position.unlockTime,
        lockPeriodDays: position.lockPeriodDays,
        bonusMultiplier: position.bonusMultiplier,
        claimedRewards: position.claimedRewards,
        isActive: position.isActive,
      })),
      bump: account.bump,
    };
  }
}
