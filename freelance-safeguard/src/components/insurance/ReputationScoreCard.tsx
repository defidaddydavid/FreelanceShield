import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Info, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Clock2,
  FileCheck,
  Award,
  Gavel,
  ArrowUp,
  ArrowDown,
  Calendar,
  Activity,
  Percent
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { 
  UserReputationData, 
  ReputationScoreResult, 
  calculateReputationScore,
  reputationScoreToPremiumFactor
} from '@/lib/insurance/calculations';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ReputationScoreCardProps {
  userData: UserReputationData;
  className?: string;
  showDetails?: boolean;
}

export function ReputationScoreCard({ 
  userData, 
  className,
  showDetails = false
}: ReputationScoreCardProps) {
  const [expanded, setExpanded] = useState(showDetails);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'improve'>('overview');
  const result = calculateReputationScore(userData);
  
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-blue-600 dark:text-blue-400';
    if (score >= 25) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  // Determine background color for score circle
  const getScoreBgColor = (score: number) => {
    if (score >= 75) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 50) return 'bg-blue-100 dark:bg-blue-900/30';
    if (score >= 25) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };
  
  // Get icon for risk level
  const getRiskIcon = (riskLevel: 'Low Risk' | 'Medium Risk' | 'High Risk') => {
    switch (riskLevel) {
      case 'Low Risk':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'Medium Risk':
        return <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'High Risk':
        return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />;
    }
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  return (
    <Card className={cn("overflow-hidden border-2 hover:shadow-lg transition-all duration-300", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Work-Based Reputation
            </CardTitle>
            <CardDescription>
              Your on-chain verified work performance
            </CardDescription>
          </div>
          
          <Badge variant={result.riskLevel === 'Low Risk' ? 'default' : 
                         result.riskLevel === 'Medium Risk' ? 'secondary' : 'destructive'} 
                 className="text-xs">
            {result.discountTier} Tier
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center relative",
              getScoreBgColor(result.score)
            )}>
              <div className="text-center">
                <div className={cn("text-3xl font-bold", getScoreColor(result.score))}>
                  {result.score}
                </div>
                <div className="text-xs text-muted-foreground">/ 100</div>
              </div>
              {result.timeDecayFactor < 1 && (
                <div className="absolute -top-1 -right-1 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-medium px-1.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  {Math.round((1 - result.timeDecayFactor) * 100)}% decay
                </div>
              )}
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground mb-1">Risk Assessment</div>
              <div className="flex items-center gap-1.5">
                {getRiskIcon(result.riskLevel)}
                <span className={cn(
                  "font-medium",
                  result.riskLevel === 'Low Risk' ? "text-green-600 dark:text-green-400" :
                  result.riskLevel === 'Medium Risk' ? "text-yellow-600 dark:text-yellow-400" :
                  "text-red-600 dark:text-red-400"
                )}>
                  {result.riskLevel}
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground mt-3 mb-1">Premium Discount</div>
              <div className="flex items-center gap-1.5">
                <Percent className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-600 dark:text-green-400">
                  {result.premiumDiscount}% off premium
                </span>
              </div>
            </div>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{expanded ? 'Show less' : 'Show details'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {expanded && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex space-x-2 mb-4">
              <Button 
                variant={activeTab === 'overview' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </Button>
              <Button 
                variant={activeTab === 'activity' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setActiveTab('activity')}
              >
                Recent Activity
              </Button>
              <Button 
                variant={activeTab === 'improve' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setActiveTab('improve')}
              >
                Improve Score
              </Button>
            </div>
            
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium mb-3">Performance Metrics</h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        Work History
                      </span>
                      <span className="text-sm font-medium">{result.breakdown.workHistoryScore}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, result.breakdown.workHistoryScore * 3.33))}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {userData.completedContracts} completed contracts ({userData.contractsLast90Days} in last 90 days)
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center gap-1">
                        <Clock2 className="h-3.5 w-3.5" />
                        Payment History
                      </span>
                      <span className="text-sm font-medium">{result.breakdown.paymentHistoryScore}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, result.breakdown.paymentHistoryScore * 4))}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {userData.onTimePayments}/{userData.totalTransactions} on-time payments ({Math.round((userData.onTimePayments / Math.max(1, userData.totalTransactions)) * 100)}%)
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center gap-1">
                        <Gavel className="h-3.5 w-3.5" />
                        Dispute Resolution
                      </span>
                      <span className="text-sm font-medium">{result.breakdown.disputeResolutionScore}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, result.breakdown.disputeResolutionScore * 5))}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {userData.disputes} disputes ({userData.disputesResolved} resolved, {userData.disputesRuledAgainst} ruled against)
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center gap-1">
                        <Activity className="h-3.5 w-3.5" />
                        Platform Activity
                      </span>
                      <span className="text-sm font-medium">{result.breakdown.activityScore}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, result.breakdown.activityScore * 6.67))}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {userData.accountAgeMonths} months on platform, {userData.lastActiveMonths === 0 ? 'active this month' : `${userData.lastActiveMonths} months since last activity`}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" />
                        Governance Participation
                      </span>
                      <span className="text-sm font-medium">{result.breakdown.governanceScore}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, result.breakdown.governanceScore * 10))}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {userData.stakingParticipation ? 'Staking tokens' : 'Not staking'}, 
                      {userData.governanceParticipation ? ' participating in governance' : ' not participating in governance'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Premium Discount Tiers</h4>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200 dark:bg-red-900/30 dark:text-red-300">
                          High Risk
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-600 bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300">
                          Medium Risk
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200 dark:bg-green-900/30 dark:text-green-300">
                          Low Risk
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                      <div style={{ width: "50%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"></div>
                      <div style={{ width: "25%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"></div>
                      <div style={{ width: "25%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                    </div>
                    <div className="flex text-xs text-gray-500 mt-1 justify-between">
                      <span>0-15% discount</span>
                      <span>15-22% discount</span>
                      <span>22-30% discount</span>
                    </div>
                    
                    {/* Position marker based on score */}
                    <div 
                      className="absolute top-[38px] w-3 h-3 bg-white border-2 border-indigo-600 rounded-full transform -translate-x-1/2"
                      style={{ left: `${result.score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium mb-3">Recent Activity Timeline</h4>
                
                {result.recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {result.recentActivity
                      .sort((a, b) => b.date.getTime() - a.date.getTime())
                      .map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 pb-3 border-b border-dashed">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            activity.impact > 0 ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                            "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            {activity.impact > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <p className="text-sm font-medium">{activity.description}</p>
                              <span className={cn(
                                "text-sm font-medium",
                                activity.impact > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                              )}>
                                {activity.impact > 0 ? '+' : ''}{activity.impact} pts
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(activity.date)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No recent activity to display</p>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Time Decay Impact</h4>
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-sm">
                    <p className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <span>
                        Your reputation score {result.timeDecayFactor < 1 ? 
                          <span>has decayed by <strong>{Math.round((1 - result.timeDecayFactor) * 100)}%</strong> due to inactivity</span> : 
                          <span>is not currently affected by time decay</span>}. 
                        Reputation must be actively maintained through consistent work.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'improve' && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium mb-3">Improve Your Reputation</h4>
                
                {result.improvementAreas.length > 0 ? (
                  <div className="space-y-3">
                    {result.improvementAreas.map((area, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                          <ArrowUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{area}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Great job! No specific improvement areas identified.</p>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Next Tier Progress</h4>
                  
                  {result.riskLevel === 'Low Risk' ? (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-sm">
                      <p className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span>
                          Congratulations! You've reached the highest tier with a <strong>{result.premiumDiscount}%</strong> discount.
                          Continue maintaining your excellent work history to preserve this status.
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Progress to {result.riskLevel === 'Medium Risk' ? 'Low Risk' : 'Medium Risk'} tier</span>
                        <span className="font-medium">
                          {result.riskLevel === 'Medium Risk' ? 
                            `${result.score}/75` : 
                            `${result.score}/50`}
                        </span>
                      </div>
                      <Progress 
                        value={result.riskLevel === 'Medium Risk' ? 
                          (result.score / 75) * 100 : 
                          (result.score / 50) * 100} 
                        className="h-2"
                      />
                      <p className="mt-3 text-sm">
                        {result.riskLevel === 'Medium Risk' ? 
                          `You need ${75 - result.score} more points to reach Low Risk tier and unlock up to 30% discount.` : 
                          `You need ${50 - result.score} more points to reach Medium Risk tier and unlock up to 22% discount.`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {expanded && (
        <CardFooter className="bg-muted/50 pt-3 pb-3">
          <div className="w-full text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>
                Reputation is based on verifiable on-chain work history and cannot be manipulated.
                {result.timeDecayFactor < 1 && " Scores decay over time if not maintained."}
              </span>
            </p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export default ReputationScoreCard;
