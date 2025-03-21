import { PublicKey, Connection, Transaction, TransactionInstruction } from '@solana/web3.js';
import { RiskPoolManager } from './riskPool';
import { evaluateClaimRisk } from './calculations';
import { NETWORK_CONFIG } from '@/lib/solana/constants';

interface ClaimEvidence {
  type: 'PAYMENT_BREACH' | 'CONTRACT_VIOLATION' | 'EQUIPMENT_DAMAGE';
  description: string;
  attachments: string[]; // IPFS hashes of supporting documents
  timestamp: number;
}

interface ArbitrationVote {
  arbitrator: PublicKey;
  approved: boolean;
  comments: string;
  timestamp: number;
}

interface ClaimVerdict {
  approved: boolean;
  payoutAmount: number;
  reason: string;
  arbitrationRequired: boolean;
  votes: ArbitrationVote[];
}

export class ClaimsProcessor {
  private connection: Connection;
  private programId: PublicKey;
  private riskPoolManager: RiskPoolManager;

  constructor(
    connection: Connection,
    programId: PublicKey,
    riskPoolManager: RiskPoolManager
  ) {
    this.connection = connection;
    this.programId = programId;
    this.riskPoolManager = riskPoolManager;
  }

  async processNewClaim(
    policyId: PublicKey,
    claimId: PublicKey,
    amount: number,
    evidence: ClaimEvidence
  ): Promise<ClaimVerdict> {
    // Step 1: Validate claim amount against policy coverage
    const policyInfo = await this.getPolicyInfo(policyId);
    if (amount > policyInfo.coverageAmount) {
      throw new Error('Claim amount exceeds policy coverage');
    }

    // Step 2: Evaluate claim risk and determine if arbitration is needed
    const riskEvaluation = evaluateClaimRisk(
      amount,
      this.calculatePolicyAge(policyInfo.startDate),
      policyInfo.claims.length,
      policyInfo.coverageAmount
    );

    // Step 3: Check if claim can be processed automatically
    if (this.canAutoProcess(evidence, riskEvaluation.riskScore)) {
      // For payment breach with smart contract evidence
      if (evidence.type === 'PAYMENT_BREACH' && await this.verifyPaymentBreach(evidence)) {
        return this.createAutomaticVerdict(amount, 'Payment breach verified via smart contract');
      }
    }

    // Step 4: Check risk pool liquidity
    const hasLiquidity = await this.riskPoolManager.canProcessClaim(amount);
    if (!hasLiquidity) {
      throw new Error('Insufficient liquidity in risk pool');
    }

    // Step 5: Determine if arbitration is needed
    const needsArbitration = riskEvaluation.riskScore > NETWORK_CONFIG.arbitrationThreshold || 
                            amount > NETWORK_CONFIG.autoClaimLimit;
    if (needsArbitration) {
      return this.initiateArbitration(claimId, amount, evidence);
    }

    // Step 6: Process automatic approval for low-risk claims
    return this.createAutomaticVerdict(amount, 'Low-risk claim automatically approved');
  }

  private async getPolicyInfo(policyId: PublicKey): Promise<any> {
    const accountInfo = await this.connection.getAccountInfo(policyId);
    if (!accountInfo) throw new Error('Policy not found');
    
    // Decode policy data
    const dataView = new DataView(accountInfo.data.buffer);
    const coverageAmount = dataView.getFloat64(8, true);
    const startDate = dataView.getUint32(24, true);
    
    // Find all claims associated with this policy
    const claims = await this.connection.getProgramAccounts(this.programId, {
      filters: [
        { dataSize: 256 }, // Expected size of claim accounts
        {
          memcmp: {
            offset: 8, // Offset where policy ID starts
            bytes: policyId.toBase58()
          }
        }
      ]
    });
    
    return {
      coverageAmount,
      startDate,
      claims
    };
  }

  private calculatePolicyAge(startDate: number): number {
    return (Date.now() - startDate) / (1000 * 60 * 60 * 24); // Convert to days
  }

  private canAutoProcess(evidence: ClaimEvidence, riskScore: number): boolean {
    return (
      evidence.type === 'PAYMENT_BREACH' &&
      riskScore < NETWORK_CONFIG.autoProcessThreshold &&
      evidence.attachments.length > 0
    );
  }

  private async verifyPaymentBreach(evidence: ClaimEvidence): Promise<boolean> {
    // Verify payment breach through smart contract events or escrow status
    // This is a placeholder - implement actual verification logic
    return true;
  }

  private createAutomaticVerdict(amount: number, reason: string): ClaimVerdict {
    return {
      approved: true,
      payoutAmount: amount,
      reason,
      arbitrationRequired: false,
      votes: []
    };
  }

