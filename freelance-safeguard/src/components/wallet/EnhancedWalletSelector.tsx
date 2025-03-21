import React, { useState, useEffect } from 'react';
import { useWalletIntegrationContext } from './WalletIntegrationProvider';
import { WalletType } from '../../lib/solana/UnifiedWalletService';
import { formatCurrency, shortenAddress } from '../../utils/formatters';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Loader2, ChevronDown, ExternalLink, LogOut, RefreshCw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

// Import wallet icons
import PhantomIcon from '../../assets/wallets/phantom.svg';
import SolflareIcon from '../../assets/wallets/solflare.svg';
import LedgerIcon from '../../assets/wallets/ledger.svg';
import TorusIcon from '../../assets/wallets/torus.svg';

interface WalletOption {
  id: WalletType;
  name: string;
  icon: string;
  description: string;
}

const walletOptions: WalletOption[] = [
  {
    id: 'phantom-adapter',
    name: 'Phantom',
    icon: PhantomIcon,
    description: 'Connect to your Phantom wallet'
  },
  {
    id: 'solflare',
    name: 'Solflare',
    icon: SolflareIcon,
    description: 'Connect to your Solflare wallet'
  },
  {
    id: 'ledger',
    name: 'Ledger',
    icon: LedgerIcon,
    description: 'Connect to your Ledger hardware wallet'
  },
  {
    id: 'torus',
    name: 'Torus',
    icon: TorusIcon,
    description: 'Connect with social login via Torus'
  }
];

export const EnhancedWalletSelector: React.FC = () => {
  const { walletInfo, walletActions, isProcessing } = useWalletIntegrationContext();
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);

  // Close dialog when wallet is connected
  useEffect(() => {
    if (walletInfo.connected) {
      setIsWalletDialogOpen(false);
    }
  }, [walletInfo.connected]);

  // Handle wallet selection
  const handleWalletSelect = async (walletType: WalletType) => {
    setSelectedWallet(walletType);
    try {
      await walletActions.connect(walletType);
    } catch (error) {
      console.error(`Error connecting to ${walletType} wallet:`, error);
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      await walletActions.disconnect();
      setSelectedWallet(null);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Handle balance refresh
  const handleRefreshBalance = async () => {
    try {
      await walletActions.refreshBalance();
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  // Render wallet button based on connection state
  return (
    <>
      {walletInfo.connected ? (
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {walletInfo.walletType && (
                  <img 
                    src={walletOptions.find(w => w.id === walletInfo.walletType)?.icon} 
                    alt={walletInfo.walletType} 
                    className="w-4 h-4"
                  />
                )}
                <span className="hidden sm:inline">{shortenAddress(walletInfo.publicKey || '')}</span>
                <span className="inline sm:hidden">{shortenAddress(walletInfo.publicKey || '', 2, 2)}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <div className="text-sm font-medium">Balance</div>
                <div className="flex items-center justify-between mt-1">
                  <div className="font-mono text-sm">
                    {walletInfo.balance !== null
                      ? formatCurrency(walletInfo.balance, 'SOL')
                      : '-.-- SOL'}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleRefreshBalance}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => window.open(`https://explorer.solana.com/address/${walletInfo.publicKey}`, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Explorer
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleDisconnect}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <>
          <Button 
            onClick={() => setIsWalletDialogOpen(true)}
            variant="default"
            className="flex items-center gap-2"
          >
            Connect Wallet
          </Button>

          <Dialog open={isWalletDialogOpen} onOpenChange={setIsWalletDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Connect Wallet</DialogTitle>
                <DialogDescription>
                  Select a wallet to connect to FreelanceShield
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {walletOptions.map((wallet) => (
                  <Card 
                    key={wallet.id}
                    className={`cursor-pointer hover:bg-accent transition-colors ${
                      selectedWallet === wallet.id ? 'border-primary' : ''
                    }`}
                    onClick={() => handleWalletSelect(wallet.id)}
                  >
                    <CardContent className="flex items-center p-4">
                      <img src={wallet.icon} alt={wallet.name} className="w-8 h-8 mr-4" />
                      <div className="flex-1">
                        <h3 className="font-medium">{wallet.name}</h3>
                        <p className="text-sm text-muted-foreground">{wallet.description}</p>
                      </div>
                      {isProcessing && selectedWallet === wallet.id && (
                        <Loader2 className="h-5 w-5 animate-spin ml-2" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
};
