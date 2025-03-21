import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  TransactionInstruction,
  Keypair
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction 
} from '@solana/spl-token';
import * as anchor from '@project-serum/anchor';
import { BN } from 'bn.js';
import { PROGRAM_IDS, RiskPoolState, CapitalProvider, SimulationResult } from './types';

export class RiskPoolProgram {
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
      PROGRAM_IDS.RISK_POOL_PROGRAM,
      provider
    );
  }

  /**
   * Initialize the risk pool program
   */
  async initialize(
    insuranceProgramId: PublicKey,
    claimsProcessorId: PublicKey,
    targetReserveRatio: number,
    minCapitalRequirement: number,
    riskBufferPercentage: number,
    monteCarloIterations: number
  ): Promise<string> {
    try {
      // Derive the risk pool state PDA
      const [riskPoolStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('risk_pool_state')],
        PROGRAM_IDS.RISK_POOL_PROGRAM
      );

      // Create the transaction
      const tx = await this.program.methods
        .initialize(
          insuranceProgramId,
          claimsProcessorId,
          targetReserveRatio,
          new BN(minCapitalRequirement),
          riskBufferPercentage,
          monteCarloIterations
        )
        .accounts({
          authority: this.wallet.publicKey,
          riskPoolState: riskPoolStatePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error initializing risk pool program:', error);
      throw error;
    }
  }

  /**
   * Deposit capital into the risk pool
   */
  async depositCapital(
    amount: number,
    usdcMint: PublicKey
  ): Promise<string> {
    try {
      // Derive the risk pool state PDA
      const [riskPoolStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('risk_pool_state')],
        PROGRAM_IDS.RISK_POOL_PROGRAM
      );

      // Derive the capital provider PDA
      const [capitalProviderPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from('capital_provider'),
          this.wallet.publicKey.toBuffer()
        ],
        PROGRAM_IDS.RISK_POOL_PROGRAM
      );

      // Get the risk pool token account
      const riskPoolTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        riskPoolStatePda,
        true
      );

      // Get the provider's token account
      const providerTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        this.wallet.publicKey
      );

      // Create the transaction
      const tx = await this.program.methods
        .depositCapital(
          new BN(amount)
        )
        .accounts({
          provider: this.wallet.publicKey,
          riskPoolState: riskPoolStatePda,
          capitalProvider: capitalProviderPda,
          providerTokenAccount: providerTokenAccount,
          riskPoolTokenAccount: riskPoolTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error depositing capital:', error);
      throw error;
    }
  }

  /**
   * Withdraw capital from the risk pool
   */
  async withdrawCapital(
    amount: number,
    usdcMint: PublicKey
  ): Promise<string> {
    try {
      // Derive the risk pool state PDA
      const [riskPoolStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('risk_pool_state')],
        PROGRAM_IDS.RISK_POOL_PROGRAM
      );

      // Derive the capital provider PDA
      const [capitalProviderPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from('capital_provider'),
          this.wallet.publicKey.toBuffer()
        ],
        PROGRAM_IDS.RISK_POOL_PROGRAM
      );

      // Get the risk pool token account
      const riskPoolTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        riskPoolStatePda,
        true
      );

      // Get the provider's token account
      const providerTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        this.wallet.publicKey
      );

      // Create the transaction
      const tx = await this.program.methods
        .withdrawCapital(
          new BN(amount)
        )
        .accounts({
          provider: this.wallet.publicKey,
          riskPoolState: riskPoolStatePda,
          capitalProvider: capitalProviderPda,
          providerTokenAccount: providerTokenAccount,
          riskPoolTokenAccount: riskPoolTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error withdrawing capital:', error);
      throw error;
    }
  }

  /**
   * Run Monte Carlo simulation for risk assessment
   */
  async runMonteCarloSimulation(
    currentPolicies: number,
    avgClaimFrequency: number,
    avgClaimSeverity: number,
    marketVolatility: number
  ): Promise<string> {
    try {
      // Derive the risk pool state PDA
      const [riskPoolStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('risk_pool_state')],
        PROGRAM_IDS.RISK_POOL_PROGRAM
      );

      // Create a timestamp for the simulation result PDA
      const timestamp = new BN(Date.now()).toArrayLike(Buffer, 'le', 8);

      // Derive the simulation result PDA
      const [simulationResultPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from('simulation'),
          timestamp
        ],
        PROGRAM_IDS.RISK_POOL_PROGRAM
      );

      // Create the transaction
      const tx = await this.program.methods
        .runMonteCarloSimulation(
          new BN(currentPolicies),
          avgClaimFrequency,
          new BN(avgClaimSeverity),
          marketVolatility
        )
        .accounts({
          authority: this.wallet.publicKey,
          riskPoolState: riskPoolStatePda,
          simulationResult: simulationResultPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error running Monte Carlo simulation:', error);
      throw error;
    }
  }

  /**
   * Update risk parameters
   */
  async updateRiskParameters(
    targetReserveRatio: number | null,
    minCapitalRequirement: number | null,
    riskBufferPercentage: number | null,
    monteCarloIterations: number | null,
    isPaused: boolean | null
  ): Promise<string> {
    try {
      // Derive the risk pool state PDA
      const [riskPoolStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('risk_pool_state')],
        PROGRAM_IDS.RISK_POOL_PROGRAM
      );

      // Create the transaction
      const tx = await this.program.methods
        .updateRiskParameters(
          targetReserveRatio,
          minCapitalRequirement ? new BN(minCapitalRequirement) : null,
          riskBufferPercentage,
          monteCarloIterations,
          isPaused
        )
        .accounts({
          authority: this.wallet.publicKey,
          riskPoolState: riskPoolStatePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error updating risk parameters:', error);
      throw error;
    }
  }

  /**
   * Update coverage liability
   */
  async updateCoverageLiability(
    newLiability: number,
    isIncrease: boolean
  ): Promise<string> {
    try {
      // Derive the risk pool state PDA
      const [riskPoolStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('risk_pool_state')],
        PROGRAM_IDS.RISK_POOL_PROGRAM
      );

      // Create the transaction
      const tx = await this.program.methods
        .updateCoverageLiability(
          new BN(newLiability),
          isIncrease
        )
        .accounts({
          authority: this.wallet.publicKey,
          riskPoolState: riskPoolStatePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error updating coverage liability:', error);
      throw error;
    }
  }

  /**
   * Record premium
   */
  async recordPremium(
    amount: number
  ): Promise<string> {
    try {
      // Derive the risk pool state PDA
      const [riskPoolStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('risk_pool_state')],
        PROGRAM_IDS.RISK_POOL_PROGRAM
      );

      // Create the transaction
      const tx = await this.program.methods
        .recordPremium(
          new BN(amount)
        )
        .accounts({
          authority: this.wallet.publicKey,
          riskPoolState: riskPoolStatePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error recording premium:', error);
      throw error;
    }
  }

  /**
   * Record claim payment
   */
  async recordClaimPayment(
    amount: number
  ): Promise<string> {
    try {
      // Derive the risk pool state PDA
      const [riskPoolStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('risk_pool_state')],
        PROGRAM_IDS.RISK_POOL_PROGRAM
      );

      // Create the transaction
      const tx = await this.program.methods
        .recordClaimPayment(
          new BN(amount)
        )
        .accounts({
          authority: this.wallet.publicKey,
          riskPoolState: riskPoolStatePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error recording claim payment:', error);
      throw error;
    }
  }

  /**
   * Fetch risk pool state
   */
  async fetchRiskPoolState(): Promise<RiskPoolState> {
    try {
      const [riskPoolStatePda] = await PublicKey.findProgramAddress(
        [Buffer.from('risk_pool_state')],
        PROGRAM_IDS.RISK_POOL_PROGRAM
      );

      const stateAccount = await this.program.account.riskPoolState.fetch(riskPoolStatePda);
      return this.transformRiskPoolState(stateAccount);
    } catch (error) {
      console.error('Error fetching risk pool state:', error);
      throw error;
    }
  }

  /**
   * Fetch capital provider
   */
  async fetchCapitalProvider(provider: PublicKey): Promise<CapitalProvider> {
    try {
      const [capitalProviderPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from('capital_provider'),
          provider.toBuffer()
        ],
        PROGRAM_IDS.RISK_POOL_PROGRAM
      );

      const providerAccount = await this.program.account.capitalProvider.fetch(capitalProviderPda);
      return this.transformCapitalProvider(providerAccount);
    } catch (error) {
      console.error('Error fetching capital provider:', error);
      throw error;
    }
  }

  /**
   * Fetch simulation result
   */
  async fetchSimulationResult(simulationAddress: PublicKey): Promise<SimulationResult> {
    try {
      const simulationAccount = await this.program.account.simulationResult.fetch(simulationAddress);
      return this.transformSimulationResult(simulationAccount);
    } catch (error) {
      console.error('Error fetching simulation result:', error);
      throw error;
    }
  }

  /**
   * Fetch latest simulation result
   */
  async fetchLatestSimulationResult(): Promise<SimulationResult | null> {
    try {
      const simulationAccounts = await this.program.account.simulationResult.all();
      
      if (simulationAccounts.length === 0) {
        return null;
      }
      
      // Sort by timestamp (descending)
      simulationAccounts.sort((a, b) => {
        const timestampA = (a.account as any).runTimestamp.toNumber();
        const timestampB = (b.account as any).runTimestamp.toNumber();
        return timestampB - timestampA;
      });
      
      return this.transformSimulationResult(simulationAccounts[0].account);
    } catch (error) {
      console.error('Error fetching latest simulation result:', error);
      throw error;
    }
  }

  /**
   * Transform risk pool state account data
   */
  private transformRiskPoolState(account: any): RiskPoolState {
    return {
      authority: account.authority,
      insuranceProgramId: account.insuranceProgramId,
      claimsProcessorId: account.claimsProcessorId,
      targetReserveRatio: account.targetReserveRatio,
      minCapitalRequirement: account.minCapitalRequirement,
      riskBufferPercentage: account.riskBufferPercentage,
      monteCarloIterations: account.monteCarloIterations,
      totalCapital: account.totalCapital,
      totalCoverageLiability: account.totalCoverageLiability,
      currentReserveRatio: account.currentReserveRatio,
      totalPremiumsCollected: account.totalPremiumsCollected,
      totalClaimsPaid: account.totalClaimsPaid,
      isPaused: account.isPaused,
      bump: account.bump,
    };
  }

  /**
   * Transform capital provider account data
   */
  private transformCapitalProvider(account: any): CapitalProvider {
    return {
      provider: account.provider,
      depositedAmount: account.depositedAmount,
      lastDepositTimestamp: account.lastDepositTimestamp,
      bump: account.bump,
    };
  }

  /**
   * Transform simulation result account data
   */
  private transformSimulationResult(account: any): SimulationResult {
    return {
      runTimestamp: account.runTimestamp,
      currentPolicies: account.currentPolicies,
      avgClaimFrequency: account.avgClaimFrequency,
      avgClaimSeverity: account.avgClaimSeverity,
      marketVolatility: account.marketVolatility,
      expectedLoss: account.expectedLoss,
      var95: account.var95,
      var99: account.var99,
      recommendedCapital: account.recommendedCapital,
      currentCapital: account.currentCapital,
      capitalAdequacy: account.capitalAdequacy,
      bump: account.bump,
    };
  }
}
