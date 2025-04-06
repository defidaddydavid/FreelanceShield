import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Coins, ExternalLink, Wallet } from "lucide-react";
import WalletAvatar from "./WalletAvatar";
import cn from "classnames";

interface WalletInfoCardProps {
  className?: string;
  showActions?: boolean;
}

/**
 * Wallet info card component that displays wallet information and balance
 * Uses the new color scheme and font styles
 */
const WalletInfoCard: React.FC<WalletInfoCardProps> = ({ 
  className = "", 
  showActions = true 
}) => {
  const { publicKey, connected, wallet, balance } = useWallet();
  
  // Format SOL balance with proper decimals
  const formatBalance = (lamports: number | undefined) => {
    if (lamports === undefined) return "0";
    return (lamports / LAMPORTS_PER_SOL).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  // Shorten wallet address for display
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!connected || !publicKey) {
    return (
      <Card className={cn(
        "border-shield-purple/20 bg-white dark:bg-gray-900",
        "hover:shadow-md transition-shadow duration-200",
        className
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-heading text-shield-purple dark:text-shield-blue">
            <Wallet className="mr-2 h-5 w-5 inline" />
            Wallet
          </CardTitle>
          <CardDescription>Connect your wallet to view details</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-shield-purple/20 bg-white dark:bg-gray-900",
      "hover:shadow-md transition-shadow duration-200",
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-heading text-shield-purple dark:text-shield-blue">
          <Wallet className="mr-2 h-5 w-5 inline" />
          Wallet Connected
        </CardTitle>
        <CardDescription className="text-shield-purple dark:text-shield-blue">
          {wallet?.adapter.name || "Unknown Wallet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-4 mb-4">
          <WalletAvatar size="lg" />
          <div>
            <h3 className="font-heading text-lg font-medium">
              {shortenAddress(publicKey.toBase58())}
            </h3>
            <div className="flex items-center mt-1">
              <Coins className="h-4 w-4 text-shield-blue mr-1" />
              <span className="font-numeric text-lg">
                {formatBalance(balance)} SOL
              </span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">Network</div>
            <div className="font-medium">Devnet</div>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              <span className="font-medium">Connected</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      {showActions && (
        <CardFooter className="flex flex-col space-y-2 pt-2">
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center">
              <Shield className="mr-2 h-4 w-4 text-shield-purple" />
              View on Explorer
            </span>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default WalletInfoCard;
