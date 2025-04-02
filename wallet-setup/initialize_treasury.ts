/**
 * FreelanceShield Protocol Treasury Initialization Script
 * 
 * This script initializes the protocol treasury with the wallet address
 * linked to freelanceshield.xyz for use in your Solana programs.
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';

// Import local keypair or use environment variables in production
const loadWalletKeypair = (): Keypair => {
  try {
    // For testing, you can load a keypair from file
    // Never use this in production - use environment variables instead
    const keypairFile = process.env.WALLET_KEYPAIR_PATH || './keypair.json';
    const secretKey = new Uint8Array(JSON.parse(fs.readFileSync(keypairFile, 'utf-8')));
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    console.error('Failed to load keypair:', error);
    throw new Error('Please create a keypair file or set the environment variable');
  }
};

// Initialize the treasury account
const initializeTreasury = async () => {
  // Connect to Solana cluster
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'confirmed'
  );
  
  // Set up wallet and provider
  const wallet = new Wallet(loadWalletKeypair());
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });
  
  // Treasury address - matches our constants file
  const treasuryAddress = new PublicKey('5dDo2hJ2PKH1XhRzzCgZhX5SDKBypr3crrx3TfwjPosE');
  
  // Domain name
  const domainName = 'freelanceshield.xyz';
  
  console.log(`Initializing FreelanceShield treasury for domain: ${domainName}`);
  console.log(`Treasury Address: ${treasuryAddress.toString()}`);
  
  try {
    // Find PDA for the domain treasury
    const [domainTreasuryPDA, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from('domain-treasury'), Buffer.from(domainName)],
      // Replace with your actual program ID
      new PublicKey('YOUR_PROGRAM_ID_HERE')
    );
    
    console.log(`Domain Treasury PDA: ${domainTreasuryPDA.toString()}`);
    
    // Load your program - you'll need to replace with your actual IDL and program ID
    // const idl = JSON.parse(fs.readFileSync('./target/idl/your_program.json', 'utf-8'));
    // const programId = new PublicKey('YOUR_PROGRAM_ID_HERE');
    // const program = new Program(idl, programId, provider);
    
    // Call your program to initialize the treasury
    // For demonstration, we're just showing what would be called
    console.log(`Ready to initialize treasury with the following parameters:`);
    console.log(`- Domain: ${domainName}`);
    console.log(`- SOL Treasury: ${treasuryAddress.toString()}`);
    console.log(`- USDC Treasury: ${treasuryAddress.toString()}`);
    console.log(`- Bump: ${bump}`);
    
    // Example code (commented out until you have your actual program)
    /*
    const tx = await program.methods
      .initializeDomainTreasury(
        domainName,
        treasuryAddress,
        treasuryAddress, // Same address for both SOL and USDC in Solana
        bump
      )
      .accounts({
        authority: wallet.publicKey,
        domainTreasury: domainTreasuryPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    
    console.log(`Treasury initialized! Transaction: ${tx}`);
    */
    
    console.log('Replace YOUR_PROGRAM_ID_HERE with your actual program ID to complete this script');
    
  } catch (error) {
    console.error('Failed to initialize treasury:', error);
  }
};

// Run the initialization
initializeTreasury().catch(console.error);
