import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';

export function RiskTrends() {
  const trendData = [
    { month: 'Jan', risk: 68, industry: 65 },
    { month: 'Feb', risk: 72, industry: 66 },
    { month: 'Mar', risk: 65, industry: 67 },
    { month: 'Apr', risk: 60, industry: 66 },
    { month: 'May', risk: 58, industry: 65 },
    { month: 'Jun', risk: 52, industry: 64 },
    { month: 'Jul', risk: 48, industry: 63 },
    { month: 'Aug', risk: 45, industry: 62 },
    { month: 'Sep', risk: 40, industry: 61 },
    { month: 'Oct', risk: 38, industry: 60 },
    { month: 'Nov', risk: 35, industry: 60 },
    { month: 'Dec', risk: 32, industry: 59 },
  ];

  // Calculate the percentage change from first to last month
  const firstMonth = trendData[0].risk;
  const lastMonth = trendData[trendData.length - 1].risk;
  const percentChange = ((lastMonth - firstMonth) / firstMonth * 100).toFixed(1);
  const isPositive = lastMonth < firstMonth; // Lower risk is better

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Risk Trends (12 Months)</CardTitle>
            <CardDescription>
              Your risk profile compared to industry average
            </CardDescription>
          </div>
          <Badge className={isPositive ? "bg-green-500" : "bg-red-500"}>
            {isPositive ? "↓" : "↑"} {Math.abs(Number(percentChange))}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="risk" 
                name="Your Risk Score" 
                stroke="#3B82F6" 
                strokeWidth={2} 
                dot={{ r: 3 }} 
                activeDot={{ r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="industry" 
                name="Industry Average" 
                stroke="#9CA3AF" 
                strokeWidth={2} 
                dot={{ r: 3 }} 
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Your risk score has {isPositive ? "decreased" : "increased"} by {Math.abs(Number(percentChange))}% over the past year, indicating {isPositive ? "improved" : "worsening"} risk profile.</p>
        </div>
      </CardContent>
    </Card>
  );
}
