import React, { useState } from "react";
import { Check, Minus, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";

interface InsurancePlan {
  name: string;
  price: number;
  currency: string;
  description: string;
  popular?: boolean;
  color: string;
  features: Array<{
    name: string;
    included: boolean;
  }>;
}

interface InsurancePlanSelectorProps {
  className?: string;
}

export function InsurancePlanSelector({ className }: InsurancePlanSelectorProps) {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(1); // Default to middle plan
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  
  const plans: InsurancePlan[] = [
    {
      name: "Basic",
      price: 0.1,
      currency: "SOL",
      description: "Essential coverage for freelancers just starting out",
      color: "blue",
      features: [
        { name: "Coverage Amount", included: true },
        { name: "Payment Disputes", included: true },
        { name: "Project Cancellations", included: true },
        { name: "Client Bankruptcy", included: false },
        { name: "Expedited Claims", included: false },
        { name: "Premium Discounts", included: false },
      ]
    },
    {
      name: "Professional",
      price: 0.25,
      currency: "SOL",
      description: "Comprehensive coverage for established freelancers",
      popular: true,
      color: "purple",
      features: [
        { name: "Coverage Amount", included: true },
        { name: "Payment Disputes", included: true },
        { name: "Project Cancellations", included: true },
        { name: "Client Bankruptcy", included: true },
        { name: "Expedited Claims", included: true },
        { name: "Premium Discounts", included: false },
      ]
    },
    {
      name: "Enterprise",
      price: 0.5,
      currency: "SOL",
      description: "Maximum protection for high-value freelance work",
      color: "amber",
      features: [
        { name: "Coverage Amount", included: true },
        { name: "Payment Disputes", included: true },
        { name: "Project Cancellations", included: true },
        { name: "Client Bankruptcy", included: true },
        { name: "Expedited Claims", included: true },
        { name: "Premium Discounts", included: true },
      ]
    }
  ];

  const getColorClasses = (color: string, isSelected: boolean) => {
    const baseClasses = "transition-all duration-300";
    
    if (color === "blue") {
      return isSelected 
        ? "ring-2 ring-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-900/20" 
        : "hover:border-blue-200 dark:hover:border-blue-800";
    } else if (color === "purple") {
      return isSelected 
        ? "ring-2 ring-purple-500 shadow-lg shadow-purple-100 dark:shadow-purple-900/20" 
        : "hover:border-purple-200 dark:hover:border-purple-800";
    } else if (color === "amber") {
      return isSelected 
        ? "ring-2 ring-amber-500 shadow-lg shadow-amber-100 dark:shadow-amber-900/20" 
        : "hover:border-amber-200 dark:hover:border-amber-800";
    }
    
    return "";
  };

  return (
    <div 
      ref={ref}
      className={cn("w-full py-12", className)}
    >
      <div className="container mx-auto">
        <div className="flex text-center justify-center items-center gap-4 flex-col">
          <Badge className="opacity-0 translate-y-4 transition-all duration-500" 
            style={{ transitionDelay: "100ms" }}
            data-state={inView ? "visible" : "hidden"}>
            Insurance Plans
          </Badge>
          <div className="flex gap-2 flex-col opacity-0 translate-y-4 transition-all duration-500" 
            style={{ transitionDelay: "200ms" }}
            data-state={inView ? "visible" : "hidden"}>
            <h2 className="text-3xl md:text-4xl tracking-tighter font-bold text-center">
              Choose the right coverage for you
            </h2>
            <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl text-center mx-auto">
              Compare our plans to find the perfect insurance coverage for your freelance work
            </p>
          </div>
          
          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-10">
            {plans.map((plan, index) => (
              <Card 
                key={index}
                className={cn(
                  "p-6 flex flex-col gap-4 relative border cursor-pointer opacity-0 translate-y-4 transition-all duration-500",
                  getColorClasses(plan.color, selectedPlan === index),
                  inView && "opacity-100 translate-y-0"
                )}
                style={{ transitionDelay: `${300 + index * 100}ms` }}
                onClick={() => setSelectedPlan(index)}
              >
                {plan.popular && (
                  <Badge className="absolute top-4 right-4" variant="outline">Popular</Badge>
                )}
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-medium">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-lg font-medium">{plan.currency}</span>
                  <span className="text-muted-foreground text-sm ml-1">/month</span>
                </div>
                <div className="flex-1">
                  <ul className="space-y-2 mt-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <Minus className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? "" : "text-muted-foreground"}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button 
                  className={cn(
                    "mt-4 w-full",
                    plan.color === "blue" && "bg-blue-600 hover:bg-blue-700",
                    plan.color === "purple" && "bg-purple-600 hover:bg-purple-700",
                    plan.color === "amber" && "bg-amber-600 hover:bg-amber-700",
                  )}
                >
                  Choose Plan
                </Button>
              </Card>
            ))}
          </div>
          
          {/* Comparison Table */}
          <div className="w-full max-w-5xl mt-16 overflow-x-auto opacity-0 translate-y-4 transition-all duration-500" 
            style={{ transitionDelay: "600ms" }}
            data-state={inView ? "visible" : "hidden"}>
            <div className="min-w-[600px]">
              <div className="grid grid-cols-4 gap-0 border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 bg-muted/50 font-medium">Features</div>
                <div className="px-6 py-4 bg-muted/50 font-medium text-center text-blue-600">Basic</div>
                <div className="px-6 py-4 bg-muted/50 font-medium text-center text-purple-600">Professional</div>
                <div className="px-6 py-4 bg-muted/50 font-medium text-center text-amber-600">Enterprise</div>
                
                {/* Coverage Amount */}
                <div className="px-6 py-4 border-t">Coverage Amount</div>
                <div className="px-6 py-4 border-t text-center">Up to 1,000 USDC</div>
                <div className="px-6 py-4 border-t text-center">Up to 5,000 USDC</div>
                <div className="px-6 py-4 border-t text-center">Up to 20,000 USDC</div>
                
                {/* Claims Processing */}
                <div className="px-6 py-4 border-t">Claims Processing</div>
                <div className="px-6 py-4 border-t text-center">Standard (3-5 days)</div>
                <div className="px-6 py-4 border-t text-center">Expedited (1-2 days)</div>
                <div className="px-6 py-4 border-t text-center">Priority (24 hours)</div>
                
                {/* Client Bankruptcy */}
                <div className="px-6 py-4 border-t">Client Bankruptcy</div>
                <div className="px-6 py-4 border-t flex justify-center">
                  <Minus className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="px-6 py-4 border-t flex justify-center">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <div className="px-6 py-4 border-t flex justify-center">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                
                {/* Premium Discounts */}
                <div className="px-6 py-4 border-t">Premium Discounts</div>
                <div className="px-6 py-4 border-t flex justify-center">
                  <Minus className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="px-6 py-4 border-t flex justify-center">
                  <Minus className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="px-6 py-4 border-t flex justify-center">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InsurancePlanSelector;
