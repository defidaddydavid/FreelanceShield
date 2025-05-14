import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  LogOut, 
  AlertTriangle, 
  Info, 
  Shield, 
  Coins, 
  Unlock, 
  RefreshCw, 
  Loader2,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { LAMPORTS_PER_SOL, Connection, PublicKey } from '@solana/web3.js';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NETWORK_CONFIG } from '@/lib/solana/constants';
import { cn } from "@/lib/utils";

export interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isPending: boolean;
  transactionType: 'stake' | 'unstake' | 'claim' | 'policy' | 'other';
  isBatch?: boolean;
}

export const TransactionDialog: React.FC<TransactionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isPending,
  transactionType,
  isBatch = false
}) => {
  const getIcon = () => {
    switch (transactionType) {
      case 'stake':
        return <Coins className="h-6 w-6 text-primary" />;
      case 'unstake':
        return <Unlock className="h-6 w-6 text-amber-500" />;
      case 'claim':
        return <Wallet className="h-6 w-6 text-green-500" />;
      case 'policy':
        return <Shield className="h-6 w-6 text-blue-500" />;
      default:
        return <Info className="h-6 w-6 text-primary" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4">
            {getIcon()}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 bg-muted/50 rounded-md text-sm">
          <p className="font-medium mb-2">This action requires your approval:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>You'll need to approve {isBatch ? 'these transactions' : 'this transaction'} with your wallet</li>
            <li>Transaction fees will be paid from your wallet balance</li>
            <li>You can reject {isBatch ? 'these transactions' : 'this transaction'} at any time</li>
          </ul>
        </div>
        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              'Confirm & Sign'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const WalletConnect = () => {
  const { login, logout, authenticated, ready, user } = usePrivy();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [showWalletPrompt, setShowWalletPrompt] = useState<boolean>(false);
  const navigate = useNavigate();

  // Create a Solana connection to Devnet with proper configuration
  const connection = useMemo(() => new Connection(
    NETWORK_CONFIG.endpoint, 
    { commitment: NETWORK_CONFIG.connectionConfig.commitment as any }
  ), []);

  // Get the wallet address from Privy user
  const walletAddress = useMemo(() => {
    if (!user) return null;
    
    // Find Solana wallet in linked accounts
    const solanaWallet = user.linkedAccounts?.find(account => 
      account.type === 'wallet' && (account as any).walletClientType === 'solana'
    );
    
    // If no Solana wallet, check for embedded wallet
    const embeddedWallet = user.linkedAccounts?.find(account => 
      account.type === 'wallet' && (account as any).walletType === 'embedded-wallet'
    );
    
    // Return the address of the first available wallet
    if (solanaWallet) {
      return (solanaWallet as any).address;
    } else if (embeddedWallet) {
      return (embeddedWallet as any).address;
    }
    
    return null;
  }, [user]);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    if (authenticated && walletAddress) {
      // Fetch user data when connected
      console.log('Wallet connected:', walletAddress);
      // Get wallet balance when connected
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
  }, [authenticated, walletAddress]);

  const fetchBalance = async () => {
    if (!authenticated || !walletAddress) return;

    setIsLoading(true);
    try {
      const publicKey = new PublicKey(walletAddress);
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
      await logout();
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
    if (authenticated) {
      navigate('/dashboard');
    } else {
      setShowWalletPrompt(true);
      setTimeout(() => setShowWalletPrompt(false), 5000);
    }
  };

  const handleStakingClick = () => {
    if (authenticated) {
      navigate('/staking');
    } else {
      setShowWalletPrompt(true);
      setTimeout(() => setShowWalletPrompt(false), 5000);
    }
  };

  const handleRequestAirdrop = async () => {
    if (!authenticated || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const publicKey = new PublicKey(walletAddress);
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

  if (!ready) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (!authenticated) {
    return (
      <Button 
        onClick={() => login()} 
        className="bg-primary hover:bg-primary/90"
      >
        <Wallet className="mr-2 h-4 w-4" />
        Connect
      </Button>
    );
  }

  // No wallet connected yet but user is authenticated
  if (authenticated && !walletAddress) {
    return (
      <Button 
        onClick={() => login()} 
        className="bg-primary hover:bg-primary/90"
      >
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "rounded-full border-shield-purple text-shield-purple",
            "hover:bg-shield-purple/10 dark:hover:bg-shield-purple/20",
            "dark:border-shield-blue dark:text-shield-blue",
          )}
        >
          <div className={`w-2 h-2 rounded-full ${networkStatus === 'connected' ? 'bg-green-500' : networkStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
          <span className="hidden md:inline-block">{shortenAddress(walletAddress)}</span>
          <span className="md:hidden">Wallet</span>
          <span className="hidden md:inline-block text-muted-foreground ml-1">
            ({balance.toFixed(2)} SOL)
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-xs font-medium text-muted-foreground">Connected to {NETWORK_CONFIG.name}</p>
          <p className="text-xs text-muted-foreground truncate">{walletAddress}</p>
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

export default WalletConnect;
