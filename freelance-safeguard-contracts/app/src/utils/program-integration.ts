import { AnchorProvider, BN, Program, Wallet } from '@project-serum/anchor';
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction
} from '@solana/spl-token';

// Program IDs - replace with actual deployed program IDs
const CORE_PROGRAM_ID = new PublicKey('CoreProgID111111111111111111111111111111111111');
const RISK_POOL_PROGRAM_ID = new PublicKey('FroU966kfvu5RAQxhLfb4mhFdDjY6JewEf41ZfYR3xhm');
const CLAIMS_PROCESSOR_PROGRAM_ID = new PublicKey('CL1MSPrcsr111111111111111111111111111111111');
const REPUTATION_PROGRAM_ID = new PublicKey('9KbeVQ7mhcYSDUnQ9jcVpEeQx7uu1xJfqvKrQsfpaqEq');
const POLICY_NFT_PROGRAM_ID = new PublicKey('PolicyNFT11111111111111111111111111111111111');

/**
 * FreelanceShield client for interacting with on-chain programs
 * Integrates with Phantom Wallet as required by development guidelines
 */
export class FreelanceShieldClient {
  private provider: AnchorProvider;
  private connection: Connection;
  private wallet: Wallet;
  
  // Program interfaces
  private coreProgram: Program;
  private riskPoolProgram: Program;
  private claimsProcessorProgram: Program;
  private reputationProgram: Program;
  private policyNftProgram: Program;
  
  // PDAs for frequently accessed accounts
  private domainTreasury: PublicKey | null = null;
  private riskPoolState: PublicKey | null = null;
  private userReputationProfile: PublicKey | null = null;

  constructor(
    connection: Connection,
    wallet: Wallet,
    coreIdl: any,
    riskPoolIdl: any,
    claimsProcessorIdl: any,
    reputationIdl: any,
    policyNftIdl: any
  ) {
    // Initialize provider with wallet
    this.connection = connection;
    this.wallet = wallet;
    this.provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    
    // Initialize program interfaces
    this.coreProgram = new Program(coreIdl, CORE_PROGRAM_ID, this.provider);
    this.riskPoolProgram = new Program(riskPoolIdl, RISK_POOL_PROGRAM_ID, this.provider);
    this.claimsProcessorProgram = new Program(claimsProcessorIdl, CLAIMS_PROCESSOR_PROGRAM_ID, this.provider);
    this.reputationProgram = new Program(reputationIdl, REPUTATION_PROGRAM_ID, this.provider);
    this.policyNftProgram = new Program(policyNftIdl, POLICY_NFT_PROGRAM_ID, this.provider);
  }

  /**
   * Initialize all necessary PDAs and account lookups
   */
  async initialize(domain: string = 'freelanceshield.xyz') {
    try {
      // Find domain treasury PDA
      [this.domainTreasury] = await PublicKey.findProgramAddress(
        [Buffer.from('domain-treasury'), Buffer.from(domain)],
        this.coreProgram.programId
      );
      
      // Find risk pool state PDA
      [this.riskPoolState] = await PublicKey.findProgramAddress(
        [Buffer.from('risk-pool-state')],
        this.riskPoolProgram.programId
      );
      
      // Find user reputation profile PDA
      [this.userReputationProfile] = await PublicKey.findProgramAddress(
        [Buffer.from('user-profile'), this.wallet.publicKey.toBuffer()],
        this.reputationProgram.programId
      );
      
      return {
        domainTreasury: this.domainTreasury,
        riskPoolState: this.riskPoolState,
        userReputationProfile: this.userReputationProfile
      };
    } catch (error) {
      console.error('Error initializing FreelanceShield client:', error);
      throw error;
    }
  }

  /**
   * Get reputation score for the connected wallet
   * Uses on-chain verifiable data as per development guidelines
   */
  async getUserReputationScore(): Promise<number> {
    try {
      if (!this.userReputationProfile) {
        await this.initialize();
      }

      // Check if user profile exists
      const profileExists = await this.connection.getAccountInfo(this.userReputationProfile!);
      
      if (!profileExists) {
        console.log('User reputation profile does not exist yet');
        return 50; // Default reputation score
      }
      
      // Get reputation data from on-chain account
      const userProfile = await this.reputationProgram.account.userProfile.fetch(
        this.userReputationProfile!
      );
      
      // Get detailed Bayesian reputation analytics
      const analytics = await this.reputationProgram.methods
        .getReputationAnalytics()
        .accounts({
          authority: this.wallet.publicKey,
          userProfile: this.userReputationProfile,
        })
        .view();
      
      // Return normalized score (0-100)
      return userProfile.reputationScore;
    } catch (error) {
      console.error('Error getting user reputation score:', error);
      throw error;
    }
  }

  /**
   * Calculate policy premium with reputation discount
   */
  async calculatePremium(
    contractValue: number,
    riskCategory: number,
    contractDurationDays: number
  ): Promise<number> {
    try {
      if (!this.riskPoolState || !this.userReputationProfile) {
        await this.initialize();
      }
      
      // Find Bayesian parameters PDA
      const [bayesianParams] = await PublicKey.findProgramAddress(
        [Buffer.from('bayesian_params')],
        this.reputationProgram.programId
      );
      
      // Find reputation state PDA
      const [reputationState] = await PublicKey.findProgramAddress(
        [Buffer.from('reputation-state')],
        this.reputationProgram.programId
      );
      
      // Call the calculate premium instruction
      const premium = await this.riskPoolProgram.methods
        .calculatePremium(
          new BN(contractValue),
          riskCategory,
          contractDurationDays,
          this.reputationProgram.programId,
          this.wallet.publicKey,
          this.userReputationProfile,
          reputationState,
          bayesianParams
        )
        .accounts({
          authority: this.wallet.publicKey,
          riskPoolState: this.riskPoolState,
        })
        .view();
      
      return premium.toNumber();
    } catch (error) {
      console.error('Error calculating premium:', error);
      throw error;
    }
  }

