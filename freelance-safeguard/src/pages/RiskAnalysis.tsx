import { useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import { DashboardWalletInfo } from '@/components/wallet/DashboardWalletInfo';
import { PaymentTracker } from '@/components/dashboard/PaymentTracker';
import { RiskTrends } from '@/components/dashboard/RiskTrends';

const RiskAnalysis = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const riskData = [
    { category: 'Payment Disputes', risk: 65, average: 45 },
    { category: 'Project Cancellation', risk: 42, average: 38 },
    { category: 'Scope Creep', risk: 78, average: 60 },
    { category: 'Late Payments', risk: 80, average: 70 },
    { category: 'Client Communication', risk: 35, average: 50 },
    { category: 'Contract Breaches', risk: 55, average: 40 },
  ];

  const riskFactors = [
    {
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      title: "High Risk Factors",
      description: "Late payments and scope creep are your highest risk areas based on past projects."
    },
    {
      icon: <Shield className="h-5 w-5 text-green-500" />,
      title: "Protected Areas",
      description: "Your client communication processes show lower-than-average risk."
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
      title: "Risk Trend",
      description: "Your overall risk profile has improved by 12% in the last quarter."
    }
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold mb-2">Risk Analysis</h1>
        <p className="text-shield-gray-dark">
          Review your risk profile and identify areas for improvement.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {riskFactors.map((factor, index) => (
          <GlassCard key={index} className="p-6">
            <div className="flex items-start mb-4">
              <div className="mr-4">{factor.icon}</div>
              <div>
                <h3 className="font-medium text-lg mb-1">{factor.title}</h3>
                <p className="text-shield-gray-dark text-sm">{factor.description}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Risk Assessment by Category</CardTitle>
              <CardDescription>
                Comparison of your risk factors against platform average
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={riskData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70} 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="risk" name="Your Risk" fill="#3B82F6" />
                    <Bar dataKey="average" name="Platform Average" fill="#9CA3AF" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <RiskTrends />
        </div>
        
        <div className="space-y-6">
          <DashboardWalletInfo />
          <PaymentTracker />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
            <CardDescription>
              Steps to improve your risk profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="bg-blue-100 rounded-full p-1 mr-2 mt-0.5">
                  <span className="text-shield-blue text-sm font-medium">1</span>
                </div>
                <div>
                  <p className="font-medium">Improve Payment Terms</p>
                  <p className="text-sm text-shield-gray-dark">Request milestone payments to reduce late payment risk</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-blue-100 rounded-full p-1 mr-2 mt-0.5">
                  <span className="text-shield-blue text-sm font-medium">2</span>
                </div>
                <div>
                  <p className="font-medium">Detailed Scope Definition</p>
                  <p className="text-sm text-shield-gray-dark">Create more detailed project scopes to prevent scope creep</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="bg-blue-100 rounded-full p-1 mr-2 mt-0.5">
                  <span className="text-shield-blue text-sm font-medium">3</span>
                </div>
                <div>
                  <p className="font-medium">Contract Review</p>
                  <p className="text-sm text-shield-gray-dark">Update your contract templates with clearer terms</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Coverage Recommendations</CardTitle>
            <CardDescription>
              Insurance policies based on your risk profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">Payment Protection Plus</h3>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Recommended</span>
                </div>
                <p className="text-sm text-shield-gray-dark mb-3">Enhanced coverage for payment disputes and delays</p>
                <div className="flex justify-between text-sm">
                  <span>40 SOL/month</span>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">Scope Control Insurance</h3>
                </div>
                <p className="text-sm text-shield-gray-dark mb-3">Protection against scope creep and changing requirements</p>
                <div className="flex justify-between text-sm">
                  <span>35 SOL/month</span>
                  <Button variant="outline" size="sm">View Details</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RiskAnalysis;
