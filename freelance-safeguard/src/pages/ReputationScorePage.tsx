import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Slider 
} from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Switch 
} from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Shield, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Info,
  ArrowRight,
  Percent,
  History,
  TrendingUp,
  HelpCircle,
  Award,
  FileText,
  BarChart,
  Calendar,
  Users
} from 'lucide-react';
import { ReputationScoreCard } from '@/components/insurance/ReputationScoreCard';
import { UserReputationData } from '@/lib/insurance/calculations';
import { cn } from '@/lib/utils';

const defaultUserData: UserReputationData = {
  onTimePayments: 18,
  totalTransactions: 20,
  disputes: 0,
  completedContracts: 8,
  avgRating: 4.8,
  positiveFeedbackPct: 95,
  accountAgeMonths: 24,
  lastActiveMonths: 1,
  claimsMade: 0,
  fraudFlagged: false
};

export default function ReputationScorePage() {
  const [userData, setUserData] = useState<UserReputationData>(defaultUserData);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { ref: heroRef, inView: heroInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  // Helper function to update user data
  const updateUserData = (key: keyof UserReputationData, value: number | boolean) => {
    setUserData(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Reset to default values
  const resetToDefault = () => {
    setUserData(defaultUserData);
  };
  
  // Set to high risk profile
  const setHighRiskProfile = () => {
    setUserData({
      onTimePayments: 12,
      totalTransactions: 20,
      disputes: 3,
      completedContracts: 4,
      avgRating: 3.8,
      positiveFeedbackPct: 75,
      accountAgeMonths: 4,
      lastActiveMonths: 8,
      claimsMade: 2,
      fraudFlagged: false
    });
  };
  
  // Set to low risk profile
  const setLowRiskProfile = () => {
    setUserData({
      onTimePayments: 25,
      totalTransactions: 25,
      disputes: 0,
      completedContracts: 15,
      avgRating: 5.0,
      positiveFeedbackPct: 100,
      accountAgeMonths: 36,
      lastActiveMonths: 0,
      claimsMade: 0,
      fraudFlagged: false
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section 
          ref={heroRef}
          className="py-16 md:py-24 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 relative overflow-hidden"
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Reputation Score System
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Understand how your work-based reputation affects your insurance premiums and what you can do to improve it.
                </p>
                
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => setActiveTab('overview')}
                  >
                    <Shield className="h-5 w-5 mr-2" />
                    View Your Score
                  </Button>
                  
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                    onClick={() => setActiveTab('calculator')}
                  >
                    <BarChart className="h-5 w-5 mr-2" />
                    Try the Calculator
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Main Content Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <Tabs 
              defaultValue="overview" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="flex justify-center mb-8">
                <TabsList className="grid w-full max-w-3xl grid-cols-4">
                  <TabsTrigger value="overview">
                    <Shield className="h-4 w-4 mr-2 hidden sm:inline" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="activity">
                    <History className="h-4 w-4 mr-2 hidden sm:inline" />
                    Activity History
                  </TabsTrigger>
                  <TabsTrigger value="improvement">
                    <TrendingUp className="h-4 w-4 mr-2 hidden sm:inline" />
                    Improvement Plan
                  </TabsTrigger>
                  <TabsTrigger value="calculator">
                    <BarChart className="h-4 w-4 mr-2 hidden sm:inline" />
                    Calculator
                  </TabsTrigger>
                  <TabsTrigger value="faq">
                    <HelpCircle className="h-4 w-4 mr-2 hidden sm:inline" />
                    FAQ
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="overview" className="space-y-8">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Work & Payment History
                    </CardTitle>
                    <CardDescription>
                      Your track record of completed work and payments
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>On-time Payments/Deliveries</Label>
                        <span className="text-sm font-medium">
                          {userData.onTimePayments} / {userData.totalTransactions} 
                          ({Math.round((userData.onTimePayments / userData.totalTransactions) * 100)}%)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">On-time</Label>
                          <Input 
                            type="number" 
                            min="0"
                            max={userData.totalTransactions}
                            value={userData.onTimePayments}
                            onChange={(e) => updateUserData('onTimePayments', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Total</Label>
                          <Input 
                            type="number" 
                            min={userData.onTimePayments}
                            value={userData.totalTransactions}
                            onChange={(e) => {
                              const newTotal = parseInt(e.target.value) || 0;
                              updateUserData('totalTransactions', newTotal);
                              if (userData.onTimePayments > newTotal) {
                                updateUserData('onTimePayments', newTotal);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Disputes</Label>
                        <span className="text-sm font-medium">{userData.disputes}</span>
                      </div>
                      <Slider
                        value={[userData.disputes]}
                        min={0}
                        max={5}
                        step={1}
                        onValueChange={(value) => updateUserData('disputes', value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0 (Best)</span>
                        <span>5 (Worst)</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Completed Contracts</Label>
                        <span className="text-sm font-medium">{userData.completedContracts}</span>
                      </div>
                      <Slider
                        value={[userData.completedContracts]}
                        min={0}
                        max={20}
                        step={1}
                        onValueChange={(value) => updateUserData('completedContracts', value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0</span>
                        <span>20+</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      User Feedback & Ratings
                    </CardTitle>
                    <CardDescription>
                      How others rate your work and interactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Average Rating</Label>
                        <span className="text-sm font-medium">
                          {userData.avgRating.toFixed(1)} / 5.0
                        </span>
                      </div>
                      <Slider
                        value={[userData.avgRating * 10]}
                        min={10}
                        max={50}
                        step={1}
                        onValueChange={(value) => updateUserData('avgRating', value[0] / 10)}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>1.0</span>
                        <span>5.0</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Positive Feedback Percentage</Label>
                        <span className="text-sm font-medium">{userData.positiveFeedbackPct}%</span>
                      </div>
                      <Slider
                        value={[userData.positiveFeedbackPct]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(value) => updateUserData('positiveFeedbackPct', value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Tenure & Activity
                    </CardTitle>
                    <CardDescription>
                      Your account age and recent activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Account Age (Months)</Label>
                        <span className="text-sm font-medium">
                          {userData.accountAgeMonths} {userData.accountAgeMonths === 1 ? 'month' : 'months'}
                        </span>
                      </div>
                      <Slider
                        value={[userData.accountAgeMonths]}
                        min={0}
                        max={48}
                        step={1}
                        onValueChange={(value) => updateUserData('accountAgeMonths', value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>New</span>
                        <span>4+ years</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Months Since Last Activity</Label>
                        <span className="text-sm font-medium">
                          {userData.lastActiveMonths} {userData.lastActiveMonths === 1 ? 'month' : 'months'}
                        </span>
                      </div>
                      <Slider
                        value={[userData.lastActiveMonths]}
                        min={0}
                        max={12}
                        step={1}
                        onValueChange={(value) => updateUserData('lastActiveMonths', value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Active now</span>
                        <span>1+ year inactive</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Claims & Compliance
                    </CardTitle>
                    <CardDescription>
                      Your insurance claims history and policy compliance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Claims Made (Last 12 Months)</Label>
                        <span className="text-sm font-medium">{userData.claimsMade}</span>
                      </div>
                      <Slider
                        value={[userData.claimsMade]}
                        min={0}
                        max={5}
                        step={1}
                        onValueChange={(value) => updateUserData('claimsMade', value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>0 (Best)</span>
                        <span>5+ (Worst)</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch 
                        id="fraud-flag"
                        checked={userData.fraudFlagged}
                        onCheckedChange={(checked) => updateUserData('fraudFlagged', checked)}
                      />
                      <Label htmlFor="fraud-flag" className="text-sm">
                        Account has fraud or policy violation flags
                      </Label>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline" onClick={resetToDefault}>
                    Reset to Default
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                    onClick={setHighRiskProfile}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    High Risk Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30"
                    onClick={setLowRiskProfile}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Low Risk Profile
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="space-y-8">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Activity History</CardTitle>
                    <CardDescription>
                      A record of your past work and interactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p>
                      Your activity history is a record of your past work and interactions on the platform. 
                      This includes completed contracts, payments, and any disputes or issues that may have arisen.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          <h3 className="font-medium">Completed Contracts</h3>
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-600 dark:text-indigo-400">•</span>
                            <span><strong>Contract 1:</strong> Completed on January 1, 2022</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-600 dark:text-indigo-400">•</span>
                            <span><strong>Contract 2:</strong> Completed on March 15, 2022</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          <h3 className="font-medium">Payments</h3>
                        </div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-600 dark:text-indigo-400">•</span>
                            <span><strong>Payment 1:</strong> Received on January 15, 2022</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-indigo-600 dark:text-indigo-400">•</span>
                            <span><strong>Payment 2:</strong> Received on April 1, 2022</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-medium mt-6">Disputes and Issues</h3>
                    <p>
                      If you have any disputes or issues with your activity history, please contact our support team.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          <h3 className="font-medium">Dispute 1</h3>
                        </div>
                        <p className="text-sm">
                          Dispute 1 was resolved on February 1, 2022.
                        </p>
                      </div>
                      
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          <h3 className="font-medium">Dispute 2</h3>
                        </div>
                        <p className="text-sm">
                          Dispute 2 was resolved on May 15, 2022.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="improvement" className="space-y-8">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Improvement Plan</CardTitle>
                    <CardDescription>
                      A personalized plan to help you improve your reputation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p>
                      Based on your activity history and reputation score, we have created a personalized improvement plan to help you improve your reputation.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          <h3 className="font-medium">Goal 1: Complete 5 more contracts</h3>
                        </div>
                        <p className="text-sm">
                          Completing more contracts will help improve your reputation and increase your earnings.
                        </p>
                      </div>
                      
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          <h3 className="font-medium">Goal 2: Maintain a 90% on-time payment rate</h3>
                        </div>
                        <p className="text-sm">
                          Maintaining a high on-time payment rate will help improve your reputation and increase your earnings.
                        </p>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-medium mt-6">Tips for Improvement</h3>
                    <p>
                      Here are some additional tips to help you improve your reputation:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <HelpCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          <h3 className="font-medium">Tip 1: Communicate effectively with clients</h3>
                        </div>
                        <p className="text-sm">
                          Effective communication is key to building strong relationships with clients and improving your reputation.
                        </p>
                      </div>
                      
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <HelpCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          <h3 className="font-medium">Tip 2: Meet deadlines and deliver high-quality work</h3>
                        </div>
                        <p className="text-sm">
                          Meeting deadlines and delivering high-quality work will help improve your reputation and increase your earnings.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="calculator" className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Controls */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          Work & Payment History
                        </CardTitle>
                        <CardDescription>
                          Your track record of completed work and payments
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>On-time Payments/Deliveries</Label>
                            <span className="text-sm font-medium">
                              {userData.onTimePayments} / {userData.totalTransactions} 
                              ({Math.round((userData.onTimePayments / userData.totalTransactions) * 100)}%)
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs">On-time</Label>
                              <Input 
                                type="number" 
                                min="0"
                                max={userData.totalTransactions}
                                value={userData.onTimePayments}
                                onChange={(e) => updateUserData('onTimePayments', parseInt(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Total</Label>
                              <Input 
                                type="number" 
                                min={userData.onTimePayments}
                                value={userData.totalTransactions}
                                onChange={(e) => {
                                  const newTotal = parseInt(e.target.value) || 0;
                                  updateUserData('totalTransactions', newTotal);
                                  if (userData.onTimePayments > newTotal) {
                                    updateUserData('onTimePayments', newTotal);
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Disputes</Label>
                            <span className="text-sm font-medium">{userData.disputes}</span>
                          </div>
                          <Slider
                            value={[userData.disputes]}
                            min={0}
                            max={5}
                            step={1}
                            onValueChange={(value) => updateUserData('disputes', value[0])}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0 (Best)</span>
                            <span>5 (Worst)</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Completed Contracts</Label>
                            <span className="text-sm font-medium">{userData.completedContracts}</span>
                          </div>
                          <Slider
                            value={[userData.completedContracts]}
                            min={0}
                            max={20}
                            step={1}
                            onValueChange={(value) => updateUserData('completedContracts', value[0])}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0</span>
                            <span>20+</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          User Feedback & Ratings
                        </CardTitle>
                        <CardDescription>
                          How others rate your work and interactions
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Average Rating</Label>
                            <span className="text-sm font-medium">
                              {userData.avgRating.toFixed(1)} / 5.0
                            </span>
                          </div>
                          <Slider
                            value={[userData.avgRating * 10]}
                            min={10}
                            max={50}
                            step={1}
                            onValueChange={(value) => updateUserData('avgRating', value[0] / 10)}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>1.0</span>
                            <span>5.0</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Positive Feedback Percentage</Label>
                            <span className="text-sm font-medium">{userData.positiveFeedbackPct}%</span>
                          </div>
                          <Slider
                            value={[userData.positiveFeedbackPct]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(value) => updateUserData('positiveFeedbackPct', value[0])}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          Tenure & Activity
                        </CardTitle>
                        <CardDescription>
                          Your account age and recent activity
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Account Age (Months)</Label>
                            <span className="text-sm font-medium">
                              {userData.accountAgeMonths} {userData.accountAgeMonths === 1 ? 'month' : 'months'}
                            </span>
                          </div>
                          <Slider
                            value={[userData.accountAgeMonths]}
                            min={0}
                            max={48}
                            step={1}
                            onValueChange={(value) => updateUserData('accountAgeMonths', value[0])}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>New</span>
                            <span>4+ years</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Months Since Last Activity</Label>
                            <span className="text-sm font-medium">
                              {userData.lastActiveMonths} {userData.lastActiveMonths === 1 ? 'month' : 'months'}
                            </span>
                          </div>
                          <Slider
                            value={[userData.lastActiveMonths]}
                            min={0}
                            max={12}
                            step={1}
                            onValueChange={(value) => updateUserData('lastActiveMonths', value[0])}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Active now</span>
                            <span>1+ year inactive</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          Claims & Compliance
                        </CardTitle>
                        <CardDescription>
                          Your insurance claims history and policy compliance
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label>Claims Made (Last 12 Months)</Label>
                            <span className="text-sm font-medium">{userData.claimsMade}</span>
                          </div>
                          <Slider
                            value={[userData.claimsMade]}
                            min={0}
                            max={5}
                            step={1}
                            onValueChange={(value) => updateUserData('claimsMade', value[0])}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0 (Best)</span>
                            <span>5+ (Worst)</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 pt-2">
                          <Switch 
                            id="fraud-flag"
                            checked={userData.fraudFlagged}
                            onCheckedChange={(checked) => updateUserData('fraudFlagged', checked)}
                          />
                          <Label htmlFor="fraud-flag" className="text-sm">
                            Account has fraud or policy violation flags
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="flex flex-wrap gap-4">
                      <Button variant="outline" onClick={resetToDefault}>
                        Reset to Default
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                        onClick={setHighRiskProfile}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        High Risk Profile
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30"
                        onClick={setLowRiskProfile}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Low Risk Profile
                      </Button>
                    </div>
                  </div>
                  
                  {/* Results */}
                  <div className="space-y-6">
                    <ReputationScoreCard userData={userData} showDetails={true} />
                    
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Percent className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          Premium Impact
                        </CardTitle>
                        <CardDescription>
                          How your reputation affects your insurance costs
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-muted/50">
                            <div className="text-sm text-muted-foreground mb-1">Base Premium</div>
                            <div className="text-2xl font-bold">$100.00</div>
                          </div>
                          
                          <div className="flex items-center">
                            <ArrowRight className="h-5 w-5 text-muted-foreground mx-4" />
                          </div>
                          
                          <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <div className="text-sm text-muted-foreground mb-1">Your Premium</div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              ${(100 * (1 - ((100 - userData.score) / 200))).toFixed(2)}
                            </div>
                            <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                              {Math.round((userData.score / 200) * 100)}% discount applied
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="faq" className="space-y-8">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Frequently Asked Questions
                    </CardTitle>
                    <CardDescription>
                      Common questions about the work-based reputation system
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">What is the work-based reputation system?</h3>
                        <p className="text-muted-foreground">
                          Our work-based reputation system evaluates your reliability and trustworthiness based on your actual performance as a freelancer or client. 
                          Unlike traditional credit scores, our system focuses on verifiable on-chain actions and work history rather than financial background.
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">How is my reputation score calculated?</h3>
                        <p className="text-muted-foreground">
                          Your reputation score is calculated based on five key components:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                          <li><strong>Work History (35%):</strong> Completed contracts, on-time deliveries, and contract values</li>
                          <li><strong>Payment History (25%):</strong> On-time payments and payment consistency</li>
                          <li><strong>Dispute Resolution (20%):</strong> Number of disputes and how they were resolved</li>
                          <li><strong>Platform Activity (10%):</strong> Account age and recent activity</li>
                          <li><strong>Governance Participation (10%):</strong> Participation in platform governance and community</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">What is time decay and how does it affect my score?</h3>
                        <p className="text-muted-foreground">
                          Time decay means that recent activities have a stronger impact on your reputation score than older ones. 
                          This ensures that your score reflects your current behavior and reliability, not just historical data. 
                          Activities from the past 3 months have full weight, while older activities gradually decrease in importance.
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">How does my reputation score affect my insurance premium?</h3>
                        <p className="text-muted-foreground">
                          Your reputation score directly impacts your insurance premium through a tiered discount system:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                          <li><strong>75-100 (Low Risk):</strong> 22-30% discount on your premium</li>
                          <li><strong>50-74 (Medium Risk):</strong> 15-22% discount on your premium</li>
                          <li><strong>0-49 (High Risk):</strong> 0-15% discount on your premium</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">How can I improve my reputation score?</h3>
                        <p className="text-muted-foreground">
                          Here are the most effective ways to improve your score:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                          <li>Complete more contracts successfully and on time</li>
                          <li>Make all payments on time</li>
                          <li>Resolve disputes amicably and quickly</li>
                          <li>Maintain regular activity on the platform</li>
                          <li>Participate in platform governance and community activities</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Why is my score different from last month?</h3>
                        <p className="text-muted-foreground">
                          Your score may change due to:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                          <li>New completed contracts or payments</li>
                          <li>Time decay affecting older activities</li>
                          <li>Recent disputes or their resolution</li>
                          <li>Changes in your activity level</li>
                          <li>System updates to improve accuracy and fairness</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">How are verifiable metrics used in my score?</h3>
                        <p className="text-muted-foreground">
                          Our system relies on verifiable on-chain metrics to ensure transparency and prevent manipulation:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
                          <li>Smart contract interactions for completed work</li>
                          <li>Blockchain-verified payment timestamps</li>
                          <li>On-chain dispute resolution records</li>
                          <li>Verifiable governance participation</li>
                          <li>Cryptographically signed feedback and ratings</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Can I dispute my reputation score?</h3>
                        <p className="text-muted-foreground">
                          Yes, if you believe there's an error in your reputation score calculation, you can submit a dispute through our support system. 
                          We'll review the verifiable on-chain data and make corrections if necessary. However, since the score is based on objective metrics, 
                          disputes are typically only valid in cases of technical errors.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
