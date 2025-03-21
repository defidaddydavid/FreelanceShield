import React from 'react';
import { MessageSquare, Upload, CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

interface ClaimSubmissionSectionProps {
  className?: string;
}

const ClaimSubmissionSection: React.FC<ClaimSubmissionSectionProps> = ({
  className,
}) => {
  const { ref, inView } = useInView({ 
    triggerOnce: true, 
    threshold: 0.1 
  });

  // Mock data for claim risk assessment
  const riskFactors = [
    { name: 'Claim Amount', score: 65, impact: 'Medium' },
    { name: 'Claims History', score: 85, impact: 'Low' },
    { name: 'Time-based Risk', score: 45, impact: 'High' },
    { name: 'Documentation', score: 90, impact: 'Low' },
  ];

  // Mock data for claim process steps
  const claimSteps = [
    { id: 1, name: 'Submit Claim', status: 'completed', icon: <MessageSquare className="h-5 w-5" /> },
    { id: 2, name: 'Upload Evidence', status: 'completed', icon: <Upload className="h-5 w-5" /> },
    { id: 3, name: 'Risk Assessment', status: 'current', icon: <AlertCircle className="h-5 w-5" /> },
    { id: 4, name: 'Review', status: 'pending', icon: <Clock className="h-5 w-5" /> },
    { id: 5, name: 'Payout', status: 'pending', icon: <CheckCircle2 className="h-5 w-5" /> },
  ];

  return (
    <div ref={ref} className={cn("container mx-auto px-4", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Content */}
        <div className="space-y-6">
          <div className={cn(
            "space-y-3 opacity-0 translate-y-4 transition-all duration-700",
            inView && "opacity-100 translate-y-0"
          )}>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Submit a <span className="text-blue-600 dark:text-blue-400">Claim</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              If an insured event occurs, our streamlined claim process ensures you get paid quickly and fairly, with full transparency throughout.
            </p>
          </div>

          <div className="space-y-4">
            <div className={cn(
              "flex items-start gap-3 opacity-0 translate-y-4 transition-all duration-700",
              inView && "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: "100ms" }}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 mt-1">
                <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Simple Submission</h3>
                <p className="text-muted-foreground mt-1">
                  Submit your claim with just a few clicks, providing details about the incident and the amount requested.
                </p>
              </div>
            </div>

            <div className={cn(
              "flex items-start gap-3 opacity-0 translate-y-4 transition-all duration-700",
              inView && "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: "200ms" }}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 mt-1">
                <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Document Upload</h3>
                <p className="text-muted-foreground mt-1">
                  Upload supporting documents such as contracts, communications, and proof of work to strengthen your claim.
                </p>
              </div>
            </div>

            <div className={cn(
              "flex items-start gap-3 opacity-0 translate-y-4 transition-all duration-700",
              inView && "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: "300ms" }}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 mt-1">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">AI Risk Assessment</h3>
                <p className="text-muted-foreground mt-1">
                  Our AI-powered risk model evaluates your claim based on multiple factors, with automatic approval for low-risk claims.
                </p>
              </div>
            </div>

            <div className={cn(
              "flex items-start gap-3 opacity-0 translate-y-4 transition-all duration-700",
              inView && "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: "400ms" }}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 mt-1">
                <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Fast Payouts</h3>
                <p className="text-muted-foreground mt-1">
                  Approved claims are paid directly to your wallet in USDC with real-time transaction confirmation.
                </p>
              </div>
            </div>
          </div>

          <div className={cn(
            "pt-4 opacity-0 translate-y-4 transition-all duration-700",
            inView && "opacity-100 translate-y-0"
          )}
          style={{ transitionDelay: "500ms" }}>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              View Demo
            </Button>
          </div>
        </div>

        {/* Right side - Claim UI Mockup */}
        <div className={cn(
          "opacity-0 translate-y-4 transition-all duration-700",
          inView && "opacity-100 translate-y-0"
        )}
        style={{ transitionDelay: "200ms" }}>
          <div className="border border-blue-200 dark:border-blue-900/30 p-6 rounded-xl shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50">
                    <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold">Claim Submission</h3>
                </div>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  In Progress
                </span>
              </div>

              {/* Claim Progress */}
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Claim ID</span>
                  <span className="font-medium">CLM-2025-03-18-0042</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">2.5 SOL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Submission Date</span>
                  <span className="font-medium">Mar 18, 2025</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">Under Review</span>
                </div>
              </div>

              {/* Claim Steps */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-medium">Claim Progress</h4>
                <div className="space-y-3">
                  {claimSteps.map((step) => (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full",
                        step.status === 'completed' ? "bg-green-100 dark:bg-green-900/30" : 
                        step.status === 'current' ? "bg-blue-100 dark:bg-blue-900/30" : 
                        "bg-gray-100 dark:bg-gray-800"
                      )}>
                        <div className={cn(
                          "h-4 w-4",
                          step.status === 'completed' ? "text-green-600 dark:text-green-400" : 
                          step.status === 'current' ? "text-blue-600 dark:text-blue-400" : 
                          "text-gray-400 dark:text-gray-500"
                        )}>
                          {step.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className={cn(
                            "text-sm font-medium",
                            step.status === 'completed' ? "text-green-600 dark:text-green-400" : 
                            step.status === 'current' ? "text-blue-600 dark:text-blue-400" : 
                            "text-gray-500 dark:text-gray-400"
                          )}>
                            {step.name}
                          </span>
                          {step.status === 'completed' && (
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                        {step.status === 'current' && (
                          <Progress value={60} className="h-1 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-medium">Risk Assessment</h4>
                <div className="space-y-2">
                  {riskFactors.map((factor, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{factor.name}</span>
                        <span className={cn(
                          factor.impact === 'Low' ? "text-green-600 dark:text-green-400" :
                          factor.impact === 'Medium' ? "text-amber-600 dark:text-amber-400" :
                          "text-red-600 dark:text-red-400"
                        )}>
                          {factor.impact} Impact
                        </span>
                      </div>
                      <Progress value={factor.score} className="h-1" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  View Claim Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimSubmissionSection;
