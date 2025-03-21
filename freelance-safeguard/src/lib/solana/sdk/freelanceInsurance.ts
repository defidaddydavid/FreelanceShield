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

    // Initialize the insurance program
    this.insuranceProgram = new Program(
      insuranceProgramIdl as unknown as FreelanceInsuranceIDL,
      INSURANCE_PROGRAM_ID,
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

  // Create a new insurance policy with USDC payment
  async createPolicyWithUSDC(
    coverageAmount: number,
    premiumAmount: number,
    periodDays: number,
    jobType: string,
    industry: string
  ): Promise<string> {
    const [policyPDA] = await this.findPolicyPDA(this.wallet.publicKey);
    const [riskPoolPDA] = await this.findRiskPoolPDA();
    
    try {
      // Find or create USDC token accounts
      const [userTokenAccount, createAccountTx] = await this.findOrCreateAssociatedTokenAccount(
        this.wallet.publicKey
      );
      
      const [riskPoolTokenAccount, createPoolAccountTx] = await this.findOrCreateAssociatedTokenAccount(
        riskPoolPDA
      );
      
      // Create any necessary token accounts first
      if (createAccountTx) {
        await this.enhancedSendAndConfirmTransaction(createAccountTx);
      }
      
      if (createPoolAccountTx) {
        await this.enhancedSendAndConfirmTransaction(createPoolAccountTx);
      }
      
      // Validate inputs
      if (coverageAmount <= 0 || premiumAmount <= 0 || periodDays < 1) {
        throw new Error('Invalid policy parameters');
      }
      
      // Limit job type and industry string lengths for on-chain storage
      const trimmedJobType = jobType.substring(0, 50);
      const trimmedIndustry = industry.substring(0, 50);
      
      // Create the policy transaction
      const tx = await this.insuranceProgram.methods
        .createPolicy(
          new anchor.BN(coverageAmount),
          new anchor.BN(premiumAmount),
          periodDays,
          trimmedJobType,
          trimmedIndustry
        )
        .accounts({
          owner: this.wallet.publicKey,
          policy: policyPDA,
          premiumSource: userTokenAccount,
          premiumDestination: riskPoolTokenAccount,
          riskPool: riskPoolPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .transaction();
      
      // Send and confirm the transaction
      const signature = await this.enhancedSendAndConfirmTransaction(tx);
      return signature;
    } catch (error) {
      console.error("Error creating policy:", error);
      throw this.handleSolanaError(error);
    }
  }

  // Create a new insurance policy
  async createPolicy(
    coverageAmount: number,
    premiumAmount: number,
    periodDays: number,
    jobType: string,
    industry: string
  ): Promise<string> {
    return this.createPolicyWithUSDC(
      coverageAmount,
      premiumAmount,
      periodDays,
      jobType,
      industry
    );
  }

  // Submit a claim with USDC payout
  async submitClaimWithUSDC(
    policyPDA: PublicKey,
    amount: number,
    evidenceType: string,
    evidenceDescription: string,
    evidenceAttachments: string[]
  ): Promise<string> {
    try {
      // Get policy data to determine claim count
      const policyAccount = await this.insuranceProgram.account.policy.fetch(policyPDA) as PolicyAccount;
      const claimCount = policyAccount.claimsCount;
      
      const [claimPDA] = await this.findClaimPDA(policyPDA, this.wallet.publicKey, claimCount);
      
      // Find or create user's USDC token account for potential payout
      const [userTokenAccount, createAccountTx] = await this.findOrCreateAssociatedTokenAccount(
        this.wallet.publicKey
      );
      
      // Create token account if needed
      if (createAccountTx) {
        await this.enhancedSendAndConfirmTransaction(createAccountTx);
      }
      
      // Validate evidence data
      const trimmedEvidenceType = evidenceType.substring(0, 50);
      const trimmedEvidenceDescription = evidenceDescription.substring(0, 500);
      const trimmedAttachments = evidenceAttachments.map(a => a.substring(0, 200)).slice(0, 5);
      
      // Submit the claim
      const tx = await this.insuranceProgram.methods
        .submitClaim(
          new anchor.BN(amount),
          trimmedEvidenceType,
          trimmedEvidenceDescription,
          trimmedAttachments
        )
        .accounts({
          owner: this.wallet.publicKey,
          policy: policyPDA,
          claim: claimPDA,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .transaction();
      
      // Send and confirm the transaction
      const signature = await this.enhancedSendAndConfirmTransaction(tx);
      return signature;
    } catch (error) {
      console.error("Error submitting claim:", error);
      throw this.handleSolanaError(error);
    }
  }

  // Submit a claim
  async submitClaim(
    policyPDA: PublicKey,
    amount: number,
    evidenceType: string,
    evidenceDescription: string,
    evidenceAttachments: string[] = []
  ): Promise<string> {
    try {
      // Get policy details to determine claim count
      const policyAccount = await this.getPolicyDetails(policyPDA);
      if (!policyAccount) {
        throw new Error('No active policy found');
      }
      
      const claimCount = policyAccount.claimsCount;
      const [claimPDA] = await this.findClaimPDA(policyPDA, this.wallet.publicKey, claimCount);
      
      // Validate inputs
      if (amount <= 0) {
        throw new Error('Claim amount must be greater than 0');
      }
      
      // Limit string lengths for on-chain storage
      const trimmedEvidenceType = evidenceType.substring(0, 50);
      const trimmedEvidenceDescription = evidenceDescription.substring(0, 500);
      
      // Format evidence attachments (e.g., IPFS hashes)
      const formattedAttachments = evidenceAttachments.map(a => a.substring(0, 100)).slice(0, 5);
      
      // Create the claim transaction
      const tx = await this.insuranceProgram.methods
        .submitClaim(
          new anchor.BN(amount),
          trimmedEvidenceType,
          trimmedEvidenceDescription,
          formattedAttachments
        )
        .accounts({
          owner: this.wallet.publicKey,
          policy: policyPDA,
          claim: claimPDA,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .transaction();
      
      // Send and confirm the transaction
      const signature = await this.enhancedSendAndConfirmTransaction(tx);
      return signature;
    } catch (error) {
      console.error("Error submitting claim:", error);
      throw this.handleSolanaError(error);
    }
  }

  // Verify payment from a client
  async verifyPayment(
    clientPublicKey: string,
    expectedAmount: number,
    deadlineDays: number
  ): Promise<string> {
    try {
      const client = new PublicKey(clientPublicKey);
      const [paymentVerificationPDA] = await this.findPaymentVerificationPDA(
        this.wallet.publicKey,
        client
      );
      
      // Validate inputs
      if (expectedAmount <= 0 || deadlineDays <= 0) {
        throw new Error('Invalid payment verification parameters');
      }
      
      // Create the payment verification transaction
      const tx = await this.insuranceProgram.methods
        .verifyPayment(
          new anchor.BN(expectedAmount),
          deadlineDays
        )
        .accounts({
          freelancer: this.wallet.publicKey,
          client: client,
          paymentVerification: paymentVerificationPDA,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .transaction();
      
      // Send and confirm the transaction
      const signature = await this.enhancedSendAndConfirmTransaction(tx);
      return signature;
    } catch (error) {
      console.error("Error verifying payment:", error);
      throw this.handleSolanaError(error);
    }
  }

  // Confirm payment as a client
  async confirmPayment(clientPublicKey: string): Promise<string> {
    try {
      const client = new PublicKey(clientPublicKey);
      const [paymentVerificationPDA] = await this.findPaymentVerificationPDA(
        this.wallet.publicKey,
        client
      );
      
      // Create the confirm payment transaction
      const tx = await this.insuranceProgram.methods
        .confirmPayment()
        .accounts({
          client: this.wallet.publicKey,
          freelancer: client,
          paymentVerification: paymentVerificationPDA,
        })
        .transaction();
      
      // Send and confirm the transaction
      const signature = await this.enhancedSendAndConfirmTransaction(tx);
      return signature;
    } catch (error) {
      console.error("Error confirming payment:", error);
      throw this.handleSolanaError(error);
    }
  }

  // Trigger a missed payment claim
  async triggerMissedPaymentClaim(
    verificationPDA: PublicKey,
    amount: number
  ): Promise<string> {
    try {
      // Get the policy PDA for the freelancer
      const [policyPDA] = await this.findPolicyPDA(this.wallet.publicKey);
      
      // Find the claim PDA
      const [claimPDA] = await this.findClaimPDA(policyPDA, this.wallet.publicKey, 0);
      
      // Create the transaction
      const tx = new Transaction();
      
      // Add instruction to trigger missed payment claim
      tx.add(
        await this.insuranceProgram.methods
          .triggerMissedPaymentClaim(new anchor.BN(amount))
          .accounts({
            paymentVerification: verificationPDA,
            policy: policyPDA,
            claim: claimPDA,
            freelancer: this.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .instruction()
      );
      
      // Send and confirm transaction
      const signature = await this.wallet.sendTransaction(tx, this.connection);
      await this.connection.confirmTransaction(signature, 'confirmed');
      
      return signature;
    } catch (error) {
      console.error("Error triggering missed payment claim:", error);
      throw error;
    }
  }

  // Get policy details
  async getPolicyDetails(policyPDA: PublicKey): Promise<PolicyAccount | null> {
    try {
      const policyAccount = await this.insuranceProgram.account.policy.fetch(policyPDA);
      
      // Cast to any and then to PolicyAccount to avoid TypeScript errors
      const policyData = policyAccount as any;
      
      // Create a properly formatted PolicyAccount object
      const formattedPolicy: PolicyAccount = {
        owner: policyData.owner,
        coverageAmount: policyData.coverageAmount ? policyData.coverageAmount.toNumber() : 0,
        premium: policyData.premium ? policyData.premium.toNumber() : 0,
        startDate: policyData.startDate ? new Date(policyData.startDate.toNumber() * 1000) : new Date(),
        endDate: policyData.endDate ? new Date(policyData.endDate.toNumber() * 1000) : new Date(),
        status: policyData.status ? Object.keys(policyData.status)[0] : 'Inactive',
        claimsCount: policyData.claimsCount ? policyData.claimsCount.toNumber() : 0,
        createdAt: policyData.createdAt ? new Date(policyData.createdAt.toNumber() * 1000) : new Date(),
        jobType: policyData.jobType || '',
        industry: policyData.industry || '',
        riskScore: policyData.riskScore ? policyData.riskScore.toNumber() : 0
      };
      
      return formattedPolicy;
    } catch (error) {
      console.error("Error fetching policy details:", error);
      return null;
    }
  }

  // Get all claims for a policy
  async getPolicyClaims(policyPDA: PublicKey): Promise<ClaimAccount[]> {
    try {
      // Query all claims associated with this policy
      const claims = await this.insuranceProgram.account.claim.all([
        {
          memcmp: {
            offset: 8, // After discriminator
            bytes: policyPDA.toBase58()
          }
        }
      ]);
      
      // Convert the accounts to ClaimAccount type and handle potential missing properties
      const claimAccounts = claims.map(claim => {
        const account = claim.account as any;
        
        // Ensure required properties exist
        if (!account.claimsCount) {
          account.claimsCount = 0;
        }
        
        return account as ClaimAccount;
      });
      
      return claimAccounts;
    } catch (error) {
      console.error("Error fetching policy claims:", error);
      return [];
    }
  }

  // Get risk pool metrics
  async getRiskPoolMetrics(): Promise<{
    totalCapital: number;
    totalPolicies: number;
    totalClaims: number;
    totalPremiums: number;
    totalPayouts: number;
    reserveRatio: number;
    claimsCount: number;
    lastUpdated: Date;
  }> {
    try {
      // Fetch the risk pool account
      const [riskPoolPDA] = await this.findRiskPoolPDA();
      const riskPoolAccount = await this.insuranceProgram.account.riskPool.fetch(riskPoolPDA);
      
      // Cast to any to access properties safely
      const riskPool = riskPoolAccount as any;
      
      return {
        totalCapital: riskPool.totalCapital ? riskPool.totalCapital.toNumber() : 0,
        totalPolicies: riskPool.totalPolicies ? riskPool.totalPolicies.toNumber() : 0,
        totalClaims: riskPool.totalClaims ? riskPool.totalClaims.toNumber() : 0,
        totalPremiums: riskPool.totalPremiums ? riskPool.totalPremiums.toNumber() : 0,
        totalPayouts: riskPool.totalPayouts ? riskPool.totalPayouts.toNumber() : 0,
        reserveRatio: riskPool.reserveRatio ? riskPool.reserveRatio.toNumber() / 100 : 0.2, // Convert from percentage to decimal
        claimsCount: riskPool.claimsCount ? riskPool.claimsCount.toNumber() : 0,
        lastUpdated: riskPool.lastUpdated ? new Date(riskPool.lastUpdated.toNumber() * 1000) : new Date()
      };
    } catch (error) {
      console.error("Error fetching risk pool metrics:", error);
      // Return default metrics if there's an error
      return {
        totalCapital: 0,
        totalPolicies: 0,
        totalClaims: 0,
        totalPremiums: 0,
        totalPayouts: 0,
        reserveRatio: 0.2,
        claimsCount: 0,
        lastUpdated: new Date()
      };
    }
  }

  // Get payment verifications for a user
  async getPaymentVerifications(role: 'freelancer' | 'client'): Promise<PaymentVerificationAccount[]> {
    if (!this.wallet.publicKey) {
      throw new Error("Wallet not connected");
    }
    
    try {
      // Query payment verifications based on role
      const memcmpOffset = role === 'freelancer' ? 8 : 8 + 32; // After discriminator + freelancer pubkey if client
      
      const verifications = await this.insuranceProgram.account.paymentVerification.all([
        {
          memcmp: {
            offset: memcmpOffset,
            bytes: this.wallet.publicKey.toBase58()
          }
        }
      ]);
      
      // Convert to our PaymentVerificationAccount type with proper type handling
      const formattedVerifications = verifications.map(v => {
        const account = v.account as any;
        return account as PaymentVerificationAccount;
      });
      
      return formattedVerifications;
    } catch (error) {
      console.error(`Error fetching payment verifications for ${role}:`, error);
      return [];
    }
  }

  // Process a claim (approve or reject) - admin only
  async processClaim(
    claimPDA: PublicKey,
    approved: boolean,
    reason: string
  ): Promise<string> {
    try {
      const [riskPoolPDA] = await this.findRiskPoolPDA();
      
      // Get claim data to determine owner
      const claimAccount = await this.insuranceProgram.account.claim.fetch(claimPDA) as ClaimAccount;
      const ownerPublicKey = claimAccount.owner;
      
      // Find or create token accounts for the claim payment
      const [riskPoolTokenAccount] = await this.findOrCreateAssociatedTokenAccount(
        riskPoolPDA,
        USDC_MINT
      );
      
      const [userTokenAccount, createAccountTx] = await this.findOrCreateAssociatedTokenAccount(
        ownerPublicKey,
        USDC_MINT
      );
      
      // Create user token account if needed
      if (createAccountTx) {
        await this.enhancedSendAndConfirmTransaction(createAccountTx);
      }
      
      const tx = await this.insuranceProgram.methods
        .processClaim(
          approved,
          reason
        )
        .accounts({
          authority: this.wallet.publicKey,
          riskPool: riskPoolPDA,
          claim: claimPDA,
          claimSource: riskPoolTokenAccount,
          claimDestination: userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .transaction();
      
      return await this.enhancedSendAndConfirmTransaction(tx);
    } catch (error) {
      console.error("Error processing claim:", error);
      throw this.handleSolanaError(error);
    }
  }

  // Get policy details
  async getPolicy(owner: PublicKey): Promise<PolicyAccount & { publicKey: PublicKey } | null> {
    const [policyPDA] = await this.findPolicyPDA(owner);
    
    try {
      const policyAccount = await this.insuranceProgram.account.policy.fetch(policyPDA) as PolicyAccount;
      return {
        ...policyAccount,
        publicKey: policyPDA
      };
    } catch (error) {
      console.error("Error getting policy:", error);
      return null;
    }
  }

  // Get all claims for a user's policy
  async getClaims(owner: PublicKey): Promise<(ClaimAccount & { publicKey: PublicKey })[]> {
    try {
      const [policyPDA] = await this.findPolicyPDA(owner);
      return await this.getPolicyClaims(policyPDA);
    } catch (error) {
      console.error("Error getting claims:", error);
      return [];
    }
  }

  // Helper methods to map enum values
  private mapPolicyStatus(status: { [K in keyof typeof PolicyStatus]?: {} }): string {
    if (status.Active) return PolicyStatus.Active;
    if (status.Expired) return PolicyStatus.Expired;
    if (status.Terminated) return PolicyStatus.Terminated;
    return 'Unknown';
  }

  private mapClaimStatus(status: { [K in keyof typeof ClaimStatus]?: {} }): string {
    if (status.Pending) return ClaimStatus.Pending;
    if (status.Approved) return ClaimStatus.Approved;
    if (status.Rejected) return ClaimStatus.Rejected;
    if (status.Arbitration) return ClaimStatus.Arbitration;
    return 'Unknown';
  }

  private mapPaymentStatus(status: { [K in keyof typeof PaymentStatus]?: {} }): string {
    if (status.Pending) return PaymentStatus.Pending;
    if (status.Paid) return PaymentStatus.Paid;
    if (status.Claimed) return PaymentStatus.Claimed;
    return 'Unknown';
  }

  // Handle Solana errors and convert to SolanaTransactionError
  private handleSolanaError(error: any): TransactionError {
    if (error instanceof TransactionError) {
      return error;
    }
    
    // Parse program error from logs if available
    if (error.logs) {
      const programError = this.parseProgramError(error.logs);
      return {
        code: programError.code,
        message: `Transaction failed: ${programError.message}`,
        txId: error.signature
      };
    }
    
    // Handle other error types
    return {
      code: 'UNKNOWN_ERROR',
      message: `Transaction failed: ${error.message || 'Unknown error'}`,
      txId: error.signature
    };
  }

  // Parse Solana program errors from logs
  private parseProgramError(logs: string[]): { code: string; message: string } {
    for (const log of logs) {
      if (log.includes('Program log: Error:')) {
        const errorMessage = log.split('Program log: Error:')[1].trim();
        const errorCode = errorMessage.split(':')[0].trim();
        return {
          code: errorCode,
          message: errorMessage
        };
      }
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown program error'
    };
  }

  // Enhanced type safety
  validatePublicKey(key: string): PublicKey {
    try {
      return new PublicKey(key);
    } catch (error) {
      throw new Error("Invalid Public Key");
    }
  }
}

// Custom error class for Solana transaction errors
export class SolanaTransactionError extends Error {
  public code: string;
  public txId?: string;
  
  constructor(message: string, code: string, txId?: string) {
    super(message);
    this.name = 'SolanaTransactionError';
    this.code = code;
    this.txId = txId;
  }
}
