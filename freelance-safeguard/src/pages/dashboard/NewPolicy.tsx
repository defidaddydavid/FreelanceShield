import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PolicyHeader } from '@/components/policy/PolicyHeader';
import { PolicyDetailsForm } from '@/components/policy/PolicyDetailsForm';
import { Shield } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { NETWORK_CONFIG } from '@/lib/solana/constants';
import { useEffect } from 'react';
import { toast } from 'sonner';

const NewPolicy = () => {
  const { connected, connecting, publicKey } = useWallet();
  
  // Notify user about devnet usage
  useEffect(() => {
    if (connected && publicKey) {
      toast.info("Connected to Solana Devnet", {
        description: "You are creating a policy on the Solana devnet. Real USDC tokens will be required.",
        duration: 5000,
      });
    }
  }, [connected, publicKey]);

  return (
    <DashboardLayout>
      <PolicyHeader />
      
      {!connected && !connecting && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wallet Connection Required</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>You need to connect your Solana wallet to create a policy. All transactions will be processed on the Solana devnet ({NETWORK_CONFIG.endpoint}).</p>
            <div className="mt-2">
              <WalletMultiButton className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-4 py-2 text-sm font-medium" />
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {connecting && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connecting Wallet</AlertTitle>
          <AlertDescription>
            Please complete the wallet connection process to continue.
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center mb-2">
            <Shield className="h-5 w-5 text-shield-blue mr-2" />
            <CardTitle>Policy Details</CardTitle>
          </div>
          <CardDescription>
            Fill out the form below to create a new insurance policy. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PolicyDetailsForm />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default NewPolicy;
