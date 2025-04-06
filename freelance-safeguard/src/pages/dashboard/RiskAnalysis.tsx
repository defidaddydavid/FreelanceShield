import { useState } from 'react';
import { BarChart4, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export default function RiskAnalysis() {
  const [activeTab, setActiveTab] = useState('factors');
  
  const riskFactors = [
    { title: 'Payment Terms', score: 65, description: 'Client payment history and terms' },
    { title: 'Scope Definition', score: 45, description: 'Clarity and specificity of project scope' },
    { title: 'Contract Terms', score: 80, description: 'Favorability of contract conditions' },
    { title: 'Client Reputation', score: 70, description: 'Client history with freelancers' },
    { title: 'Project Duration', score: 60, description: 'Length and stability of engagement' },
  ];
  
  const recommendations = [
    { id: 1, title: 'Improve Payment Terms', impact: 'High', effort: 'Medium' },
    { id: 2, title: 'Detailed Scope Definition', impact: 'High', effort: 'High' },
    { id: 3, title: 'Contract Review', impact: 'Medium', effort: 'Low' },
  ];
  
  const coverageOptions = [
    { id: 1, title: 'Payment Protection Plus', coverage: 'Up to $5,000', premium: '$15/month' },
    { id: 2, title: 'Scope Control Insurance', coverage: 'Up to $10,000', premium: '$25/month' },
  ];
  
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-brick mb-2">Risk Analysis</h1>
        <p className="text-muted-foreground">
          Detailed assessment of your project risks and recommended coverage
        </p>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-brick">Risk Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {riskFactors.map((factor, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-brick">{factor.title}</h3>
                    <span className="text-sm font-medium">{factor.score}/100</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{factor.description}</p>
                  <Progress value={factor.score} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-brick">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map(rec => (
                <div key={rec.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-brick">{rec.id}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-brick">{rec.title}</h3>
                    <div className="flex gap-4 mt-1">
                      <span className="text-sm text-muted-foreground">Impact: {rec.impact}</span>
                      <span className="text-sm text-muted-foreground">Effort: {rec.effort}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Apply</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-brick">Recommended Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {coverageOptions.map(option => (
                <div key={option.id} className="border rounded-lg p-4 space-y-2">
                  <h3 className="font-brick">{option.title}</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Coverage:</span>
                    <span>{option.coverage}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Premium:</span>
                    <span>{option.premium}</span>
                  </div>
                  <Button className="w-full mt-3">Select Plan</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