  /**
   * Purchase insurance policy with premium payment
   */
  async purchasePolicy(
    contractValue: number,
    riskCategory: number,
    contractDurationDays: number,
    contractDetails: string,
    contractId: string
  ): Promise<string> {
    try {
      if (!this.domainTreasury || !this.riskPoolState) {
        await this.initialize();
      }
      
      // Calculate premium first
      const premium = await this.calculatePremium(
        contractValue, 
        riskCategory, 
        contractDurationDays
      );
      
      // Generate policy ID using hash of inputs
      const policyId = contractId;
      
      // Find policy state PDA
      const [policyState] = await PublicKey.findProgramAddress(
        [Buffer.from('policy'), Buffer.from(policyId)],
        this.coreProgram.programId
      );
      
      // Send premium payment and create policy in one transaction
      const tx = await this.coreProgram.methods
        .createPolicyWithPremium(
          new BN(premium),
          new BN(contractValue),
          riskCategory,
          contractDurationDays,
          contractDetails,
          policyId
        )
        .accounts({
          authority: this.wallet.publicKey,
          policyState: policyState,
          domainTreasury: this.domainTreasury,
          riskPoolState: this.riskPoolState,
          riskPoolProgram: this.riskPoolProgram.programId,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log('Policy created with transaction:', tx);
      
      // Mint policy NFT to represent the insurance policy
      const policyNftTx = await this.mintPolicyNft(policyId, contractDetails);
      
      return policyId;
    } catch (error) {
      console.error('Error purchasing policy:', error);
      throw error;
    }
  }

  /**
   * Mint NFT to represent insurance policy
   */
  private async mintPolicyNft(policyId: string, metadata: string): Promise<string> {
    try {
      // Find policy metadata PDA
      const [policyMetadata] = await PublicKey.findProgramAddress(
        [Buffer.from('policy-metadata'), Buffer.from(policyId)],
        this.policyNftProgram.programId
      );
      
      // Find policy mint PDA
      const [policyMint] = await PublicKey.findProgramAddress(
        [Buffer.from('policy-mint'), Buffer.from(policyId)],
        this.policyNftProgram.programId
      );
      
      // Find associated token account for receiving the NFT
      const userTokenAccount = await getAssociatedTokenAddress(
        policyMint,
        this.wallet.publicKey
      );
      
      // Create and send the transaction
      const tx = await this.policyNftProgram.methods
        .mintPolicyNft(
          policyId,
          metadata,
          `FreelanceShield Policy #${policyId.substring(0, 8)}`,
          `https://freelanceshield.xyz/policy/${policyId}`
        )
        .accounts({
          authority: this.wallet.publicKey,
          policyMetadata: policyMetadata,
          policyMint: policyMint,
          userTokenAccount: userTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
        
      return tx;
    } catch (error) {
      console.error('Error minting policy NFT:', error);
      throw error;
    }
  }

  /**
   * Submit insurance claim
   */
  async submitClaim(
    policyId: string,
    claimAmount: number,
    claimReason: string,
    evidenceUrls: string[]
  ): Promise<string> {
    try {
      // Find policy state PDA
      const [policyState] = await PublicKey.findProgramAddress(
        [Buffer.from('policy'), Buffer.from(policyId)],
        this.coreProgram.programId
      );
      
      // Generate claim ID
      const claimId = `${policyId}-${Date.now()}`;
      
      // Find claim state PDA
      const [claimState] = await PublicKey.findProgramAddress(
        [Buffer.from('claim'), Buffer.from(claimId)],
        this.claimsProcessorProgram.programId
      );
      
      // Find claims processor state PDA
      const [claimsProcessorState] = await PublicKey.findProgramAddress(
        [Buffer.from('claims-state')],
        this.claimsProcessorProgram.programId
      );
      
      // Find Bayesian model PDA
      const [bayesianModel] = await PublicKey.findProgramAddress(
        [Buffer.from('bayesian_model')],
        this.claimsProcessorProgram.programId
      );
      
      // Submit the claim
      const tx = await this.claimsProcessorProgram.methods
        .submitClaim(
          policyId,
          claimId,
          new BN(claimAmount),
          claimReason,
          evidenceUrls
        )
        .accounts({
          claimer: this.wallet.publicKey,
          policyState: policyState,
          claimState: claimState,
          claimsProcessorState: claimsProcessorState,
          bayesianModel: bayesianModel,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log('Claim submitted with transaction:', tx);
      return claimId;
    } catch (error) {
      console.error('Error submitting claim:', error);
      throw error;
    }
  }
  
  /**
   * Create user reputation profile if it doesn't exist
   */
  async createReputationProfileIfNeeded(): Promise<boolean> {
    try {
      if (!this.userReputationProfile) {
        await this.initialize();
      }
      
      // Check if profile already exists
      const profileExists = await this.connection.getAccountInfo(this.userReputationProfile!);
      
      if (profileExists) {
        console.log('User reputation profile already exists');
        return false;
      }
      
      // Find reputation state PDA
      const [reputationState] = await PublicKey.findProgramAddress(
        [Buffer.from('reputation-state')],
        this.reputationProgram.programId
      );
      
      // Create the profile
      const tx = await this.reputationProgram.methods
        .createProfile()
        .accounts({
          user: this.wallet.publicKey,
          userProfile: this.userReputationProfile,
          reputationState: reputationState,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log('Reputation profile created with transaction:', tx);
      return true;
    } catch (error) {
      console.error('Error creating reputation profile:', error);
      throw error;
    }
  }
}
