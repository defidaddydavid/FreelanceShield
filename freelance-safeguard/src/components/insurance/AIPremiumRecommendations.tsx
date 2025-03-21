import React from 'react';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { 
  CheckCircle2,
  TrendingDown,
  Shield,
  Wallet,
  BadgeCheck,
  BarChart4,
  Clock,
  Heart,
  Users
} from 'lucide-react';

interface AIPremiumRecommendationsProps {
  recommendations: string[];
  riskScore: number;
}

export const AIPremiumRecommendations: React.FC<AIPremiumRecommendationsProps> = ({ 
  recommendations,
  riskScore
}) => {
  // Map of recommendation keywords to icons
  const getIconForRecommendation = (recommendation: string) => {
    if (recommendation.includes('escrow')) return <Shield className="h-5 w-5 text-blue-500" />;
    if (recommendation.includes('verified client')) return <BadgeCheck className="h-5 w-5 text-green-500" />;
    if (recommendation.includes('transaction history')) return <Wallet className="h-5 w-5 text-purple-500" />;
    if (recommendation.includes('volatility') || recommendation.includes('payment schedule')) return <BarChart4 className="h-5 w-5 text-orange-500" />;
    if (recommendation.includes('lower') || recommendation.includes('discount')) return <TrendingDown className="h-5 w-5 text-green-500" />;
    if (recommendation.includes('loyalty') || recommendation.includes('renew')) return <Heart className="h-5 w-5 text-red-500" />;
    if (recommendation.includes('time') || recommendation.includes('period')) return <Clock className="h-5 w-5 text-amber-500" />;
    if (recommendation.includes('community') || recommendation.includes('risk pool')) return <Users className="h-5 w-5 text-indigo-500" />;
    return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
  };

  // Generate default recommendations based on risk score if none provided
  const allRecommendations = recommendations.length > 0 ? recommendations : [
    "Complete your profile to improve your reputation score",
    "Consider using escrow payments for your next projects",
    "Work with verified clients to reduce your risk profile",
    "Maintain consistent transaction history for better rates",
    "Opt for longer coverage periods to receive loyalty discounts"
  ];

  // Add conditional recommendations based on risk score
  const getConditionalRecommendations = () => {
    const conditionalRecs = [];
    
    if (riskScore > 70) {
      conditionalRecs.push(
        "Your risk score is high. Consider working with more established clients to improve your profile.",
        "Join a community risk pool to distribute risk and potentially lower your premium."
      );
    } else if (riskScore > 40) {
      conditionalRecs.push(
        "Maintain your current client relationships to build loyalty benefits.",
        "Consider longer-term coverage options to unlock time-based discounts."
      );
    } else {
      conditionalRecs.push(
        "Your risk profile is excellent! Renew your policy early to lock in your favorable rates.",
        "Consider increasing your coverage amount with minimal premium impact."
      );
    }
    
    return conditionalRecs;
  };

  // Combine all recommendations
  const displayRecommendations = [...allRecommendations, ...getConditionalRecommendations()];

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingDown className="mr-2 h-5 w-5 text-green-500" />
            Premium Optimization Recommendations
          </CardTitle>
          <CardDescription>
            Follow these recommendations to potentially lower your premium
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {displayRecommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <div className="mr-3 mt-0.5">
                  {getIconForRecommendation(recommendation)}
                </div>
                <div>
                  <p className="text-sm">{recommendation}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5 text-primary" />
            New Premium Features
          </CardTitle>
          <CardDescription>
            Take advantage of our enhanced premium calculation system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="mr-3 mt-0.5">
                <Heart className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Loyalty Rewards</p>
                <p className="text-xs text-muted-foreground">
                  Receive automatic discounts for each claim-free period and policy renewal.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="mr-3 mt-0.5">
                <BarChart4 className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Conditional Risk Segmentation</p>
                <p className="text-xs text-muted-foreground">
                  Our AI now creates personalized risk profiles based on your specific project types and values.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="mr-3 mt-0.5">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Time-Based Projections</p>
                <p className="text-xs text-muted-foreground">
                  See how your premium will evolve over time with our predictive modeling.
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
