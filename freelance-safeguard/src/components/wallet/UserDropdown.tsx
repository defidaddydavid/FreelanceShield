import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import { 
  Wallet, 
  LogOut, 
  RefreshCw, 
  Coins, 
  Shield, 
  Loader2 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { NETWORK_CONFIG } from "@/lib/solana/constants";

const UserDropdown = () => {
  const { publicKey, disconnect, connected, signTransaction, signAllTransactions } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const navigate = useNavigate();

  // Create a Solana connection to the configured network
  const connection = new Connection(
    NETWORK_CONFIG.endpoint, 
    { commitment: NETWORK_CONFIG.connectionConfig.commitment }
  );

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    if (connected && publicKey) {
      console.log('Wallet connected:', publicKey.toBase58());
      fetchBalance();

      // Set up an interval to refresh the balance every 30 seconds
      const intervalId = setInterval(() => {
        fetchBalance();
      }, 30000);

      return () => clearInterval(intervalId);
    } else {
      console.log('Wallet disconnected');
      setNetworkStatus('disconnected');
    }
  }, [connected, publicKey]);

  const fetchBalance = async () => {
    if (!publicKey || !connected) return;

    setIsLoading(true);
    try {
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / LAMPORTS_PER_SOL);
      setLastRefreshed(new Date());
      setNetworkStatus('connected');
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error('Failed to fetch wallet balance');
      setNetworkStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      await disconnect();
      toast.success('Wallet Disconnected');
      navigate('/'); // Redirect to home page on disconnect
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDashboardClick = () => {
    if (connected) {
      navigate('/dashboard');
    } else {
      toast.error('Please connect your wallet first');
    }
  };

  const handleStakingClick = () => {
    if (connected) {
      navigate('/staking');
    } else {
      toast.error('Please connect your wallet first');
    }
  };

  const handleRequestAirdrop = async () => {
    if (!publicKey || !connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const signature = await connection.requestAirdrop(publicKey, 1 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(signature);
      toast.success('Airdrop successful! 1 SOL received');
      fetchBalance();
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      toast.error('Failed to request airdrop');
    } finally {
      setIsLoading(false);
    }
  };

  if (!connected || !publicKey) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${networkStatus === 'connected' ? 'bg-green-500' : networkStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
          <span className="hidden md:inline-block">{shortenAddress(publicKey.toBase58())}</span>
          <span className="md:hidden">Wallet</span>
          <span className="hidden md:inline-block text-muted-foreground ml-1">
            ({balance.toFixed(2)} SOL)
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-xs font-medium text-muted-foreground">Connected to {NETWORK_CONFIG.name}</p>
          <p className="text-xs text-muted-foreground truncate">{publicKey.toBase58()}</p>
        </div>
        <div className="p-2 bg-muted/50 rounded-md mx-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Balance</span>
            <span className="text-sm">{balance.toFixed(4)} SOL</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">Last updated</span>
            <span className="text-xs text-muted-foreground">
              {lastRefreshed ? new Date(lastRefreshed).toLocaleTimeString() : 'Never'}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={fetchBalance} disabled={isLoading} className="cursor-pointer">
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

export default UserDropdown;
