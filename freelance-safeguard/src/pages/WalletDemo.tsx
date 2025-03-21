import React from 'react';
import { InsuranceWalletDemo } from '../components/wallet/InsuranceWalletDemo';
import { EnhancedWalletSelector } from '../components/wallet/EnhancedWalletSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const WalletDemo = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">FreelanceShield Wallet Integration</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Multi-Wallet Support</CardTitle>
            <CardDescription>
              Connect with your preferred Solana wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <EnhancedWalletSelector />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Supported Wallets</CardTitle>
            <CardDescription>
              Choose from multiple wallet providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <img src="../assets/wallets/phantom.svg" alt="Phantom" className="w-5 h-5 mr-2" />
                Phantom
              </li>
              <li className="flex items-center">
                <img src="../assets/wallets/solflare.svg" alt="Solflare" className="w-5 h-5 mr-2" />
                Solflare
              </li>
              <li className="flex items-center">
                <img src="../assets/wallets/backpack.svg" alt="Backpack" className="w-5 h-5 mr-2" />
                Backpack
              </li>
              <li className="flex items-center">
                <img src="../assets/wallets/ledger.svg" alt="Ledger" className="w-5 h-5 mr-2" />
                Ledger
              </li>
              <li className="flex items-center">
                <img src="../assets/wallets/torus.svg" alt="Torus" className="w-5 h-5 mr-2" />
                Torus
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Wallet Features</CardTitle>
            <CardDescription>
              Integrated wallet functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Balance checking
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Transaction signing
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Policy creation
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Claim submission
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Risk pool staking
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="insurance" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="insurance">Insurance Integration</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>
        <TabsContent value="insurance" className="mt-6">
          <InsuranceWalletDemo />
        </TabsContent>
        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View your recent transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Connect your wallet to view transaction history
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletDemo;
