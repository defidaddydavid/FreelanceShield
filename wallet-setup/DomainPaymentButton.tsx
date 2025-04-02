import React, { useState } from 'react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useProtocolPayment } from './frontend-integration';

// USDC-SPL token mint address on Solana mainnet
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

interface PaymentButtonProps {
  amount: number;
  paymentType: 'sol' | 'usdc';
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
  className?: string;
  buttonText?: string;
}

/**
 * A reusable button component for making payments to freelanceshield.xyz
 */
export function DomainPaymentButton({
  amount,
  paymentType = 'sol',
  onSuccess,
  onError,
  className = 'payment-button',
  buttonText
}: PaymentButtonProps) {
  const { publicKey } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const { payWithSol, payWithUsdc, isReady, loading, error } = useProtocolPayment();

  const handleClick = async () => {
    if (!publicKey) {
      const walletError = new WalletNotConnectedError('Wallet not connected');
      onError?.(walletError);
      return;
    }

    if (!isReady) {
      onError?.(new Error('Payment system not ready yet. Please try again.'));
      return;
    }

    setIsProcessing(true);
    try {
      let signature: string;
      
      if (paymentType === 'sol') {
        signature = await payWithSol(amount);
      } else {
        signature = await payWithUsdc(amount, USDC_MINT);
      }
      
      onSuccess?.(signature);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Payment failed:', error);
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Determine button text based on state and props
  const getButtonText = () => {
    if (loading) return 'Loading...';
    if (isProcessing) return `Processing ${paymentType.toUpperCase()} payment...`;
    if (error) return 'Error: Try Again';
    return buttonText || `Pay ${amount} ${paymentType.toUpperCase()} to freelanceshield.xyz`;
  };

  // Determine button state
  const isDisabled = !publicKey || !isReady || isProcessing || loading;

  return (
    <button
      className={`${className} ${isDisabled ? 'disabled' : ''}`}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {getButtonText()}
    </button>
  );
}

/**
 * Example implementation of a premium payment component using the domain
 */
export function PolicyPremiumPayment({ premiumAmount, policyId }: { premiumAmount: number, policyId: string }) {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);

  const handleSuccess = (signature: string) => {
    setTransactionSignature(signature);
    setPaymentStatus('success');
    // Here you would typically call your backend API to record the payment
    // markPolicyPremiumPaid(policyId, signature);
  };

  const handleError = (error: Error) => {
    console.error('Premium payment failed:', error);
    setPaymentStatus('error');
  };

  return (
    <div className="premium-payment-card">
      <h2>Policy Premium Payment</h2>
      <div className="payment-details">
        <p>Policy ID: {policyId}</p>
        <p>Premium Amount: {premiumAmount} USDC</p>
        <p>Pay to: <strong>freelanceshield.xyz</strong></p>
      </div>
      
      {paymentStatus === 'success' ? (
        <div className="payment-success">
          <h3>Payment Successful!</h3>
          <p>Transaction: {transactionSignature}</p>
        </div>
      ) : (
        <DomainPaymentButton
          amount={premiumAmount}
          paymentType="usdc"
          onSuccess={handleSuccess}
          onError={handleError}
          buttonText="Pay Premium Now"
          className="premium-payment-button"
        />
      )}
      
      {paymentStatus === 'error' && (
        <div className="payment-error">
          <p>Payment failed. Please try again or contact support.</p>
        </div>
      )}
    </div>
  );
}
