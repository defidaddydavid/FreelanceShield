import { Connection, PublicKey, Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN, utils } from '@project-serum/anchor';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import * as anchor from '@project-serum/anchor';
import * as bs58 from 'bs58';
import { sha256 } from 'js-sha256';

// Define types that reflect our Rust program structures
export enum VerificationLevel {
  Basic = 0,
  Intermediate = 1,
  Advanced = 2,
  Premium = 3
}

export enum ClaimType {
  NonPayment = 0,
  IncompleteWork = 1,
  QualityDispute = 2,
  DeadlineMissed = 3,
  ContractBreach = 4,
  Other = 5
}

export enum EvidenceType {
  Contract = 0,
  Communication = 1,
  Deliverable = 2,
  Payment = 3,
  Timeline = 4,
  QualityAssessment = 5,
  ExpertOpinion = 6,
  Other = 7
}

export enum FraudType {
  FakeIdentity = 0,
  CollaborativeFraud = 1,
  IdentityTheft = 2,
  FalseClaim = 3,
  InflatedClaim = 4,
  ContractManipulation = 5,
  EvidenceFalsification = 6,
  SystemExploitation = 7,
  Other = 8
}

export interface IdentityData {
  userPublicKey: string;
  verificationLevel: VerificationLevel;
  socialVerifications: SocialVerification[];
  vouchers: VoucherInfo[];
  isActive: boolean;
  created: Date;
  lastUpdated: Date;
}

export interface SocialVerification {
  platform: string;
  accountHash: string;
  verificationTimestamp: number;
}

export interface VoucherInfo {
  voucher: string;
  timestamp: number;
  reputationScore: number;
}

export interface ClaimEvidence {
  evidenceHash: string;
  evidenceType: EvidenceType;
  submittedBy: string;
  timestamp: number;
  uri: string;
  verified: boolean;
}

export interface ClaimData {
  claimType: ClaimType;
  claimant: string;
  respondent: string;
  policyId: string;
  contractId?: string;
  claimAmount: number;
  description: string;
  requiredEvidenceTypes: EvidenceType[];
}

export class FraudPreventionService {
  private connection: Connection;
  private program: Program;
  private programId: PublicKey;
  
  constructor(
    connection: Connection,
    programId: string = 'FrDpveRvsGksRPUeehKQYJkXKMRh64pNaEMgnV9yW8S',
    programIdl?: any
  ) {
    this.connection = connection;
    this.programId = new PublicKey(programId);
    
    // In a real implementation, you would load the IDL from the deployed program
    // For demonstration, we're assuming the IDL is passed in or we're using a mock
    if (programIdl) {
      const provider = this.getProvider();
      this.program = new Program(programIdl, this.programId, provider);
    }
  }
  
  private getProvider() {
    // For browser environments
    const wallet = useAnchorWallet();
    if (wallet) {
      const provider = new AnchorProvider(
        this.connection,
        wallet as any,
        { preflightCommitment: 'confirmed' }
      );
      return provider;
    }
    
    // For non-browser environments (tests, scripts)
    const dummyKeypair = Keypair.generate();
    const dummyWallet = {
      publicKey: dummyKeypair.publicKey,
      signTransaction: async (tx: Transaction) => tx,
      signAllTransactions: async (txs: Transaction[]) => txs,
    };
    
    return new AnchorProvider(
      this.connection,
      dummyWallet,
      { preflightCommitment: 'confirmed' }
    );
  }
  
  /**
   * Initialize a new identity verification account for a user
   */
  public async initializeIdentity(
    wallet: any,
    userInfo: { name: string, email: string, username: string }
  ): Promise<string> {
    try {
      const provider = this.getProvider();
      
      // Hash the email for privacy
      const emailHash = Array.from(sha256.array(userInfo.email));
      
      // Find the identity PDA
      const [identityAccount, bump] = await PublicKey.findProgramAddress(
        [
          Buffer.from('identity'),
          wallet.publicKey.toBuffer()
        ],
        this.programId
      );
      
      // Submit the transaction
      const tx = await this.program.methods
        .initializeIdentity(
          VerificationLevel.Basic,
          {
            name: userInfo.name,
            emailHash: emailHash,
            publicUsername: userInfo.username
          }
        )
        .accounts({
          user: wallet.publicKey,
          identityAccount,
          systemProgram: SystemProgram.programId
        })
        .rpc();
      
      console.log('Identity initialized:', tx);
      return tx;
    } catch (error) {
      console.error('Error initializing identity:', error);
      throw error;
    }
  }
  
