import React from "react";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { 
  Wallet, 
  User, 
  Calculator, 
  Shield, 
  FileText, 
  CreditCard, 
  CheckCircle, 
  MessageSquare,
  Award,
  BarChart4
} from "lucide-react";

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "done" | "current" | "default" | "error";
  features?: string[];
}

export interface WorkflowTimelineProps {
  className?: string;
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  className,
}) => {
  const { ref, inView } = useInView({ 
    triggerOnce: true, 
    threshold: 0.1 
  });

  const steps: WorkflowStep[] = [
    {
      id: "1",
      title: "Connect Wallet & Profile Setup",
      description: "Connect your Solana wallet (Phantom, Solflare, or Backpack) and set up your freelancer profile with work history and portfolio details.",
      icon: <Wallet className="h-5 w-5" />,
      status: "done",
      features: [
        "Multiple wallet support",
        "Secure connection",
        "Profile customization",
        "Reputation integration"
      ]
    },
    {
      id: "2",
      title: "Choose Insurance Plan",
      description: "Select from Basic, Pro, or Enterprise plans with different coverage amounts, deductibles, and premium rates based on your needs.",
      icon: <Shield className="h-5 w-5" />,
      status: "current",
      features: [
        "Customizable coverage",
        "Flexible deductibles",
        "Monthly/annual options",
        "Coverage verification"
      ]
    },
    {
      id: "3",
      title: "Pay Premium",
      description: "Pay your insurance premium in SOL or USDC directly from your connected wallet with transparent fee structure.",
      icon: <CreditCard className="h-5 w-5" />,
      status: "default",
      features: [
        "Multiple tokens accepted",
        "Automatic renewals",
        "Payment history",
        "Receipt generation"
      ]
    },
    {
      id: "4",
      title: "Risk Pool Management",
      description: "Your premium joins our decentralized risk pool, managed by smart contracts with transparent capital allocation.",
      icon: <BarChart4 className="h-5 w-5" />,
      status: "default",
      features: [
        "Transparent allocation",
        "Real-time monitoring",
        "Smart contract security",
        "Capital efficiency"
      ]
    },
    {
      id: "5",
      title: "Smart Contract Policy",
      description: "Your policy is minted as an NFT with coverage details, terms, and conditions embedded in the metadata.",
      icon: <FileText className="h-5 w-5" />,
      status: "default",
      features: [
        "NFT representation",
        "On-chain verification",
        "Transferable ownership",
        "Coverage verification"
      ]
    },
    {
      id: "6",
      title: "Submit a Claim",
      description: "If an insured event occurs, submit your claim with supporting documents through our intuitive interface.",
      icon: <MessageSquare className="h-5 w-5" />,
      status: "default",
      features: [
        "Document upload",
        "AI risk scoring",
        "Progress tracking",
        "Automated approvals"
      ]
    },
    {
      id: "7",
      title: "Monte Carlo Risk Model",
      description: "Our advanced risk modeling uses Monte Carlo simulations to project claim outcomes and expected losses.",
      icon: <Calculator className="h-5 w-5" />,
      status: "default",
      features: [
        "Real-time simulation",
        "Confidence intervals",
        "Risk visualization",
        "Premium impact"
      ]
    },
    {
      id: "8",
      title: "Community Governance & Staking",
      description: "Participate in protocol governance by voting on insurance parameters and staking USDC/SOL for rewards.",
      icon: <User className="h-5 w-5" />,
      status: "default",
      features: [
        "Governance voting",
        "Staking rewards",
        "Proposal tracking",
        "Community participation"
      ]
    },
    {
      id: "9",
      title: "Receive Payout",
      description: "Approved claims are paid instantly to your wallet in USDC once verified with real-time status tracking.",
      icon: <CheckCircle className="h-5 w-5" />,
      status: "default",
      features: [
        "Instant payouts",
        "Status tracking",
        "Confirmation animation",
        "Appeal options"
      ]
    },
    {
      id: "10",
      title: "Reputation & Discount System",
      description: "Build your reputation score over time to earn discounts on future premiums and unlock additional benefits.",
      icon: <Award className="h-5 w-5" />,
      status: "default",
      features: [
        "Reputation scoring",
        "Premium discounts",
        "Trust indicators",
        "Loyalty rewards"
      ]
    }
  ];

  return (
    <div 
      ref={ref}
      className={cn("w-full py-12 space-y-8", className)}
    >
      <div className="relative max-w-5xl mx-auto">
        {/* Timeline connector line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 -translate-x-1/2 hidden md:block" />
        
        {/* Timeline steps */}
        <div className="space-y-16 relative">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={cn(
                "flex flex-col md:flex-row gap-8 md:gap-16 relative opacity-0 translate-y-8 transition-all duration-700",
                inView && "opacity-100 translate-y-0"
              )}
              style={{ transitionDelay: `${index * 150}ms` }}
              onTouchStart={() => {
                const hapticFeedback = window.navigator.vibrate(50);
                if (!hapticFeedback) {
                  console.log("Haptic feedback not supported");
                }
              }}
            >
              {/* Step number and icon - always centered on mobile, alternating on desktop */}
              <div className="flex items-center justify-center md:justify-end md:w-1/2 order-1 md:order-none">
                {index % 2 === 0 ? (
                  <div className="flex flex-col items-center md:items-end gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 relative">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          step.status === "done" ? "bg-green-100 text-green-600" : step.status === "current" ? "bg-blue-100 text-blue-600" : "bg-muted text-muted-foreground"
                        )}>
                          {step.icon}
                        </div>
                      </div>
                    </div>
                    <div className="text-right hidden md:block">
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                      <p className="text-muted-foreground mt-2 max-w-xs">
                        {step.description}
                      </p>
                      {step.features && (
                        <ul className="mt-3 space-y-1">
                          {step.features.map((feature, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex justify-end gap-2">
                              <span>{feature}</span>
                              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 md:hidden">
                    <div className="flex-shrink-0 relative">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        step.status === "done" ? "bg-green-100 text-green-600" : step.status === "current" ? "bg-blue-100 text-blue-600" : "bg-muted text-muted-foreground"
                      )}>
                        {step.icon}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Content - always below on mobile, alternating on desktop */}
              <div className="md:w-1/2 md:order-none">
                {index % 2 === 0 ? (
                  <div className="md:hidden">
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground mt-2">
                      {step.description}
                    </p>
                    {step.features && (
                      <ul className="mt-3 space-y-1">
                        {step.features.map((feature, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 hidden md:flex">
                      <div className="flex-shrink-0 relative">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          step.status === "done" ? "bg-green-100 text-green-600" : step.status === "current" ? "bg-blue-100 text-blue-600" : "bg-muted text-muted-foreground"
                        )}>
                          {step.icon}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mt-3 md:mt-0">{step.title}</h3>
                      <p className="text-muted-foreground mt-2 max-w-xs">
                        {step.description}
                      </p>
                      {step.features && (
                        <ul className="mt-3 space-y-1">
                          {step.features.map((feature, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowTimeline;
