import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, DollarSign, Calendar, Briefcase, Building, Star, AlertCircle, Loader2 } from 'lucide-react';
import { JobType, Industry } from '@/types';
import { useWallet } from '@solana/wallet-adapter-react';
import { NETWORK_CONFIG, RISK_WEIGHTS } from '@/lib/solana/constants';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFreelanceInsurance } from '@/lib/solana/hooks/useFreelanceInsurance';
import { usePremiumCalculation } from '@/lib/solana/hooks/usePremiumCalculation';

const NewPolicy = () => {
  const navigate = useNavigate();
  const { connected, publicKey } = useWallet();
  const { createPolicy, isLoading } = useFreelanceInsurance();
  const { calculatePremium } = usePremiumCalculation();
  
  // Policy form state
  const [formData, setFormData] = useState({
    projectName: '',
    clientName: '',
    coverageAmount: 1000,
    coveragePeriod: 30,
    jobType: JobType.DEVELOPMENT,
    industry: Industry.TECHNOLOGY,
    description: ''
  });

  // Premium calculation state
  const [premium, setPremium] = useState({
    premiumAmount: 0,
    baseRate: 0,
    coverageRatio: 0,
    periodAdjustment: 0,
    riskAdjustment: 0,
    reputationFactor: 0,
    totalRiskScore: 0
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState({
    projectName: '',
    clientName: '',
    description: ''
  });

  // Loading state for premium calculation
  const [calculatingPremium, setCalculatingPremium] = useState(false);

  // Update premium when form changes
  useEffect(() => {
    if (connected) {
      updatePremium();
    }
  }, [formData, connected]);

  const updatePremium = async () => {
    if (connected) {
      try {
        setCalculatingPremium(true);
        
        // Use the calculatePremium function from the hook
        const premiumResult = await calculatePremium({
          coverageAmount: formData.coverageAmount,
          periodDays: formData.coveragePeriod,
          jobType: formData.jobType,
          industry: formData.industry
        });
        
        // Set premium with the calculation result
        setPremium(premiumResult);
      } catch (error) {
        console.error('Error calculating premium:', error);
        toast.error('Premium Calculation Error', {
          description: 'There was an error calculating your premium. Please try again.'
        });
      } finally {
        setCalculatingPremium(false);
      }
    }
  };

  const validateForm = () => {
    const errors = {
      projectName: '',
      clientName: '',
      description: ''
    };
    
    if (!formData.projectName.trim()) {
      errors.projectName = 'Project name is required';
    }
    
    if (!formData.clientName.trim()) {
      errors.clientName = 'Client name is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Project description is required';
    }
    
    setFormErrors(errors);
    
    return !Object.values(errors).some(error => error);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const handleSliderChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value[0]
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!connected || !publicKey) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet to create a policy"
      });
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields"
      });
      return;
    }
    
    try {
      // Create policy using the updated hook
      const result = await createPolicy(
        formData.coverageAmount,
        premium.premiumAmount,
        formData.coveragePeriod,
        formData.jobType,
        formData.industry,
        formData.projectName,
        formData.clientName,
        formData.description
      );
      
      if (result.success) {
        toast.success("Policy Created", {
          description: `Your policy has been created successfully. Transaction ID: ${result.txId?.slice(0, 8)}...`
        });
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      toast.error("Policy Creation Failed", {
        description: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`
      });
    }
  };

  // Map job type enum to display names
  const getJobTypeDisplayName = (jobType) => {
    switch (jobType) {
      case JobType.DEVELOPMENT:
        return 'Software Development';
      case JobType.DESIGN:
        return 'Design';
      case JobType.WRITING:
        return 'Content Writing';
      case JobType.MARKETING:
        return 'Marketing';
      case JobType.CONSULTING:
        return 'Consulting';
      case JobType.ENGINEERING:
        return 'Engineering';
      default:
        return 'Other';
    }
  };

  // Map industry enum to display names
  const getIndustryDisplayName = (industry) => {
    switch (industry) {
      case Industry.TECHNOLOGY:
        return 'Technology';
      case Industry.HEALTHCARE:
        return 'Healthcare';
      case Industry.FINANCE:
        return 'Finance';
      case Industry.EDUCATION:
        return 'Education';
      case Industry.ECOMMERCE:
        return 'E-commerce';
      case Industry.ENTERTAINMENT:
        return 'Entertainment';
      case Industry.MANUFACTURING:
        return 'Manufacturing';
      default:
        return 'Other';
    }
  };

  const getRiskFactorForJobType = (jobType) => {
    // Map JobType enum values to the keys used in RISK_WEIGHTS.jobTypes
    const jobTypeMap = {
      [JobType.DEVELOPMENT]: 'development',
      [JobType.DESIGN]: 'design',
      [JobType.WRITING]: 'writing',
      [JobType.MARKETING]: 'marketing',
      [JobType.CONSULTING]: 'consulting',
      [JobType.ENGINEERING]: 'other', // Map to 'other' as there's no direct match
      [JobType.OTHER]: 'other'
    };
    
    const jobTypeKey = jobTypeMap[jobType] || 'other';
    return RISK_WEIGHTS.jobTypes[jobTypeKey] ? RISK_WEIGHTS.jobTypes[jobTypeKey].toFixed(2) : '1.00';
  };

  const getRiskFactorForIndustry = (industry) => {
    // Map Industry enum values to the keys used in RISK_WEIGHTS.industries
    const industryMap = {
      [Industry.TECHNOLOGY]: 'infrastructure', // Closest match
      [Industry.HEALTHCARE]: 'other',
      [Industry.FINANCE]: 'defi',
      [Industry.EDUCATION]: 'other',
      [Industry.ECOMMERCE]: 'other',
      [Industry.ENTERTAINMENT]: 'gaming', // Closest match
      [Industry.MANUFACTURING]: 'other',
      [Industry.OTHER]: 'other'
    };
    
    const industryKey = industryMap[industry] || 'other';
    return RISK_WEIGHTS.industries[industryKey] ? RISK_WEIGHTS.industries[industryKey].toFixed(2) : '1.00';
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Create New Insurance Policy</h1>
        
        {!connected && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Wallet not connected</AlertTitle>
            <AlertDescription>
              Please connect your wallet to create an insurance policy.
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Project Details
                </CardTitle>
                <CardDescription>
                  Enter details about your freelance project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleInputChange}
                    placeholder="Enter project name"
                    className={formErrors.projectName ? 'border-red-500' : ''}
                  />
                  {formErrors.projectName && (
                    <p className="text-sm text-red-500">{formErrors.projectName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    placeholder="Enter client name"
                    className={formErrors.clientName ? 'border-red-500' : ''}
                  />
                  {formErrors.clientName && (
                    <p className="text-sm text-red-500">{formErrors.clientName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Project Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe your project and the work you'll be doing"
                    className={`w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${formErrors.description ? 'border-red-500' : ''}`}
                  />
                  {formErrors.description && (
                    <p className="text-sm text-red-500">{formErrors.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Coverage Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Coverage Details
                </CardTitle>
                <CardDescription>
                  Configure your insurance coverage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="flex justify-between">
                    <span>Coverage Amount (USDC)</span>
                    <span className="font-semibold">{formData.coverageAmount} USDC</span>
                  </Label>
                  <Slider
                    defaultValue={[formData.coverageAmount]}
                    max={NETWORK_CONFIG.maxCoverageAmount}
                    min={NETWORK_CONFIG.minCoverageAmount}
                    step={100}
                    onValueChange={(value) => handleSliderChange('coverageAmount', value)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{NETWORK_CONFIG.minCoverageAmount} USDC</span>
                    <span>{NETWORK_CONFIG.maxCoverageAmount} USDC</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label className="flex justify-between">
                    <span>Coverage Period (Days)</span>
                    <span className="font-semibold">{formData.coveragePeriod} days</span>
                  </Label>
                  <Slider
                    defaultValue={[formData.coveragePeriod]}
                    max={NETWORK_CONFIG.maxPeriodDays}
                    min={NETWORK_CONFIG.minPeriodDays}
                    step={1}
                    onValueChange={(value) => handleSliderChange('coveragePeriod', value)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{NETWORK_CONFIG.minPeriodDays} days</span>
                    <span>{NETWORK_CONFIG.maxPeriodDays} days</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jobType">Job Type</Label>
                  <Select
                    value={formData.jobType}
                    onValueChange={(value) => handleSelectChange('jobType', value)}
                  >
                    <SelectTrigger id="jobType">
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(JobType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {getJobTypeDisplayName(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Risk factor: {getRiskFactorForJobType(formData.jobType)}x
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => handleSelectChange('industry', value)}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Industry).map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {getIndustryDisplayName(ind)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Risk factor: {getRiskFactorForIndustry(formData.industry)}x
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Premium Calculation */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Premium Calculation
              </CardTitle>
              <CardDescription>
                Review your premium and risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Premium Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Base Rate:</span>
                      <span>{premium.baseRate.toFixed(2)} USDC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Coverage Ratio:</span>
                      <span>x{premium.coverageRatio.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Period Adjustment:</span>
                      <span>x{premium.periodAdjustment.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Risk Adjustment:</span>
                      <span>x{premium.riskAdjustment.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Reputation Factor:</span>
                      <span>x{premium.reputationFactor.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-border my-2" />
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Premium:</span>
                      <span className="text-xl">{premium.premiumAmount.toFixed(2)} USDC</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-muted-foreground">Risk Score:</span>
                        <span className="font-medium">{premium.totalRiskScore.toFixed(0)}/100</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            premium.totalRiskScore < 30
                              ? 'bg-green-500'
                              : premium.totalRiskScore < 70
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${premium.totalRiskScore}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {premium.totalRiskScore < 30
                          ? 'Low risk - Good job!'
                          : premium.totalRiskScore < 70
                          ? 'Medium risk - Consider adjusting parameters'
                          : 'High risk - Premium is higher due to risk factors'}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Coverage Amount:</span>
                        <span>{formData.coverageAmount} USDC</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Coverage Period:</span>
                        <span>{formData.coveragePeriod} days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Job Type:</span>
                        <span>{getJobTypeDisplayName(formData.jobType)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Industry:</span>
                        <span>{getIndustryDisplayName(formData.industry)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isLoading || calculatingPremium || !connected}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Policy...
                  </>
                ) : (
                  <>Create Policy</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default NewPolicy;