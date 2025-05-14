import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../../lib/solana/wallet-adapter-compat';
import { usePhantomWallet } from '../../lib/solana/PhantomWalletProvider';
import { useUnifiedWallet } from '../../hooks/useUnifiedWallet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Card, CardContent } from '../ui/card';
import { Loader2, ChevronDown, ExternalLink, LogOut, RefreshCw } from 'lucide-react';
import { formatCurrency, shortenAddress } from '../../utils/formatters';
import { toast } from 'sonner';
import { usePrivy } from '@privy-io/react-auth';

// Import wallet icons
import PhantomIcon from '../../assets/wallets/phantom.svg';
import SolflareIcon from '../../assets/wallets/solflare.svg';
import BackpackIcon from '../../assets/wallets/backpack.svg';
import LedgerIcon from '../../assets/wallets/ledger.svg';  
import TorusIcon from '../../assets/wallets/torus.svg';

// Define wallet types
type WalletType = 'privy' | 'phantom-adapter' | 'solflare' | 'other' | 'ledger' | 'torus';

interface WalletOption {
  id: WalletType;
  name: string;
  description: string;
  icon: string;
  isEmbedded?: boolean;
}

const walletOptions: WalletOption[] = [
  {
    id: 'privy',
    name: 'Privy',
    description: 'Connect with Privy authentication',
    icon: PhantomIcon
  },
  {
    id: 'phantom-adapter',
    name: 'Phantom',
    description: 'Connect with Phantom browser extension',
    icon: PhantomIcon
  },
  {
    id: 'solflare',
    name: 'Solflare',
    description: 'Connect with Solflare browser extension',
    icon: SolflareIcon
  },
  {
    id: 'other',
    name: 'Backpack',
    description: 'Connect with Backpack wallet',
    icon: BackpackIcon
  },
  {
    id: 'ledger',
    name: 'Ledger',
    description: 'Connect with Ledger hardware wallet',
    icon: LedgerIcon
  },
  {
    id: 'torus',
    name: 'Torus',
    description: 'Connect with Torus wallet',
    icon: TorusIcon
  }
];

export const MultiWalletAdapter: React.FC = () => {
  const { 
    walletInfo, 
    walletStatus, 
    isConnected, 
    publicKey, 
    balance,
    refreshBalance,
    walletService,
    connect,
    disconnect
  } = useUnifiedWallet();
  
  const wallet = useWallet();
  const phantomWallet = usePhantomWallet();
  const privy = usePrivy();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletOption | null>(null);

  // Get current wallet from options
  const currentWallet = walletInfo?.walletType 
    ? walletOptions.find(w => w.id === walletInfo.walletType as WalletType) 
    : null;

  // Handle wallet selection
  const handleWalletSelect = useCallback(async (option: WalletOption) => {
    try {
      // With Privy integration, we'll use the privy.login() method for all wallet types
      privy.login();
      
      // Close dialog after selection
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error selecting wallet:', error);
    }
  }, [privy]);

  // Set up wallet connection handlers
  const handleConnectWallet = async (walletOption: WalletOption) => {
    setConnecting(true);
    setSelectedWallet(walletOption);
    try {
      // With Privy integration, we'll use the connect method from our unified wallet
      const success = await connect(walletOption.id);
      if (!success) {
        toast.error(`Failed to connect to ${walletOption.name}`);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error(`Error connecting to ${walletOption.name}`);
    } finally {
      setConnecting(false);
      setIsDialogOpen(false);
    }
  };

  // Refresh wallet balance
  const handleRefreshBalance = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    setIsRefreshing(true);
    try {
      await refreshBalance();
      toast.success('Balance refreshed');
    } catch (error) {
      console.error('Error refreshing balance:', error);
      toast.error('Failed to refresh balance');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Render wallet selection dialog
  const renderWalletDialog = () => (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Select a wallet to connect to this application
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {walletOptions.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              className="flex justify-between items-center w-full p-4"
              onClick={() => handleConnectWallet(option)}
            >
              <div className="flex items-center gap-3">
                <img src={option.icon} alt={option.name} className="w-8 h-8" />
                <div className="text-left">
                  <div className="font-medium">{option.name}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
              </div>
              <ExternalLink className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
  
  // Render connected wallet UI
  const renderConnectedWallet = () => (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {currentWallet && (
              <img src={currentWallet.icon} alt={currentWallet.name} className="w-8 h-8" />
            )}
            <div>
              <div className="font-medium">{currentWallet?.name || 'Wallet'}</div>
              <div className="text-xs text-muted-foreground">
                {publicKey ? 
                  shortenAddress(publicKey.toString()) : 
                  'Unknown'
                }
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleRefreshBalance}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => disconnect()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="text-2xl font-bold">
            {balance !== null ? 
              formatCurrency(balance, 'SOL') : 
              '-.-- SOL'
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // Render wallet selector
  const renderWalletSelector = () => (
    <div className="flex flex-col gap-2">
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => setIsDialogOpen(true)}
      >
        Connect Wallet
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full flex justify-between items-center">
            <span>Select Wallet</span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[240px]">
          {walletOptions.map((option) => (
            <DropdownMenuItem
              key={option.id}
              onClick={() => handleConnectWallet(option)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <img src={option.icon} alt={option.name} className="w-5 h-5" />
                <span>{option.name}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
  
  return (
    <div className="wallet-adapter-container">
      {isConnected ? renderConnectedWallet() : renderWalletSelector()}
      {renderWalletDialog()}
    </div>
  );
};
