import { usePrivy } from '@privy-io/react-auth';

export interface EthosScore {
  score: number;
  elements: Record<string, any>;
  metadata: Record<string, any>;
  errors: string[];
}

export interface EthosScoreHistory {
  score: number;
  timestamp: number;
  txHash?: string;
}

export function useEthosService() {
  const { user, authenticated, getAccessToken } = usePrivy();
  const baseUrl = 'https://api.ethos.network';
  
  const getHeaders = async () => {
    const token = await getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };
  
  // Get a user's reputation score
  const getUserScore = async (userKey: string): Promise<EthosScore | null> => {
    if (!authenticated) return null;
    
    try {
      const headers = await getHeaders();
      const response = await fetch(`${baseUrl}/api/v1/score/${userKey}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) throw new Error('Failed to fetch score');
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching Ethos score:', error);
      return null;
    }
  };
  
  // Get a user's score history
  const getScoreHistory = async (userKey: string): Promise<EthosScoreHistory[] | null> => {
    if (!authenticated) return null;
    
    try {
      const headers = await getHeaders();
      const response = await fetch(`${baseUrl}/api/v1/score/history/${userKey}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) throw new Error('Failed to fetch score history');
      
      const data = await response.json();
      return data.data.history;
    } catch (error) {
      console.error('Error fetching Ethos score history:', error);
      return null;
    }
  };
  
  // Get scores for multiple users at once
  const getBulkScores = async (userKeys: string[]): Promise<Record<string, EthosScore> | null> => {
    if (!authenticated) return null;
    
    try {
      const headers = await getHeaders();
      const response = await fetch(`${baseUrl}/api/v1/scores/bulk`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userKeys })
      });
      
      if (!response.ok) throw new Error('Failed to fetch bulk scores');
      
      const data = await response.json();
      return data.data.scores;
    } catch (error) {
      console.error('Error fetching Ethos bulk scores:', error);
      return null;
    }
  };
  
  // Simulate score changes
  const simulateScoreChanges = async (
    subjectKey: string, 
    options: {
      vouchAmount?: number;
      numberOfVouchers?: number;
      reviews?: Array<{ author: string; score: 'positive' | 'neutral' | 'negative' }>;
    }
  ): Promise<{ simulation: any; calculationResults: EthosScore } | null> => {
    if (!authenticated) return null;
    
    try {
      const headers = await getHeaders();
      const response = await fetch(`${baseUrl}/api/v1/score/simulate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subjectKey,
          ...options
        })
      });
      
      if (!response.ok) throw new Error('Failed to simulate score changes');
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error simulating Ethos score changes:', error);
      return null;
    }
  };
  
  return {
    getUserScore,
    getScoreHistory,
    getBulkScores,
    simulateScoreChanges
  };
}
