import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Clock, Loader2 } from 'lucide-react';
import InsuranceCard from '@/components/dashboard/InsuranceCard';
import GlassCard from '@/components/ui/GlassCard';
import { useSolanaInsurance } from '@/hooks/useSolanaInsurance';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Policies = () => {
  const navigate = useNavigate();
  const { policies, loading, error } = useSolanaInsurance();
  const [activePolicies, setActivePolicies] = useState<any[]>([]);
  const [expiredPolicies, setExpiredPolicies] = useState<any[]>([]);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (policies && policies.length > 0) {
      const now = new Date();
      
      // Filter policies into active and expired
      const active = policies.filter(policy => new Date(policy.endDate) > now)
        .map(policy => ({
          title: policy.projectName || "Freelance Project Protection",
          description: policy.description || "Coverage for project cancellations and payment disputes.",
          premium: `${policy.premiumAmount} USDC`,
          coverage: `Up to ${policy.coverageAmount} USDC`,
          status: "active" as const,
          expiryDate: new Date(policy.endDate).toLocaleDateString(),
          id: policy.id || policy.publicKey?.toString()
        }));
      
      const expired = policies.filter(policy => new Date(policy.endDate) <= now)
        .map(policy => ({
          title: policy.projectName || "Freelance Project Protection",
          description: policy.description || "Coverage for project cancellations and payment disputes.",
          premium: `${policy.premiumAmount} USDC`,
          coverage: `Up to ${policy.coverageAmount} USDC`,
          status: "expired" as const,
          expiryDate: new Date(policy.endDate).toLocaleDateString(),
          id: policy.id || policy.publicKey?.toString()
        }));
      
      setActivePolicies(active);
      setExpiredPolicies(expired);
    }
  }, [policies]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Insurance Policies</h1>
          <Button onClick={() => navigate('/dashboard/new-policy')} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" /> New Policy
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">Manage your active and expired insurance policies</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-2 text-lg">Loading your policies...</span>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}. Please try refreshing the page or check your Solana connection.
          </AlertDescription>
        </Alert>
      ) : (
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Active Policies ({activePolicies.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Expired Policies ({expiredPolicies.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4">
            {activePolicies.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <h3 className="text-lg font-medium mb-2">No Active Policies</h3>
                <p className="text-muted-foreground mb-4">You don't have any active insurance policies at the moment.</p>
                <Button onClick={() => navigate('/dashboard/new-policy')} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="mr-2 h-4 w-4" /> Create Your First Policy
                </Button>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePolicies.map((policy, index) => (
                  <InsuranceCard
                    key={policy.id || index}
                    title={policy.title}
                    description={policy.description}
                    premium={policy.premium}
                    coverage={policy.coverage}
                    status={policy.status}
                    expiryDate={policy.expiryDate}
                    onClick={() => navigate(`/dashboard/policy/${policy.id || index}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="expired" className="space-y-4">
            {expiredPolicies.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <h3 className="text-lg font-medium mb-2">No Expired Policies</h3>
                <p className="text-muted-foreground">You don't have any expired insurance policies.</p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expiredPolicies.map((policy, index) => (
                  <InsuranceCard
                    key={policy.id || index}
                    title={policy.title}
                    description={policy.description}
                    premium={policy.premium}
                    coverage={policy.coverage}
                    status={policy.status}
                    expiryDate={policy.expiryDate}
                    onClick={() => navigate(`/dashboard/policy/${policy.id || index}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
};

export default Policies;
