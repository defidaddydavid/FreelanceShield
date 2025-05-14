import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useEthosService } from '@/lib/ethos/ethosService';
import { usePrivy } from '@privy-io/react-auth';
import { FEATURES } from '@/lib/featureFlags';
import { useReputationSystem } from '@/lib/hooks/useReputationSystem';

export interface ReputationScoreProps {
  userKey?: string;
  maxScore?: number;
}

export const ReputationScore = ({
  userKey,
  maxScore = 2000, // Ethos scores typically range up to 2000
}: ReputationScoreProps) => {
  const { user } = usePrivy();
  const ethosService = useEthosService();
  const reputationSystem = useReputationSystem();
  const [score, setScore] = useState<number>(0);
  const [trend, setTrend] = useState<"up" | "down" | "stable">("stable");
  const [trendValue, setTrendValue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchScore = async () => {
      setIsLoading(true);
      
      try {
        if (FEATURES.USE_ETHOS_REPUTATION) {
          // Use Ethos for reputation
          // Use provided userKey or default to current user
          const targetUserKey = userKey || (user?.wallet?.address ? `address:${user.wallet.address}` : null);
          
          if (!targetUserKey) {
            setIsLoading(false);
            return;
          }
          
          // Get current score
          const scoreData = await ethosService.getUserScore(targetUserKey);
          
          if (scoreData) {
            setScore(scoreData.score);
            
            // Get historical data to determine trend
            const historyData = await ethosService.getScoreHistory(targetUserKey);
            
            if (historyData && historyData.length > 1) {
              const previousScore = historyData[historyData.length - 2].score;
              const scoreDiff = scoreData.score - previousScore;
              
              if (scoreDiff > 0) {
                setTrend("up");
                setTrendValue(Math.round((scoreDiff / previousScore) * 100));
              } else if (scoreDiff < 0) {
                setTrend("down");
                setTrendValue(Math.round((Math.abs(scoreDiff) / previousScore) * 100));
              } else {
                setTrend("stable");
                setTrendValue(0);
              }
            }
          }
        } else {
          // Use original Solana-based reputation system
          const { profile } = await reputationSystem.getUserProfile();
          
          if (profile) {
            setScore(profile.reputationScore);
            // We don't have historical data in the original system
            setTrend("stable");
            setTrendValue(0);
          }
        }
      } catch (error) {
        console.error("Error fetching reputation data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchScore();
  }, [ethosService, user, userKey, reputationSystem]);
  
  const scorePercentage = (score / maxScore) * 100;
  
  if (isLoading) {
    return <Card className="p-6"><p>Loading reputation data...</p></Card>;
  }
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Reputation Score</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold">{score}</span>
          <div className="flex items-center gap-1">
            {trend === "up" && (
              <>
                <ArrowUpIcon className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">+{trendValue}%</span>
              </>
            )}
            {trend === "down" && (
              <>
                <ArrowDownIcon className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500">-{trendValue}%</span>
              </>
            )}
          </div>
        </div>
        <Progress value={scorePercentage} />
        <p className="text-sm text-muted-foreground">
          Your reputation score affects your insurance premiums. Higher scores lead
          to lower premiums.
        </p>
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Improve Your Score</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {FEATURES.USE_ETHOS_REPUTATION ? (
              <>
                <li>Receive vouches from trusted users</li>
                <li>Get positive reviews from clients</li>
                <li>Maintain active wallet history</li>
                <li>Complete projects successfully</li>
              </>
            ) : (
              <>
                <li>Maintain a consistent work history</li>
                <li>Successfully complete contracts</li>
                <li>Avoid claims or disputes</li>
                <li>Build positive client feedback</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </Card>
  );
};
