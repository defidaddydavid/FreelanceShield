import * as anchor from '@project-serum/anchor';
import { Program, Idl, IdlAccounts, BN } from '@project-serum/anchor';
import { 
  PublicKey, 
  Connection, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL, 
  TransactionInstruction, 
  TransactionSignature, 
  sendAndConfirmTransaction,
  VersionedTransaction,
  ComputeBudgetProgram,
  Commitment,
  SendOptions,
  SYSVAR_RENT_PUBKEY,
  Signer
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  getAccount,
  createTransferInstruction,
} from '@solana/spl-token';
import { 
  INSURANCE_PROGRAM_ID, 
  RISK_POOL_PROGRAM_ID, 
  CLAIMS_PROCESSOR_PROGRAM_ID, 
  REPUTATION_PROGRAM_ID,
  USDC_MINT, 
  NETWORK_CONFIG 
} from '../constants';

// Import the IDL files
import { insuranceProgramIdl, reputationProgramIdl } from '../idl';

// Import the IDL
// import idl from './idl.json';

// Define the IDL interface
export interface FreelanceInsuranceIDL extends Idl {
  name: "freelance_insurance";
  version: "0.1.0";
  instructions: any[];
  accounts: any[];
  types: any[];
}

// Define enum types from IDL
export enum PolicyStatus {
  Active = "Active",
  Expired = "Expired",
  Terminated = "Terminated"
}

export enum ClaimStatus {
  Pending = "Pending",
  Approved = "Approved",
  Rejected = "Rejected",
  Arbitration = "Arbitration"
}

export enum PaymentStatus {
  Pending = "Pending",
  Paid = "Paid",
  Claimed = "Claimed"
}

// Define struct types from IDL
export type ClaimVerdict = {
  approved: boolean;
  reason: string;
  processedAt: anchor.BN;
};

// Define account types using IdlAccounts utility
export type RiskPoolAccount = IdlAccounts<FreelanceInsuranceIDL>["riskPool"];
export type PolicyAccount = IdlAccounts<FreelanceInsuranceIDL>["policy"];
export type ClaimAccount = IdlAccounts<FreelanceInsuranceIDL>["claim"];
export type PaymentVerificationAccount = IdlAccounts<FreelanceInsuranceIDL>["paymentVerification"];

// Define the program type
export type FreelanceInsuranceProgram = Program<FreelanceInsuranceIDL>;

// Define wallet interface that matches what the SDK expects
export interface SolanaWallet {
  publicKey: PublicKey;
  signTransaction: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>;
  signAllTransactions?: <T extends Transaction | VersionedTransaction>(transactions: T[]) => Promise<T[]>;
  sendTransaction?: (transaction: Transaction, connection: Connection, options?: SendOptions) => Promise<string>;
}

// Enhanced error handling types
interface TransactionError {
  code: string;
  message: string;
  txId?: string;
}

interface TransactionOptions {
  maxRetries?: number;
  retryDelay?: number;
  commitment?: Commitment;
}

export class FreelanceInsuranceSDK {
  insuranceProgram: FreelanceInsuranceProgram;
  reputationProgram: Program<any>;
  connection: Connection;
  wallet: SolanaWallet;
  provider: anchor.AnchorProvider;

  constructor(connection: Connection, wallet: SolanaWallet) {
    if (!connection) {
      throw new Error('Connection is required');
    }
    if (!wallet) {
      throw new Error('Wallet is required');
    }

    this.connection = connection;
    this.wallet = wallet;
    
    this.provider = new anchor.AnchorProvider(
      connection,
      wallet as unknown as anchor.Wallet,
      { 
        commitment: NETWORK_CONFIG.connectionConfig.commitment as Commitment,
        preflightCommitment: NETWORK_CONFIG.connectionConfig.commitment as Commitment
      }
    );
    
    if (!this.provider) {
      throw new Error('Failed to initialize provider');
    }

    // Initialize the insurance program with the correct program ID
    this.insuranceProgram = new Program(
      insuranceProgramIdl as unknown as FreelanceInsuranceIDL,
      INSURANCE_PROGRAM_ID, // Use the correct program ID
      this.provider
    );

    if (!this.insuranceProgram) {
      throw new Error('Failed to initialize insurance program');
    }

    // Initialize the reputation program
    this.reputationProgram = new Program(
      reputationProgramIdl,
      REPUTATION_PROGRAM_ID,
      this.provider
    );

    if (!this.reputationProgram) {
      throw new Error('Failed to initialize reputation program');
    }

    console.log('FreelanceInsurance SDK initialized with real Solana connection');
    console.log('Connected to network:', NETWORK_CONFIG.endpoint);
    console.log('Using wallet address:', wallet.publicKey?.toString());
  }

