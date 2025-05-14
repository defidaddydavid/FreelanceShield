import React from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { PrivyAuth } from "@/components/auth/PrivyAuth";

interface WalletRequiredProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  message?: string;
  title?: string;
}

/**
 * Component that requires a wallet connection to display its children
 * Shows a fallback UI with Privy authentication if not connected
 */
const WalletRequired: React.FC<WalletRequiredProps> = ({
  children,
  fallback,
  message = "Please connect your wallet to access this feature",
  title = "Wallet Connection Required",
}) => {
  const { authenticated, ready } = usePrivy();

  if (!ready) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-shield-purple" />
      </div>
    );
  }

  if (authenticated) {
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
        <div className="w-full max-w-sm">
          <PrivyAuth />
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default WalletRequired;
