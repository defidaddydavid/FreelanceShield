import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import ConnectWalletDialog from "./ConnectWalletDialog";
import UserDropdown from "./UserDropdown";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

interface WalletConnectButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showBalance?: boolean;
}

/**
 * Enhanced wallet connect button that uses Solana UI components
 * Provides a unified interface for connecting wallets and displaying user info
 */
const EnhancedWalletConnect: React.FC<WalletConnectButtonProps> = ({
  variant = "default",
  size = "default",
  className = "",
  showBalance = true,
}) => {
  const { connected } = useWallet();

  // If connected, show the user dropdown
  if (connected) {
    return <UserDropdown />;
  }

  // If not connected, show the connect wallet dialog
  return (
    <ConnectWalletDialog
      trigger={
        <Button variant={variant} size={size} className={className}>
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      }
    />
  );
};

export default EnhancedWalletConnect;
