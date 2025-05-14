import React, { useEffect, useState } from 'react';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Wallet, RefreshCw, Coins, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import PrivyCardFunding from '@/components/funding/PrivyCardFunding';
import FundingSection from '@/components/funding/FundingSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Test page for Privy integration
 */
const PrivyTestPage: React.FC = () => {
  const { 
    login, 
    logout, 
    isAuthenticated, 
    ready, 
    user, 
    solanaPublicKey 
  } = usePrivyAuth();
  
  const {
    walletInfo,
    walletStatus,
    isInitializing,
    refreshBalance,
    requestAirdrop,
    balance,
    isConnected,
    formatAddress
  } = useUnifiedWallet();
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // Handle refresh balance
  const handleRefreshBalance = async () => {
    setIsLoading(true);
    try {
      await refreshBalance();
      toast.success('Balance refreshed');
    } catch (error) {
      console.error('Error refreshing balance:', error);
      toast.error('Failed to refresh balance');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle airdrop request
  const handleRequestAirdrop = async () => {
    setIsLoading(true);
    try {
      const signature = await requestAirdrop(1);
      if (signature) {
        toast.success('Airdrop successful! 1 SOL received');
      }
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      toast.error('Failed to request airdrop');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle funding success
  const handleFundingSuccess = (txHash: string) => {
    setLastTxHash(txHash);
    toast.success('Funding successful!');
    // Refresh balance after funding
    refreshBalance();
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Privy Integration Test</h1>
      
      <Tabs defaultValue="auth" className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="funding">Card Funding</TabsTrigger>
        </TabsList>
        
        <TabsContent value="auth" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Authentication Status */}
            <Card>
              <CardHeader>
                <CardTitle>Authentication Status</CardTitle>
                <CardDescription>Current Privy authentication state</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Ready:</span>
                    <span>{ready ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Authenticated:</span>
                    <span>{isAuthenticated ? 'Yes' : 'No'}</span>
                  </div>
                  {user && (
                    <>
                      <Separator className="my-2" />
                      <div className="flex justify-between">
                        <span className="font-medium">User ID:</span>
                        <span className="truncate max-w-[200px]">{user.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Email:</span>
                        <span>{user.email?.address || 'Not provided'}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                {!isAuthenticated ? (
                  <Button onClick={() => login()} disabled={isLoading || !ready}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wallet className="mr-2 h-4 w-4" />
                    )}
                    Login with Privy
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={() => logout()} disabled={isLoading || !ready}>
                    Logout
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Linked Accounts */}
            {user && user.linkedAccounts && user.linkedAccounts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Linked Accounts</CardTitle>
                  <CardDescription>All accounts linked to this user</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {user.linkedAccounts.map((account: any, index: number) => (
                      <div key={index} className="p-4 border rounded-md">
                        <div className="flex justify-between">
                          <span className="font-medium">Type:</span>
                          <span>{account.type}</span>
                        </div>
                        {account.type === 'wallet' && (
                          <>
                            <div className="flex justify-between mt-1">
                              <span className="font-medium">Wallet Type:</span>
                              <span>{account.walletClientType || account.walletType || 'Unknown'}</span>
                            </div>
                            {account.address && (
                              <div className="flex justify-between mt-1">
                                <span className="font-medium">Address:</span>
                                <span className="font-mono text-sm truncate max-w-[300px]">{account.address}</span>
                              </div>
                            )}
                          </>
                        )}
                        {account.type === 'email' && account.address && (
                          <div className="flex justify-between mt-1">
                            <span className="font-medium">Email:</span>
                            <span>{account.address}</span>
                          </div>
                        )}
                        {account.type === 'google' && account.email && (
                          <div className="flex justify-between mt-1">
                            <span className="font-medium">Google Email:</span>
                            <span>{account.email}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="wallet" className="mt-4">
          {/* Wallet Status */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Status</CardTitle>
              <CardDescription>Current wallet connection state</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Connected:</span>
                  <span>{isConnected ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Initializing:</span>
                  <span>{isInitializing ? 'Yes' : 'No'}</span>
                </div>
                {isConnected && (
                  <>
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="font-medium">Address:</span>
                      <span className="font-mono text-sm truncate max-w-[200px]">
                        {walletInfo.address}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Type:</span>
                      <span>{walletInfo.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Balance:</span>
                      <span>{balance.toFixed(4)} SOL</span>
                    </div>
                  </>
                )}
                {walletStatus.hasError && (
                  <div className="mt-2 text-red-500 text-sm">
                    Error: {walletStatus.errorMessage || 'Unknown error'}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={handleRefreshBalance} 
                disabled={!isConnected || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh Balance
              </Button>
              <Button 
                onClick={handleRequestAirdrop} 
                disabled={!isConnected || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Coins className="mr-2 h-4 w-4" />
                )}
                Request Airdrop
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="funding" className="mt-4">
          <div className="grid grid-cols-1 gap-6">
            {/* Card Funding Component */}
            <Card>
              <CardHeader>
                <CardTitle>Card Funding</CardTitle>
                <CardDescription>Test the card funding functionality</CardDescription>
              </CardHeader>
              <CardContent>
                <PrivyCardFunding onSuccess={handleFundingSuccess} />
              </CardContent>
            </Card>
            
            {lastTxHash && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                <h3 className="font-medium text-green-800 dark:text-green-300">Transaction Successful!</h3>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  Transaction hash: <code className="text-xs">{lastTxHash}</code>
                </p>
              </div>
            )}
            
            {/* Complete Funding Section */}
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Complete Funding Section</h2>
              <FundingSection />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrivyTestPage;
