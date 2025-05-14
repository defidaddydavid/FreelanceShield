import { useWallet } from '@/hooks/useWallet';
import { WalletMultiButton } from '@/lib/solana/wallet-adapter-compat';
import { useEffect, useState, useMemo } from 'react';
import { LAMPORTS_PER_SOL, Connection, Commitment } from '@solana/web3.js';
import { toast } from 'sonner';
import { NETWORK_CONFIG } from '@/lib/solana/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Wallet,
  Shield,
  CheckCircle,
  Clock,
  Server,
  Copy
} from 'lucide-react';

interface WalletStatusProps {
  refreshOnLoad?: boolean;
}

export function WalletStatus({ refreshOnLoad = false }: WalletStatusProps) {
  const { publicKey, connected, connecting, disconnecting } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);

  // Create a Solana connection to the configured endpoint
  const connection = useMemo(() => new Connection(
    NETWORK_CONFIG.endpoint,
    { commitment: NETWORK_CONFIG.connectionConfig.commitment as Commitment }
  ), []);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Copy address to clipboard
  const copyAddressToClipboard = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      toast.success('Address copied to clipboard');
    }
  };

  // Open Solana Explorer for the wallet address
  const openExplorer = () => {
    if (publicKey) {
      const explorerUrl = `https://explorer.solana.com/address/${publicKey.toBase58()}?cluster=${NETWORK_CONFIG.network}`;
      window.open(explorerUrl, '_blank');
    }
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
    } else if (connecting) {
      setNetworkStatus('connecting');
    } else {
      setNetworkStatus('disconnected');
    }
  }, [connected, connecting, publicKey]);

  const fetchBalance = async () => {
    if (!publicKey || !connected) return;

    setIsLoading(true);
    const startTime = performance.now();
    
    try {
      const bal = await connection.getBalance(publicKey);
      const endTime = performance.now();
      setNetworkLatency(Math.round(endTime - startTime));
      setBalance(bal / LAMPORTS_PER_SOL);
      setLastRefreshed(new Date());
      setNetworkStatus('connected');
    } catch (error) {
      console.error('Error fetching balance:', error);
      setNetworkStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchBalance();
  };

  // Time since last refresh
  const getRefreshTime = () => {
    if (!lastRefreshed) return 'Never';
    
    const seconds = Math.floor((new Date().getTime() - lastRefreshed.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  };

  // Network health indicator based on latency
  const getNetworkHealthStatus = () => {
    if (!networkLatency) return null;
    
    if (networkLatency < 500) return 'excellent';
    if (networkLatency < 1000) return 'good';
    if (networkLatency < 2000) return 'fair';
    return 'poor';
  };

  const networkHealth = getNetworkHealthStatus();

  // Remove usage of 'wallet' and 'network' properties that are not present in Privy-based useWallet or config.
  // Use only supported properties from useWallet and config.
  // For network info, use NETWORK_CONFIG directly if needed.
  // Example: const { publicKey, connected } = useWallet();
  // import { NETWORK_CONFIG } from '@/lib/solana/constants';
  // ...
  // Use NETWORK_CONFIG.name, NETWORK_CONFIG.endpoint, etc.

  return (
    <Card className="border border-border/40 bg-background/95 shadow-md transition-all">
      <CardHeader className="bg-gradient-to-r from-blue-500/5 to-blue-500/10 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-500" />
            <span>Solana Connection</span>
          </CardTitle>
          {connected ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : networkStatus === 'connecting' ? (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200">
              <Clock className="h-3 w-3 mr-1 animate-spin" />
              Connecting
            </Badge>
          ) : networkStatus === 'error' ? (
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              Error
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              Disconnected
            </Badge>
          )}
        </div>
        <CardDescription>
          {(NETWORK_CONFIG.network ? (NETWORK_CONFIG.network.charAt(0).toUpperCase() + NETWORK_CONFIG.network.slice(1)) : 'Devnet')} Network • {lastRefreshed ? getRefreshTime() : 'Not connected'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {connected && publicKey ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Wallet className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm font-medium text-muted-foreground">
                  Address:
                </span>
              </div>
              <div className="flex items-center gap-1">
                <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-mono">
                  {shortenAddress(publicKey.toBase58())}
                </code>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={copyAddressToClipboard}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy address</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={openExplorer}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View on explorer</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Server className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-sm font-medium text-muted-foreground">Network Health:</span>
              </div>
              {networkLatency ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`
                    ${networkHealth === 'excellent' ? 'bg-green-500/10 text-green-600 border-green-200' : 
                      networkHealth === 'good' ? 'bg-blue-500/10 text-blue-600 border-blue-200' : 
                      networkHealth === 'fair' ? 'bg-amber-500/10 text-amber-600 border-amber-200' : 
                      'bg-red-500/10 text-red-600 border-red-200'
                    }
                  `}>
                    {networkLatency}ms
                  </Badge>
                  <Progress 
                    value={
                      networkHealth === 'excellent' ? 90 : 
                      networkHealth === 'good' ? 70 : 
                      networkHealth === 'fair' ? 50 : 
                      20
                    } 
                    className="w-12 h-2"
                  />
                </div>
              ) : (
                <span className="text-sm">Unknown</span>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground">
                  Balance:
                </span>
                <span className="text-lg font-bold">{formatCurrency(balance)}</span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 px-2 text-xs bg-primary/5 hover:bg-primary/10"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground mb-4">Connect your wallet to access the dashboard</p>
              <WalletMultiButton />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WalletStatus;
