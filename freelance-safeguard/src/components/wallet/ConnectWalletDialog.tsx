import React from "react";
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { cn } from '@/lib/utils';

export function ConnectWalletDialog() {
  const { visible, setVisible } = useWalletModal();
  
  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent className="max-w-md rounded-xl bg-white dark:bg-gray-900 border-shield-purple/20">
        <DialogHeader className="text-center">
          <h2 className={cn(
            "text-2xl font-heading text-shield-purple dark:text-shield-blue",
            "mb-4"
          )}>
            Connect Wallet
          </h2>
          <p className="text-muted-foreground text-sm">
            Choose a wallet to connect to FreelanceShield
          </p>
        </DialogHeader>
        <div className="flex flex-col gap-2 p-4">
          <WalletMultiButton className="w-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
};
