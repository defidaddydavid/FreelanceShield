import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { MonteCarloSimulationResult, SimulationPath } from '@/lib/insurance/monteCarloSimulation';

// Import Chart.js - you'll need to install this dependency
// npm install chart.js react-chartjs-2
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MonteCarloVisualizerProps {
  simulationResult: MonteCarloSimulationResult;
  basePremium: number;
  adjustedPremium: number;
  onRunNewSimulation?: () => void;
}

const MonteCarloVisualizer: React.FC<MonteCarloVisualizerProps> = ({
  simulationResult,
  basePremium,
  adjustedPremium,
  onRunNewSimulation
}) => {
  const [activeTab, setActiveTab] = useState('distribution');
  const [selectedRiskFactor, setSelectedRiskFactor] = useState('overall');
  const [simulationPathsToShow, setSimulationPathsToShow] = useState<number>(100);
  
  // Prepare data for distribution chart
  const prepareDistributionData = () => {
    // Create histogram of claim probabilities
    const histogramBins: Record<string, number> = {};
    const binSize = 0.01; // 1% bins
    
    simulationResult.simulationPaths.forEach(path => {
      const binKey = Math.floor(path.riskFactors.totalRisk / binSize) * binSize;
      histogramBins[binKey] = (histogramBins[binKey] || 0) + 1;
    });
    
    // Sort bins and convert to chart data
    const sortedBins = Object.keys(histogramBins)
      .map(Number)
      .sort((a, b) => a - b);
    
    return {
      labels: sortedBins.map(bin => `${(bin * 100).toFixed(0)}%`),
      datasets: [
        {
          label: 'Claim Probability Distribution',
          data: sortedBins.map(bin => histogramBins[bin]),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          borderColor: 'rgba(53, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Prepare data for convergence chart
  const prepareConvergenceData = () => {
    const { meanConvergence } = simulationResult.convergenceMetrics;
    
    return {
      labels: meanConvergence.map((_, index) => 
        index * Math.floor(simulationResult.simulationPaths.length / meanConvergence.length)
      ),
      datasets: [
        {
          label: 'Mean Convergence',
          data: meanConvergence.map(value => value * 100), // Convert to percentage
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };
  
  // Prepare data for risk factors chart
  const prepareRiskFactorsData = () => {
    const { varianceContributions } = simulationResult;
    
    // Sort factors by contribution
    const sortedFactors = Object.entries(varianceContributions)
      .sort(([, a], [, b]) => b - a);
    
    return {
      labels: sortedFactors.map(([factor]) => 
        factor.replace(/([A-Z])/g, ' $1').trim() // Add spaces before capital letters
      ),
      datasets: [
        {
          label: 'Risk Factor Contribution (%)',
          data: sortedFactors.map(([, value]) => value * 100), // Convert to percentage
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Prepare data for simulation paths chart
  const prepareSimulationPathsData = () => {
    // Get a subset of simulation paths
    const pathsToShow = simulationResult.simulationPaths
      .slice(0, simulationPathsToShow);
    
    // Get risk factor data based on selection
    const getDataForFactor = (path: SimulationPath) => {
      if (selectedRiskFactor === 'overall') {
        return path.riskFactors.totalRisk * 100; // Convert to percentage
      }
      
      // Return the specific risk factor if it exists
      return (path.riskFactors[selectedRiskFactor] || 0) * 100;
    };
    
    return {
      labels: pathsToShow.map(path => path.iteration),
      datasets: [
        {
          label: `${selectedRiskFactor.replace(/([A-Z])/g, ' $1').trim()} Risk (%)`,
          data: pathsToShow.map(path => getDataForFactor(path)),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: pathsToShow.map(path => 
            path.claimOccurred ? 'rgba(255, 99, 132, 0.8)' : 'rgba(75, 192, 192, 0.8)'
          ),
          borderWidth: 1,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };
  };
  
  // Chart options
  const distributionOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Claim Probability Distribution',
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const total = simulationResult.simulationPaths.length;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} simulations (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Claim Probability'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Number of Simulations'
        }
      }
    }
  };
  
  const convergenceOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Simulation Convergence',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Simulation Iterations'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Claim Probability (%)'
        },
        min: 0,
      }
    }
  };
  
  const riskFactorsOptions = {
    responsive: true,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Risk Factor Contributions',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Contribution to Overall Risk (%)'
        },
        max: 100,
      }
    }
  };
  
  const simulationPathsOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Simulation Paths',
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y.toFixed(1);
            const path = simulationResult.simulationPaths[context.dataIndex];
            const claimStatus = path.claimOccurred ? 'Claim Occurred' : 'No Claim';
            return [`${label}: ${value}%`, `Status: ${claimStatus}`];
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Simulation Iteration'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Risk Level (%)'
        },
        min: 0,
      }
    }
  };
  
  // Risk factor options for dropdown
  const riskFactorOptions = [
    { value: 'overall', label: 'Overall Risk' },
    ...Object.keys(simulationResult.simulationPaths[0]?.riskFactors || {})
      .filter(key => key !== 'totalRisk')
      .map(key => ({
        value: key,
        label: key.replace(/([A-Z])/g, ' $1').trim()
      }))
  ];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Monte Carlo Risk Simulation</span>
          <Badge variant={simulationResult.riskBucket === 'LOW' ? 'success' : 
                          simulationResult.riskBucket === 'MEDIUM' ? 'warning' : 'destructive'}>
            {simulationResult.riskBucket} RISK
          </Badge>
        </CardTitle>
        <CardDescription>
          Based on {simulationResult.simulationPaths.length.toLocaleString()} simulation iterations
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Base Premium</div>
            <div className="text-2xl font-bold">{basePremium.toFixed(2)} USDC</div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Risk Adjustment</div>
            <div className="text-2xl font-bold">
              {(simulationResult.premiumAdjustment * 100 - 100).toFixed(2)}%
            </div>
          </div>
          
          <div className="text-center p-4 border rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">Final Premium</div>
            <div className="text-2xl font-bold">{adjustedPremium.toFixed(2)} USDC</div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">
              Claim Probability: {(simulationResult.claimProbability * 100).toFixed(2)}%
            </div>
            <div className="text-sm text-muted-foreground">
              95% CI: [{(simulationResult.confidenceInterval[0] * 100).toFixed(2)}% - 
              {(simulationResult.confidenceInterval[1] * 100).toFixed(2)}%]
            </div>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                simulationResult.riskBucket === 'LOW' ? 'bg-green-500' : 
                simulationResult.riskBucket === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${simulationResult.claimProbability * 100}%` }}
            />
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="convergence">Convergence</TabsTrigger>
            <TabsTrigger value="riskFactors">Risk Factors</TabsTrigger>
            <TabsTrigger value="simulationPaths">Simulation Paths</TabsTrigger>
          </TabsList>
          
          <TabsContent value="distribution" className="h-80">
            <Bar data={prepareDistributionData()} options={distributionOptions} />
          </TabsContent>
          
          <TabsContent value="convergence" className="h-80">
            <Line data={prepareConvergenceData()} options={convergenceOptions} />
          </TabsContent>
          
          <TabsContent value="riskFactors" className="h-80">
            <Bar data={prepareRiskFactorsData()} options={riskFactorsOptions} />
          </TabsContent>
          
          <TabsContent value="simulationPaths" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <Select
                value={selectedRiskFactor}
                onValueChange={setSelectedRiskFactor}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Select risk factor" />
                </SelectTrigger>
                <SelectContent>
                  {riskFactorOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex flex-col w-full md:w-[300px]">
                <span className="text-sm mb-1">Paths to show: {simulationPathsToShow}</span>
                <Slider
                  min={10}
                  max={500}
                  step={10}
                  value={[simulationPathsToShow]}
                  onValueChange={(value) => setSimulationPathsToShow(value[0])}
                />
              </div>
            </div>
            
            <div className="h-80">
              <Line data={prepareSimulationPathsData()} options={simulationPathsOptions} />
            </div>
          </TabsContent>
        </Tabs>
        
        {onRunNewSimulation && (
          <div className="mt-6 flex justify-center">
            <Button onClick={onRunNewSimulation}>
              Run New Simulation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonteCarloVisualizer;
