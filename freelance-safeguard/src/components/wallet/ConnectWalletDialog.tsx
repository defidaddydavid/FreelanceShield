import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { XIcon, LoaderCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogDescription,
  DialogTitle,
  DialogHeader,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ConnectWalletDialogProps = {
  trigger?: React.ReactNode;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<typeof Dialog>, "children">;

const ConnectWalletDialog = ({
  trigger,
  title,
  description,
  ...dialogProps
}: ConnectWalletDialogProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { wallets, select, connecting, wallet, connected } = useWallet();

  const handleWalletSelect = async (walletName: string) => {
    try {
      select(walletName);
      // Close dialog after a short delay to allow connection to initialize
      setTimeout(() => {
        if (connected) {
          setIsDialogOpen(false);
          toast.success(`Connected to ${walletName} successfully!`);
        }
      }, 1000);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet");
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} {...dialogProps}>
      <DialogTrigger asChild>
        {trigger || <Button className="bg-shield-blue hover:bg-shield-blue/90 text-white">Connect Wallet</Button>}
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <div className="fixed bottom-0 left-0 right-0 top-0 z-50 m-auto flex h-screen w-screen flex-col items-center justify-center gap-4 border bg-background/75 px-8 pb-10 pt-8 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:rounded-lg md:h-fit md:max-w-md">
          <DialogHeader className={cn("sm:text-center", !title && "sr-only")}>
            <DialogTitle className="text-2xl font-heading">
              {title || "Connect Wallet"}
            </DialogTitle>
            <DialogDescription className="text-base">
              {description || "Connect your wallet to continue"}
            </DialogDescription>
          </DialogHeader>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <ul className="mt-6 flex w-full flex-col justify-center gap-4 text-center">
            {wallets.map((walletItem) => (
              <li key={walletItem.adapter.name}>
                <Button
                  variant="secondary"
                  size="lg"
                  className="h-12 w-full justify-start gap-4 px-4 disabled:opacity-80"
                  onClick={() => handleWalletSelect(walletItem.adapter.name)}
                  disabled={connecting}
                >
                  {connecting && wallet?.adapter.name === walletItem.adapter.name ? (
                    <LoaderCircleIcon className="h-5 w-5 animate-spin" />
                  ) : (
                    <img
                      src={walletItem.adapter.icon}
                      alt={`${walletItem.adapter.name} icon`}
                      className="h-5 w-5"
                    />
                  )}
                  <span className="flex-1 text-left">{walletItem.adapter.name}</span>
                  {connecting && wallet?.adapter.name === walletItem.adapter.name && (
                    <span className="text-xs text-muted-foreground">Connecting...</span>
                  )}
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>New to Solana?</p>
            <a
              href="https://solana.com/developers/guides/getstarted/setup-a-wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-shield-blue hover:underline"
            >
              Learn how to set up a wallet
            </a>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
};

export default ConnectWalletDialog;
