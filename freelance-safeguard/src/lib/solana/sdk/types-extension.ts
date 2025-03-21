import { PublicKey } from '@solana/web3.js';
import { JobType, Industry } from '@/types/insurance';

// Extended types for the SDK to match the application's expected structure
export interface PolicyAccountExtended {
  owner: PublicKey;
  coverageAmount: number;
  premium: number;
  startDate: number; // Unix timestamp
  endDate: number; // Unix timestamp
  status: string;
  jobType: string;
  industry: string;
  claimsCount: number;
  projectName?: string;
  clientName?: string;
  description?: string;
  publicKey?: PublicKey;
}

export interface ClaimAccountExtended {
  policy: PublicKey;
  owner: PublicKey;
  amount: number;
  status: string;
  evidenceType: string;
  evidenceDescription: string;
  evidenceAttachments: string[];
  submissionDate: number; // Unix timestamp
  verdict?: {
    approved: boolean;
    reason: string;
    processedAt: number; // Unix timestamp
  };
  publicKey?: PublicKey;
}

export interface PaymentVerificationExtended {
  freelancer: PublicKey;
  client: PublicKey;
  expectedAmount: number;
  deadline: number; // Unix timestamp
  status: string;
  createdAt: number; // Unix timestamp
  paidAt: number | null; // Unix timestamp or null
  publicKey?: PublicKey;
}

// Helper function to safely convert BN or number to number
export function safeToNumber(value: any): number {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value.toNumber === 'function') {
    try {
      return value.toNumber();
    } catch (e) {
      return 0;
    }
  }
  return 0;
}

// Helper function to safely convert BN or number to Date
export function safeToDate(value: any): Date {
  const timestamp = safeToNumber(value);
  if (timestamp === 0) return new Date();
  
  // Check if the timestamp is in seconds (Unix) or milliseconds
  if (timestamp < 10000000000) { // If in seconds (Unix timestamp)
    return new Date(timestamp * 1000);
  }
  return new Date(timestamp);
}
