import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { NETWORK_CONFIG } from './constants';

/**
 * Request SOL from the Solana devnet faucet
 * @param connection Solana connection
 * @param wallet Public key of the wallet to receive SOL
 * @param amount Amount of SOL to request (max 2 SOL per request)
 * @returns Promise that resolves when the airdrop is confirmed
 */
export async function requestDevnetSol(
  connection: Connection,
  wallet: PublicKey,
  amount: number = 1
): Promise<string> {
  try {
    // Cap the amount to 2 SOL per request (devnet limit)
    const cappedAmount = Math.min(amount, 2);
    const lamports = cappedAmount * LAMPORTS_PER_SOL;
    
    console.log(`Requesting ${cappedAmount} SOL from devnet faucet for ${wallet.toString()}`);
    
    // Request airdrop
    const signature = await connection.requestAirdrop(wallet, lamports);
    
    // Wait for confirmation
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      ...latestBlockhash
    });
    
    console.log(`Airdrop confirmed: ${signature}`);
    return signature;
  } catch (error) {
    console.error('Error requesting devnet SOL:', error);
    throw new Error(`Failed to request devnet SOL: ${error.message}`);
  }
}

/**
 * Check if a wallet needs SOL and request it if balance is low
 * @param connection Solana connection
 * @param wallet Public key of the wallet to check
 * @param minimumBalance Minimum balance in SOL to maintain
 * @returns Promise that resolves to true if an airdrop was requested
 */
export async function ensureDevnetSolBalance(
  connection: Connection,
  wallet: PublicKey,
  minimumBalance: number = 1
): Promise<boolean> {
  try {
    // Get current balance
    const balance = await connection.getBalance(wallet);
    const solBalance = balance / NETWORK_CONFIG.lamportsPerSol;
    
    console.log(`Current balance for ${wallet.toString()}: ${solBalance} SOL`);
    
    // If balance is below minimum, request an airdrop
    if (solBalance < minimumBalance) {
      const amountToRequest = 2; // Request 2 SOL (devnet max)
      await requestDevnetSol(connection, wallet, amountToRequest);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking wallet balance:', error);
    return false;
  }
}
