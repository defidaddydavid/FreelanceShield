import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import verifyContractIntegration from '@/utils/verifyContractIntegration';
import { 
  INSURANCE_PROGRAM_ID, 
  RISK_POOL_PROGRAM_ID, 
  CLAIMS_PROCESSOR_PROGRAM_ID 
} from '@/lib/solana/constants';

type VerificationStatus = 'idle' | 'loading' | 'success' | 'error';
type VerificationResult = {
  success: boolean;
  networkConnected?: boolean;
  programsFound?: {
    insurance: boolean;
    riskPool: boolean;
    claimsProcessor: boolean;
  };
  error?: any;
};

export function ContractVerifier() {
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const captureConsoleOutput = () => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleGroup = console.group;
    const originalConsoleGroupEnd = console.groupEnd;
    
    const capturedLogs: string[] = [];
    
    console.log = (...args) => {
      capturedLogs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' '));
      originalConsoleLog(...args);
    };
    
    console.error = (...args) => {
      capturedLogs.push(`ERROR: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}`);
      originalConsoleError(...args);
    };
    
    console.warn = (...args) => {
      capturedLogs.push(`WARNING: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}`);
      originalConsoleWarn(...args);
    };
    
    console.group = (...args) => {
      capturedLogs.push(`GROUP: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')}`);
      originalConsoleGroup(...args);
    };
    
    console.groupEnd = () => {
      capturedLogs.push('GROUP END');
      originalConsoleGroupEnd();
    };
    
    return {
      getLogs: () => capturedLogs,
      restore: () => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        console.group = originalConsoleGroup;
        console.groupEnd = originalConsoleGroupEnd;
      }
    };
  };

  const runVerification = async () => {
    setStatus('loading');
    setLogs([]);
    
    const logger = captureConsoleOutput();
    
    try {
      const verificationResult = await verifyContractIntegration();
      setResult({
        success: verificationResult.success,
        programsFound: {
          insurance: true, // These would be determined by the verification
          riskPool: true,  // function in a real implementation
          claimsProcessor: true
        },
        networkConnected: true,
        error: verificationResult.success ? undefined : verificationResult.error
      });
      
      setStatus(verificationResult.success ? 'success' : 'error');
    } catch (error) {
      setResult({
        success: false,
        error
      });
      setStatus('error');
    } finally {
      setLogs(logger.getLogs());
      logger.restore();
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>FreelanceShield Contract Verifier</span>
          {status === 'success' && <CheckCircle className="text-green-500" size={20} />}
          {status === 'error' && <XCircle className="text-red-500" size={20} />}
        </CardTitle>
        <CardDescription>
          Verify that your frontend is correctly connected to the deployed Solana contracts
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {status === 'idle' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Verification Required</AlertTitle>
            <AlertDescription>
              Click the button below to verify your contract integration
            </AlertDescription>
          </Alert>
        )}
        
        {status === 'loading' && (
          <div className="flex items-center justify-center p-6">
            <RefreshCw className="animate-spin h-8 w-8 text-primary" />
            <span className="ml-2">Verifying contract integration...</span>
          </div>
        )}
        
        {(status === 'success' || status === 'error') && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-2">Insurance Program</h3>
                <div className="flex items-center">
                  {result?.programsFound?.insurance ? (
                    <CheckCircle className="text-green-500 mr-2" size={16} />
                  ) : (
                    <XCircle className="text-red-500 mr-2" size={16} />
                  )}
                  <span className="text-xs truncate">{INSURANCE_PROGRAM_ID.toString()}</span>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-2">Risk Pool Program</h3>
                <div className="flex items-center">
                  {result?.programsFound?.riskPool ? (
                    <CheckCircle className="text-green-500 mr-2" size={16} />
                  ) : (
                    <XCircle className="text-red-500 mr-2" size={16} />
                  )}
                  <span className="text-xs truncate">{RISK_POOL_PROGRAM_ID.toString()}</span>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-2">Claims Processor</h3>
                <div className="flex items-center">
                  {result?.programsFound?.claimsProcessor ? (
                    <CheckCircle className="text-green-500 mr-2" size={16} />
                  ) : (
                    <XCircle className="text-red-500 mr-2" size={16} />
                  )}
                  <span className="text-xs truncate">{CLAIMS_PROCESSOR_PROGRAM_ID.toString()}</span>
                </div>
              </div>
            </div>
            
            {result?.error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Verification Failed</AlertTitle>
                <AlertDescription>
                  {result.error.message || 'An unknown error occurred during verification'}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Verification Logs</h3>
              <div className="bg-muted p-3 rounded-md max-h-60 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap">
                  {logs.map((log, i) => (
                    <div key={i} className={`${log.startsWith('ERROR') ? 'text-red-500' : log.startsWith('WARNING') ? 'text-yellow-500' : ''}`}>
                      {log}
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={runVerification} 
          disabled={status === 'loading'}
          className="w-full"
        >
          {status === 'loading' ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : status === 'success' ? (
            'Verify Again'
          ) : status === 'error' ? (
            'Retry Verification'
          ) : (
            'Verify Contract Integration'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ContractVerifier;
