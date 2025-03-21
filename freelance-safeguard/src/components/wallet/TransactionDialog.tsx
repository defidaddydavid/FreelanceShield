import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Transaction } from '@solana/web3.js';
import { Loader2, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type TransactionType = 'stake' | 'unstake' | 'claim' | 'policy' | 'other';

interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  transactionType: TransactionType;
  isPending: boolean;
  isBatch: boolean;
}

export const TransactionDialog: React.FC<TransactionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  transactionType,
  isPending,
  isBatch
}) => {
  const getTransactionTypeIcon = () => {
    switch (transactionType) {
      case 'stake':
        return <Badge variant="outline" className="bg-blue-50">Staking</Badge>;
      case 'unstake':
        return <Badge variant="outline" className="bg-amber-50">Unstaking</Badge>;
      case 'claim':
        return <Badge variant="outline" className="bg-green-50">Claim Rewards</Badge>;
      case 'policy':
        return <Badge variant="outline" className="bg-purple-50">Insurance Policy</Badge>;
      default:
        return <Badge variant="outline">Transaction</Badge>;
    }
  };

  const getTransactionWarning = () => {
    switch (transactionType) {
      case 'stake':
        return (
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md mt-4">
            <ShieldAlert className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Staking Information</p>
              <p className="mt-1">
                By staking your tokens, you're helping secure the FreelanceShield network and earning rewards.
                Staked tokens will be locked for the specified period.
              </p>
            </div>
          </div>
        );
      case 'unstake':
        return (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-md mt-4">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="text-sm text-amber-700">
              <p className="font-medium">Unstaking Warning</p>
              <p className="mt-1">
                You are about to unstake your tokens. This will remove them from the staking pool
                and you'll no longer earn rewards for this position.
              </p>
            </div>
          </div>
        );
      case 'policy':
        return (
          <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-md mt-4">
            <ShieldAlert className="h-5 w-5 text-purple-500 mt-0.5" />
            <div className="text-sm text-purple-700">
              <p className="font-medium">Policy Transaction</p>
              <p className="mt-1">
                This transaction will create or modify an insurance policy. Please review the details
                carefully before confirming.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
            {getTransactionTypeIcon()}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {getTransactionWarning()}
        
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <div className="text-sm">
            <p className="font-medium">Transaction Details</p>
            <p className="text-muted-foreground mt-1">
              {isBatch ? 'Multiple transactions will be signed and sent.' : 'This transaction will be signed and sent to the Solana network.'}
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex flex-row justify-between sm:justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Confirm Transaction
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDialog;
