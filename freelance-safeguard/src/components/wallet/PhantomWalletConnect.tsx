import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePhantomWallet } from '@/lib/solana/PhantomWalletProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Wallet,
  LogOut,
  AlertTriangle,
  Shield,
  Coins,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { NETWORK_CONFIG } from '@/lib/solana/constants';

const PhantomWalletConnect = () => {
  const {
    phantom,
    isInitialized,
    isLoading,
    showWallet,
    connectWallet,
    disconnectWallet,
    isConnected,
    publicKey,
    balance,
    refreshBalance,
  } = usePhantomWallet();
  
  const [hasConnected, setHasConnected] = useState<boolean>(false);
  const [showWalletPrompt, setShowWalletPrompt] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const navigate = useNavigate();

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    if (isConnected && !hasConnected) {
      setHasConnected(true);
    } else if (!isConnected) {
      setHasConnected(false);
    }
  }, [isConnected, hasConnected]);

  useEffect(() => {
    if (isConnected && publicKey) {
      console.log('Phantom wallet connected:', publicKey);
    } else {
      console.log('Phantom wallet disconnected');
    }
  }, [isConnected, publicKey]);

  const handleRefreshBalance = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      await refreshBalance();
      setLastRefreshed(new Date());
      toast.success('Balance refreshed');
    } catch (error) {
      console.error('Error refreshing balance:', error);
      toast.error('Failed to refresh balance');
    }
  };

  const handleDisconnect = async () => {
    try {
      disconnectWallet();
      navigate('/'); // Redirect to home page on disconnect
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  const handleDashboardClick = () => {
    if (isConnected) {
      navigate('/dashboard');
    } else {
      setShowWalletPrompt(true);
      setTimeout(() => setShowWalletPrompt(false), 5000);
    }
  };

  const handleStakingClick = () => {
    if (isConnected) {
      navigate('/staking');
    } else {
      setShowWalletPrompt(true);
      setTimeout(() => setShowWalletPrompt(false), 5000);
    }
  };

  const handleRequestAirdrop = async () => {
    if (!isConnected || !phantom || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      // Request airdrop using the Phantom SDK
      const signature = await phantom.solana.request({
        method: 'requestAirdrop',
        params: [publicKey, 1 * NETWORK_CONFIG.lamportsPerSol],
      });
      
      toast.success('Airdrop requested! Transaction signature: ' + shortenAddress(signature));
      toast.info('Confirming transaction...');
      
      // Wait for confirmation
      await phantom.solana.request({
        method: 'confirmTransaction',
        params: [signature],
      });
      
      toast.success('Airdrop successful! 1 SOL received');
      await refreshBalance();
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      toast.error('Failed to request airdrop');
    }
  };

  const handleConnect = async () => {
    if (!isInitialized) {
      toast.error('Phantom wallet is not initialized');
      return;
    }

    try {
      await connectWallet();
      showWallet();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    }
  };

  const handleShowWallet = () => {
    if (phantom) {
      showWallet();
    }
  };

  if (!isConnected) {
    return (
      <div className="relative">
        <Button 
          onClick={handleConnect} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 py-2 text-sm font-medium"
          disabled={isLoading || !isInitialized}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Phantom
            </>
          )}
        </Button>
        {showWalletPrompt && (
          <div className="absolute top-full right-0 mt-2 p-3 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 w-64 animate-in fade-in slide-in-from-top-5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Wallet connection required</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please connect your wallet to access this feature
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="hidden md:inline-block">{publicKey ? shortenAddress(publicKey) : 'Connected'}</span>
          <span className="md:hidden">Wallet</span>
          <span className="hidden md:inline-block text-muted-foreground ml-1">
            ({balance !== null ? balance.toFixed(2) : '0.00'} SOL)
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-xs font-medium text-muted-foreground">Connected to {NETWORK_CONFIG.name}</p>
          <p className="text-xs text-muted-foreground truncate">{publicKey}</p>
        </div>
        <div className="p-2 bg-muted/50 rounded-md mx-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Balance</span>
            <span className="text-sm">{balance !== null ? balance.toFixed(4) : '0.0000'} SOL</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">Last updated</span>
            <span className="text-xs text-muted-foreground">
              {lastRefreshed ? new Date(lastRefreshed).toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleShowWallet} className="cursor-pointer">
          <Wallet className="mr-2 h-4 w-4" />
          Open Wallet
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleRefreshBalance} disabled={isLoading} className="cursor-pointer">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Balance
          {isLoading && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleRequestAirdrop} disabled={isLoading} className="cursor-pointer">
          <Coins className="mr-2 h-4 w-4" />
          Request Devnet Airdrop
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDashboardClick} className="cursor-pointer">
          <Shield className="mr-2 h-4 w-4" />
          My Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleStakingClick} className="cursor-pointer">
          <Coins className="mr-2 h-4 w-4" />
          Staking
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="text-red-500 cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PhantomWalletConnect;
