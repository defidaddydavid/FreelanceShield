import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { cn } from '@/lib/utils';
import { ChevronDown, Wallet } from 'lucide-react';

export function ConnectWalletPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "bg-shield-purple/10 hover:bg-shield-purple/20",
            "text-shield-purple dark:text-shield-blue",
            "font-heading"
          )}
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 bg-white dark:bg-gray-900 border-shield-purple/20">
        <WalletMultiButton className="w-full" />
      </PopoverContent>
    </Popover>
  );
};
