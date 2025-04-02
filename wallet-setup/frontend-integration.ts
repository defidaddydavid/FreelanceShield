/**
 * FreelanceShield.xyz Domain Integration for Frontend
 * This module provides React hooks and utilities to integrate with Unstoppable Domains
 */

import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

// Import our domain resolver
import { 
  resolveDomainToSolanaAddress, 
  getProtocolTreasuryAddress, 
  getProtocolUsdcAddress 
} from './domain_resolver';

// Custom hook to resolve freelanceshield.xyz domain
export function useProtocolAddresses() {
  const { connection } = useConnection();
  const [treasuryAddress, setTreasuryAddress] = useState<string | null>(null);
  const [usdcAddress, setUsdcAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function resolveAddresses() {
      try {
        const [treasuryAddr, usdcAddr] = await Promise.all([
          getProtocolTreasuryAddress(connection),
          getProtocolUsdcAddress(connection)
        ]);
        
        setTreasuryAddress(treasuryAddr);
        setUsdcAddress(usdcAddr);
        setLoading(false);
      } catch (err) {
        console.error('Error resolving domain addresses:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    }

    resolveAddresses();
  }, [connection]);

  return { treasuryAddress, usdcAddress, loading, error };
}

// Hook to facilitate payments to the protocol
export function useProtocolPayment() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { treasuryAddress, usdcAddress, loading, error } = useProtocolAddresses();

  // Function to pay SOL to the protocol
  const payWithSol = async (amount: number) => {
    if (!publicKey || !treasuryAddress || loading || error) {
      throw new Error('Cannot make payment: wallet not connected or treasury not resolved');
    }

    const lamports = amount * 1_000_000_000; // Convert SOL to lamports
    const treasuryPublicKey = new PublicKey(treasuryAddress);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: treasuryPublicKey,
        lamports,
      })
    );

    try {
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      return signature;
    } catch (err) {
      console.error('Error sending SOL payment:', err);
      throw err;
    }
  };

  // Function to pay USDC to the protocol
  const payWithUsdc = async (amount: number, usdcMint: PublicKey) => {
    if (!publicKey || !usdcAddress || loading || error) {
      throw new Error('Cannot make payment: wallet not connected or treasury not resolved');
    }

    const treasuryPublicKey = new PublicKey(usdcAddress);
    
    try {
      // Get the associated token accounts
      const fromTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        publicKey
      );
      
      const toTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        treasuryPublicKey
      );

      // Convert amount to token units (USDC has 6 decimals)
      const tokenAmount = amount * 1_000_000;
      
      // Create the transfer instruction
      const instruction = createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        publicKey,
        tokenAmount
      );

      // Create and send transaction
      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      return signature;
    } catch (err) {
      console.error('Error sending USDC payment:', err);
      throw err;
    }
  };

  return {
    payWithSol,
    payWithUsdc,
    isReady: !loading && !error && !!treasuryAddress && !!usdcAddress,
    loading,
    error
  };
}

// Component for displaying the FreelanceShield.xyz treasury address
export function TreasuryDisplay() {
  const { treasuryAddress, loading, error } = useProtocolAddresses();

  if (loading) return <div>Loading treasury address...</div>;
  if (error) return <div>Error loading treasury address: {error.message}</div>;

  return (
    <div className="treasury-display">
      <h3>FreelanceShield Protocol Treasury</h3>
      <div className="address-display">
        <span>Send payments to: </span>
        <strong>freelanceshield.xyz</strong>
        <span className="address-detail">({treasuryAddress})</span>
      </div>
    </div>
  );
}