  /**
   * Get identity data for a user
   */
  public async getIdentityData(userPublicKey: string): Promise<IdentityData | null> {
    try {
      const userPubkey = new PublicKey(userPublicKey);
      
      // Find the identity PDA
      const [identityAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from('identity'),
          userPubkey.toBuffer()
        ],
        this.programId
      );
      
      // Fetch the account data
      const accountInfo = await this.connection.getAccountInfo(identityAccount);
      if (!accountInfo) {
        return null;
      }
      
      // Parse the account data using the program
      const identity = await this.program.account.identityAccount.fetch(identityAccount);
      
      // Transform into our frontend-friendly format
      return {
        userPublicKey: userPublicKey,
        verificationLevel: identity.verificationLevel,
        socialVerifications: identity.socialVerifications.map((sv: any) => ({
          platform: sv.platform,
          accountHash: bs58.encode(sv.accountHash),
          verificationTimestamp: sv.verificationTimestamp.toNumber()
        })),
        vouchers: identity.vouchers.map((v: any) => ({
          voucher: v.voucher.toString(),
          timestamp: v.timestamp.toNumber(),
          reputationScore: v.voucherReputation.toNumber()
        })),
        isActive: identity.isActive,
        created: new Date(identity.createdAt.toNumber() * 1000),
        lastUpdated: new Date(identity.lastUpdated.toNumber() * 1000)
      };
    } catch (error) {
      console.error('Error fetching identity data:', error);
      return null;
    }
  }
  
  /**
   * Add social verification to a user's identity
   */
  public async addSocialVerification(
    wallet: any, 
    platform: string, 
    accountId: string
  ): Promise<string> {
    try {
      const provider = this.getProvider();
      
      // Hash the account ID for privacy
      const accountHash = Array.from(sha256.array(accountId));
      
      // Find the identity PDA
      const [identityAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from('identity'),
          wallet.publicKey.toBuffer()
        ],
        this.programId
      );
      
      // Create verification timestamp (current time)
      const verificationTimestamp = Math.floor(Date.now() / 1000);
      
      // Create a simple verification hash (in a real app, this would be more complex)
      const verificationHash = Array.from(sha256.array(`${platform}:${accountId}:${verificationTimestamp}`));
      
      // Submit the transaction
      const tx = await this.program.methods
        .addSocialVerification({
          platform,
          accountHash,
          verificationTimestamp: new BN(verificationTimestamp),
          verificationHash
        })
        .accounts({
          user: wallet.publicKey,
          identityAccount,
          verifier: wallet.publicKey // Self-verification (in a real app, would be an oracle)
        })
        .rpc();
      
      console.log('Social verification added:', tx);
      return tx;
    } catch (error) {
      console.error('Error adding social verification:', error);
      throw error;
    }
  }
  
  /**
   * Initialize a new claim verification process
   */
  public async initializeClaimVerification(
    wallet: any,
    claimData: ClaimData
  ): Promise<string> {
    try {
      const provider = this.getProvider();
      
      // Convert string addresses to PublicKeys
      const claimant = new PublicKey(claimData.claimant);
      const respondent = new PublicKey(claimData.respondent);
      const policyId = new PublicKey(claimData.policyId);
      let contractId = null;
      if (claimData.contractId) {
        contractId = new PublicKey(claimData.contractId);
      }
      
      // Find the claim verification PDA
      const timestamp = new BN(Math.floor(Date.now() / 1000));
      const [claimVerification] = await PublicKey.findProgramAddress(
        [
          Buffer.from('claim'),
          claimant.toBuffer(),
          timestamp.toBuffer('le', 8)
        ],
        this.programId
      );
      
      // Submit the transaction
      const tx = await this.program.methods
        .initializeClaimVerification({
          claimType: claimData.claimType,
          claimant,
          respondent,
          policyId,
          contractId: contractId ? contractId : null,
          claimAmount: new BN(claimData.claimAmount),
          description: claimData.description,
          requiredEvidenceTypes: claimData.requiredEvidenceTypes
        })
        .accounts({
          claimant: wallet.publicKey,
          respondent,
          claimVerification,
          systemProgram: SystemProgram.programId
        })
        .rpc();
      
      console.log('Claim verification initialized:', tx);
      return tx;
    } catch (error) {
      console.error('Error initializing claim verification:', error);
      throw error;
    }
  }
  
  /**
   * Add evidence to a claim verification process
   */
  public async addClaimEvidence(
    wallet: any,
    claimVerificationAddress: string,
    evidenceType: EvidenceType,
    evidenceUri: string,
    evidenceContent: string
  ): Promise<string> {
    try {
      const provider = this.getProvider();
      
      // Calculate evidence hash
      const evidenceHash = Array.from(sha256.array(evidenceContent));
      
      // Get the claim verification account
      const claimVerification = new PublicKey(claimVerificationAddress);
      
      // Submit the transaction
      const tx = await this.program.methods
        .addClaimEvidence(
          evidenceHash,
          evidenceType,
          evidenceUri
        )
        .accounts({
          submitter: wallet.publicKey,
          claimVerification
        })
        .rpc();
      
      console.log('Evidence added to claim:', tx);
      return tx;
    } catch (error) {
      console.error('Error adding evidence to claim:', error);
      throw error;
    }
  }
  
  /**
   * Report fraudulent behavior
   */
  public async reportFraud(
    wallet: any,
    reportedUserPublicKey: string,
    fraudType: FraudType,
    description: string,
    evidenceUri: string,
    evidenceContent: string
  ): Promise<string> {
    try {
      const provider = this.getProvider();
      
      // Calculate evidence hash
      const evidenceHash = Array.from(sha256.array(evidenceContent));
      
      // Convert reported user pubkey
      const reportedUser = new PublicKey(reportedUserPublicKey);
      
      // Find the fraud report PDA
      const timestamp = new BN(Math.floor(Date.now() / 1000));
      const [fraudReport] = await PublicKey.findProgramAddress(
        [
          Buffer.from('fraud_report'),
          wallet.publicKey.toBuffer(),
          reportedUser.toBuffer(),
          timestamp.toBuffer('le', 8)
        ],
        this.programId
      );
      
      // Submit the transaction
      const tx = await this.program.methods
        .reportFraud(
          fraudType,
          evidenceHash,
          description,
          evidenceUri
        )
        .accounts({
          reporter: wallet.publicKey,
          reportedUser,
          fraudReport,
          systemProgram: SystemProgram.programId
        })
        .rpc();
      
      console.log('Fraud report submitted:', tx);
      return tx;
    } catch (error) {
      console.error('Error reporting fraud:', error);
      throw error;
    }
  }
  
  /**
   * Get a list of evidence for a claim
   */
  public async getClaimEvidence(
    claimVerificationAddress: string
  ): Promise<ClaimEvidence[]> {
    try {
      // Get the claim verification account
      const claimVerification = new PublicKey(claimVerificationAddress);
      
      // Fetch the account data
      const claim = await this.program.account.claimVerification.fetch(claimVerification);
      
      // Transform into our frontend-friendly format
      return claim.evidence.map((e: any) => ({
        evidenceHash: bs58.encode(e.evidenceHash),
        evidenceType: e.evidenceType,
        submittedBy: e.submittedBy.toString(),
        timestamp: e.timestamp.toNumber(),
        uri: e.uri,
        verified: e.verified
      }));
    } catch (error) {
      console.error('Error fetching claim evidence:', error);
      return [];
    }
  }
  
  /**
   * Check if a user's identity is verified at the specified level or higher
   */
  public async isIdentityVerified(
    userPublicKey: string,
    minLevel: VerificationLevel = VerificationLevel.Basic
  ): Promise<boolean> {
    try {
      const identity = await this.getIdentityData(userPublicKey);
      if (!identity) {
        return false;
      }
      
      return identity.verificationLevel >= minLevel && identity.isActive;
    } catch (error) {
      console.error('Error checking identity verification:', error);
      return false;
    }
  }
}

/**
 * Create a new instance of FraudPreventionService
 */
export function createFraudPreventionService(
  connection: Connection,
  programId?: string,
  programIdl?: any
): FraudPreventionService {
  return new FraudPreventionService(connection, programId, programIdl);
}

/**
 * Custom hook to use the fraud prevention service in React components
 */
export function useFraudPreventionService(
  connection: Connection,
  programId?: string,
  programIdl?: any
): FraudPreventionService {
  return new FraudPreventionService(connection, programId, programIdl);
}