  // Find the risk pool PDA
  async findRiskPoolPDA(): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from('risk_pool')],
      this.insuranceProgram.programId
    );
  }

  // Find the policy PDA for a user
  async findPolicyPDA(owner: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from('policy'), owner.toBuffer()],
      this.insuranceProgram.programId
    );
  }

  // Find a claim PDA
  async findClaimPDA(policy: PublicKey, owner: PublicKey, claimCount: number): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from('claim'), policy.toBuffer(), owner.toBuffer(), Buffer.from([claimCount])],
      this.insuranceProgram.programId
    );
  }

  // Find a payment verification PDA
  async findPaymentVerificationPDA(
    freelancer: PublicKey,
    client: PublicKey
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from('payment'), freelancer.toBuffer(), client.toBuffer()],
      this.insuranceProgram.programId
    );
  }

  // Initialize the insurance program
  async initializeProgram(): Promise<string> {
    const [riskPoolPDA] = await this.findRiskPoolPDA();
    
    try {
      const tx = await this.insuranceProgram.methods
        .initializeProgram()
        .accounts({
          authority: this.wallet.publicKey,
          riskPool: riskPoolPDA,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .transaction();
      
      return await this.enhancedSendAndConfirmTransaction(tx);
    } catch (error) {
      console.error("Error initializing program:", error);
      throw this.handleSolanaError(error);
    }
  }

  // Find or create an associated token account for a user
  async findOrCreateAssociatedTokenAccount(
    owner: PublicKey,
    mint: PublicKey = USDC_MINT
  ): Promise<[PublicKey, Transaction | null]> {
    if (!owner) {
      throw new Error('Owner public key is required');
    }
    if (!mint) {
      throw new Error('Mint public key is required');
    }

    try {
      const associatedToken = await getAssociatedTokenAddress(mint, owner);
      const accountInfo = await this.connection.getAccountInfo(associatedToken);
      
      if (accountInfo) {
        return [associatedToken, null];
      }

      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          this.wallet.publicKey,
          associatedToken,
          owner,
          mint
        )
      );

      return [associatedToken, transaction];
    } catch (error) {
      throw new Error(`Failed to find or create associated token account: ${error.message}`);
    }
  }

  // Enhanced transaction handling
  async simulateTransaction(transaction: Transaction): Promise<void> {
    const simulation = await this.connection.simulateTransaction(transaction);
    if (simulation.value.err) {
      throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
    }
  }

  async estimateTransactionFee(transaction: Transaction): Promise<number> {
    const fee = await this.connection.getFeeForMessage(transaction.compileMessage());
    if (fee.value === null) {
      throw new Error('Unable to estimate transaction fee');
    }
    return fee.value;
  }

  // Enhanced type safety
  async enhancedSendAndConfirmTransaction(
    transaction: Transaction,
    options: TransactionOptions = {}
  ): Promise<string> {
    const { maxRetries = 3, retryDelay = 1000, commitment = 'confirmed' } = options;

    try {
      await this.simulateTransaction(transaction);
      const fee = await this.estimateTransactionFee(transaction);
      console.log(`Estimated transaction fee: ${fee} lamports`);

      let retryCount = 0;
      while (retryCount < maxRetries) {
        try {
          const signature = await this.connection.sendTransaction(transaction);
          await this.confirmTransaction(signature, commitment);
          return signature;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) throw error;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    } catch (error) {
      throw new Error(`Transaction failed after ${maxRetries} attempts: ${error.message}`);
    }
  }

  // Enhanced transaction confirmation
  async confirmTransaction(
    signature: string,
    commitment: Commitment = 'confirmed'
  ): Promise<void> {
    const status = await this.connection.confirmTransaction(signature, commitment);
    if (status.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
    }
  }

  // Create a new insurance policy with USDC
  async createPolicyWithUSDC(
    coverageAmount: number,
    periodDays: number,
    jobType: string,
    industry: string
  ): Promise<string> {
    try {
      console.log(`Creating policy with coverage: ${coverageAmount} USDC, period: ${periodDays} days`);
      
      // First, calculate the premium
      const premiumInfo = await this.calculatePremium(coverageAmount, periodDays, jobType, industry);
      const premiumAmount = premiumInfo.premiumAmount;
      
      console.log(`Premium calculated: ${premiumAmount} USDC`);

      // Find the risk pool PDA
      const [riskPoolPDA] = await this.findRiskPoolPDA();
      
      // Get the user's token account for USDC
      const [userTokenAccount, createAtaIx] = await this.findOrCreateAssociatedTokenAccount(
        this.wallet.publicKey
      );
      
      // Get the risk pool's token account for USDC
      const riskPoolTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        riskPoolPDA,
        true // allowOwnerOffCurve
      );
      
      // Create the transaction
      const transaction = new Transaction();
      
      // Add compute budget instruction to avoid OOM errors
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: 400000
        })
      );
      
      // Add create ATA instruction if needed
      if (createAtaIx) {
        transaction.add(createAtaIx);
      }
      
      // Convert inputs to the format the program expects
      const coverageAmountLamports = parseUSDC(coverageAmount);
      const jobTypeValue = this.mapJobTypeToValue(jobType);
      const industryValue = this.mapIndustryToValue(industry);
      
      // Get reputation score (or use default if not available)
      let reputationScore = 5; // Default
      try {
        const reputationData = await this.getReputationScore(this.wallet.publicKey);
        if (reputationData) {
          reputationScore = reputationData.score;
        }
      } catch (e) {
        console.log('Error getting reputation score, using default', e);
      }
      
      // Get claims history (or use default if not available)
      let claimsHistory = 0; // Default
      try {
        const claims = await this.getClaims(this.wallet.publicKey);
        claimsHistory = claims.length;
      } catch (e) {
        console.log('Error getting claims history, using default', e);
      }
      
      // Add the create policy instruction
      transaction.add(
        await this.insuranceProgram.methods
          .createPolicy(
            new BN(coverageAmountLamports),
            periodDays,
            jobTypeValue,
            industryValue,
            reputationScore,
            claimsHistory
          )
          .accounts({
            payer: this.wallet.publicKey,
            policy: (await this.findPolicyPDA(this.wallet.publicKey))[0],
            riskPool: riskPoolPDA,
            userTokenAccount: userTokenAccount,
            riskPoolTokenAccount: riskPoolTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .instruction()
      );
      
      // Sign and send the transaction
      const txId = await this.enhancedSendAndConfirmTransaction(transaction);
      console.log(`Policy created successfully, txId: ${txId}`);
      
      return txId;
    } catch (error) {
      const solanaError = this.handleSolanaError(error);
      throw new SolanaTransactionError(
        solanaError.message,
        solanaError.code,
        solanaError.txId
      );
    }
  }

  // Calculate premium for a policy
  async calculatePremium(
    coverageAmount: number,
    periodDays: number,
    jobType: string,
    industry: string
  ): Promise<{ premiumAmount: number, breakdown: any }> {
    try {
      // Convert inputs to program format
      const coverageAmountLamports = parseUSDC(coverageAmount);
      const jobTypeValue = this.mapJobTypeToValue(jobType);
      const industryValue = this.mapIndustryToValue(industry);

      // Get reputation score (or use default if not available)
      let reputationScore = 5; // Default
      try {
        const reputationData = await this.getReputationScore(this.wallet.publicKey);
        if (reputationData) {
          reputationScore = reputationData.score;
        }
      } catch (e) {
        console.log('Error getting reputation score, using default', e);
      }

      // Get claims history (or use default if not available)
      let claimsHistory = 0; // Default
      try {
        const claims = await this.getClaims(this.wallet.publicKey);
        claimsHistory = claims.length;
      } catch (e) {
        console.log('Error getting claims history, using default', e);
      }

      // Find the risk pool PDA
      const [riskPoolPDA] = await this.findRiskPoolPDA();

      // Call the calculate_premium instruction
      const result = await this.insuranceProgram.methods
        .calculatePremium(
          new BN(coverageAmountLamports),
          periodDays,
          jobTypeValue,
          industryValue,
          reputationScore,
          claimsHistory
        )
        .accounts({
          riskPool: riskPoolPDA,
          user: this.wallet.publicKey,
        })
        .view();

      // Extract the premium amount from the result
      const premiumAmount = formatUSDC(result.premiumAmount.toNumber());

      // Create a breakdown of the premium calculation for UI display
      const breakdown = {
        basePremium: formatUSDC(result.basePremium.toNumber()),
        riskAdjustment: formatUSDC(result.riskAdjustment.toNumber()),
        reputationDiscount: formatUSDC(result.reputationDiscount.toNumber()),
        finalPremium: premiumAmount,
        coverageAmount: coverageAmount,
        periodDays: periodDays,
        jobType: jobType,
        industry: industry,
        reputationScore: reputationScore,
        claimsHistory: claimsHistory,
      };

      return { 
        premiumAmount, 
        breakdown 
      };
    } catch (error) {
      console.error('Error calculating premium:', error);
      
      // Fallback to client-side calculation if on-chain calculation fails
      const basePremium = PREMIUM_CALCULATION.baseFee;
      const coveragePercentage = coverageAmount * PREMIUM_CALCULATION.coveragePercentage;
      
      // Adjust for job type and industry risk
      let riskMultiplier = 1.0;
      if (jobType === 'blockchain_development' || jobType === 'ai_development') {
        riskMultiplier *= PREMIUM_CALCULATION.riskMultiplier;
      }
      if (industry === 'finance' || industry === 'legal') {
        riskMultiplier *= PREMIUM_CALCULATION.riskMultiplier;
      }
      
      // Calculate duration factor (longer periods get slight discount)
      const durationFactor = Math.max(0.5, Math.min(1.0, periodDays / 30));
      
      // Apply reputation discount if available
      const reputationDiscount = 0; // Will be calculated if reputation data is available
      
      // Calculate final premium
      const premiumAmount = (basePremium + coveragePercentage) * riskMultiplier * durationFactor - reputationDiscount;
      
      const breakdown = {
        basePremium: basePremium,
        coverageBasedAmount: coveragePercentage,
        riskMultiplier: riskMultiplier,
        durationFactor: durationFactor,
        reputationDiscount: reputationDiscount,
        finalPremium: premiumAmount,
        coverageAmount: coverageAmount,
        periodDays: periodDays,
        jobType: jobType,
        industry: industry,
        calculatedOffChain: true
      };
      
      return { 
        premiumAmount: Math.max(PREMIUM_CALCULATION.baseFee, Math.round(premiumAmount * 100) / 100), 
        breakdown 
      };
    }
  }

  // Helper method to map job type string to enum value
  private mapJobTypeToValue(jobType: string): number {
    const jobTypeMap = {
      'web_development': 0,
      'mobile_development': 1,
      'design': 2,
      'content_writing': 3,
      'marketing': 4,
      'consulting': 5,
      'data_analysis': 6,
      'blockchain_development': 7,
      'ai_development': 8,
      'video_production': 9,
      'translation': 10,
      'other': 11
    };
    
    return jobTypeMap[jobType as keyof typeof jobTypeMap] || 11; // Default to 'other'
  }
  
  // Helper method to map industry string to enum value
  private mapIndustryToValue(industry: string): number {
    const industryMap = {
      'technology': 0,
      'finance': 1,
      'healthcare': 2,
      'education': 3,
      'entertainment': 4,
      'retail': 5,
      'manufacturing': 6,
      'real_estate': 7,
      'legal': 8,
      'nonprofit': 9,
      'government': 10,
      'other': 11
    };
    
    return industryMap[industry as keyof typeof industryMap] || 11; // Default to 'other'
  }

  // ... rest of the code remains the same ...
}
