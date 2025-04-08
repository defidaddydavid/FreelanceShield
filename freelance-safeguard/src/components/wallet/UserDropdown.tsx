import React, { useState, useEffect, useCallback } from "react";
import { LAMPORTS_PER_SOL, Connection, Commitment } from "@solana/web3.js";
import { 
  Wallet, 
  LogOut, 
  RefreshCw, 
  Coins, 
  Shield, 
  Loader2,
  User,
  Settings,
  ExternalLink,
  Copy,
  Check,
  Moon,
  Sun
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
import { cn } from "@/lib/utils"; // Utility for conditional class names
import { Avatar } from "@/components/ui/avatar";
import { useSolanaTheme } from "@/contexts/SolanaThemeProvider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSafeWallet } from "@/hooks/useSafeWallet";
import { formatSolanaErrorMessage, trackSolanaError } from "@/utils/errorHandling";
import { useWallet } from "@solana/wallet-adapter-react";

// Define menu item styling with neon accents for retro-futuristic look
const menuItemClasses = cn(
  "flex items-center gap-2 px-3 py-2.5 rounded-md",
  "text-sm font-medium font-sans",
  "hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-purple-500/10",
  "focus:bg-shield-purple/15 dark:focus:bg-shield-blue/25",
  "cursor-pointer transition-colors"
);

// Retro-future styled button for balance display
const BalanceDisplayButton = ({ balance, isLoading, onClick }: { 
  balance: number, 
  isLoading: boolean, 
  onClick: () => void 
}) => (
  <Button
    variant="outline"
    size="sm"
    onClick={onClick}
    className={cn(
      "h-9 gap-2 font-mono bg-black/5 dark:bg-white/5",
      "border-dashed border-pink-500/30 dark:border-blue-400/30",
      "hover:border-pink-500/50 dark:hover:border-blue-400/50",
      "transition-all duration-200"
    )}
    disabled={isLoading}
  >
    {isLoading ? (
      <Loader2 className="h-4 w-4 animate-spin text-pink-500 dark:text-blue-400" />
    ) : (
      <Coins className="h-4 w-4 text-pink-500 dark:text-blue-400" />
    )}
    <span className={cn(
      "font-bold",
      "bg-clip-text text-transparent bg-gradient-to-r",
      "from-pink-500 to-purple-600 dark:from-blue-400 dark:to-teal-300"
    )}>
      {balance.toFixed(4)} SOL
    </span>
  </Button>
);

/**
 * UserDropdown Component
 * 
 * A dropdown menu component for Solana wallet users that displays wallet information,
 * balance, and provides navigation options with a retro-futuristic design.
 */
const UserDropdown = () => {
  // Theme context
  const { isDark, setTheme } = useSolanaTheme();
  
  // Enhanced safe wallet access
  const safeWallet = useSafeWallet();
  // Direct wallet access for disconnection
  const { disconnect } = useWallet();
  
  // Component state
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [usdValue, setUsdValue] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  
  const navigate = useNavigate();

  // Create a Solana connection to the configured network
  const connection = new Connection(
    NETWORK_CONFIG.endpoint, 
    { commitment: NETWORK_CONFIG.connectionConfig.commitment as Commitment }
  );

  /**
   * Shortens a Solana address for display purposes
   * @param address - The full Solana address
   * @returns Shortened address in format "xxxx...xxxx"
   */
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Get shortened address if publicKey exists
  const truncatedAddress = safeWallet.publicKey ? shortenAddress(safeWallet.publicKey.toBase58()) : '';
  const fullAddress = safeWallet.publicKey ? safeWallet.publicKey.toBase58() : '';

  /**
   * Fetch the SOL balance of the connected wallet
   */
  const fetchBalance = useCallback(async () => {
    if (!safeWallet.connected || !safeWallet.publicKey) {
      setBalance(0);
      setNetworkStatus('disconnected');
      return;
    }

    setIsLoading(true);
    
    try {
      // Use the enhanced getSolBalance method from our hook
      const solBalance = await safeWallet.getSolBalance(connection);
      setBalance(solBalance);
      setLastRefreshed(new Date());
      setNetworkStatus('connected');
      
      // Attempt to get SOL price in USD
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        if (data && data.solana && data.solana.usd) {
          setSolPrice(data.solana.usd);
          setUsdValue(solBalance * data.solana.usd);
        }
      } catch (priceErr) {
        console.warn("Failed to fetch SOL price:", priceErr);
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
      trackSolanaError(err, "fetchBalance");
      setNetworkStatus('error');
      toast.error("Failed to fetch balance", {
        description: formatSolanaErrorMessage(err),
      });
    } finally {
      setIsLoading(false);
    }
  }, [connection, safeWallet]);

  /**
   * Copy wallet address to clipboard
   */
  const copyAddress = useCallback(() => {
    if (!fullAddress) return;

    navigator.clipboard.writeText(fullAddress).then(
      () => {
        setIsCopied(true);
        toast.success("Address copied to clipboard");
        
        // Reset copied state after animation
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      },
      (err) => {
        console.error("Failed to copy address:", err);
        toast.error("Failed to copy address");
      }
    );
  }, [fullAddress]);

  /**
   * Handle wallet disconnect with confirmation
   */
  const handleDisconnect = useCallback(async () => {
    try {
      if (disconnect) {
        await disconnect();
        toast.success("Wallet disconnected");
        setBalance(0);
        setNetworkStatus('disconnected');
      }
    } catch (err) {
      console.error("Error disconnecting wallet:", err);
      toast.error("Failed to disconnect wallet");
    }
  }, [disconnect]);

  /**
   * Toggle theme between light and dark mode
   */
  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
    toast.success(`Switched to ${isDark ? 'light' : 'dark'} mode`);
  }, [isDark, setTheme]);

  // Effect to fetch balance when wallet connects and set up refresh interval
  useEffect(() => {
    // Fetch balance initially
    if (safeWallet.connected && safeWallet.publicKey) {
      fetchBalance();
    }

    // Set up refresh interval (every 30 seconds)
    const interval = setInterval(() => {
      if (safeWallet.connected && safeWallet.publicKey) {
        fetchBalance();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchBalance, safeWallet.connected, safeWallet.publicKey]);

  // Return loading skeleton if wallet is in connecting state
  if (safeWallet.connecting) {
    return (
      <div className="flex items-center">
        <Button variant="ghost" size="sm" disabled className="gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> 
          <span>Connecting...</span>
        </Button>
      </div>
    );
  }

  // Return disconnect button if wallet is in disconnecting state
  if (safeWallet.disconnecting) {
    return (
      <div className="flex items-center">
        <Button variant="ghost" size="sm" disabled className="gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Disconnecting...</span>
        </Button>
      </div>
    );
  }

  // If not connected, return null
  if (!safeWallet.connected || !safeWallet.publicKey) {
    return null;
  }

  // Determine if we're on testnet based on endpoint or env var
  const isTestnet = NETWORK_CONFIG.endpoint.includes('devnet') || 
                    NETWORK_CONFIG.endpoint.includes('testnet') || 
                    import.meta.env.VITE_SOLANA_NETWORK !== 'mainnet-beta';
                    
  // Get network name for display
  const networkName = isTestnet ? 'Devnet' : 'Mainnet';

  // Main dropdown component when connected
  return (
    <div className="flex items-center gap-2">
      {/* Balance Display with Refresh */}
      <BalanceDisplayButton 
        balance={balance} 
        isLoading={isLoading} 
        onClick={fetchBalance} 
      />

      {/* User Dropdown Menu */}
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={cn(
                    "h-9 w-9 rounded-full border-2",
                    "hover:border-pink-500 dark:hover:border-blue-400",
                    "transition-colors duration-200",
                    "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-950 dark:to-indigo-950"
                  )}
                >
                  <Avatar className="h-7 w-7 bg-gradient-to-r from-purple-500 to-pink-600 dark:from-blue-600 dark:to-indigo-800">
                    <User className="h-4 w-4 text-white" />
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="font-mono text-xs">
                {truncatedAddress}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent align="end" className="w-56 p-2 border border-pink-300/20 dark:border-blue-500/20">
          {/* Header */}
          <div className="px-2 py-1.5 mb-1">
            <p className="font-heading font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-700 dark:from-blue-400 dark:to-indigo-300">
              {safeWallet.walletName}
            </p>
            
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {truncatedAddress}
              </span>
              <button 
                onClick={copyAddress} 
                className="text-pink-500 dark:text-blue-400 hover:opacity-80"
              >
                {isCopied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-pink-300/20 dark:via-blue-500/20 to-transparent my-1" />

          {/* Wallet Details */}
          <div className="px-2 py-1.5 mb-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Balance:</span>
              <span className="font-mono font-bold text-sm">
                {balance.toFixed(4)} SOL
              </span>
            </div>
            
            {usdValue !== null && (
              <div className="flex justify-between items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span>USD Value:</span>
                <span>${usdValue.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>Network:</span>
              <div className="flex items-center gap-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  networkStatus === 'connected' ? 'bg-green-400' : 
                  networkStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400'
                )} />
                <span>{networkName}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>Last updated:</span>
              <span>{lastRefreshed ? lastRefreshed.toLocaleTimeString() : 'Never'}</span>
            </div>
          </div>

          <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-pink-300/20 dark:via-blue-500/20 to-transparent my-1" />

          {/* Menu Actions */}
          <DropdownMenuItem className={menuItemClasses} onClick={() => navigate('/profile')}>
            <User className="h-4 w-4 text-pink-500 dark:text-blue-400" />
            <span>Profile</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem className={menuItemClasses} onClick={() => navigate('/settings')}>
            <Settings className="h-4 w-4 text-pink-500 dark:text-blue-400" />
            <span>Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onSelect={(e) => {
              e.preventDefault();
              toggleTheme();
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-shield-blue" />
            ) : (
              <Moon className="h-4 w-4 text-shield-purple" />
            )}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem className={menuItemClasses} 
            onClick={() => window.open(`https://explorer.solana.com/address/${fullAddress}${isTestnet ? `?cluster=${import.meta.env.VITE_SOLANA_NETWORK || 'devnet'}` : ''}`, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="h-4 w-4 text-pink-500 dark:text-blue-400" />
            <span>View on Explorer</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-pink-300/20 dark:via-blue-500/20 to-transparent my-1" />
          
          <DropdownMenuItem className={menuItemClasses} onClick={handleDisconnect}>
            <LogOut className="h-4 w-4 text-red-500" />
            <span className="text-red-500">Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserDropdown;
