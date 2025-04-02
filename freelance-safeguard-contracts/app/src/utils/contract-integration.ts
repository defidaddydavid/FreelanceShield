import { AnchorProvider, BN, Program, web3 } from '@project-serum/anchor';
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

/**
 * FreelanceShield contract integration utilities
 * Connects frontend components to on-chain smart contracts using Phantom Wallet
 * Following development guidelines for Solana-based contracts with Anchor
 */

// Program IDs - replace with actual deployed program IDs on Devnet
export const PROGRAM_IDS = {
  CORE: 'CoreProgID111111111111111111111111111111111111',
  RISK_POOL: 'FroU966kfvu5RAQxhLfb4mhFdDjY6JewEf41ZfYR3xhm',
  CLAIMS_PROCESSOR: 'CL1MSPrcsr111111111111111111111111111111111',
  REPUTATION: '9KbeVQ7mhcYSDUnQ9jcVpEeQx7uu1xJfqvKrQsfpaqEq',
  POLICY_NFT: 'PolicyNFT11111111111111111111111111111111111',
};

// Program Seeds for PDA derivation
export const PDA_SEEDS = {
  DOMAIN_TREASURY: 'domain-treasury',
  RISK_POOL_STATE: 'risk-pool-state',
  USER_PROFILE: 'user-profile',
  BAYESIAN_PARAMS: 'bayesian_params',
  REPUTATION_STATE: 'reputation-state',
  CLAIMS_STATE: 'claims-state',
  BAYESIAN_MODEL: 'bayesian_model',
};

/**
 * Find PDA account for FreelanceShield contracts
 */
export async function findProgramAccount(programId: string, seeds: Array<Buffer | Uint8Array>): Promise<[PublicKey, number]> {
  return await PublicKey.findProgramAddress(
    seeds,
    new PublicKey(programId)
  );
}

/**
 * Create AnchorProvider from wallet
 */
export function getAnchorProvider(connection: Connection, wallet: WalletContextState): AnchorProvider {
  // Create an Anchor provider from wallet and connection
  const provider = new AnchorProvider(
    connection,
    wallet as any, // Convert WalletContextState to Wallet interface for Anchor
    AnchorProvider.defaultOptions()
  );
  return provider;
}

/**
 * Initialize program from IDL
 */
export function getProgram(connection: Connection, wallet: WalletContextState, programId: string, idl: any): Program {
  const provider = getAnchorProvider(connection, wallet);
  return new Program(idl, new PublicKey(programId), provider);
}

/**
 * Integration with Bayesian reputation system
 */
export async function getReputationScore(connection: Connection, wallet: WalletContextState, idl: any): Promise<number> {
  try {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    // Initialize program
    const program = getProgram(connection, wallet, PROGRAM_IDS.REPUTATION, idl);

    // Find user reputation profile PDA
    const [userProfileAddress] = await findProgramAccount(
      PROGRAM_IDS.REPUTATION,
      [Buffer.from(PDA_SEEDS.USER_PROFILE), wallet.publicKey.toBuffer()]
    );

    // Check if profile exists
    const profileAccount = await connection.getAccountInfo(userProfileAddress);
    if (!profileAccount) {
      // No profile exists yet
      return 50; // Default score
    }

    // Fetch reputation data
    const userProfile = await program.account.userProfile.fetch(userProfileAddress);
    return userProfile.reputationScore;
  } catch (error) {
    console.error("Error fetching reputation score:", error);
    // Return default score if error
    return 50;
  }
}

/**
 * Calculate policy premium with reputation discount
 */
export async function calculatePremium(
  connection: Connection, 
  wallet: WalletContextState, 
  riskPoolIdl: any,
  contractValue: number,
  riskCategory: number,
  contractDurationDays: number
): Promise<number> {
  try {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    // Find risk pool state PDA
    const [riskPoolState] = await findProgramAccount(
      PROGRAM_IDS.RISK_POOL,
      [Buffer.from(PDA_SEEDS.RISK_POOL_STATE)]
    );

    // Initialize program
    const program = getProgram(connection, wallet, PROGRAM_IDS.RISK_POOL, riskPoolIdl);

    // Call the calculate premium instruction
    const premium = await program.methods
      .calculatePremium(
        new BN(contractValue),
        riskCategory,
        contractDurationDays
      )
      .accounts({
        authority: wallet.publicKey,
        riskPoolState: riskPoolState,
      })
      .view();
    
    return premium.toNumber();
  } catch (error) {
    console.error("Error calculating premium:", error);
    // Fall back to simplified calculation if contract call fails
    const basePremium = contractValue * (riskCategory === 1 ? 0.02 : riskCategory === 2 ? 0.035 : 0.05);
    return basePremium;
  }
}

/**
 * Create user reputation profile if it doesn't exist
 */
export async function createReputationProfile(
  connection: Connection,
  wallet: WalletContextState,
  reputationIdl: any
): Promise<boolean> {
  try {
    if (!wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    // Find PDAs
    const [userProfileAddress] = await findProgramAccount(
      PROGRAM_IDS.REPUTATION,
      [Buffer.from(PDA_SEEDS.USER_PROFILE), wallet.publicKey.toBuffer()]
    );

    const [reputationState] = await findProgramAccount(
      PROGRAM_IDS.REPUTATION,
      [Buffer.from(PDA_SEEDS.REPUTATION_STATE)]
    );

    // Check if profile already exists
    const profileAccount = await connection.getAccountInfo(userProfileAddress);
    if (profileAccount) {
      return false; // Already exists
    }

    // Initialize program
    const program = getProgram(connection, wallet, PROGRAM_IDS.REPUTATION, reputationIdl);

    // Create profile
    const tx = await program.methods
      .createProfile()
      .accounts({
        user: wallet.publicKey,
        userProfile: userProfileAddress,
        reputationState: reputationState,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(`Profile created: ${tx}`);
    return true;
  } catch (error) {
    console.error("Error creating reputation profile:", error);
    return false;
  }
}
