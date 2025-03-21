import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

export interface ReputationScoreProps {
  score: number;
  maxScore?: number;
  trend?: "up" | "down" | "stable";
  trendValue?: number;
}

export const ReputationScore = ({
  score,
  maxScore = 100,
  trend = "stable",
  trendValue = 0,
}: ReputationScoreProps) => {
  const scorePercentage = (score / maxScore) * 100;

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
            <li>Maintain a consistent work history</li>
            <li>Successfully complete contracts</li>
            <li>Avoid claims or disputes</li>
            <li>Build positive client feedback</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
