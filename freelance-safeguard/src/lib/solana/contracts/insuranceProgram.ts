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
} from '@solana/spl_governance';
import * as anchor from '@project-serum/anchor';
import { BN } from 'bn.js';
import { PROGRAM_IDS, JobType, Industry, Policy, InsuranceState } from './types';

export class InsuranceProgram {
  private connection: Connection;
  private wallet: anchor.Wallet;
  private program: anchor.Program;

  constructor(connection: Connection, wallet: anchor.Wallet, idl: any) {
    this.connection = connection;
    this.wallet = wallet;
    
    // Create the provider
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { commitment: 'confirmed' }
    );
    
    // Initialize the program with the provider
    this.program = new anchor.Program(
      idl,
      PROGRAM_IDS.INSURANCE_PROGRAM,
      provider
    );
  }

  /**
   * Initialize the insurance program
   */
  async initialize(
    riskPoolAuthority: PublicKey,
    baseReserveRatio: number,
    minCoverageAmount: number,
    maxCoverageAmount: number,
    minPeriodDays: number,
    maxPeriodDays: number
  ): Promise<string> {
    try {
      // Derive the insurance state PDA
      const [insuranceStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('insurance_state')],
        PROGRAM_IDS.INSURANCE_PROGRAM
      );

      // Create the transaction
      const tx = await this.program.methods
        .initialize(
          riskPoolAuthority,
          baseReserveRatio,
          new BN(minCoverageAmount),
          new BN(maxCoverageAmount),
          minPeriodDays,
          maxPeriodDays
        )
        .accounts({
          authority: this.wallet.publicKey,
          insuranceState: insuranceStatePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error initializing insurance program:', error);
      throw error;
    }
  }

  /**
   * Create a new insurance policy
   */
  async createPolicy(
    coverageAmount: number,
    periodDays: number,
    jobType: JobType,
    industry: Industry,
    usdcMint: PublicKey
  ): Promise<string> {
    try {
      // Derive the insurance state PDA
      const [insuranceStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('insurance_state')],
        PROGRAM_IDS.INSURANCE_PROGRAM
      );

      // Derive the policy PDA
      const [policyPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from('policy'),
          this.wallet.publicKey.toBuffer(),
          new BN(Date.now()).toArrayLike(Buffer, 'le', 8)
        ],
        PROGRAM_IDS.INSURANCE_PROGRAM
      );

      // Get the risk pool token account
      const [riskPoolState] = await PublicKey.findProgramAddress(
        [Buffer.from('risk_pool_state')],
        PROGRAM_IDS.RISK_POOL_PROGRAM
      );

      // Get the insurance state data to retrieve the risk pool authority
      const insuranceState = await this.fetchInsuranceState();
      
      // Get the risk pool token account
      const riskPoolTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        riskPoolState,
        true
      );

      // Get the user's token account
      const userTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        this.wallet.publicKey
      );

      // Create the transaction
      const tx = await this.program.methods
        .createPolicy(
          new BN(coverageAmount),
          periodDays,
          jobType,
          industry
        )
        .accounts({
          owner: this.wallet.publicKey,
          policy: policyPda,
          insuranceState: insuranceStatePda,
          riskPoolState: riskPoolState,
          ownerTokenAccount: userTokenAccount,
          riskPoolTokenAccount: riskPoolTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error creating policy:', error);
      throw error;
    }
  }

  /**
   * Cancel an existing insurance policy
   */
  async cancelPolicy(policyAddress: PublicKey, usdcMint: PublicKey): Promise<string> {
    try {
      // Derive the insurance state PDA
      const [insuranceStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('insurance_state')],
        PROGRAM_IDS.INSURANCE_PROGRAM
      );

      // Get the risk pool token account
      const [riskPoolState] = await PublicKey.findProgramAddress(
        [Buffer.from('risk_pool_state')],
        PROGRAM_IDS.RISK_POOL_PROGRAM
      );

      // Get the risk pool token account
      const riskPoolTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        riskPoolState,
        true
      );

      // Get the user's token account
      const userTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        this.wallet.publicKey
      );

      // Create the transaction
      const tx = await this.program.methods
        .cancelPolicy()
        .accounts({
          owner: this.wallet.publicKey,
          policy: policyAddress,
          insuranceState: insuranceStatePda,
          riskPoolState: riskPoolState,
          ownerTokenAccount: userTokenAccount,
          riskPoolTokenAccount: riskPoolTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error cancelling policy:', error);
      throw error;
    }
  }

  /**
   * Update insurance parameters
   */
  async updateParameters(
    baseReserveRatio: number | null,
    minCoverageAmount: number | null,
    maxCoverageAmount: number | null,
    minPeriodDays: number | null,
    maxPeriodDays: number | null,
    isPaused: boolean | null
  ): Promise<string> {
    try {
      // Derive the insurance state PDA
      const [insuranceStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('insurance_state')],
        PROGRAM_IDS.INSURANCE_PROGRAM
      );

      // Create the transaction
      const tx = await this.program.methods
        .updateParameters(
          baseReserveRatio,
          minCoverageAmount ? new BN(minCoverageAmount) : null,
          maxCoverageAmount ? new BN(maxCoverageAmount) : null,
          minPeriodDays,
          maxPeriodDays,
          isPaused
        )
        .accounts({
          authority: this.wallet.publicKey,
          insuranceState: insuranceStatePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error updating parameters:', error);
      throw error;
    }
  }

  /**
   * Calculate premium estimate using the new logarithmic risk curve model
   */
  async calculatePremium(
    coverageAmount: number,
    periodDays: number,
    jobType: JobType,
    industry: Industry,
    reputationScore: number = 0,
    claimsHistory: number = 0,
    marketConditions: number = 10
  ): Promise<{ premiumSOL: number; riskScore: number; breakdownFactors: any }> {
    try {
      // Fetch insurance state to get current risk parameters
      const insuranceState = await this.fetchInsuranceState();
      
      // Get base premium rate (convert from lamports to SOL)
      const baseRate = Number(insuranceState.basePremiumRate) / LAMPORTS_PER_SOL;
      
      // Get risk curve exponent
      const riskCurveExponent = insuranceState.riskCurveExponent / 10;
      
      // Convert parameters for calculation
      const coverageInSOL = coverageAmount / LAMPORTS_PER_SOL; // Coverage in SOL
      const periodRatio = periodDays / 30; // Period in months
      
      // Calculate reputation factor (0.7-1.0 range)
      // Higher reputation score = lower premium
      const MIN_REPUTATION_FACTOR = 0.7;
      const MAX_REPUTATION_FACTOR = 1.0;
      const reputationMultiplier = reputationScore > 0
        ? MIN_REPUTATION_FACTOR + ((MAX_REPUTATION_FACTOR - MIN_REPUTATION_FACTOR) * (100 - reputationScore) / 100)
        : MAX_REPUTATION_FACTOR; // Default to max for users with no reputation
      
      // Get risk weights with appropriate scaling
      const jobTypeRiskWeight = this.getJobTypeRiskWeight(jobType, insuranceState) / 10;
      const industryRiskWeight = this.getIndustryRiskWeight(industry, insuranceState) / 10;
      
      // Non-linear coverage scaling with logarithmic curve
      // This provides better scaling for large coverage amounts
      const MAX_COVERAGE_RATIO = 5.0;
      const coverageFactor = (1.0 + Math.log(Math.max(1, coverageInSOL))) * 
                            Math.min(Math.pow(coverageInSOL, riskCurveExponent), MAX_COVERAGE_RATIO);
      
      // Exponential period scaling with diminishing returns
      const periodFactor = Math.pow(periodRatio, 1.1);
      
      // Combined risk weight with Bayesian adjustment based on claims history
      const claimsAdjustment = 1.0 + (claimsHistory * (insuranceState.claimsHistoryImpactWeight / 100));
      const riskWeight = jobTypeRiskWeight * industryRiskWeight * claimsAdjustment;
      
      // Market condition adjustment
      const marketAdjustment = 1.0 + (marketConditions * (insuranceState.marketVolatilityWeight / 100));
      
      // Calculate premium with all factors
      const premium = baseRate * 
                    coverageFactor * 
                    periodFactor * 
                    riskWeight * 
                    reputationMultiplier *
                    marketAdjustment;
      
      // Calculate risk score (0-100)
      const coverageRatioImpact = Math.min(coverageInSOL / 10, 1.0);
      const reputationImpact = 1.0 - (reputationScore / 100);
      const claimsImpact = Math.min(claimsHistory * 0.2, 1.0);
      
      const riskScore = Math.min(100, Math.round(
        (jobTypeRiskWeight * industryRiskWeight * 20) +
        (claimsImpact * 15) +
        (coverageRatioImpact * 30) +
        (reputationImpact * 35)
      ));
      
      return {
        premiumSOL: parseFloat(premium.toFixed(5)),
        riskScore,
        breakdownFactors: {
          baseRate,
          coverageFactor,
          periodFactor,
          riskWeight,
          reputationMultiplier,
          marketAdjustment
        }
      };
    } catch (error) {
      console.error('Error calculating premium:', error);
      // Fallback to local calculation if on-chain data isn't available
      return this.calculatePremiumLocally(
        coverageAmount,
        periodDays,
        jobType,
        industry,
        reputationScore,
        claimsHistory,
        marketConditions
      );
    }
  }
  
  /**
   * Fallback local premium calculation
   */
  private calculatePremiumLocally(
    coverageAmount: number,
    periodDays: number,
    jobType: JobType,
    industry: Industry,
    reputationScore: number = 0,
    claimsHistory: number = 0,
    marketConditions: number = 10
  ): { premiumSOL: number; riskScore: number; breakdownFactors: any } {
    // Base rate in SOL (0.1 SOL)
    const baseRate = 0.1;
    
    // Risk curve exponent
    const riskCurveExponent = 0.2;
    
    // Convert parameters for calculation
    const coverageInSOL = coverageAmount / LAMPORTS_PER_SOL; // Coverage in SOL
    const periodRatio = periodDays / 30; // Period in months
    
    // Calculate reputation factor (0.7-1.0 range)
    const MIN_REPUTATION_FACTOR = 0.7;
    const MAX_REPUTATION_FACTOR = 1.0;
    const reputationMultiplier = reputationScore > 0
      ? MIN_REPUTATION_FACTOR + ((MAX_REPUTATION_FACTOR - MIN_REPUTATION_FACTOR) * (100 - reputationScore) / 100)
      : MAX_REPUTATION_FACTOR;
    
    // Default risk weights
    const jobTypeRiskWeights = {
      [JobType.SoftwareDevelopment]: 1.0,
      [JobType.Design]: 0.9,
      [JobType.Writing]: 0.9,
      [JobType.Marketing]: 1.1,
      [JobType.Consulting]: 1.2,
      [JobType.Other]: 1.2
    };
    
    const industryRiskWeights = {
      [Industry.Technology]: 1.0,
      [Industry.Healthcare]: 1.2,
      [Industry.Finance]: 1.3,
      [Industry.Education]: 0.9,
      [Industry.Retail]: 1.1,
      [Industry.Entertainment]: 1.1,
      [Industry.Other]: 1.2
    };
    
    // Non-linear coverage scaling with logarithmic curve
    const MAX_COVERAGE_RATIO = 5.0;
    const coverageFactor = (1.0 + Math.log(Math.max(1, coverageInSOL))) * 
                          Math.min(Math.pow(coverageInSOL, riskCurveExponent), MAX_COVERAGE_RATIO);
    
    // Exponential period scaling with diminishing returns
    const periodFactor = Math.pow(periodRatio, 1.1);
    
    // Combined risk weight with claims history adjustment
    const claimsAdjustment = 1.0 + (claimsHistory * 0.15);
    const riskWeight = jobTypeRiskWeights[jobType] * industryRiskWeights[industry] * claimsAdjustment;
    
    // Market condition adjustment
    const marketAdjustment = 1.0 + (marketConditions * 0.05);
    
    // Calculate premium with all factors
    const premium = baseRate * 
                  coverageFactor * 
                  periodFactor * 
                  riskWeight * 
                  reputationMultiplier *
                  marketAdjustment;
    
    // Calculate risk score (0-100)
    const coverageRatioImpact = Math.min(coverageInSOL / 10, 1.0);
    const reputationImpact = 1.0 - (reputationScore / 100);
    const claimsImpact = Math.min(claimsHistory * 0.2, 1.0);
    
    const riskScore = Math.min(100, Math.round(
      (riskWeight * 20) +
      (claimsImpact * 15) +
      (coverageRatioImpact * 30) +
      (reputationImpact * 35)
    ));
    
    return {
      premiumSOL: parseFloat(premium.toFixed(5)),
      riskScore,
      breakdownFactors: {
        baseRate,
        coverageFactor,
        periodFactor,
        riskWeight,
        reputationMultiplier,
        marketAdjustment
      }
    };
  }
  
  /**
   * Helper method to get job type risk weight
   */
  private getJobTypeRiskWeight(jobType: JobType, insuranceState: any): number {
    const jobTypeIndex = {
      [JobType.SoftwareDevelopment]: 0,
      [JobType.Design]: 1,
      [JobType.Writing]: 2,
      [JobType.Marketing]: 3,
      [JobType.Consulting]: 4,
      [JobType.Other]: 5
    };
    
    return insuranceState.jobTypeRiskWeights[jobTypeIndex[jobType]];
  }
  
  /**
   * Helper method to get industry risk weight
   */
  private getIndustryRiskWeight(industry: Industry, insuranceState: any): number {
    const industryIndex = {
      [Industry.Technology]: 0,
      [Industry.Healthcare]: 1,
      [Industry.Finance]: 2,
      [Industry.Education]: 3,
      [Industry.Retail]: 4,
      [Industry.Entertainment]: 5,
      [Industry.Other]: 6
    };
    
    return insuranceState.industryRiskWeights[industryIndex[industry]];
  }

  /**
   * Fetch a policy by address
   */
  async fetchPolicy(policyAddress: PublicKey): Promise<Policy> {
    try {
      const policyAccount = await this.program.account.policy.fetch(policyAddress);
      return this.transformPolicyAccount(policyAccount);
    } catch (error) {
      console.error('Error fetching policy:', error);
      throw error;
    }
  }

  /**
   * Fetch all policies for a user
   */
  async fetchUserPolicies(): Promise<Policy[]> {
    try {
      const filters = [
        {
          memcmp: {
            offset: 8, // Skip the discriminator
            bytes: this.wallet.publicKey.toBase58(),
          },
        },
      ];

      const policyAccounts = await this.program.account.policy.all(filters);
      return policyAccounts.map(account => this.transformPolicyAccount(account.account));
    } catch (error) {
      console.error('Error fetching user policies:', error);
      throw error;
    }
  }

  /**
   * Fetch insurance state
   */
  async fetchInsuranceState(): Promise<InsuranceState> {
    try {
      const [insuranceStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('insurance_state')],
        PROGRAM_IDS.INSURANCE_PROGRAM
      );

      const stateAccount = await this.program.account.insuranceState.fetch(insuranceStatePda);
      return this.transformInsuranceState(stateAccount);
    } catch (error) {
      console.error('Error fetching insurance state:', error);
      throw error;
    }
  }

  /**
   * Transform policy account data
   */
  private transformPolicyAccount(account: any): Policy {
    return {
      owner: account.owner,
      coverageAmount: account.coverageAmount,
      premiumAmount: account.premiumAmount,
      startDate: account.startDate,
      endDate: account.endDate,
      status: account.status,
      jobType: account.jobType,
      industry: account.industry,
      claimsCount: account.claimsCount,
      bump: account.bump,
    };
  }

  /**
   * Transform insurance state account data
   */
  private transformInsuranceState(account: any): InsuranceState {
    return {
      authority: account.authority,
      riskPoolAuthority: account.riskPoolAuthority,
      baseReserveRatio: account.baseReserveRatio,
      minCoverageAmount: account.minCoverageAmount,
      maxCoverageAmount: account.maxCoverageAmount,
      minPeriodDays: account.minPeriodDays,
      maxPeriodDays: account.maxPeriodDays,
      totalPolicies: account.totalPolicies,
      activePolicies: account.activePolicies,
      totalCoverage: account.totalCoverage,
      totalPremiums: account.totalPremiums,
      totalClaimsPaid: account.totalClaimsPaid,
      isPaused: account.isPaused,
      // New risk model parameters
      basePremiumRate: account.basePremiumRate || BigInt(100000000), // Default 0.1 SOL in lamports
      riskCurveExponent: account.riskCurveExponent || 20, // Default 2.0 (stored as 20)
      reputationImpactWeight: account.reputationImpactWeight || 30, // Default 30%
      claimsHistoryImpactWeight: account.claimsHistoryImpactWeight || 15, // Default 15%
      marketVolatilityWeight: account.marketVolatilityWeight || 5, // Default 5%
      jobTypeRiskWeights: account.jobTypeRiskWeights || [10, 9, 9, 11, 12, 12], // Default risk weights
      industryRiskWeights: account.industryRiskWeights || [10, 12, 13, 9, 11, 11, 12], // Default risk weights
      bump: account.bump,
    };
  }
}
