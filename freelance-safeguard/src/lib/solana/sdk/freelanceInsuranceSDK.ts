import { 
  Connection, 
  PublicKey, 
  TransactionInstruction, 
  SystemProgram, 
  SYSVAR_RENT_PUBKEY,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
  AccountInfo,
  ParsedAccountData
} from '@solana/web3.js';
import { 
  INSURANCE_PROGRAM_ID, 
  RISK_POOL_PROGRAM_ID, 
  CLAIMS_PROCESSOR_PROGRAM_ID,
  USDC_MINT,
  NETWORK_CONFIG
} from '../constants';
import { 
  Policy, 
  Claim, 
  PolicyStatus, 
  ClaimStatus, 
  RiskPoolMetrics,
  RiskEvaluation,
  JobType,
  Industry
} from '../../../types/insurance';

// Define interfaces for policy and claim accounts
export interface PolicyAccount {
  publicKey: PublicKey;
  account: {
    owner: PublicKey;
    coverageAmount: number;
    premiumAmount: number;
    startTime: number;
    expiryTime: number;
    jobType: string;
    industry: string;
    active: boolean;
    projectName: string;
    clientName: string;
    description: string;
  };
}

export interface ClaimAccount {
  publicKey: PublicKey;
  account: {
    policyPDA: PublicKey;
    owner: PublicKey;
    amount: number;
    submissionTime: number;
    status: string;
    evidenceType: string;
    evidenceDescription: string;
    evidenceAttachments: string[];
    riskScore: number;
    riskFactors: string[];
  };
}

export interface RiskPoolMetricsData {
  totalPolicies: number;
  activePolicies: number;
  totalCoverage: number;
  poolBalance: number;
  totalPremiums: number;
  totalClaims: number;
  claimCount: number;
  claimApprovalRate: number;
  solvencyRatio: number;
  averagePremium: number;
  averageCoverage: number;
}

export class FreelanceInsuranceSDK {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Create a policy creation instruction
   */
  async createPolicyInstruction(
    owner: PublicKey,
    coverageAmount: number,
    premiumAmount: number,
    coveragePeriod: number,
    jobType: string,
    industry: string,
    projectName: string,
    clientName: string,
    description: string
  ): Promise<TransactionInstruction> {
    // Generate a PDA for the policy
    const [policyPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from('policy'),
        owner.toBuffer(),
        Buffer.from(Math.floor(Date.now() / 1000).toString())
      ],
      INSURANCE_PROGRAM_ID
    );

    // Create the instruction data buffer
    const data = Buffer.alloc(1024);
    let offset = 0;

    // Instruction discriminator (0 = CreatePolicy)
    data.writeUInt8(0, offset);
    offset += 1;

    // Coverage amount (as a u64)
    const coverageBuffer = Buffer.alloc(8);
    coverageBuffer.writeBigUInt64LE(BigInt(coverageAmount), 0);
    coverageBuffer.copy(data, offset);
    offset += 8;

    // Premium amount (as a u64)
    const premiumBuffer = Buffer.alloc(8);
    premiumBuffer.writeBigUInt64LE(BigInt(premiumAmount), 0);
    premiumBuffer.copy(data, offset);
    offset += 8;

    // Coverage period in days (as a u16)
    data.writeUInt16LE(coveragePeriod, offset);
    offset += 2;

    // Job type (as a string)
    const jobTypeBuffer = Buffer.from(jobType);
    data.writeUInt8(jobTypeBuffer.length, offset);
    offset += 1;
    jobTypeBuffer.copy(data, offset);
    offset += jobTypeBuffer.length;

    // Industry (as a string)
    const industryBuffer = Buffer.from(industry);
    data.writeUInt8(industryBuffer.length, offset);
    offset += 1;
    industryBuffer.copy(data, offset);
    offset += industryBuffer.length;

    // Project name (as a string)
    const projectNameBuffer = Buffer.from(projectName);
    data.writeUInt16LE(projectNameBuffer.length, offset);
    offset += 2;
    projectNameBuffer.copy(data, offset);
    offset += projectNameBuffer.length;

    // Client name (as a string)
    const clientNameBuffer = Buffer.from(clientName);
    data.writeUInt16LE(clientNameBuffer.length, offset);
    offset += 2;
    clientNameBuffer.copy(data, offset);
    offset += clientNameBuffer.length;

    // Description (as a string)
    const descriptionBuffer = Buffer.from(description);
    data.writeUInt16LE(descriptionBuffer.length, offset);
    offset += 2;
    descriptionBuffer.copy(data, offset);
    offset += descriptionBuffer.length;

