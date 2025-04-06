import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
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
  Loader2 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { LAMPORTS_PER_SOL, Connection, clusterApiUrl, PublicKey, Transaction, Commitment } from '@solana/web3.js';
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
  isLoading: boolean;
  transactionType: 'stake' | 'unstake' | 'claim' | 'policy' | 'other';
}

export const TransactionDialog: React.FC<TransactionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading,
  transactionType
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
            <li>You'll need to approve this transaction with your wallet</li>
            <li>Transaction fees will be paid from your wallet balance</li>
            <li>You can reject this transaction at any time</li>
          </ul>
        </div>
        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
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
  const { publicKey, disconnect, connected, signTransaction, signAllTransactions } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasConnected, setHasConnected] = useState<boolean>(false);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [showWalletPrompt, setShowWalletPrompt] = useState<boolean>(false);
  const navigate = useNavigate();

  // Create a Solana connection to Devnet with proper configuration
  const connection = useMemo(() => new Connection(
    NETWORK_CONFIG.endpoint, 
    { commitment: NETWORK_CONFIG.connectionConfig.commitment as Commitment }
  ), []);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    const storedConnected = localStorage.getItem('walletConnected');
    if (storedConnected === 'true') {
      setHasConnected(true);
    }
  }, []);

  useEffect(() => {
    if (connected && !hasConnected) {
      toast.success('Wallet Connected Successfully!');
      setHasConnected(true);
      localStorage.setItem('walletConnected', 'true');
      setNetworkStatus('connected');
    } else if (!connected) {
      localStorage.removeItem('walletConnected');
      setNetworkStatus('disconnected');
    }
  }, [connected, hasConnected]);

  useEffect(() => {
    if (connected && publicKey) {
      // Fetch user data when connected
      console.log('Wallet connected:', publicKey.toBase58());
      // Get wallet balance when connected
      fetchBalance();

      // Set up an interval to refresh the balance every 30 seconds
      const intervalId = setInterval(() => {
        fetchBalance();
      }, 30000);

      return () => clearInterval(intervalId);
    } else {
      console.log('Wallet disconnected');
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
      setHasConnected(false);
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
      setShowWalletPrompt(true);
      setTimeout(() => setShowWalletPrompt(false), 5000);
    }
  };

  const handleStakingClick = () => {
    if (connected) {
      navigate('/staking');
    } else {
      setShowWalletPrompt(true);
      setTimeout(() => setShowWalletPrompt(false), 5000);
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

  if (!connected) {
    return (
      <WalletMultiButton 
        className="bg-primary hover:bg-primary/90"
      />
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

export default WalletConnect;
