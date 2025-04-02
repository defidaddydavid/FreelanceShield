import React, { FC, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNavigate } from 'react-router-dom';
import '@solana/wallet-adapter-react-ui/styles.css';

/**
 * Wallet connection component using Phantom wallet
 * Following FreelanceShield rules: Phantom Wallet should be the primary authentication method
 */
const WalletConnect: FC = () => {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);

  // Update balance when wallet connects
  useEffect(() => {
    if (publicKey) {
      const fetchBalance = async () => {
        try {
          const walletBalance = await connection.getBalance(publicKey);
          setBalance(walletBalance / 1000000000);
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      };

      fetchBalance();
      const intervalId = setInterval(fetchBalance, 10000);
      return () => clearInterval(intervalId);
    }
  }, [publicKey, connection]);

  // Redirect to dashboard when connected
  useEffect(() => {
    if (connected) {
      navigate('/dashboard');
    }
  }, [connected, navigate]);

  return (
    <div className="wallet-connect-container">
      <div className="wallet-connect-card">
        <h2>Connect to FreelanceShield</h2>
        <p>
          Secure your freelance work with blockchain-based insurance.
          Connect your Phantom Wallet to get started.
        </p>
        
        <div className="wallet-button-container">
          <WalletMultiButton />
        </div>
        
        {connected && balance !== null && (
          <div className="wallet-info">
            <p>Connected: {publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-4)}</p>
            <p>Balance: {balance.toFixed(4)} SOL</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletConnect;
