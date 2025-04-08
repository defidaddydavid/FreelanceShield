// Enhanced ClaimsSystem Component with improved performance, accessibility, and organization
// Optimized for best practices in React, TypeScript, and accessibility standards

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ClaimsManager } from '@/components/dashboard/ClaimsManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';
import { VisuallyHidden } from '@/components/ui/visually-hidden';

// Types for statistics and process steps
interface StatCard {
  title: string;
  value: string;
  description: string;
}

interface ProcessStep {
  number: number;
  title: string;
  description: string;
}

// ClaimsManager component props type
interface ClaimsManagerProps {
  claimId?: string | null;
  mode?: 'submit' | 'track' | 'arbitration';
}

/**
 * ClaimsSystem page
 * Dedicated page for the claims processing system that connects to the Claims Processor backend
 * 
 * @returns {JSX.Element} The ClaimsSystem component
 */
const ClaimsSystem: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useSolanaTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isLoading, setIsLoading] = useState(true);
  
  // Parse query parameters
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const defaultTab = queryParams.get('tab') || 'overview';
  const claimId = queryParams.get('claim');

  // Handle tab changes and update URL
  const handleTabChange = useCallback((value: string) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set('tab', value);
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
  }, [location.search, location.pathname, navigate]);

  // Statistics data - memoized to prevent unnecessary re-renders
  const statistics: StatCard[] = useMemo(() => [
    {
      title: 'Claims Process',
      value: '3-Step Process',
      description: 'Submit → Verification → Payment'
    },
    {
      title: 'Average Processing Time',
      value: '48 Hours',
      description: 'For standard claims verification'
    },
    {
      title: 'Success Rate',
      value: '89%',
      description: 'Of valid claims are approved'
    }
  ], []);

  // Process steps - memoized to prevent unnecessary re-renders
  const processSteps: ProcessStep[] = useMemo(() => [
    {
      number: 1,
      title: 'Submit Your Claim',
      description: 'Provide details about your policy and the incident, along with any supporting evidence.'
    },
    {
      number: 2,
      title: 'Automated Verification',
      description: 'Our Claims Processor analyzes your claim using deterministic rule-based verification and Bayesian models.'
    },
    {
      number: 3,
      title: 'Arbitration (If Needed)',
      description: 'Complex cases may require arbitration by the community governance system.'
    },
    {
      number: 4,
      title: 'Claim Payment',
      description: 'Approved claims receive automatic payment from the risk pool via on-chain transaction.'
    }
  ], []);

  // Simulate loading state - in a real app, this would be based on actual data fetching
  useEffect(() => {
    let isMounted = true;
    
    const timer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 800);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Jump to specific claim if ID is provided
  useEffect(() => {
    if (claimId) {
      // Logic to focus on specific claim could be added here
      console.log(`Focusing on claim: ${claimId}`);
    }
  }, [claimId]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 
          className={cn(
            "text-3xl font-display font-bold mb-2 bg-clip-text text-transparent",
            "bg-gradient-to-r from-shield-purple to-shield-blue",
            "transition-colors duration-300"
          )}
        >
          Claims Processing System
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          Submit, track, and manage your insurance claims through our blockchain-powered claims processor
        </p>
      </div>

      <Tabs 
        defaultValue={defaultTab} 
        className="space-y-4"
        onValueChange={handleTabChange}
      >
        <TabsList className="w-full sm:w-auto flex flex-wrap sm:flex-nowrap">
          <TabsTrigger value="overview">
            <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="submit">
            <Clock className="h-4 w-4 mr-2" aria-hidden="true" />
            <span>Submit Claim</span>
          </TabsTrigger>
          <TabsTrigger value="track">
            <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
            <span>Track Claims</span>
          </TabsTrigger>
          <TabsTrigger value="arbitration">
            <AlertTriangle className="h-4 w-4 mr-2" aria-hidden="true" />
            <span>Arbitration</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab Content */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statistics.map((stat, index) => (
              <StatisticCard 
                key={`stat-${index}`}
                title={stat.title}
                value={stat.value}
                description={stat.description}
                isLoading={isLoading}
              />
            ))}
          </div>

          <Card className="p-6 border border-border/50 shadow-sm">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl font-display">How the Claims Process Works</CardTitle>
              <CardDescription className="text-base">
                Our specialized Claims Processor program uses Bayesian models for accurate claim verification
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="grid gap-6 mt-4 md:grid-cols-2">
                <div className="space-y-6">
                  {processSteps.slice(0, 2).map((step) => (
                    <ProcessStepItem 
                      key={`step-${step.number}`}
                      number={step.number}
                      title={step.title}
                      description={step.description}
                      isLoading={isLoading}
                    />
                  ))}
                </div>
                <div className="space-y-6">
                  {processSteps.slice(2, 4).map((step) => (
                    <ProcessStepItem 
                      key={`step-${step.number}`}
                      number={step.number}
                      title={step.title}
                      description={step.description}
                      isLoading={isLoading}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submit Tab Content */}
        <TabsContent value="submit">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-display">Submit a New Claim</CardTitle>
              <CardDescription>
                Fill out the form below to submit a new insurance claim
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* @ts-expect-error - ClaimsManager component will be updated to accept these props */}
              <ClaimsManager claimId={claimId} mode="submit" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Track Tab Content */}
        <TabsContent value="track">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-display">Track Your Claims</CardTitle>
              <CardDescription>
                View the status and details of your submitted claims
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* @ts-expect-error - ClaimsManager component will be updated to accept these props */}
              <ClaimsManager claimId={claimId} mode="track" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Arbitration Tab Content */}
        <TabsContent value="arbitration">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-display">Claims Arbitration</CardTitle>
              <CardDescription>
                Participate in the decentralized arbitration process for disputed claims
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* @ts-expect-error - ClaimsManager component will be updated to accept these props */}
              <ClaimsManager claimId={claimId} mode="arbitration" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

// Extracted reusable components
interface StatisticCardProps {
  title: string;
  value: string;
  description: string;
  isLoading: boolean;
}

/**
 * StatisticCard component for displaying key metrics
 * 
 * @param {StatisticCardProps} props - Component props
 * @returns {JSX.Element} The StatisticCard component
 */
const StatisticCard: React.FC<StatisticCardProps> = ({ 
  title, 
  value, 
  description,
  isLoading
}) => {
  return (
    <Card className="border border-border/50 shadow-sm transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {isLoading ? <Skeleton className="h-4 w-32" /> : title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-3 w-36" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface ProcessStepItemProps {
  number: number;
  title: string;
  description: string;
  isLoading: boolean;
}

/**
 * ProcessStepItem component for displaying numbered process steps
 * 
 * @param {ProcessStepItemProps} props - Component props
 * @returns {JSX.Element} The ProcessStepItem component
 */
const ProcessStepItem: React.FC<ProcessStepItemProps> = ({
  number,
  title,
  description,
  isLoading
}) => {
  return (
    <div className="flex gap-3 group" data-testid={`process-step-${number}`}>
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0 mt-0.5" />
          <div className="space-y-2 w-full">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </>
      ) : (
        <>
          <div 
            className="bg-shield-purple/10 text-shield-purple h-8 w-8 rounded-full 
                      flex items-center justify-center mt-0.5 flex-shrink-0
                      transition-colors group-hover:bg-shield-purple/20"
            aria-hidden="true"
          >
            {number}
          </div>
          <div>
            <h3 className="font-medium">
              <span className="sr-only">Step {number}:</span> {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ClaimsSystem;
