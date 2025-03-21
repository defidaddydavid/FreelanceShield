import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Wallet, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WalletConnect from '@/components/wallet/WalletConnect';
import { Progress } from '@/components/ui/progress';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSolanaInsurance } from '@/hooks/useSolanaInsurance';
import { formatCurrency } from '@/lib/utils';
import { useInsuranceOperations } from '@/hooks/useInsuranceOperations';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export function DashboardWalletInfo() {
  const { publicKey, connected } = useWallet();
  const { policyDetails, isPolicyLoading } = useInsuranceOperations();
  const { getWalletBalance } = useSolanaInsurance();
  
  const [walletData, setWalletData] = useState({
    balance: '0',
    insuranceStatus: 'Unprotected',
    solanaPrice: '$154.32', // This would come from an API in a real app
    totalInsured: '0',
    networkStatus: 'Mainnet',
    insuranceHealth: 0
  });
  const [loading, setLoading] = useState(false);

  // Load real wallet data when connected
  useEffect(() => {
    const loadWalletData = async () => {
      if (publicKey && connected) {
        setLoading(true);
        try {
          // Get actual wallet balance
          const balance = await getWalletBalance(publicKey);
          const balanceInSOL = balance / LAMPORTS_PER_SOL;
          
          setWalletData(prev => ({
            ...prev,
            balance: balanceInSOL.toFixed(2),
            insuranceStatus: policyDetails?.status === 'active' ? 'Protected' : 'Unprotected',
            totalInsured: policyDetails ? formatCurrency(policyDetails.coverageAmount).replace('$', '') : '0',
            insuranceHealth: policyDetails?.status === 'active' ? 85 : 0
          }));
        } catch (error) {
          console.error("Error loading wallet data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadWalletData();
  }, [publicKey, connected, policyDetails, getWalletBalance]);

  const refreshWalletData = async () => {
    if (!publicKey || !connected) return;
    
    setLoading(true);
    try {
      // Get actual wallet balance
      const balance = await getWalletBalance(publicKey);
      const balanceInSOL = balance / LAMPORTS_PER_SOL;
      
      setWalletData(prev => ({
        ...prev,
        balance: balanceInSOL.toFixed(2)
      }));
    } catch (error) {
      console.error("Error refreshing wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wallet className="h-5 w-5 text-shield-blue mr-2" />
          Wallet Status
        </CardTitle>
        <CardDescription>
          Connect your Solana wallet to manage your insurance policies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <WalletConnect />
        </div>
        
        {connected && publicKey && (
          <>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Balance:</span>
                <div className="flex items-center">
                  <span className="font-medium">{walletData.balance} SOL</span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({walletData.solanaPrice})
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Insurance Status:</span>
                <Badge className={`${walletData.insuranceStatus === 'Protected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {walletData.insuranceStatus}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Value Insured:</span>
                <span className="font-medium">${walletData.totalInsured}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Network:</span>
                <Badge variant="outline">{walletData.networkStatus}</Badge>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Insurance Health:</span>
                  <span className="font-medium">{walletData.insuranceHealth}%</span>
                </div>
                <Progress value={walletData.insuranceHealth} className="h-2" />
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4"
              onClick={refreshWalletData}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </>
        )}
        
        {(!connected || !publicKey) && (
          <div className="flex flex-col items-center justify-center p-4 mt-2 bg-muted/50 rounded-lg">
            <Shield className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-center text-sm text-muted-foreground">
              Connect your wallet to view your insurance status and manage your coverage
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
