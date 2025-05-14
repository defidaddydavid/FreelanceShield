import React, { useState, useEffect } from 'react';
import { usePrivyAuth } from '@/hooks/usePrivyAuth';
import { useEthosService } from '@/lib/ethos/ethosService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Search, User, Award } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FEATURES } from '@/lib/featureFlags';

const EthosTestPage: React.FC = () => {
  const { user, isAuthenticated, ready } = usePrivyAuth();
  const ethosService = useEthosService();
  
  const [isLoading, setIsLoading] = useState(false);
  const [userKey, setUserKey] = useState<string>('');
  const [score, setScore] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [customUserKey, setCustomUserKey] = useState<string>('');
  
  // Initialize userKey when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.wallet?.address) {
      const key = `address:${user.wallet.address}`;
      setUserKey(key);
    }
  }, [isAuthenticated, user]);
  
  // Fetch user's Ethos score
  const fetchScore = async () => {
    if (!userKey) {
      toast.error('No wallet address available');
      return;
    }
    
    setIsLoading(true);
    try {
      const scoreData = await ethosService.getUserScore(userKey);
      setScore(scoreData);
      toast.success('Score fetched successfully');
    } catch (error) {
      console.error('Error fetching score:', error);
      toast.error('Failed to fetch score');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch user's score history
  const fetchHistory = async () => {
    if (!userKey) {
      toast.error('No wallet address available');
      return;
    }
    
    setIsLoading(true);
    try {
      const historyData = await ethosService.getScoreHistory(userKey);
      setHistory(historyData || []);
      toast.success('History fetched successfully');
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to fetch history');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Simulate score changes
  const simulateScoreChanges = async () => {
    if (!userKey) {
      toast.error('No wallet address available');
      return;
    }
    
    setIsLoading(true);
    try {
      // Simulate receiving a positive review
      const simulation = await ethosService.simulateScoreChanges(userKey, {
        reviews: [
          { author: '0x1234567890123456789012345678901234567890', score: 'positive' }
        ]
      });
      
      setSimulationResult(simulation);
      toast.success('Simulation completed successfully');
    } catch (error) {
      console.error('Error simulating score changes:', error);
      toast.error('Failed to simulate score changes');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch score for a custom user key
  const fetchCustomScore = async () => {
    if (!customUserKey) {
      toast.error('Please enter a user key');
      return;
    }
    
    setIsLoading(true);
    try {
      const scoreData = await ethosService.getUserScore(customUserKey);
      setScore(scoreData);
      setUserKey(customUserKey);
      toast.success('Score fetched successfully');
    } catch (error) {
      console.error('Error fetching score:', error);
      toast.error('Failed to fetch score');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  if (!FEATURES.USE_ETHOS_REPUTATION) {
    return (
      <div className="container py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Ethos Integration Test</CardTitle>
            <CardDescription>Testing the Ethos reputation system integration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
              <p className="font-semibold">Ethos integration is currently disabled</p>
              <p className="mt-2">
                To enable Ethos integration, set the <code>NEXT_PUBLIC_USE_ETHOS_REPUTATION</code> environment variable to <code>true</code>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Ethos Integration Test</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Current user and wallet information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Authenticated:</span>
                <span>{isAuthenticated ? 'Yes' : 'No'}</span>
              </div>
              
              {user && user.wallet && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">Wallet Address:</span>
                    <span className="font-mono text-sm truncate max-w-[200px]">
                      {user.wallet.address}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Ethos User Key:</span>
                    <span className="font-mono text-sm truncate max-w-[200px]">
                      {userKey}
                    </span>
                  </div>
                </>
              )}
              
              <div className="pt-4">
                <Label htmlFor="customUserKey">Look up a different user key:</Label>
                <div className="flex mt-2">
                  <Input
                    id="customUserKey"
                    value={customUserKey}
                    onChange={(e) => setCustomUserKey(e.target.value)}
                    placeholder="address:0x123... or profileId:123"
                    className="flex-1"
                  />
                  <Button
                    onClick={fetchCustomScore}
                    disabled={isLoading || !customUserKey}
                    className="ml-2"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Reputation Score */}
        <Card>
          <CardHeader>
            <CardTitle>Ethos Reputation Score</CardTitle>
            <CardDescription>Current reputation score from Ethos</CardDescription>
          </CardHeader>
          <CardContent>
            {score ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{score.score}</span>
                  <Badge variant="outline" className="px-2 py-1">
                    <Award className="h-4 w-4 mr-1" />
                    Ethos Score
                  </Badge>
                </div>
                
                <Progress value={(score.score / 2000) * 100} />
                
                <div className="space-y-2 mt-4">
                  <h3 className="font-semibold">Score Components:</h3>
                  {score.elements && Object.entries(score.elements).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span>{key}:</span>
                      <span className="font-medium">{value.raw || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No score data available</p>
                <Button 
                  onClick={fetchScore} 
                  disabled={isLoading || !userKey} 
                  className="mt-4"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Fetch Score
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Score History */}
        <Card>
          <CardHeader>
            <CardTitle>Score History</CardTitle>
            <CardDescription>Historical reputation score data</CardDescription>
          </CardHeader>
          <CardContent>
            {history && history.length > 0 ? (
              <div className="space-y-4">
                {history.map((item, index) => (
                  <div key={index} className="flex justify-between border-b pb-2">
                    <div>
                      <span className="font-medium">{item.score}</span>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {item.txHash && (
                      <span className="font-mono text-xs truncate max-w-[150px]">
                        {item.txHash.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground">No history data available</p>
                <Button 
                  onClick={fetchHistory} 
                  disabled={isLoading || !userKey} 
                  className="mt-4"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Fetch History
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Score Simulation */}
        <Card>
          <CardHeader>
            <CardTitle>Score Simulation</CardTitle>
            <CardDescription>Simulate changes to reputation score</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={simulateScoreChanges} 
              disabled={isLoading || !userKey}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Simulate Positive Review"
              )}
            </Button>
            
            {simulationResult && (
              <div className="mt-4 space-y-2 border-t pt-4">
                <h3 className="font-semibold">Simulation Results:</h3>
                <div className="flex justify-between">
                  <span>Current Score:</span>
                  <span className="font-medium">{score?.score || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Simulated Score:</span>
                  <span className="font-medium">{simulationResult.calculationResults?.score || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Impact:</span>
                  <span className={`font-medium ${
                    simulationResult.simulation?.impact === 'POSITIVE' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {simulationResult.simulation?.impact === 'POSITIVE' ? '+' : '-'}
                    {simulationResult.simulation?.value.toFixed(2) || 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EthosTestPage;
