import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { calculatePremium } from '@/utils/premiumCalculation';
import { PremiumBreakdown } from './PremiumBreakdown';
import { Info, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CardFooter } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSolanaInsurance, PolicyCreationParams, JobType, Industry } from '@/hooks/useSolanaInsurance';
import { useWallet } from '@solana/wallet-adapter-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const formSchema = z.object({
  projectName: z.string().min(3, {
    message: "Project name must be at least 3 characters.",
  }),
  policyType: z.string({
    required_error: "Please select a policy type.",
  }),
  clientName: z.string().min(2, {
    message: "Client name must be at least 2 characters.",
  }),
  projectValue: z.string().min(1, {
    message: "Please enter the project value.",
  }),
  coverageAmount: z.string().min(1, {
    message: "Please enter the coverage amount.",
  }),
  coveragePeriod: z.string({
    required_error: "Please select a coverage period.",
  }),
  jobType: z.string({
    required_error: "Please select a job type.",
  }),
  industry: z.string({
    required_error: "Please select an industry.",
  }),
  riskTolerance: z.number().min(0).max(100),
  projectDescription: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const PolicyDetailsForm = () => {
  const navigate = useNavigate();
  const { connected } = useWallet();
  const { createPolicy, estimatePremium, transactionStatus, error: solanaError } = useSolanaInsurance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [premium, setPremium] = useState({ value: 0, breakdown: null });
  const [error, setError] = useState<string | null>(null);
  
  const reputationScore = 75;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: "",
      policyType: "",
      clientName: "",
      projectValue: "",
      coverageAmount: "",
      coveragePeriod: "",
      jobType: "",
      industry: "",
      riskTolerance: 50,
      projectDescription: "",
    },
  });
  
  const projectValue = form.watch("projectValue");
  const coverageAmount = form.watch("coverageAmount");
  const coveragePeriod = form.watch("coveragePeriod");
  const riskTolerance = form.watch("riskTolerance");
  const jobType = form.watch("jobType");
  const industry = form.watch("industry");
  
  useEffect(() => {
    if (projectValue && coverageAmount && coveragePeriod && jobType && industry) {
      const projectValueNum = Number(projectValue);
      const coverageAmountNum = Number(coverageAmount);
      
      if (!isNaN(projectValueNum) && !isNaN(coverageAmountNum) && projectValueNum > 0) {
        try {
          // Map coverage period to days
          const periodMap: Record<string, number> = {
            "1month": 30,
            "3months": 90,
            "6months": 180,
            "1year": 365
          };
          
          const periodDays = periodMap[coveragePeriod] || 30;
          
          // Use the estimatePremium function from useSolanaInsurance
          const premiumResult = estimatePremium(
            coverageAmountNum,
            periodDays,
            jobType as JobType,
            industry as Industry
          );
          
          setPremium({ 
            value: premiumResult.premiumUSDC, 
            breakdown: premiumResult.breakdownFactors || null 
          });
        } catch (err) {
          console.error("Error calculating premium:", err);
          setPremium({ value: 0, breakdown: null });
        }
      }
    }
  }, [projectValue, coverageAmount, coveragePeriod, jobType, industry, riskTolerance, estimatePremium]);
  
  async function onSubmit(values: FormValues) {
    if (!connected) {
      setError("Please connect your wallet to create a policy");
      toast.error("Wallet not connected", {
        description: "You need to connect your Solana wallet to create a policy."
      });
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Map coverage period to days
      const periodMap: Record<string, number> = {
        "1month": 30,
        "3months": 90,
        "6months": 180,
        "1year": 365
      };
      
      const policyParams: PolicyCreationParams = {
        coverageAmount: Number(values.coverageAmount),
        coveragePeriod: periodMap[values.coveragePeriod] || 30,
        jobType: values.jobType,
        industry: values.industry,
        projectName: values.projectName,
        clientName: values.clientName,
        description: values.projectDescription || ""
      };
      
      // Create the policy on Solana blockchain
      const signature = await createPolicy(policyParams);
      
      toast.success("Policy created successfully", {
        description: `Your policy has been created on the Solana devnet. Transaction signature: ${signature.slice(0, 8)}...${signature.slice(-8)}`
      });
      
      // Navigate to policies page
      navigate("/dashboard/policies");
    } catch (err) {
      console.error("Error creating policy:", err);
      setError(err instanceof Error ? err.message : "Failed to create policy. Please try again.");
      toast.error("Policy creation failed", {
        description: err instanceof Error ? err.message : "Failed to create policy. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!connected && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Wallet Not Connected</AlertTitle>
            <AlertDescription>
              You need to connect your Solana wallet to create a policy. All transactions will be processed on the Solana devnet.
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {solanaError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Solana Connection Error</AlertTitle>
            <AlertDescription>{solanaError}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="projectName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name *</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Web Development Project" {...field} />
                </FormControl>
                <FormDescription>
                  A name to identify this project.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Name *</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Acme Corporation" {...field} />
                </FormControl>
                <FormDescription>
                  The name of your client for this project.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="policyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select policy type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="project">Project Protection</SelectItem>
                    <SelectItem value="payment">Payment Protection</SelectItem>
                    <SelectItem value="income">Income Protection</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive Coverage</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Type of insurance coverage.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="jobType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="web_development">Web Development</SelectItem>
                    <SelectItem value="mobile_development">Mobile Development</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="content_writing">Content Writing</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="data_analysis">Data Analysis</SelectItem>
                    <SelectItem value="blockchain_development">Blockchain Development</SelectItem>
                    <SelectItem value="ai_development">AI Development</SelectItem>
                    <SelectItem value="video_production">Video Production</SelectItem>
                    <SelectItem value="translation">Translation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Type of work you're performing.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                    <SelectItem value="nonprofit">Nonprofit</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Industry sector for this project.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="projectValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Value (USDC) *</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="1000" {...field} />
                </FormControl>
                <FormDescription>
                  Total value of your project in USDC.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="coverageAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coverage Amount (USDC) *</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="800" {...field} />
                </FormControl>
                <FormDescription>
                  Maximum amount that can be claimed in USDC.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="coveragePeriod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coverage Period *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select coverage period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1month">1 Month</SelectItem>
                    <SelectItem value="3months">3 Months</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  How long the policy will be active.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="riskTolerance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Risk Tolerance</FormLabel>
                <FormControl>
                  <div className="pt-2">
                    <Slider
                      defaultValue={[field.value]}
                      max={100}
                      step={1}
                      onValueChange={(vals) => field.onChange(vals[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Low Risk (Higher Premium)</span>
                      <span>High Risk (Lower Premium)</span>
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
                  Adjust your risk tolerance to affect premium costs.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="projectDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your project or freelance work..." 
                  className="min-h-[120px]" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Additional details about your project to help with risk assessment.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="relative">
          <PremiumBreakdown 
            premium={premium} 
            coveragePeriod={coveragePeriod} 
            riskTolerance={riskTolerance} 
          />
          <div className="absolute top-6 right-6">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Info className="h-4 w-4" />
                  <span className="sr-only">Premium information</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <h4 className="font-medium mb-2">How we calculate your premium</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Your premium is calculated using several factors including project value, coverage amount, 
                  coverage period, risk tolerance, job type, industry, and your reputation score.
                </p>
                <p className="text-sm text-muted-foreground">
                  The final premium is: Base Rate × Coverage Ratio × Period Adjustment × 
                  Risk Adjustment × Reputation Factor × Market Conditions
                </p>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <CardFooter className="px-0 pt-2 pb-0 flex justify-end">
          <Button 
            variant="outline" 
            type="button" 
            className="mr-2"
            onClick={() => navigate("/dashboard/policies")}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !connected}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Policy...
              </>
            ) : (
              "Create Policy"
            )}
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
};
