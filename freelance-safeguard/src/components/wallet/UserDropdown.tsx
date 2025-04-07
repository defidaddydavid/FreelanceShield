import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
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
  Check
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

function UserDropdown() {
  const wallet = useSafeWallet();
  
  // Now safe to use wallet properties
  return (
    <div>
      {wallet.connected ? (
        <div>Connected: {wallet.publicKey?.toString()}</div>
      ) : (
        <div>Not connected</div>
      )}
    </div>
  );
}
// Define menu item styling
const menuItemClasses = cn(
  "flex items-center gap-2 px-2 py-2 rounded-md",
  "text-sm font-medium",
  "focus:bg-shield-purple/10 dark:focus:bg-shield-blue/20",
  "cursor-pointer transition-colors"
);

/**
 * UserDropdown Component
 * 
 * A dropdown menu component for Solana wallet users that displays wallet information,
 * balance, and provides navigation options.
 */
const UserDropdown = () => {
  // Theme context
  const { isDark } = useSolanaTheme();
  
  // Wallet connection state from Solana wallet adapter
  const { publicKey, disconnect, connected, wallet } = useWallet();
  
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
    { commitment: NETWORK_CONFIG.connectionConfig.commitment }
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
  const truncatedAddress = publicKey ? shortenAddress(publicKey.toBase58()) : '';
  const fullAddress = publicKey ? publicKey.toBase58() : '';

  // Effect to fetch balance when wallet connects and set up refresh interval
  useEffect(() => {
    if (connected && publicKey) {
      console.log('Wallet connected:', publicKey.toBase58());
      fetchBalance();
      fetchSolPrice();

      // Set up an interval to refresh the balance every 30 seconds
      const intervalId = setInterval(() => {
        fetchBalance();
      }, 30000);

      // Set up an interval to refresh the SOL price every 5 minutes
      const priceIntervalId = setInterval(() => {
        fetchSolPrice();
      }, 300000);

      // Clean up intervals on component unmount or wallet disconnect
      return () => {
        clearInterval(intervalId);
        clearInterval(priceIntervalId);
      };
    } else {
      console.log('Wallet disconnected');
      setNetworkStatus('disconnected');
    }
  }, [connected, publicKey]);

  /**
   * Fetches the current SOL price in USD
   */
  const fetchSolPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const data = await response.json();
      if (data && data.solana && data.solana.usd) {
        setSolPrice(data.solana.usd);
        // Update USD value if we have balance
        if (balance > 0) {
          setUsdValue(balance * data.solana.usd);
        }
      }
    } catch (error) {
      console.error('Error fetching SOL price:', error);
    }
  };

  /**
   * Fetches the current SOL balance for the connected wallet
   */
  const fetchBalance = async () => {
    if (!publicKey || !connected) return;

    setIsLoading(true);
    try {
      const bal = await connection.getBalance(publicKey);
      const solBalance = bal / LAMPORTS_PER_SOL;
      setBalance(solBalance);
      
      // Update USD value if we have SOL price
      if (solPrice) {
        setUsdValue(solBalance * solPrice);
      }
      
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

  /**
   * Copies wallet address to clipboard
   */
  const copyAddress = () => {
    if (!publicKey) return;
    
    navigator.clipboard.writeText(publicKey.toBase58())
      .then(() => {
        setIsCopied(true);
        toast.success('Address copied to clipboard');
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy address:', err);
        toast.error('Failed to copy address');
      });
  };

  /**
   * Opens the wallet address in Solana Explorer
   */
  const viewInExplorer = () => {
    if (!publicKey) return;
    
    const explorerUrl = `https://${NETWORK_CONFIG.isTestnet ? 'explorer.solana.com' : 'solscan.io'}/address/${publicKey.toBase58()}${NETWORK_CONFIG.isTestnet ? '?cluster=devnet' : ''}`;
    window.open(explorerUrl, '_blank');
  };

  /**
   * Handles wallet disconnection with proper state management
   */
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

  /**
   * Navigates to the dashboard page
   */
  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  /**
   * Navigates to the staking page
   */
  const handleStakingClick = () => {
    navigate('/staking');
  };

  /**
   * Requests an airdrop of 1 SOL (only available on testnet)
   */
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

  // If not connected, return null (could be replaced with a connect button if needed)
  if (!connected || !publicKey) {
    return null;
  }

  // Format the last refreshed time
  const formattedLastRefreshed = lastRefreshed 
    ? lastRefreshed.toLocaleTimeString() 
    : 'Never';

  return (
    <TooltipProvider>
      <DropdownMenu>
        {/* Dropdown Trigger Button */}
        <DropdownMenuTrigger asChild>
          <button className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
            "hover:bg-shield-purple/10 dark:hover:bg-shield-blue/20",
            "focus:outline-none focus:ring-2",
            isDark 
              ? "focus:ring-shield-blue/50" 
              : "focus:ring-shield-purple/50",
            isLoading && "opacity-70 cursor-wait"
          )}>
            {isLoading ? (
              <Loader2 className={cn(
                "h-4 w-4 animate-spin",
                isDark ? "text-shield-blue" : "text-shield-purple"
              )} />
            ) : (
              <Avatar 
                size="sm" 
                walletAddress={publicKey.toBase58()}
                className={cn(
                  "border-2",
                  isDark ? "border-shield-blue" : "border-shield-purple"
                )}
              />
            )}
            <span className={cn(
              "font-medium",
              isDark ? "text-shield-blue" : "text-shield-purple"
            )}>
              {truncatedAddress}
            </span>
          </button>
        </DropdownMenuTrigger>
        
        {/* Dropdown Content */}
        <DropdownMenuContent 
          className={cn(
            "w-64 p-1 rounded-lg",
            "bg-white dark:bg-gray-900",
            "border",
            isDark 
              ? "border-shield-blue/20" 
              : "border-shield-purple/20",
            "shadow-lg"
          )}
        >
          {/* Wallet Information Header */}
          <div className="px-3 py-2 mb-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-medium",
                  isDark ? "text-shield-blue" : "text-shield-purple"
                )}>
                  {wallet?.adapter.name || 'Wallet'}
                </span>
                <div className={cn(
                  "px-1.5 py-0.5 text-xs rounded-full",
                  isDark 
                    ? "bg-shield-blue/10 text-shield-blue" 
                    : "bg-shield-purple/10 text-shield-purple"
                )}>
                  {NETWORK_CONFIG.isTestnet ? 'Testnet' : 'Mainnet'}
                </div>
              </div>
              <div className="flex gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={copyAddress} 
                      className={cn(
                        "p-1 rounded-md transition-colors",
                        isDark 
                          ? "hover:bg-gray-800 text-gray-400 hover:text-gray-200" 
                          : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                      )}
                      aria-label="Copy address"
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy address</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={viewInExplorer} 
                      className={cn(
                        "p-1 rounded-md transition-colors",
                        isDark 
                          ? "hover:bg-gray-800 text-gray-400 hover:text-gray-200" 
                          : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                      )}
                      aria-label="View in explorer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View in explorer</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            {/* Address Display */}
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
              {fullAddress}
            </div>
          </div>
          
          <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
          
          {/* Balance Information Section */}
          <div className="px-3 py-2 mb-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Balance</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={fetchBalance} 
                    className={cn(
                      "p-1 rounded-md transition-colors",
                      isDark 
                        ? "hover:bg-gray-800 text-shield-blue hover:text-shield-blue" 
                        : "hover:bg-gray-100 text-shield-purple hover:text-shield-purple"
                    )}
                    disabled={isLoading}
                    aria-label="Refresh balance"
                  >
                    <RefreshCw className={cn(
                      "h-3.5 w-3.5",
                      isLoading && "animate-spin"
                    )} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh balance</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            {/* SOL Balance */}
            <div className="flex items-center gap-1 mt-1">
              <Coins className={cn(
                "h-4 w-4",
                isDark ? "text-shield-blue" : "text-shield-purple"
              )} />
              <span className="font-medium text-base">
                {balance.toFixed(4)} SOL
              </span>
            </div>
            
            {/* USD Value */}
            {usdValue !== null && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                ≈ ${usdValue.toFixed(2)} USD
                {solPrice && <span className="ml-1">@ ${solPrice.toFixed(2)}</span>}
              </div>
            )}
            
            {/* Network Status Indicator */}
            <div className="text-xs text-gray-400 mt-2 flex items-center justify-between">
              <div className="flex items-center">
                <span className={cn(
                  "inline-block w-2 h-2 rounded-full mr-1",
                  networkStatus === 'connected' && "bg-green-500",
                  networkStatus === 'disconnected' && "bg-gray-500",
                  networkStatus === 'error' && "bg-red-500"
                )}></span>
                {networkStatus === 'connected' ? 'Connected' : 
                 networkStatus === 'error' ? 'Connection Error' : 'Disconnected'}
              </div>
              {lastRefreshed && (
                <span className="text-xs text-gray-400">
                  Updated: {formattedLastRefreshed}
                </span>
              )}
            </div>
          </div>
          
          <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
          
          {/* Navigation Options */}
          <DropdownMenuItem 
            className={menuItemClasses}
            onClick={handleDashboardClick}
          >
            <Shield className="h-4 w-4" />
            Dashboard
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className={menuItemClasses}
            onClick={handleStakingClick}
          >
            <Coins className="h-4 w-4" />
            Staking
          </DropdownMenuItem>
          
          {/* Only show airdrop in development or testnet */}
          {NETWORK_CONFIG.isTestnet && (
            <DropdownMenuItem 
              className={menuItemClasses}
              onClick={handleRequestAirdrop}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4" />
              Request Airdrop
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
          
          {/* User Options */}
          <DropdownMenuItem className={menuItemClasses}>
            <User className="h-4 w-4" />
            Profile
          </DropdownMenuItem>
          
          <DropdownMenuItem className={menuItemClasses}>
            <Settings className="h-4 w-4" />
            Settings
          </DropdownMenuItem>
          
          {/* Disconnect Option */}
          <DropdownMenuItem 
            className={cn(menuItemClasses, "text-red-500 focus:text-red-500")}
            onClick={handleDisconnect}
            disabled={isLoading}
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
};

export default UserDropdown;
