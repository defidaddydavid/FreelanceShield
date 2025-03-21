import React from 'react';
import { Calculator, TrendingUp, BarChart3, PieChart, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

interface MonteCarloRiskSectionProps {
  className?: string;
}

const MonteCarloRiskSection: React.FC<MonteCarloRiskSectionProps> = ({
  className,
}) => {
  const { ref, inView } = useInView({ 
    triggerOnce: true, 
    threshold: 0.1 
  });

  // Mock data for Monte Carlo simulation results
  const simulationData = [
    { percentile: 50, expectedLoss: 0.8, color: 'bg-green-500' },
    { percentile: 75, expectedLoss: 1.2, color: 'bg-blue-500' },
    { percentile: 90, expectedLoss: 1.8, color: 'bg-amber-500' },
    { percentile: 95, expectedLoss: 2.3, color: 'bg-orange-500' },
    { percentile: 99, expectedLoss: 3.5, color: 'bg-red-500' },
  ];

  // Mock data for risk factors
  const riskFactors = [
    { name: 'Job Type', weight: 20, description: 'Different job types have varying risk profiles' },
    { name: 'Industry', weight: 15, description: 'Some industries have higher dispute rates' },
    { name: 'Coverage Ratio', weight: 30, description: 'Higher coverage correlates with higher risk' },
    { name: 'Reputation', weight: 35, description: 'Freelancer reputation strongly impacts risk' },
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
              Monte Carlo <span className="text-blue-600 dark:text-blue-400">Risk Model</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Our advanced risk modeling uses Monte Carlo simulations to project claim outcomes, ensuring the solvency of our insurance pool.
            </p>
          </div>

          <div className="space-y-4">
            <div className={cn(
              "flex items-start gap-3 opacity-0 translate-y-4 transition-all duration-700",
              inView && "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: "100ms" }}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 mt-1">
                <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">10,000+ Simulations</h3>
                <p className="text-muted-foreground mt-1">
                  Our model runs thousands of simulations to predict potential claim scenarios and their financial impact.
                </p>
              </div>
            </div>

            <div className={cn(
              "flex items-start gap-3 opacity-0 translate-y-4 transition-all duration-700",
              inView && "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: "200ms" }}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 mt-1">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Dynamic Premium Adjustment</h3>
                <p className="text-muted-foreground mt-1">
                  Premiums are calculated based on risk factors and adjusted dynamically as market conditions change.
                </p>
              </div>
            </div>

            <div className={cn(
              "flex items-start gap-3 opacity-0 translate-y-4 transition-all duration-700",
              inView && "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: "300ms" }}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 mt-1">
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Confidence Intervals</h3>
                <p className="text-muted-foreground mt-1">
                  Our model provides clear confidence intervals for expected losses, helping maintain appropriate reserves.
                </p>
              </div>
            </div>

            <div className={cn(
              "flex items-start gap-3 opacity-0 translate-y-4 transition-all duration-700",
              inView && "opacity-100 translate-y-0"
            )}
            style={{ transitionDelay: "400ms" }}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 mt-1">
                <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Transparent Risk Factors</h3>
                <p className="text-muted-foreground mt-1">
                  We clearly display how different factors affect your premium, with a focus on fairness and transparency.
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
              View Risk Methodology
            </Button>
          </div>
        </div>

        {/* Right side - Risk Model Visualization */}
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
                    <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold">Risk Simulation</h3>
                </div>
              </div>

              {/* Simulation Results */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Expected Loss by Confidence Level</h4>
                <div className="space-y-3">
                  {simulationData.map((data, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{data.percentile}% Confidence</span>
                        <span>{data.expectedLoss} SOL</span>
                      </div>
                      <div className="w-full h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${data.color} rounded-full`} 
                          style={{ width: `${Math.min(data.expectedLoss / 4 * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Premium Calculation Formula */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Premium Calculation Formula</h4>
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm font-mono">
                  <p>Premium = BaseRate * CoverageRatio * PeriodAdjustment * RiskAdjustment * ReputationFactor</p>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Risk Score Components</h4>
                <div className="grid grid-cols-2 gap-3">
                  {riskFactors.map((factor, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{factor.name}</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                          {factor.weight}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {factor.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reserve Ratio */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Reserve Ratio</h4>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">150%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Current reserve exceeds the recommended 50% buffer for maximum security
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonteCarloRiskSection;
