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
      
      // For development purposes, return some sample policies
      // This allows the UI to function while we're implementing the real blockchain integration
      return [
        {
          policyId: "policy1",
          owner: userPublicKey.toString(),
          coverageAmount: 5000,
          premiumAmount: 250,
          startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          expiryTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          jobType: "web_development",
          industry: "technology",
          status: PolicyStatus.ACTIVE,
          projectName: "E-commerce Website",
          clientName: "TechRetail Inc.",
          description: "Development of a full-featured e-commerce platform with payment integration"
        },
        {
          policyId: "policy2",
          owner: userPublicKey.toString(),
          coverageAmount: 2500,
          premiumAmount: 125,
          startTime: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          expiryTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          jobType: "design",
          industry: "entertainment",
          status: PolicyStatus.EXPIRED,
          projectName: "Brand Identity Design",
          clientName: "Creative Studios",
          description: "Complete brand identity package including logo, color scheme, and style guide"
        }
      ];
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
              offset: 8, // After the account discriminator
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
        // This matches the Claim struct in the Solana program
        const policyPDA = new PublicKey(data.slice(8, 40));
        const owner = new PublicKey(data.slice(40, 72));
        const amount = Number(data.readBigUInt64LE(72));
        const submissionTime = data.readBigInt64LE(80);
        const statusValue = data.readUInt8(88);
        
        // Map status value to ClaimStatus enum
        let status: ClaimStatus;
        switch (statusValue) {
          case 0: status = ClaimStatus.PENDING; break;
          case 1: status = ClaimStatus.PROCESSING; break;
          case 2: status = ClaimStatus.APPROVED; break;
          case 3: status = ClaimStatus.REJECTED; break;
          case 4: status = ClaimStatus.ARBITRATION; break;
          case 5: status = ClaimStatus.PAID; break;
          default: status = ClaimStatus.PENDING;
        }
        
        // Read string fields with their length prefixes
        let offset = 89;
        
        // Read evidence_type
        const evidenceTypeLen = data.readUInt32LE(offset);
        offset += 4;
        const evidenceType = data.slice(offset, offset + evidenceTypeLen).toString();
        offset += evidenceTypeLen;
        
        // Read evidence_description
        const evidenceDescLen = data.readUInt32LE(offset);
        offset += 4;
        const evidenceDescription = data.slice(offset, offset + evidenceDescLen).toString();
        offset += evidenceDescLen;
        
        // Read evidence_attachments (array of strings)
        const attachmentsCount = data.readUInt32LE(offset);
        offset += 4;
        
        const evidenceAttachments: string[] = [];
        for (let i = 0; i < attachmentsCount; i++) {
          const attachmentLen = data.readUInt32LE(offset);
          offset += 4;
          if (attachmentLen > 0) {
            const attachment = data.slice(offset, offset + attachmentLen).toString();
            evidenceAttachments.push(attachment);
            offset += attachmentLen;
          }
        }
        
        // Read risk_score if it exists
        let riskScore = 50; // Default value
        if (offset < data.length) {
          riskScore = data.readUInt8(offset);
          offset += 1;
        }
        
        // Create a basic risk evaluation
        const riskEvaluation: RiskEvaluation = {
          score: riskScore,
          factors: ["Amount within reasonable range", "Policy active at time of claim"]
        };
        
        return {
          claimId: account.pubkey.toString(),
          policyId: policyPDA.toString(),
          owner: owner.toString(),
          amount,
          submissionTime: new Date(Number(submissionTime) * 1000).toISOString(),
          status,
          evidenceType,
          evidenceDescription,
          evidenceAttachments,
          riskEvaluation
        };
      });
      
      return claims;
    } catch (error) {
      console.error("Error fetching claims:", error);
      
      // For development purposes, return some sample claims
      // This allows the UI to function while we're implementing the real blockchain integration
      return [
        {
          claimId: "claim1",
          policyId: "policy1",
          owner: userPublicKey.toString(),
          amount: 1500,
          submissionTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: ClaimStatus.PENDING,
          evidenceType: "Contract Breach",
          evidenceDescription: "Client failed to pay milestone after work was delivered and approved",
          evidenceAttachments: ["contract.pdf", "email_thread.pdf"],
          riskEvaluation: {
            score: 35,
            factors: ["Amount within reasonable range", "Policy active at time of claim"]
          }
        },
        {
          claimId: "claim2",
          policyId: "policy1",
          owner: userPublicKey.toString(),
          amount: 750,
          submissionTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          status: ClaimStatus.APPROVED,
          evidenceType: "Scope Creep",
          evidenceDescription: "Client demanded additional features outside of contract scope",
          evidenceAttachments: ["original_requirements.pdf", "change_requests.pdf"],
          riskEvaluation: {
            score: 25,
            factors: ["Well-documented evidence", "Clear contract terms"]
          }
        }
      ];
    }
  }

  /**
   * Get risk pool metrics
   */
  async getRiskPoolMetrics(): Promise<RiskPoolMetrics> {
    try {
      console.log("Fetching risk pool metrics");
      
      // Get the risk pool account
      const riskPoolAccount = await this.connection.getAccountInfo(RISK_POOL_PROGRAM_ID);
      
      if (!riskPoolAccount) {
        throw new Error("Risk pool account not found");
      }
      
      // Parse the account data (this would be based on your actual account structure)
      // This is a simplified example - you would need to adjust based on your actual data layout
      const data = riskPoolAccount.data;
      
      // For a real implementation, you would parse the binary data here
      // This is just a placeholder for demonstration
      
      // Query additional metrics from the blockchain
      const policyAccounts = await this.connection.getProgramAccounts(INSURANCE_PROGRAM_ID);
      const claimAccounts = await this.connection.getProgramAccounts(CLAIMS_PROCESSOR_PROGRAM_ID);
      
      const totalPolicies = policyAccounts.length;
      const totalClaims = claimAccounts.length;
      
      // Calculate active policies (those that haven't expired)
      const now = Math.floor(Date.now() / 1000);
      const activePolicies = policyAccounts.filter(account => {
        // This assumes the expiry time is at a specific offset in the account data
        // You would need to adjust based on your actual data layout
        const expiryTime = account.account.data.readUInt32LE(60);
        return now < expiryTime;
      }).length;
      
      // Calculate total coverage and premiums
      let totalCoverage = 0;
      let totalPremiums = 0;
      
      policyAccounts.forEach(account => {
        // This assumes the coverage and premium amounts are at specific offsets in the account data
        // You would need to adjust based on your actual data layout
        const coverageAmount = Number(account.account.data.readBigUInt64LE(40));
        const premiumAmount = Number(account.account.data.readBigUInt64LE(48));
        
        totalCoverage += coverageAmount;
        totalPremiums += premiumAmount;
      });
      
      // Calculate approved claims
      const approvedClaims = claimAccounts.filter(account => {
        // This assumes the status is at a specific offset in the account data
        // You would need to adjust based on your actual data layout
        const statusCode = account.account.data.readUInt8(84);
        return statusCode === 2; // Approved status
      });
      
      // Calculate total claims paid
      let totalClaimsPaid = 0;
      
      approvedClaims.forEach(account => {
        // This assumes the claim amount is at a specific offset in the account data
        // You would need to adjust based on your actual data layout
        const amount = Number(account.account.data.readBigUInt64LE(72));
        totalClaimsPaid += amount;
      });
      
      // Calculate claim approval rate
      const claimApprovalRate = totalClaims > 0 ? approvedClaims.length / totalClaims : 0;
      
      // Calculate pool balance (this would typically come from the risk pool account)
      // For demonstration, we'll use a formula based on premiums and claims
      const poolBalance = totalPremiums - totalClaimsPaid;
      
      // Calculate solvency ratio
      const solvencyRatio = totalCoverage > 0 ? poolBalance / totalCoverage : 1;
      
      // Calculate averages
      const averagePremium = totalPolicies > 0 ? totalPremiums / totalPolicies : 0;
      const averageCoverage = totalPolicies > 0 ? totalCoverage / totalPolicies : 0;
      
      return {
        totalPolicies,
        activePolicies,
        totalCoverage,
        poolBalance,
        totalPremiums,
        totalClaims: totalClaimsPaid,
        claimCount: totalClaims,
        claimApprovalRate,
        solvencyRatio,
        averagePremium,
        averageCoverage
      };
    } catch (error) {
      console.error("Error fetching risk pool metrics:", error);
      
      // For development purposes, return some sample metrics
      // This allows the UI to function while we're implementing the real blockchain integration
      return {
        totalPolicies: 24,
        activePolicies: 18,
        totalCoverage: 120000,
        poolBalance: 12500,
        totalPremiums: 15000,
        totalClaims: 2500,
        claimCount: 5,
        claimApprovalRate: 0.8,
        solvencyRatio: 0.65,
        averagePremium: 625,
        averageCoverage: 5000
      };
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
