import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import ConnectWalletDialog from "./ConnectWalletDialog";

interface WalletRequiredProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  message?: string;
  title?: string;
}

/**
 * Component that requires a wallet connection to display its children
 * Shows a fallback UI with connect wallet button if not connected
 */
const WalletRequired: React.FC<WalletRequiredProps> = ({
  children,
  fallback,
  message = "Please connect your wallet to access this feature",
  title = "Wallet Connection Required",
}) => {
  const { connected } = useWallet();

  if (connected) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Alert variant="destructive" className="bg-shield-purple/10 border-shield-purple text-foreground">
      <AlertTriangle className="h-5 w-5 text-shield-purple" />
      <AlertTitle className="font-heading text-lg text-shield-purple">{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-4">{message}</p>
        <ConnectWalletDialog
          trigger={
            <Button className="bg-shield-purple hover:bg-shield-purple/90 text-white">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          }
        />
      </AlertDescription>
    </Alert>
  );
};

export default WalletRequired;
