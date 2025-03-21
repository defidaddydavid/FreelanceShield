import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { usePhantomWallet } from '../../lib/solana/PhantomWalletProvider';
import { useUnifiedWallet, WalletType } from '../../lib/solana/UnifiedWalletService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Card, CardContent } from '../ui/card';
import { Loader2, ChevronDown, ExternalLink, LogOut, RefreshCw } from 'lucide-react';
import { formatCurrency, shortenAddress } from '../../utils/formatters';
import { toast } from 'sonner';

// Import wallet icons
import PhantomIcon from '../../assets/wallets/phantom.svg';
import SolflareIcon from '../../assets/wallets/solflare.svg';
import BackpackIcon from '../../assets/wallets/backpack.svg';
import LedgerIcon from '../../assets/wallets/ledger.svg';  
import TorusIcon from '../../assets/wallets/torus.svg';

interface WalletOption {
  id: WalletType;
  name: string;
  description: string;
  icon: string;
  isEmbedded?: boolean;
}

const walletOptions: WalletOption[] = [
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
  const [walletInfo, walletActions] = useUnifiedWallet();
  const { select, wallets } = useWallet();
  const phantomWallet = usePhantomWallet();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletOption | null>(null);

  // Handle wallet selection
  const handleWalletSelect = useCallback(async (option: WalletOption) => {
    try {
      if (option.isEmbedded) {
        // Handle embedded wallet (Phantom SDK)
        if (option.id === 'phantom-embedded') {
          await phantomWallet.connectWallet();
        }
      } else {
        // Handle adapter-based wallets
        const selectedWallet = wallets.find(wallet => {
          const walletName = wallet.adapter.name.toLowerCase();
          if (option.id === 'phantom-adapter' && walletName.includes('phantom')) return true;
          if (option.id === 'solflare' && walletName.includes('solflare')) return true;
          if (option.id === 'backpack' && walletName.includes('backpack')) return true;
          if (option.id === 'ledger' && walletName.includes('ledger')) return true;
          if (option.id === 'torus' && walletName.includes('torus')) return true;
          return false;
        });
        
        if (selectedWallet) {
          select(selectedWallet.adapter.name);
        }
      }
      
      // Close dialog after selection
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error selecting wallet:', error);
    }
  }, [wallets, select, phantomWallet]);

  // Set up wallet connection handlers
  const handleConnectWallet = async (walletOption: WalletOption) => {
    setConnecting(true);
    setSelectedWallet(walletOption);
    try {
      if (walletOption.isEmbedded) {
        // For embedded wallets like Phantom SDK
        const success = await walletActions.connect(walletOption.id);
        if (!success) {
          throw new Error(`Failed to connect to ${walletOption.name}`);
        }
      } else {
        // For standard wallet adapters, just close the dialog
        // The actual connection happens when the user clicks the adapter button
        await walletActions.connect(walletOption.id);
      }
      
      // Close the dialog after successful connection
      setIsDialogOpen(false);
    } catch (error) {
      console.error(`Error connecting to ${walletOption.name}:`, error);
      toast.error(`Failed to connect to ${walletOption.name}. Please try again.`);
    } finally {
      setConnecting(false);
    }
  };

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!walletInfo.connected) return;
    
    setIsRefreshing(true);
    try {
      await walletActions.refreshBalance();
    } catch (error) {
      console.error('Error refreshing balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [walletInfo.connected, walletActions]);
  
  // Auto-refresh balance when wallet changes
  useEffect(() => {
    if (walletInfo.connected) {
      refreshBalance();
    }
  }, [walletInfo.connected, walletInfo.publicKey]);
  
  // Get current wallet option
  const getCurrentWalletOption = useCallback(() => {
    if (!walletInfo.walletType) return null;
    return walletOptions.find(option => option.id === walletInfo.walletType) || null;
  }, [walletInfo.walletType]);
  
  const currentWallet = getCurrentWalletOption();
  
  // Render wallet selection dialog
  const renderWalletDialog = () => (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Select a wallet to connect to FreelanceShield
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
                {walletInfo.publicKey ? 
                  `${walletInfo.publicKey.substring(0, 4)}...${walletInfo.publicKey.substring(walletInfo.publicKey.length - 4)}` : 
                  'Unknown'
                }
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={refreshBalance}
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
              onClick={() => walletActions.disconnect()}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <div className="text-2xl font-bold">
            {walletInfo.balance !== null ? 
              formatCurrency(walletInfo.balance, 'SOL') : 
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
      
      {/* Standard Solana wallet adapter button as fallback */}
      <div className="hidden">
        <WalletMultiButton />
      </div>
    </div>
  );
  
  return (
    <div className="wallet-adapter-container">
      {walletInfo.connected ? renderConnectedWallet() : renderWalletSelector()}
      {renderWalletDialog()}
    </div>
  );
};
