import { useEffect, useRef, useState } from 'react';
import { usePhantomWallet } from '@/lib/solana/PhantomWalletProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Wallet } from 'lucide-react';
import { toast } from 'sonner';

/**
 * PhantomWalletElement component
 * 
 * This component demonstrates the Element mode of the Phantom Wallet SDK,
 * which allows embedding the wallet UI directly into your application.
 */
const PhantomWalletElement = () => {
  const {
    phantom,
    isInitialized,
    isLoading,
    connectWallet,
    isConnected,
    publicKey,
    balance,
  } = usePhantomWallet();
  
  const [mode, setMode] = useState<'popup' | 'element'>('popup');
  const walletElementRef = useRef<HTMLDivElement>(null);

  // Function to handle wallet connection
  const handleConnect = async () => {
    if (!isInitialized) {
      toast.error('Phantom wallet is not initialized');
      return;
    }

    try {
      await connectWallet();
      
      if (mode === 'popup') {
        // In popup mode, show the wallet UI
        phantom?.show();
      } else if (mode === 'element' && phantom) {
        // In element mode, render the wallet UI into the container
        if (walletElementRef.current) {
          phantom.app.renderElement({
            elementId: 'phantom-wallet-element',
            width: '100%',
            height: '500px',
          });
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    }
  };

  // Effect to handle element mode rendering
  useEffect(() => {
    if (mode === 'element' && phantom && isConnected && walletElementRef.current) {
      phantom.app.renderElement({
        elementId: 'phantom-wallet-element',
        width: '100%',
        height: '500px',
      });
    }
  }, [mode, phantom, isConnected]);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Phantom Wallet Integration</CardTitle>
        <CardDescription>
          Integrate with Phantom Wallet using either Popup or Element mode
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="popup" onValueChange={(value) => setMode(value as 'popup' | 'element')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="popup">Popup Mode</TabsTrigger>
            <TabsTrigger value="element">Element Mode</TabsTrigger>
          </TabsList>
          <TabsContent value="popup" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Popup mode displays the Phantom wallet in a popup window, allowing users to interact
                with their wallet without leaving your application.
              </p>
              
              {isConnected ? (
                <div className="p-4 bg-muted rounded-md">
                  <p className="font-medium">Connected Wallet</p>
                  <p className="text-sm text-muted-foreground mt-1 break-all">{publicKey}</p>
                  <p className="text-sm mt-2">Balance: {balance !== null ? balance.toFixed(4) : '0.0000'} SOL</p>
                </div>
              ) : (
                <Button 
                  onClick={handleConnect} 
                  disabled={isLoading || !isInitialized}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Connect with Phantom (Popup)
                    </>
                  )}
                </Button>
              )}
            </div>
          </TabsContent>
          <TabsContent value="element" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Element mode embeds the Phantom wallet directly into your application,
                providing a seamless user experience.
              </p>
              
              {isConnected ? (
                <div 
                  id="phantom-wallet-element" 
                  ref={walletElementRef}
                  className="w-full h-[500px] border border-border rounded-md"
                ></div>
              ) : (
                <Button 
                  onClick={handleConnect} 
                  disabled={isLoading || !isInitialized}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Connect with Phantom (Element)
                    </>
                  )}
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Powered by Phantom Wallet SDK
        </p>
      </CardFooter>
    </Card>
  );
};

export default PhantomWalletElement;
