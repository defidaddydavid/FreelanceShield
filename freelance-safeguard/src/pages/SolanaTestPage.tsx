import React from 'react';
import { SolanaIntegration } from '../components/solana/SolanaIntegration';
import { SolanaIntegrationTest } from '../components/solana/SolanaIntegrationTest';

export default function SolanaTestPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Solana Integration Test</h1>
      
      <SolanaIntegration>
        <SolanaIntegrationTest />
      </SolanaIntegration>
      
      <div className="mt-8 text-sm text-muted-foreground">
        <p>
          This page is used to test the Solana integration. Connect your wallet and use the
          test functions to verify that the SDK is working correctly.
        </p>
        <p className="mt-2">
          Note: Some functions may fail if the corresponding smart contracts are not deployed
          or if your wallet doesn't have the necessary accounts.
        </p>
      </div>
    </div>
  );
}