    // Trim the data buffer to the actual size
    const instructionData = data.slice(0, offset);

    // Create the transaction instruction
    return new TransactionInstruction({
      keys: [
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: policyPDA, isSigner: false, isWritable: true },
        { pubkey: RISK_POOL_PROGRAM_ID, isSigner: false, isWritable: true },
        { pubkey: USDC_MINT, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      ],
      programId: INSURANCE_PROGRAM_ID,
      data: instructionData,
    });
  }

  /**
   * Create a claim submission instruction
   */
  async submitClaimInstruction(
    owner: PublicKey,
    policyPDA: PublicKey,
    amount: number,
    evidenceType: string,
    evidenceDescription: string,
    evidenceAttachments: string[] = []
  ): Promise<TransactionInstruction> {
    // Generate a PDA for the claim
    const [claimPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from('claim'),
        policyPDA.toBuffer(),
        Buffer.from(Math.floor(Date.now() / 1000).toString())
      ],
      CLAIMS_PROCESSOR_PROGRAM_ID
    );

    // Create the instruction data buffer
    const data = Buffer.alloc(1024);
    let offset = 0;

    // Instruction discriminator (0 = SubmitClaim)
    data.writeUInt8(0, offset);
    offset += 1;

    // Claim amount (as a u64)
    const amountBuffer = Buffer.alloc(8);
    amountBuffer.writeBigUInt64LE(BigInt(amount), 0);
    amountBuffer.copy(data, offset);
    offset += 8;

    // Evidence type (as a string)
    const evidenceTypeBuffer = Buffer.from(evidenceType);
    data.writeUInt8(evidenceTypeBuffer.length, offset);
    offset += 1;
    evidenceTypeBuffer.copy(data, offset);
    offset += evidenceTypeBuffer.length;

    // Evidence description (as a string)
    const evidenceDescriptionBuffer = Buffer.from(evidenceDescription);
    data.writeUInt16LE(evidenceDescriptionBuffer.length, offset);
    offset += 2;
    evidenceDescriptionBuffer.copy(data, offset);
    offset += evidenceDescriptionBuffer.length;

    // Evidence attachments (as an array of strings)
    data.writeUInt8(evidenceAttachments.length, offset);
    offset += 1;

    for (const attachment of evidenceAttachments) {
      const attachmentBuffer = Buffer.from(attachment);
      data.writeUInt16LE(attachmentBuffer.length, offset);
      offset += 2;
      attachmentBuffer.copy(data, offset);
      offset += attachmentBuffer.length;
    }

    // Trim the data buffer to the actual size
    const instructionData = data.slice(0, offset);

    // Create the transaction instruction
    return new TransactionInstruction({
      keys: [
        { pubkey: owner, isSigner: true, isWritable: true },
        { pubkey: policyPDA, isSigner: false, isWritable: true },
        { pubkey: claimPDA, isSigner: false, isWritable: true },
        { pubkey: CLAIMS_PROCESSOR_PROGRAM_ID, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      ],
      programId: CLAIMS_PROCESSOR_PROGRAM_ID,
      data: instructionData,
    });
  }

  /**
   * Get all policies for a user
   */
  async getPoliciesForUser(userPublicKey: PublicKey): Promise<Policy[]> {
    try {
      console.log(`Fetching policies for user: ${userPublicKey.toString()}`);
      
      // Get all program accounts for the insurance program
      const accounts = await this.connection.getProgramAccounts(INSURANCE_PROGRAM_ID, {
        filters: [
          {
            memcmp: {
              offset: 8, // After the account discriminator
              bytes: userPublicKey.toBase58() // Owner's public key
            }
          }
        ]
      });
      
      console.log(`Found ${accounts.length} policy accounts`);
      
      // Parse the account data into Policy objects
      const policies: Policy[] = accounts.map((account) => {
        const data = account.account.data;
        
        // Parse the binary data based on the Anchor account structure
        // This matches the Policy struct in the Solana program
        const owner = new PublicKey(data.slice(8, 40));
        const coverageAmount = Number(data.readBigUInt64LE(40));
        const premiumAmount = Number(data.readBigUInt64LE(48));
        const startTime = data.readBigInt64LE(56);
        const endTime = data.readBigInt64LE(64);
        const statusValue = data.readUInt8(72);
        
        // Map status value to PolicyStatus enum
        let status: PolicyStatus;
        switch (statusValue) {
          case 0: status = PolicyStatus.ACTIVE; break;
          case 1: status = PolicyStatus.EXPIRED; break;
          case 2: status = PolicyStatus.PENDING; break;
          case 3: status = PolicyStatus.CANCELLED; break;
          default: status = PolicyStatus.ACTIVE;
        }
        
        // Read string fields with their length prefixes
        let offset = 73;
        
        // Read job_type
        const jobTypeLen = data.readUInt32LE(offset);
        offset += 4;
        const jobType = data.slice(offset, offset + jobTypeLen).toString();
        offset += jobTypeLen;
        
        // Read industry
        const industryLen = data.readUInt32LE(offset);
        offset += 4;
        const industry = data.slice(offset, offset + industryLen).toString();
        offset += industryLen;
        
        // Read claims_count
        const claimsCount = data.readUInt16LE(offset);
        offset += 2;
        
        // Read bump
        const bump = data.readUInt8(offset);
        offset += 1;
        
        // Read project_name, client_name, and description if they exist
        // These might be optional in the Anchor struct
        let projectName = "";
        let clientName = "";
        let description = "";
        
        if (offset < data.length) {
          const projectNameLen = data.readUInt32LE(offset);
          offset += 4;
          if (projectNameLen > 0 && offset + projectNameLen <= data.length) {
            projectName = data.slice(offset, offset + projectNameLen).toString();
            offset += projectNameLen;
          }
          
          if (offset < data.length) {
            const clientNameLen = data.readUInt32LE(offset);
            offset += 4;
            if (clientNameLen > 0 && offset + clientNameLen <= data.length) {
              clientName = data.slice(offset, offset + clientNameLen).toString();
              offset += clientNameLen;
            }
            
            if (offset < data.length) {
              const descriptionLen = data.readUInt32LE(offset);
              offset += 4;
              if (descriptionLen > 0 && offset + descriptionLen <= data.length) {
                description = data.slice(offset, offset + descriptionLen).toString();
              }
            }
          }
        }
        
        return {
          policyId: account.pubkey.toString(),
          owner: owner.toString(),
          coverageAmount,
          premiumAmount,
          startTime: new Date(Number(startTime) * 1000).toISOString(),
          expiryTime: new Date(Number(endTime) * 1000).toISOString(),
          jobType,
          industry,
          status,
          projectName,
          clientName,
          description
        };
      });
      
      return policies;
    } catch (error) {
      console.error("Error fetching policies:", error);
      throw new Error(`Failed to fetch policies: ${error.message}`);
    }
  }

  /**
   * Get all claims for a user
   */
  async getClaimsForUser(userPublicKey: PublicKey): Promise<Claim[]> {
    try {
      console.log(`Fetching claims for user: ${userPublicKey.toString()}`);
      
      // Get all program accounts for the claims processor program
      const accounts = await this.connection.getProgramAccounts(CLAIMS_PROCESSOR_PROGRAM_ID, {
        filters: [
          {
            memcmp: {
              offset: 40, // After the account discriminator and policy PDA
              bytes: userPublicKey.toBase58() // Owner's public key
            }
          }
        ]
      });
      
      console.log(`Found ${accounts.length} claim accounts`);
      
      // Parse the account data into Claim objects
      const claims: Claim[] = accounts.map((account) => {
        const data = account.account.data;
        
        // Parse the binary data based on the Anchor account structure
        const policyPDA = new PublicKey(data.slice(8, 40));
        const owner = new PublicKey(data.slice(40, 72));
        const amount = Number(data.readBigUInt64LE(72));
        const submissionTime = data.readBigInt64LE(80);
        const processingTime = data.readBigInt64LE(88);
        const statusValue = data.readUInt8(96);
        
        // Map status value to ClaimStatus enum
        let status: ClaimStatus;
        switch (statusValue) {
          case 0: status = ClaimStatus.PENDING; break;
          case 1: status = ClaimStatus.APPROVED; break;
          case 2: status = ClaimStatus.REJECTED; break;
          case 3: status = ClaimStatus.PAID; break;
          default: status = ClaimStatus.PENDING;
        }
        
        // Read risk score
        const riskScore = data.readFloatLE(97);
        
        // Read string fields with their length prefixes
        let offset = 101;
        
        // Read evidence_type
        const evidenceTypeLen = data.readUInt32LE(offset);
        offset += 4;
        const evidenceType = data.slice(offset, offset + evidenceTypeLen).toString();
        offset += evidenceTypeLen;
        
        // Read evidence_description
        const evidenceDescriptionLen = data.readUInt32LE(offset);
        offset += 4;
        const evidenceDescription = data.slice(offset, offset + evidenceDescriptionLen).toString();
        offset += evidenceDescriptionLen;
        
        // Read evidence_attachments as array of strings
        const attachmentsCount = data.readUInt8(offset);
        offset += 1;
        
        const evidenceAttachments: string[] = [];
        for (let i = 0; i < attachmentsCount; i++) {
          const attachmentLen = data.readUInt32LE(offset);
          offset += 4;
          const attachment = data.slice(offset, offset + attachmentLen).toString();
          offset += attachmentLen;
          evidenceAttachments.push(attachment);
        }
        
        // Read risk_factors as array of strings
        const riskFactorsCount = data.readUInt8(offset);
        offset += 1;
        
        const riskFactors: string[] = [];
        for (let i = 0; i < riskFactorsCount; i++) {
          const factorLen = data.readUInt32LE(offset);
          offset += 4;
          const factor = data.slice(offset, offset + factorLen).toString();
          offset += factorLen;
          riskFactors.push(factor);
        }
        
        return {
          id: account.pubkey.toString(),
          policyId: policyPDA.toString(),
          owner: owner.toString(),
          amount,
          createdAt: new Date(Number(submissionTime) * 1000).toISOString(),
          processedAt: processingTime > 0n ? new Date(Number(processingTime) * 1000).toISOString() : null,
          status,
          evidenceType,
          evidenceDescription,
          evidenceAttachments,
          riskScore,
          riskFactors
        };
      });
      
      return claims;
    } catch (error) {
      console.error("Error fetching claims:", error);
      throw new Error(`Failed to fetch claims: ${error.message}`);
    }
  }

  /**
   * Get risk pool metrics
   */
  async getRiskPoolMetrics(): Promise<RiskPoolMetrics> {
    try {
      console.log("Fetching risk pool metrics");
      
      // Get the risk pool metrics account for the risk pool program
      const [metricsAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("metrics")],
        RISK_POOL_PROGRAM_ID
      );
      
      const accountInfo = await this.connection.getAccountInfo(metricsAccount);
      
      if (!accountInfo) {
        throw new Error("Risk pool metrics account not found");
      }
      
      const data = accountInfo.data;
      
      // Parse the binary data based on the Anchor account structure
      const totalPolicies = Number(data.readBigUInt64LE(8));
      const activePolicies = Number(data.readBigUInt64LE(16));
      const totalCoverage = Number(data.readBigUInt64LE(24));
      const poolBalance = Number(data.readBigUInt64LE(32));
      const totalPremiums = Number(data.readBigUInt64LE(40));
      const totalClaims = Number(data.readBigUInt64LE(48));
      const claimCount = Number(data.readBigUInt64LE(56));
      const claimApprovalRate = data.readFloatLE(64);
      const solvencyRatio = data.readFloatLE(68);
      const averagePremium = Number(data.readBigUInt64LE(72));
      const averageCoverage = Number(data.readBigUInt64LE(80));
      
      return {
        totalPolicies,
        activePolicies,
        totalCoverage,
        poolBalance,
        totalPremiums,
        totalClaims,
        claimCount,
        claimApprovalRate,
        solvencyRatio,
        averagePremium,
        averageCoverage,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error fetching risk pool metrics:", error);
      throw new Error(`Failed to fetch risk pool metrics: ${error.message}`);
    }
  }

  /**
   * Create a policy
   */
  async createPolicy(
    coverageAmount: number,
    premiumAmount: number,
    coveragePeriod: number,
    jobType: string,
    industry: string
  ): Promise<string> {
    // This would be implemented in a real application
    // For now, we'll just log the parameters and return a mock transaction ID
    console.log("Creating policy with parameters:", {
      coverageAmount,
      premiumAmount,
      coveragePeriod,
      jobType,
      industry
    });
    
    return "mock_transaction_id";
  }

  /**
   * Submit a claim
   */
  async submitClaim(
    policyPDA: PublicKey,
    amount: number,
    evidenceType: string,
    evidenceDescription: string,
    evidenceAttachments: string[] = []
  ): Promise<string> {
    // This would be implemented in a real application
    // For now, we'll just log the parameters and return a mock transaction ID
    console.log("Submitting claim with parameters:", {
      policyPDA: policyPDA.toString(),
      amount,
      evidenceType,
      evidenceDescription,
      evidenceAttachments
    });
    
    return "mock_transaction_id";
  }
}
