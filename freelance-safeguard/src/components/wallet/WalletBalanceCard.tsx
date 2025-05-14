import React, { useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useConnection } from "@/hooks/useConnection";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, ArrowUpRight } from "lucide-react";

interface WalletBalanceCardProps {
  className?: string;
  showProgress?: boolean;
  targetBalance?: number;
}

/**
 * Wallet balance card component that displays wallet balance with optional progress bar
 * Uses the new color scheme and font styles
 */
const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({
  className = "",
  showProgress = false,
  targetBalance = 10,
}) => {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (connected && publicKey && connection) {
      connection.getBalance(publicKey).then(setBalance).catch(() => setBalance(undefined));
    }
  }, [connected, publicKey, connection]);

  // Format SOL balance with proper decimals
  const formatBalance = (lamports: number | undefined) => {
    if (lamports === undefined) return "0";
    return (lamports / LAMPORTS_PER_SOL).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  // Calculate progress percentage
  const calculateProgress = (current: number | undefined, target: number) => {
    if (current === undefined) return 0;
    const solBalance = current / LAMPORTS_PER_SOL;
    return Math.min(Math.round((solBalance / target) * 100), 100);
  };

  if (!connected) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-heading">Wallet Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-8 w-[180px]" />
            {showProgress && <Skeleton className="h-4 w-full" />}
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = calculateProgress(balance, targetBalance);

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-heading flex items-center justify-between">
          <span>Wallet Balance</span>
          <Coins className="h-5 w-5 text-shield-blue" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline">
          <span className="text-3xl font-numeric font-bold text-shield-purple">
            {formatBalance(balance)}
          </span>
          <span className="ml-2 text-muted-foreground">SOL</span>
          
          <div className="ml-auto flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <span>View</span>
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </div>
        </div>
        
        {showProgress && (
          <div className="mt-4 space-y-1">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progressPercent}% of target</span>
              <span>{targetBalance} SOL</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletBalanceCard;