  private async initiateArbitration(
    claimId: PublicKey,
    amount: number,
    evidence: ClaimEvidence
  ): Promise<ClaimVerdict> {
    // Select arbitrators based on reputation and expertise
    const arbitrators = await this.selectArbitrators(evidence.type);

    // Create arbitration instruction
    const arbitrationInstruction = new TransactionInstruction({
      keys: [
        ...arbitrators.map(arbitrator => ({
          pubkey: arbitrator,
          isSigner: false,
          isWritable: false
        })),
        {
          pubkey: claimId,
          isSigner: false,
          isWritable: true
        }
      ],
      programId: this.programId,
      data: Buffer.from([
        3, // instruction index for initiate_arbitration
        ...new Uint8Array(new Float64Array([amount]).buffer)
      ])
    });

    // Return pending verdict
    return {
      approved: false,
      payoutAmount: 0,
      reason: 'Claim requires arbitration',
      arbitrationRequired: true,
      votes: []
    };
  }

  private async selectArbitrators(claimType: ClaimEvidence['type']): Promise<PublicKey[]> {
    // In testnet, use predefined test arbitrators
    return NETWORK_CONFIG.testArbitrators.map(addr => new PublicKey(addr));
  }

  async submitArbitrationVote(
    arbitrator: PublicKey,
    claimId: PublicKey,
    vote: boolean,
    comments: string
  ): Promise<TransactionInstruction> {
    return new TransactionInstruction({
      keys: [
        {
          pubkey: arbitrator,
          isSigner: true,
          isWritable: false
        },
        {
          pubkey: claimId,
          isSigner: false,
          isWritable: true
        }
      ],
      programId: this.programId,
      data: Buffer.from([
        4, // instruction index for submit_arbitration_vote
        vote ? 1 : 0,
        ...Buffer.from(comments.slice(0, 100)) // Limit comments to 100 chars
      ])
    });
  }

  async finalizeArbitration(claimId: PublicKey): Promise<ClaimVerdict> {
    // Get claim account data
    const claimInfo = await this.connection.getAccountInfo(claimId);
    if (!claimInfo) throw new Error('Claim not found');
    
    // Decode claim data
    const dataView = new DataView(claimInfo.data.buffer);
    const status = dataView.getUint8(0);
    const amount = dataView.getFloat64(8, true);
    const votesCount = dataView.getUint8(16);
    
    // Parse votes
    const votes: ArbitrationVote[] = [];
    let offset = 17;
    for (let i = 0; i < votesCount; i++) {
      const arbitratorBytes = claimInfo.data.slice(offset, offset + 32);
      offset += 32;
      const approved = dataView.getUint8(offset) === 1;
      offset += 1;
      const commentLength = dataView.getUint8(offset);
      offset += 1;
      const commentBytes = claimInfo.data.slice(offset, offset + commentLength);
      offset += commentLength;
      const timestamp = dataView.getUint32(offset, true);
      offset += 4;
      
      votes.push({
        arbitrator: new PublicKey(arbitratorBytes),
        approved,
        comments: new TextDecoder().decode(commentBytes),
        timestamp
      });
    }
    
    // Determine verdict based on votes
    const approvedVotes = votes.filter(v => v.approved).length;
    const rejectedVotes = votes.length - approvedVotes;
    const approved = approvedVotes > rejectedVotes;
    
    return {
      approved,
      payoutAmount: approved ? amount : 0,
      reason: approved ? 'Claim approved by arbitration' : 'Claim rejected by arbitration',
      arbitrationRequired: votes.length < 3, // Need at least 3 votes to finalize
      votes
    };
  }

  // New method to get claim instruction for transaction
  async getClaimInstruction(
    policyId: PublicKey,
    claimId: PublicKey,
    amount: number,
    evidence: ClaimEvidence
  ): Promise<TransactionInstruction> {
    // Create instruction to submit claim
    return new TransactionInstruction({
      keys: [
        { pubkey: policyId, isSigner: false, isWritable: true },
        { pubkey: claimId, isSigner: false, isWritable: true }
      ],
      programId: this.programId,
      data: Buffer.from([
        2, // instruction index for submit_claim
        ...new Uint8Array(new Float64Array([amount]).buffer),
        ...Buffer.from(evidence.type.slice(0, 20)),
        ...Buffer.from(evidence.description.slice(0, 100)),
        ...new Uint8Array(new Uint32Array([evidence.timestamp]).buffer)
      ])
    });
  }

  // New method to get claim status
  async getClaimStatus(claimId: PublicKey): Promise<ClaimVerdict | null> {
    try {
      const claimInfo = await this.connection.getAccountInfo(claimId);
      if (!claimInfo) return null;
      
      // Decode claim data
      const dataView = new DataView(claimInfo.data.buffer);
      const statusCode = dataView.getUint8(0);
      const amount = dataView.getFloat64(8, true);
      
      // Map status code to verdict
      switch (statusCode) {
        case 0: // Pending
          return {
            approved: false,
            payoutAmount: 0,
            reason: 'Claim is pending review',
            arbitrationRequired: false,
            votes: []
          };
        case 1: // Approved
          return {
            approved: true,
            payoutAmount: amount,
            reason: 'Claim approved',
            arbitrationRequired: false,
            votes: []
          };
        case 2: // Rejected
          return {
            approved: false,
            payoutAmount: 0,
            reason: 'Claim rejected',
            arbitrationRequired: false,
            votes: []
          };
        case 3: // In Arbitration
          return await this.finalizeArbitration(claimId);
        default:
          return null;
      }
    } catch (error) {
      console.error('Error getting claim status:', error);
      return null;
    }
  }
}
