import React, { useState } from 'react';
import { WalletConnection } from './WalletConnection';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSolana } from '../../lib/solana/SolanaProvider';
import { useFreelanceInsurance, useReputationProgram, usePremiumCalculation } from '../../lib/solana/hooks';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { Loader2 } from 'lucide-react';

/**
 * SolanaIntegrationTest component
 * 
 * This component is used to test the Solana integration and SDK functionality.
 * It provides buttons to test various SDK functions and displays the results.
 */
export function SolanaIntegrationTest() {
  const { connected } = useWallet();
  const { connection } = useSolana();
  const { getPolicy, isLoading: isPolicyLoading } = useFreelanceInsurance();
  const { getUserProfile, isLoading: isProfileLoading } = useReputationProgram();
  const { calculatePremium } = usePremiumCalculation();
  
  const [testResults, setTestResults] = useState<{
    action: string;
    status: 'success' | 'error' | 'pending';
    message: string;
  }[]>([]);

  // Add a test result to the list
  const addTestResult = (action: string, status: 'success' | 'error' | 'pending', message: string) => {
    setTestResults(prev => [{ action, status, message }, ...prev].slice(0, 5));
  };

  // Test connection to Solana
  const testConnection = async () => {
    if (!connection) {
      addTestResult('Test Connection', 'error', 'No connection available');
      return;
    }

    try {
      addTestResult('Test Connection', 'pending', 'Testing connection...');
      const version = await connection.getVersion();
      addTestResult('Test Connection', 'success', `Connected to Solana ${version['solana-core']}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addTestResult('Test Connection', 'error', `Connection failed: ${errorMessage}`);
    }
  };

  // Test getting user policy
  const testGetPolicy = async () => {
    try {
      addTestResult('Get Policy', 'pending', 'Fetching policy...');
      const { policy, error } = await getPolicy();
      
      if (error) {
        addTestResult('Get Policy', 'error', `Error: ${error}`);
        return;
      }
      
      if (!policy) {
        addTestResult('Get Policy', 'success', 'No policy found for this wallet');
        return;
      }
      
      addTestResult('Get Policy', 'success', `Policy found: ${policy.publicKey.toString().slice(0, 8)}...`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addTestResult('Get Policy', 'error', `Error: ${errorMessage}`);
    }
  };

  // Test getting user profile
  const testGetProfile = async () => {
    try {
      addTestResult('Get Profile', 'pending', 'Fetching profile...');
      const { profile, error } = await getUserProfile();
      
      if (error) {
        addTestResult('Get Profile', 'error', `Error: ${error}`);
        return;
      }
      
      if (!profile) {
        addTestResult('Get Profile', 'success', 'No profile found for this wallet');
        return;
      }
      
      addTestResult('Get Profile', 'success', `Profile found: Score ${profile.reputationScore}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addTestResult('Get Profile', 'error', `Error: ${errorMessage}`);
    }
  };

  // Test premium calculation
  const testPremiumCalculation = async () => {
    try {
      addTestResult('Calculate Premium', 'pending', 'Calculating premium...');
      
      // Example values
      const coverageAmount = 1000; // 1000 USDC
      const periodDays = 30;
      const jobType = 'development';
      const industry = 'technology';
      
      const premiumResult = await calculatePremium({
        coverageAmount,
        periodDays,
        jobType,
        industry,
        // The reputation factor will be handled internally by the calculatePremium function
      });
      
      addTestResult(
        'Calculate Premium', 
        'success', 
        `Premium: ${premiumResult.premiumAmount.toFixed(2)} USDC for ${coverageAmount} USDC coverage`
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addTestResult('Calculate Premium', 'error', `Error: ${errorMessage}`);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Solana Integration Test</CardTitle>
        <CardDescription>
          Test the Solana integration and SDK functionality
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Wallet Connection</h3>
          <WalletConnection />
        </div>
        
        {connected && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Test SDK Functions</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={testConnection}
                  variant="outline"
                >
                  Test Connection
                </Button>
                
                <Button 
                  onClick={testGetPolicy}
                  variant="outline"
                  disabled={isPolicyLoading}
                >
                  {isPolicyLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading Policy</>
                  ) : (
                    'Get Policy'
                  )}
                </Button>
                
                <Button 
                  onClick={testGetProfile}
                  variant="outline"
                  disabled={isProfileLoading}
                >
                  {isProfileLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading Profile</>
                  ) : (
                    'Get Profile'
                  )}
                </Button>
                
                <Button 
                  onClick={testPremiumCalculation}
                  variant="outline"
                >
                  Calculate Premium
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Test Results</h3>
              
              {testResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tests run yet</p>
              ) : (
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border rounded-md">
                      <Badge 
                        variant={
                          result.status === 'success' ? 'default' : 
                          result.status === 'error' ? 'destructive' : 
                          'outline'
                        }
                      >
                        {result.status === 'pending' ? (
                          <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Pending</>
                        ) : (
                          result.status.charAt(0).toUpperCase() + result.status.slice(1)
                        )}
                      </Badge>
                      <div>
                        <p className="font-medium">{result.action}</p>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Connected to {connection?.rpcEndpoint.includes('devnet') ? 'Devnet' : 'Mainnet'}
        </p>
      </CardFooter>
    </Card>
  );
}
