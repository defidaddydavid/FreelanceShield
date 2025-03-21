import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSolana } from '../../lib/solana/SolanaProvider';
import { Button } from '../ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { truncateAddress } from '../../lib/utils';
import { USDC_MINT, USDC_DECIMALS } from '../../lib/solana/constants';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { Alert, AlertDescription } from '../ui/alert';

export function WalletConnection() {
  const { connection, isConnecting, error } = useSolana();
  const { connected, publicKey, disconnect } = useWallet();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Fetch SOL and USDC balances when wallet is connected
  useEffect(() => {
    if (!connected || !publicKey || !connection) return;

    const fetchBalances = async () => {
      try {
        setIsLoadingBalance(true);
        setBalanceError(null);
        
        // Get SOL balance
        const solBalance = await connection.getBalance(publicKey);
        setSolBalance(solBalance / 1_000_000_000); // Convert lamports to SOL
        
        // Get USDC balance
        try {
          const usdcMint = new PublicKey(USDC_MINT);
          const tokenAccount = await getAssociatedTokenAddress(usdcMint, publicKey);
          
          try {
            const tokenAccountInfo = await getAccount(connection, tokenAccount);
            const usdcAmount = Number(tokenAccountInfo.amount) / (10 ** USDC_DECIMALS);
            setUsdcBalance(usdcAmount);
          } catch (err) {
            // Token account doesn't exist yet, which is normal if user hasn't received any USDC
            setUsdcBalance(0);
          }
        } catch (err) {
          console.error('Failed to fetch USDC balance:', err);
          setUsdcBalance(null);
        }
      } catch (err) {
        console.error('Failed to fetch balances:', err);
        setBalanceError('Failed to load balances. Please try again.');
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalances();
    
    // Set up subscription to account changes for SOL balance
    const subscriptionId = connection.onAccountChange(
      publicKey,
      () => {
        fetchBalances(); // Refresh all balances when SOL balance changes
      },
      'confirmed'
    );

    return () => {
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [connection, publicKey, connected]);

  return (
    <div className="flex flex-col space-y-2 p-4 border rounded-lg bg-card">
      {!connected ? (
        <div className="flex flex-col items-center space-y-3">
          <h3 className="text-lg font-medium">Connect Wallet</h3>
          <p className="text-sm text-muted-foreground mb-2">Connect your Solana wallet to use FreelanceShield</p>
          <WalletMultiButton className="wallet-adapter-button" />
          {isConnecting && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting to Solana...</span>
            </div>
          )}
          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      ) : (
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Wallet</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => disconnect()}
            >
              Disconnect
            </Button>
          </div>
          
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium">Address</span>
            <span className="text-xs text-muted-foreground font-mono">
              {truncateAddress(publicKey.toString())}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="flex flex-col p-3 border rounded-md">
              <span className="text-xs text-muted-foreground">SOL Balance</span>
              {isLoadingBalance ? (
                <Loader2 className="h-4 w-4 animate-spin mt-1" />
              ) : (
                <span className="text-sm font-medium">
                  {solBalance !== null ? `${solBalance.toFixed(4)} SOL` : 'Unknown'}
                </span>
              )}
            </div>
            
            <div className="flex flex-col p-3 border rounded-md">
              <span className="text-xs text-muted-foreground">USDC Balance</span>
              {isLoadingBalance ? (
                <Loader2 className="h-4 w-4 animate-spin mt-1" />
              ) : (
                <span className="text-sm font-medium">
                  {usdcBalance !== null ? `${usdcBalance.toFixed(2)} USDC` : 'Unknown'}
                </span>
              )}
            </div>
          </div>
          
          {balanceError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{balanceError}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-xs text-muted-foreground mt-2">
            Connected to {connection?.rpcEndpoint.includes('devnet') ? 'Devnet' : 'Mainnet'}
          </div>
        </div>
      )}
    </div>
  );
}
