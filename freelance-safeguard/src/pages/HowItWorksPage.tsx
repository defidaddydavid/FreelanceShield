import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wallet, 
  Shield, 
  CheckCircle, 
  FileText, 
  Calculator, 
  Clock, 
  Coins, 
  Award,
  ArrowRight,
  ArrowDown,
  ChevronDown,
  BarChart4,
  DollarSign,
  User,
  Zap,
  Lock,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Landmark,
  Vote,
  Database,
  FileQuestion,
  ArrowDownRight,
  ArrowUpRight,
  Percent,
  UploadCloud,
  FileCheck,
  Users,
  MessageSquare
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { NETWORK_CONFIG, RISK_WEIGHTS } from '@/lib/solana/constants';

const HowItWorksPage = () => {
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const { ref: ctaRef, inView: ctaInView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const wallet = useWallet();
  const [activeSection, setActiveSection] = useState('connect-wallet');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'connect-wallet': true,
    'choose-plan': false,
    'pay-premium': false,
    'risk-pool': false,
    'submit-claim': false,
    'staking-governance': false
  });
  
  // Refs for each section for smooth scrolling
  const connectWalletRef = useRef<HTMLDivElement>(null);
  const choosePlanRef = useRef<HTMLDivElement>(null);
  const payPremiumRef = useRef<HTMLDivElement>(null);
  const riskPoolRef = useRef<HTMLDivElement>(null);
  const submitClaimRef = useRef<HTMLDivElement>(null);
  const stakingGovernanceRef = useRef<HTMLDivElement>(null);
  
  // Function to provide haptic feedback
  const provideHapticFeedback = () => {
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  };
  
  // Function to smoothly scroll to a section
  const scrollToSection = (sectionId: string) => {
    provideHapticFeedback();
    
    let ref;
    switch(sectionId) {
      case 'connect-wallet':
        ref = connectWalletRef;
        break;
      case 'choose-plan':
        ref = choosePlanRef;
        break;
      case 'pay-premium':
        ref = payPremiumRef;
        break;
      case 'risk-pool':
        ref = riskPoolRef;
        break;
      case 'submit-claim':
        ref = submitClaimRef;
        break;
      case 'staking-governance':
        ref = stakingGovernanceRef;
        break;
      default:
        ref = null;
    }
    
    if (ref && ref.current) {
      ref.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    
    setActiveSection(sectionId);
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: true
    }));
  };
  
  // Scroll handling
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Set up intersection observers for each section
    const sections = [
      'connect-wallet',
      'choose-plan',
      'pay-premium',
      'risk-pool',
      'submit-claim',
      'staking-governance'
    ];
    
    const observers = sections.map(section => {
      const element = document.getElementById(section);
      if (!element) return null;
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(section);
          }
        },
        { threshold: 0.5 }
      );
      
      observer.observe(element);
      return { observer, element };
    }).filter(Boolean);
    
    return () => {
      observers.forEach(item => {
        if (item) {
          item.observer.unobserve(item.element);
        }
      });
    };
  }, []);
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const [premiumState, setPremiumState] = useState({
    coverageAmount: 2000,
    periodDays: 30,
    jobType: "SOFTWARE_DEVELOPMENT",
    industry: "TECHNOLOGY",
    reputationScore: 80,
    claimHistory: 0,
    premium: 19,
    riskScore: 25,
    breakdownFactors: {
      baseRate: 10,
      coverageRatio: 1.2,
      periodAdjustment: 1.0,
      riskAdjustment: 0.9,
      reputationFactor: 0.9,
      marketConditions: 1.0
    }
  });

  // Calculate premium based on real calculation logic
  const calculatePremium = () => {
    const BASE_RATE_USDC = 10;
    const MAX_COVERAGE_RATIO = 5.0;
    const MIN_COVERAGE_PERIOD_DAYS = 30;

    // Calculate coverage ratio with non-linear scaling
    const coverageRatio = Math.min(
      Math.pow(premiumState.coverageAmount / 1000, 2.0) * 
      (1 + Math.log10(premiumState.coverageAmount / 1000)),
      MAX_COVERAGE_RATIO
    );

    // Period adjustment (exponential increase for longer periods)
    const periodAdjustment = Math.pow(
      premiumState.periodDays / MIN_COVERAGE_PERIOD_DAYS,
      1.1
    );

    // Risk adjustment based on job type and industry
    const jobTypeRisk = RISK_WEIGHTS.jobTypes[premiumState.jobType as keyof typeof RISK_WEIGHTS.jobTypes];
    const industryRisk = RISK_WEIGHTS.industries[premiumState.industry as keyof typeof RISK_WEIGHTS.industries];
    const baseRiskAdjustment = jobTypeRisk * industryRisk;
    
    // Enhanced risk adjustment that scales with coverage amount
    const riskAdjustment = baseRiskAdjustment * 
      (1 + Math.log10(Math.max(premiumState.coverageAmount / 1000, 1)));

    // Reputation factor (better reputation = lower premium)
    const reputationFactor = Math.max(0.7, 1 - (premiumState.reputationScore / 200));

    // Claims history impact
    const claimsImpact = Math.pow(1.5, premiumState.claimHistory);

    // Market conditions
    const marketConditions = 1.0 + (premiumState.coverageAmount > 5000 ? 0.2 : 0);

    // Calculate final premium
    const premium = BASE_RATE_USDC *
      coverageRatio *
      periodAdjustment *
      riskAdjustment *
      reputationFactor *
      claimsImpact *
      marketConditions;

    // Calculate risk score (0-100)
    const riskScore = Math.min(
      100,
      (riskAdjustment * 20 +
        (premiumState.claimHistory * 15) +
        (coverageRatio / MAX_COVERAGE_RATIO * 30) +
        ((1 - reputationFactor) * 35))
    );

    setPremiumState(prev => ({
      ...prev,
      premium: Number(premium.toFixed(2)),
      riskScore: Number(riskScore.toFixed(2)),
      breakdownFactors: {
        baseRate: BASE_RATE_USDC,
        coverageRatio,
        periodAdjustment,
        riskAdjustment,
        reputationFactor,
        marketConditions
      }
    }));
  };

  // Update premium when inputs change
  useEffect(() => {
    calculatePremium();
  }, [premiumState.coverageAmount, premiumState.periodDays, premiumState.jobType, premiumState.industry, premiumState.reputationScore, premiumState.claimHistory]);

  // Handle input changes
  const handleCoverageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setPremiumState(prev => ({ ...prev, coverageAmount: value * 1000 }));
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const periodMap: Record<string, number> = {
      "1 Month": 30,
      "3 Months": 90,
      "6 Months": 180,
      "12 Months": 365
    };
    setPremiumState(prev => ({ ...prev, periodDays: periodMap[e.target.value] }));
  };

  const handleJobTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const jobTypeMap: Record<string, string> = {
      "Web Development": "SOFTWARE_DEVELOPMENT",
      "Graphic Design": "DESIGN",
      "Content Writing": "WRITING",
      "Marketing": "MARKETING",
      "Consulting": "CONSULTING",
      "Other": "OTHER"
    };
    setPremiumState(prev => ({ ...prev, jobType: jobTypeMap[e.target.value] }));
  };

  const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const industryMap: Record<string, string> = {
      "Technology": "TECHNOLOGY",
      "Healthcare": "HEALTHCARE",
      "Finance": "FINANCE",
      "Education": "EDUCATION",
      "Retail": "RETAIL",
      "Other": "OTHER"
    };
    setPremiumState(prev => ({ ...prev, industry: industryMap[e.target.value] }));
  };

  const handleReputationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setPremiumState(prev => ({ ...prev, reputationScore: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        {/* Hero Section with Animated Background */}
        <motion.section 
          ref={heroRef} 
          className="relative py-24 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-blue-950/20 dark:via-background dark:to-background -z-10" />
          
          {/* Animated background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <motion.div 
              className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl" 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.7, 0.5] 
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
            />
            <motion.div 
              className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-indigo-400/10 dark:bg-indigo-400/5 rounded-full blur-3xl" 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5] 
              }}
              transition={{ 
                duration: 10, 
                repeat: Infinity,
                repeatType: "reverse",
                delay: 2
              }}
            />
          </div>
          
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                How FreelanceShield
                <motion.div 
                  className="mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300"
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] 
                  }}
                  transition={{ 
                    duration: 15, 
                    repeat: Infinity,
                    ease: "linear" 
                  }}
                >
                  Secures Your Work on Solana
                </motion.div>
              </motion.h1>
              
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                FreelanceShield provides blockchain-based insurance for freelancers, protecting your income against project cancellations, payment disputes, and work disruptions with a simple, transparent process on the Solana blockchain.
              </motion.p>
              
              <motion.div 
                className="flex flex-wrap justify-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
                  <Link to="/dashboard">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline">
                  <a href="#connect-wallet" onClick={() => scrollToSection('connect-wallet')}>Explore Process</a>
                </Button>
              </motion.div>
            </div>
          </div>
          
          <motion.div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 1, 
              delay: 1.2,
              repeat: Infinity,
              repeatType: "reverse" 
            }}
          >
            <a href="#connect-wallet" className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors" onClick={() => scrollToSection('connect-wallet')}>
              <span className="text-sm mb-2">Scroll to explore</span>
              <ArrowDown className="h-5 w-5" />
            </a>
          </motion.div>
        </motion.section>

        {/* Sticky Navigation */}
        <div className="sticky top-20 z-30 w-full bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-3 overflow-x-auto hide-scrollbar">
              <div className="flex items-center gap-6 text-sm">
                <a 
                  href="#connect-wallet" 
                  className={cn(
                    "transition-colors flex items-center gap-2 py-2 px-3 rounded-md",
                    activeSection === 'connect-wallet' 
                      ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => scrollToSection('connect-wallet')}
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs font-medium">1</span>
                  Connect Wallet
                </a>
                <a 
                  href="#choose-plan" 
                  className={cn(
                    "transition-colors flex items-center gap-2 py-2 px-3 rounded-md",
                    activeSection === 'choose-plan' 
                      ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => scrollToSection('choose-plan')}
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs font-medium">2</span>
                  Choose Plan
                </a>
                <a 
                  href="#pay-premium" 
                  className={cn(
                    "transition-colors flex items-center gap-2 py-2 px-3 rounded-md",
                    activeSection === 'pay-premium' 
                      ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => scrollToSection('pay-premium')}
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs font-medium">3</span>
                  Pay Premium
                </a>
                <a 
                  href="#risk-pool" 
                  className={cn(
                    "transition-colors flex items-center gap-2 py-2 px-3 rounded-md",
                    activeSection === 'risk-pool' 
                      ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => scrollToSection('risk-pool')}
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs font-medium">4</span>
                  Risk Pool
                </a>
                <a 
                  href="#submit-claim" 
                  className={cn(
                    "transition-colors flex items-center gap-2 py-2 px-3 rounded-md",
                    activeSection === 'submit-claim' 
                      ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => scrollToSection('submit-claim')}
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs font-medium">5</span>
                  Submit Claim
                </a>
                <a 
                  href="#staking-governance" 
                  className={cn(
                    "transition-colors flex items-center gap-2 py-2 px-3 rounded-md",
                    activeSection === 'staking-governance' 
                      ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => scrollToSection('staking-governance')}
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs font-medium">6</span>
                  Staking & Governance
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Overview */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0 transform -translate-y-1/2 hidden lg:block" />
          </div>
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">How FreelanceShield Works</h2>
              <p className="text-muted-foreground mt-4 max-w-3xl mx-auto">
                Our streamlined process protects freelancers with blockchain-based insurance on Solana
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
              <motion.div 
                className="flex flex-col items-center p-6 border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-background/80 backdrop-blur-sm"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                onTouchStart={() => {
                  if (window.navigator.vibrate) window.navigator.vibrate(50);
                }}
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 relative">
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md">1</span>
                  <Wallet className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium text-lg mb-2">Connect Wallet & Profile</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Connect your Solana wallet (Phantom, Solflare, or Backpack) and set up your freelancer profile.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline" className="text-xs">Secure connection</Badge>
                  <Badge variant="outline" className="text-xs">Profile customization</Badge>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex flex-col items-center p-6 border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-background/80 backdrop-blur-sm"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                onTouchStart={() => {
                  if (window.navigator.vibrate) window.navigator.vibrate(50);
                }}
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 relative">
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md">2</span>
                  <Shield className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium text-lg mb-2">Choose Insurance Plan</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Select from Basic, Pro, or Enterprise plans with different coverage amounts and rates.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline" className="text-xs">Customizable coverage</Badge>
                  <Badge variant="outline" className="text-xs">Flexible deductibles</Badge>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex flex-col items-center p-6 border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-background/80 backdrop-blur-sm"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                onTouchStart={() => {
                  if (window.navigator.vibrate) window.navigator.vibrate(50);
                }}
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 relative">
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md">3</span>
                  <CreditCard className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium text-lg mb-2">Pay Premium</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Pay your insurance premium in USDC directly from your connected wallet.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline" className="text-xs">Multiple tokens</Badge>
                  <Badge variant="outline" className="text-xs">Automatic renewals</Badge>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex flex-col items-center p-6 border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-background/80 backdrop-blur-sm"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                onTouchStart={() => {
                  if (window.navigator.vibrate) window.navigator.vibrate(50);
                }}
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 relative">
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md">4</span>
                  <BarChart4 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium text-lg mb-2">Risk Pool Management</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Your premium joins our decentralized risk pool, managed by smart contracts.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline" className="text-xs">Transparent allocation</Badge>
                  <Badge variant="outline" className="text-xs">Smart contract security</Badge>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex flex-col items-center p-6 border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-background/80 backdrop-blur-sm"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
                onTouchStart={() => {
                  if (window.navigator.vibrate) window.navigator.vibrate(50);
                }}
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 relative">
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md">5</span>
                  <MessageSquare className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium text-lg mb-2">Submit a Claim</h3>
                <p className="text-sm text-muted-foreground text-center">
                  If an insured event occurs, submit your claim with supporting documents.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline" className="text-xs">Document upload</Badge>
                  <Badge variant="outline" className="text-xs">Progress tracking</Badge>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex flex-col items-center p-6 border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-background/80 backdrop-blur-sm"
                whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                viewport={{ once: true }}
                onTouchStart={() => {
                  if (window.navigator.vibrate) window.navigator.vibrate(50);
                }}
              >
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 relative">
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md">6</span>
                  <CheckCircle className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium text-lg mb-2">Receive Payout</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Approved claims are paid instantly to your wallet in USDC with real-time tracking.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline" className="text-xs">Instant payouts</Badge>
                  <Badge variant="outline" className="text-xs">Status tracking</Badge>
                </div>
              </motion.div>

              {/* Animated dots connecting the steps (visible on larger screens) */}
              <div className="absolute top-1/2 left-0 right-0 hidden lg:flex justify-between px-24 -z-10">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div 
                    key={i}
                    className="w-3 h-3 rounded-full bg-blue-500"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: 0.7 + (i * 0.1),
                      type: "spring",
                      stiffness: 200
                    }}
                    viewport={{ once: true }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Connect Wallet Section */}
        <section id="connect-wallet" ref={connectWalletRef} className="py-24 relative">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Content */}
              <motion.div 
                className="space-y-8"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Connect Your <span className="text-blue-600 dark:text-blue-400">Solana Wallet</span>
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Start by connecting your Solana wallet to access FreelanceShield's insurance services. We support multiple wallet providers for your convenience.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Supported Wallets</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-background border-2 hover:border-blue-400 transition-all duration-300">
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-[#AB9FF2]/20 flex items-center justify-center mb-4">
                          <img src="/images/wallets/phantom.svg" alt="Phantom" className="w-6 h-6" />
                        </div>
                        <h4 className="font-medium">Phantom</h4>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-background border-2 hover:border-blue-400 transition-all duration-300">
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-[#FC9965]/20 flex items-center justify-center mb-4">
                          <img src="/images/wallets/solflare.svg" alt="Solflare" className="w-6 h-6" />
                        </div>
                        <h4 className="font-medium">Solflare</h4>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-background border-2 hover:border-blue-400 transition-all duration-300">
                      <CardContent className="p-6 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-[#121212]/20 flex items-center justify-center mb-4">
                          <img src="/images/wallets/backpack.svg" alt="Backpack" className="w-6 h-6" />
                        </div>
                        <h4 className="font-medium">Backpack</h4>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Why Connect Your Wallet?</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span>Securely authenticate your identity on the Solana blockchain</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span>Access your insurance policies and transaction history</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span>Make premium payments and receive claim payouts directly</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span>Participate in governance and staking opportunities</span>
                    </li>
                  </ul>
                </div>
                
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={provideHapticFeedback}>
                  Connect Wallet
                </Button>
              </motion.div>
              
              {/* Right side - Interactive Wallet Connection Animation */}
              <motion.div 
                className="relative"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/50 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <motion.div 
                      className="absolute -top-40 -left-40 w-[300px] h-[300px] bg-blue-400/10 rounded-full blur-2xl" 
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.7, 0.5] 
                      }}
                      transition={{ 
                        duration: 8, 
                        repeat: Infinity,
                        repeatType: "reverse" 
                      }}
                    />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="mb-8 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold">FreelanceShield</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {NETWORK_CONFIG.name}
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="text-center py-8">
                        <Wallet className="h-16 w-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                        <p className="text-muted-foreground mb-6">Choose your preferred wallet provider</p>
                        
                        <div className="space-y-3 max-w-xs mx-auto">
                          <motion.button 
                            className="flex items-center justify-between w-full p-3 rounded-lg border-2 border-[#AB9FF2]/50 bg-[#AB9FF2]/5 hover:bg-[#AB9FF2]/10 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={provideHapticFeedback}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#AB9FF2]/20 flex items-center justify-center">
                                <img src="/images/wallets/phantom.svg" alt="Phantom" className="w-5 h-5" />
                              </div>
                              <span className="font-medium">Phantom</span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </motion.button>
                          
                          <motion.button 
                            className="flex items-center justify-between w-full p-3 rounded-lg border-2 border-[#FC9965]/50 bg-[#FC9965]/5 hover:bg-[#FC9965]/10 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={provideHapticFeedback}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#FC9965]/20 flex items-center justify-center">
                                <img src="/images/wallets/solflare.svg" alt="Solflare" className="w-5 h-5" />
                              </div>
                              <span className="font-medium">Solflare</span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </motion.button>
                          
                          <motion.button 
                            className="flex items-center justify-between w-full p-3 rounded-lg border-2 border-[#121212]/50 bg-[#121212]/5 hover:bg-[#121212]/10 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={provideHapticFeedback}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#121212]/20 flex items-center justify-center">
                                <img src="/images/wallets/backpack.svg" alt="Backpack" className="w-5 h-5" />
                              </div>
                              <span className="font-medium">Backpack</span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </motion.button>
                        </div>
                      </div>
                      
                      <div className="text-center text-sm text-muted-foreground">
                        <p>By connecting, you agree to FreelanceShield's <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</a></p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Connection Lines Animation */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                  <motion.div 
                    className="w-0.5 h-12 bg-gradient-to-b from-blue-500 to-transparent"
                    initial={{ height: 0 }}
                    whileInView={{ height: 48 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    viewport={{ once: true }}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Choose Plan Section */}
        <section id="choose-plan" ref={choosePlanRef} className="py-24 bg-muted/30 relative">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.div 
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <Shield className="h-6 w-6" />
              </motion.div>
              
              <motion.h2 
                className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                Choose Your <span className="text-blue-600 dark:text-blue-400">Insurance Plan</span>
              </motion.h2>
              
              <motion.p 
                className="text-lg text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                Select the insurance plan that best fits your freelancing needs. Our plans are designed to provide comprehensive coverage with transparent pricing on the Solana blockchain.
              </motion.p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Basic Plan */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <Card className="border-2 h-full flex flex-col bg-background hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">Basic Plan</CardTitle>
                        <CardDescription>For occasional freelancers</CardDescription>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Shield className="h-5 w-5" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="mb-6">
                      <p className="text-3xl font-bold">
                        $19
                        <span className="text-sm font-normal text-muted-foreground ml-1">/ month</span>
                      </p>
                      <p className="text-sm text-muted-foreground">Paid in USDC on Solana</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">Up to $2,000 coverage per project</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">1 claim per month</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">72-hour claim processing</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">Basic dispute resolution</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">Email support</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={provideHapticFeedback}>
                      Select Basic Plan
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
              
              {/* Pro Plan */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <Card className="border-2 border-blue-600 dark:border-blue-500 h-full flex flex-col bg-background hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0">
                    <div className="bg-blue-600 text-white text-xs font-medium py-1 px-3 rounded-bl-lg">
                      POPULAR
                    </div>
                  </div>
                  
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">Pro Plan</CardTitle>
                        <CardDescription>For active freelancers</CardDescription>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Shield className="h-5 w-5" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="mb-6">
                      <p className="text-3xl font-bold">
                        $49
                        <span className="text-sm font-normal text-muted-foreground ml-1">/ month</span>
                      </p>
                      <p className="text-sm text-muted-foreground">Paid in USDC on Solana</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">Up to $5,000 coverage per project</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">3 claims per month</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">48-hour claim processing</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">Advanced dispute resolution</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">Priority email & chat support</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">Governance voting rights</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={provideHapticFeedback}>
                      Select Pro Plan
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
              
              {/* Enterprise Onboarding */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <Card className="border-2 h-full flex flex-col bg-background hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">Enterprise Onboarding</CardTitle>
                        <CardDescription>For agencies & teams</CardDescription>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Landmark className="h-5 w-5" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="mb-6">
                      <p className="text-3xl font-bold">
                        Custom
                      </p>
                      <p className="text-sm text-muted-foreground">Tailored to your needs</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">Custom coverage limits</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">Unlimited claims</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">24-hour claim processing</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">Dedicated account manager</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">API access for integration</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm">Enhanced governance rights</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={provideHapticFeedback}>
                      Contact Sales
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>
            
            {/* Premium Calculator */}
            <motion.div 
              className="mt-16 max-w-3xl mx-auto bg-background rounded-xl border-2 border-blue-100 dark:border-blue-900/50 shadow-lg overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xl font-semibold">Premium Calculator</h3>
                </div>
                
                <p className="text-muted-foreground mb-6">
                  Our premiums are calculated based on several factors including coverage amount, job type, industry, reputation score, and claim history. Use this calculator to estimate your premium.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Coverage Amount (USDC)</label>
                      <div className="relative">
                        <input 
                          type="range" 
                          min="1" 
                          max="50" 
                          value={premiumState.coverageAmount / 1000}
                          onChange={handleCoverageChange}
                          className="w-full h-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg appearance-none cursor-pointer" 
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>$1,000</span>
                          <span>$25,000</span>
                          <span>$50,000</span>
                        </div>
                        <div className="text-sm text-center mt-1 text-muted-foreground">
                          Selected: ${premiumState.coverageAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Job Type</label>
                      <select 
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        onChange={handleJobTypeChange}
                        defaultValue="Web Development"
                      >
                        <option>Web Development</option>
                        <option>Graphic Design</option>
                        <option>Content Writing</option>
                        <option>Marketing</option>
                        <option>Consulting</option>
                        <option>Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Industry</label>
                      <select 
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        onChange={handleIndustryChange}
                        defaultValue="Technology"
                      >
                        <option>Technology</option>
                        <option>Healthcare</option>
                        <option>Finance</option>
                        <option>Education</option>
                        <option>Retail</option>
                        <option>Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Coverage Period</label>
                      <select 
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        onChange={handlePeriodChange}
                        defaultValue="1 Month"
                      >
                        <option>1 Month</option>
                        <option>3 Months</option>
                        <option>6 Months</option>
                        <option>12 Months</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Reputation Score</label>
                      <div className="relative">
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={premiumState.reputationScore}
                          onChange={handleReputationChange}
                          className="w-full h-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg appearance-none cursor-pointer" 
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0</span>
                          <span>50</span>
                          <span>100</span>
                        </div>
                        <div className="text-sm text-center mt-1 text-muted-foreground">
                          Score: {premiumState.reputationScore}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-6 flex flex-col justify-between">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Estimated Premium</p>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">${premiumState.premium}</div>
                      <p className="text-sm text-muted-foreground">per month</p>
                      
                      <div className="mt-4 p-3 bg-background rounded-lg border border-border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Risk Score</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{premiumState.riskScore}</span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  premiumState.riskScore < 30 
                                    ? 'bg-green-500' 
                                    : premiumState.riskScore < 70 
                                      ? 'bg-yellow-500' 
                                      : 'bg-red-500'
                                }`}
                                style={{ width: `${premiumState.riskScore}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-1 mt-4 text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Base Rate</span>
                            <span>${premiumState.breakdownFactors.baseRate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Coverage Factor</span>
                            <span>×{premiumState.breakdownFactors.coverageRatio.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Period Adjustment</span>
                            <span>×{premiumState.breakdownFactors.periodAdjustment.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Risk Adjustment</span>
                            <span>×{premiumState.breakdownFactors.riskAdjustment.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Reputation Factor</span>
                            <span>×{premiumState.breakdownFactors.reputationFactor.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={provideHapticFeedback}>
                          Get Exact Quote
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Connection Lines Animation */}
            <div className="flex justify-center mt-12">
              <motion.div 
                className="w-0.5 h-12 bg-gradient-to-b from-blue-500 to-transparent"
                initial={{ height: 0 }}
                whileInView={{ height: 48 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
              />
            </div>
          </div>
        </section>

        {/* Pay Premium Section */}
        <section id="pay-premium" ref={payPremiumRef} className="py-24 relative">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Interactive Payment Animation */}
              <motion.div 
                className="relative order-2 lg:order-1"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/50 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <motion.div 
                      className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-blue-400/10 rounded-full blur-2xl" 
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3] 
                      }}
                      transition={{ 
                        duration: 8, 
                        repeat: Infinity,
                        repeatType: "reverse" 
                      }}
                    />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="mb-8 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold">FreelanceShield</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {NETWORK_CONFIG.name}
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="text-center py-4">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-xl font-semibold mb-2">Pay Premium</h3>
                        <p className="text-muted-foreground mb-6">Confirm your payment details</p>
                      </div>
                      
                      <div className="space-y-4 max-w-sm mx-auto">
                        <div className="bg-background rounded-lg p-4 border border-border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Plan</span>
                            <span className="font-medium">Pro Plan</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Coverage</span>
                            <span className="font-medium">15 SOL</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Period</span>
                            <span className="font-medium">1 Month</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-border mt-2">
                            <span className="font-medium">Total</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">$49</span>
                          </div>
                        </div>
                        
                        <div className="bg-background rounded-lg p-4 border border-border">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-medium">Payment Method</span>
                            <span className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer">Change</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#AB9FF2]/20 flex items-center justify-center">
                              <img src="/images/wallets/phantom.svg" alt="Phantom" className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-medium">Phantom Wallet</div>
                              <div className="text-xs text-muted-foreground">7x2g...5Kpu</div>
                            </div>
                          </div>
                        </div>
                        
                        <motion.button 
                          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={provideHapticFeedback}
                        >
                          <Coins className="h-4 w-4" />
                          Pay $49 Now
                        </motion.button>
                        
                        <div className="text-center text-xs text-muted-foreground">
                          By paying, you agree to FreelanceShield's <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Transaction Animation */}
                <motion.div 
                  className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1 }}
                  viewport={{ once: true }}
                >
                  <motion.div 
                    className="w-0.5 h-16 bg-gradient-to-b from-blue-500 to-transparent"
                    initial={{ height: 0 }}
                    whileInView={{ height: 64 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    viewport={{ once: true }}
                  />
                  <div className="mt-2 text-sm text-muted-foreground">Transaction Confirmed</div>
                </motion.div>
              </motion.div>
              
              {/* Right side - Content */}
              <motion.div 
                className="space-y-8 order-1 lg:order-2"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                    <Coins className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Pay Your <span className="text-blue-600 dark:text-blue-400">Premium</span>
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Complete your insurance activation by paying your premium directly with USDC from your connected wallet. All transactions are secured by the Solana blockchain.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold">How Premium Payments Work</h3>
                    <p className="text-muted-foreground">
                      FreelanceShield uses the Solana blockchain to process premium payments quickly and with minimal fees. Here's how it works:
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mt-0.5">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Select Your Plan</h4>
                        <p className="text-sm text-muted-foreground">Choose the coverage amount and period that best fits your needs</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mt-0.5">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Review Premium Amount</h4>
                        <p className="text-sm text-muted-foreground">Verify the premium calculation based on your coverage and risk factors</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mt-0.5">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Approve Transaction</h4>
                        <p className="text-sm text-muted-foreground">Confirm the payment in your Solana wallet</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mt-0.5">
                        4
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Receive Policy NFT</h4>
                        <p className="text-sm text-muted-foreground">Your active policy is minted as an NFT in your wallet for verification</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Benefits of Blockchain Payments</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span>Instant transaction confirmation</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span>Minimal transaction fees on Solana</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span>Transparent and verifiable on-chain</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span>Automated policy activation</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 4. Risk Pool Section */}
        <section id="risk-pool" ref={riskPoolRef} className="py-24 relative bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Content */}
              <motion.div 
                className="space-y-8"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
                    <Database className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Decentralized <span className="text-indigo-600 dark:text-indigo-400">Risk Pool</span>
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Your premium is added to a transparent, on-chain risk pool that provides coverage for all policyholders. This collective approach ensures fair pricing and sustainable protection.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold">How the Risk Pool Works</h3>
                    <p className="text-muted-foreground">
                      FreelanceShield's risk pool is a smart contract-based system that aggregates premiums and manages claims transparently:
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mt-0.5">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Premium Collection</h4>
                        <p className="text-sm text-muted-foreground">All premiums are collected in a transparent on-chain pool</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mt-0.5">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Risk Diversification</h4>
                        <p className="text-sm text-muted-foreground">The pool diversifies risk across many freelancers and projects</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mt-0.5">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Claim Processing</h4>
                        <p className="text-sm text-muted-foreground">Valid claims are paid directly from the pool via smart contracts</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mt-0.5">
                        4
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Yield Generation</h4>
                        <p className="text-sm text-muted-foreground">Idle funds generate yield to strengthen the pool and reduce premiums</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Benefits of Our Risk Pool</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span>Full transparency of funds and claims</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span>Lower premiums through collective risk-sharing</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span>Automated and fast claim payouts</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span>No intermediaries or hidden fees</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2">
                  <Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-950/30" onClick={provideHapticFeedback}>
                    View Pool Statistics
                  </Button>
                </div>
              </motion.div>
              
              {/* Right side - Interactive Risk Pool Visualization */}
              <motion.div 
                className="relative"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/50 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <motion.div 
                      className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-indigo-400/10 rounded-full blur-2xl" 
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3] 
                      }}
                      transition={{ 
                        duration: 8, 
                        repeat: Infinity,
                        repeatType: "reverse" 
                      }}
                    />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="mb-8 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-semibold">Risk Pool Dashboard</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Live Data
                      </div>
                    </div>
                    
                    <div className="space-y-8">
                      {/* Pool Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white dark:bg-background rounded-lg border border-border">
                          <div className="text-sm text-muted-foreground mb-1">Total Value Locked</div>
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            2,450 USDC
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                            <TrendingUp className="h-3 w-3" />
                            +5.2% this week
                          </div>
                        </div>
                        
                        <div className="p-4 bg-white dark:bg-background rounded-lg border border-border">
                          <div className="text-sm text-muted-foreground mb-1">Active Policies</div>
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            187
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                            <TrendingUp className="h-3 w-3" />
                            +12 this week
                          </div>
                        </div>
                        
                        <div className="p-4 bg-white dark:bg-background rounded-lg border border-border">
                          <div className="text-sm text-muted-foreground mb-1">Claims Paid</div>
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            28
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Last: 2 days ago
                          </div>
                        </div>
                        
                        <div className="p-4 bg-white dark:bg-background rounded-lg border border-border">
                          <div className="text-sm text-muted-foreground mb-1">Solvency Ratio</div>
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            215%
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                            <ShieldCheck className="h-3 w-3" />
                            Very Strong
                          </div>
                        </div>
                      </div>
                      
                      {/* Pool Visualization */}
                      <div className="bg-white dark:bg-background rounded-lg p-4 border border-border">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-medium">Risk Pool Allocation</span>
                          <span className="text-xs text-muted-foreground">Updated 5 min ago</span>
                        </div>
                        
                        <div className="h-[180px] relative">
                          {/* This would be a real chart in production */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full max-w-[250px] aspect-square rounded-full border-8 border-indigo-200 dark:border-indigo-800/50 relative">
                              <motion.div 
                                className="absolute inset-0 rounded-full border-8 border-t-indigo-600 dark:border-t-indigo-400 border-r-transparent border-b-transparent border-l-transparent"
                                animate={{ 
                                  rotate: 360
                                }}
                                transition={{ 
                                  duration: 8, 
                                  repeat: Infinity,
                                  ease: "linear"
                                }}
                              />
                              
                              <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">75%</div>
                                <div className="text-xs text-muted-foreground">Available</div>
                              </div>
                              
                              {/* Animated dots representing transactions */}
                              <motion.div 
                                className="absolute w-3 h-3 rounded-full bg-green-500"
                                initial={{ x: 0, y: 0, opacity: 0 }}
                                animate={{ 
                                  x: [0, 125, 125], 
                                  y: [0, 0, 125], 
                                  opacity: [0, 1, 0] 
                                }}
                                transition={{ 
                                  duration: 3, 
                                  repeat: Infinity,
                                  repeatDelay: 2,
                                  times: [0, 0.5, 1]
                                }}
                              />
                              
                              <motion.div 
                                className="absolute w-3 h-3 rounded-full bg-blue-500"
                                initial={{ x: 0, y: 0, opacity: 0 }}
                                animate={{ 
                                  x: [0, -125, -125], 
                                  y: [0, 0, -125], 
                                  opacity: [0, 1, 0] 
                                }}
                                transition={{ 
                                  duration: 3, 
                                  repeat: Infinity,
                                  repeatDelay: 3,
                                  times: [0, 0.5, 1]
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
                            <div className="text-xs">Available (75%)</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-300 dark:bg-indigo-700"></div>
                            <div className="text-xs">Reserved for Claims (25%)</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Recent Transactions */}
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Recent Pool Transactions</div>
                        
                        <div className="space-y-2 max-h-[120px] overflow-y-auto">
                          <div className="flex items-center justify-between text-xs p-2 rounded-md bg-background/80 backdrop-blur-sm border border-border">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <ArrowDownRight className="h-3 w-3 text-green-600 dark:text-green-400" />
                              </div>
                              <div>Premium Payment</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="font-medium">+$49</div>
                              <div className="text-muted-foreground">2m ago</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs p-2 rounded-md bg-background/80 backdrop-blur-sm border border-border">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <ArrowUpRight className="h-3 w-3 text-red-600 dark:text-red-400" />
                              </div>
                              <div>Claim Payout</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="font-medium">-$5,000</div>
                              <div className="text-muted-foreground">2d ago</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs p-2 rounded-md bg-background/80 backdrop-blur-sm border border-border">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Percent className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>Yield Generated</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="font-medium">+$12</div>
                              <div className="text-muted-foreground">1d ago</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Connection Lines Animation */}
                <div className="flex justify-center mt-12">
                  <motion.div 
                    className="w-0.5 h-12 bg-gradient-to-b from-indigo-500 to-transparent"
                    initial={{ height: 0 }}
                    whileInView={{ height: 48 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    viewport={{ once: true }}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 5. Submit Claim Section */}
        <section id="submit-claim" ref={submitClaimRef} className="py-24 relative">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Interactive Claim Form */}
              <motion.div 
                className="relative order-2 lg:order-1"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-900/50 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <motion.div 
                      className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-purple-400/10 rounded-full blur-2xl" 
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3] 
                      }}
                      transition={{ 
                        duration: 8, 
                        repeat: Infinity,
                        repeatType: "reverse" 
                      }}
                    />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="mb-8 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileQuestion className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <span className="font-semibold">Claim Submission</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {NETWORK_CONFIG.name}
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="text-center py-4">
                        <FileQuestion className="h-12 w-12 mx-auto mb-4 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-xl font-semibold mb-2">Submit a Claim</h3>
                        <p className="text-muted-foreground mb-6">Complete the form to initiate your claim</p>
                      </div>
                      
                      <div className="space-y-4 max-w-sm mx-auto">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Policy ID</label>
                          <div className="flex">
                            <input 
                              type="text" 
                              value="FS-POL-2023-0042" 
                              readOnly
                              className="w-full px-3 py-2 bg-background border border-border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <div className="bg-purple-100 dark:bg-purple-900/30 border border-l-0 border-border rounded-r-lg px-3 flex items-center">
                              <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Claim Type</label>
                          <select className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            <option>Non-payment</option>
                            <option>Contract breach</option>
                            <option>Scope change</option>
                            <option>Other</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Claim Amount</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              placeholder="0.00"
                              className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <div className="absolute inset-y-0 left-0 px-3 flex items-center text-muted-foreground">
                              USDC
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Description</label>
                          <textarea 
                            rows={3}
                            placeholder="Describe your claim in detail..."
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          ></textarea>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Supporting Evidence</label>
                          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center bg-background/60">
                            <UploadCloud className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Drag files here or <span className="text-purple-600 dark:text-purple-400">browse</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Max 10MB per file
                            </p>
                          </div>
                        </div>
                        
                        <motion.button 
                          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={provideHapticFeedback}
                        >
                          <FileCheck className="h-4 w-4" />
                          Submit Claim
                        </motion.button>
                        
                        <div className="text-center text-xs text-muted-foreground">
                          By submitting, you confirm all information is accurate and truthful
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Verification Animation */}
                <motion.div 
                  className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1 }}
                  viewport={{ once: true }}
                >
                  <motion.div 
                    className="w-0.5 h-16 bg-gradient-to-b from-purple-500 to-transparent"
                    initial={{ height: 0 }}
                    whileInView={{ height: 64 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    viewport={{ once: true }}
                  />
                  <div className="mt-2 text-sm text-muted-foreground">Claim Verification</div>
                </motion.div>
              </motion.div>
              
              {/* Right side - Content */}
              <motion.div 
                className="space-y-8 order-1 lg:order-2"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-4">
                    <FileQuestion className="h-6 w-6" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Submit a <span className="text-purple-600 dark:text-purple-400">Claim</span>
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    When things don't go as planned, our streamlined claims process ensures you get the compensation you deserve quickly and fairly.
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold">How the Claims Process Works</h3>
                    <p className="text-muted-foreground">
                      FreelanceShield uses blockchain technology to process claims efficiently and transparently:
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mt-0.5">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Submit Your Claim</h4>
                        <p className="text-sm text-muted-foreground">Provide details about your claim and upload supporting evidence</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mt-0.5">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Verification Process</h4>
                        <p className="text-sm text-muted-foreground">Our decentralized verification system reviews your claim</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mt-0.5">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Community Validation</h4>
                        <p className="text-sm text-muted-foreground">A network of independent validators reviews complex claims</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mt-0.5">
                        4
                      </div>
                      <div>
                        <h4 className="font-medium mb-1">Instant Payout</h4>
                        <p className="text-sm text-muted-foreground">Approved claims are paid directly to your wallet</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">What Makes Our Claims Process Better</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span>Fast processing with most claims resolved in 72 hours</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span>Transparent verification process visible on-chain</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span>No paperwork or lengthy back-and-forth communications</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span>Direct payouts to your wallet without intermediaries</span>
                    </li>
                  </ul>
                </div>
                
                <div className="pt-2">
                  <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-950/30" onClick={provideHapticFeedback}>
                    View Claims Statistics
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 6. Staking and Governance Section */}
        <section id="staking-governance" ref={stakingGovernanceRef} className="py-24 relative bg-gradient-to-b from-muted/30 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
                <motion.div 
                  className="flex-1 order-2 md:order-1"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true, margin: "-100px" }}
                >
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                      <Vote className="h-4 w-4" />
                      <span>Step 6: Staking & Governance</span>
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                      Participate in Platform Governance
                    </h2>
                    
                    <p className="text-lg text-muted-foreground">
                      Stake your tokens to earn rewards and have a voice in the future of FreelanceShield. Your participation helps secure the network and shape platform policies.
                    </p>
                    
                    <div className="space-y-4 pt-2">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                          <Coins className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">Stake Tokens</h3>
                          <p className="text-muted-foreground">
                            Lock your FLS tokens in the staking contract to earn passive rewards from protocol fees and demonstrate your commitment to the ecosystem.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                          <Vote className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">Vote on Proposals</h3>
                          <p className="text-muted-foreground">
                            Use your staked tokens to vote on important protocol decisions, including premium adjustments, new coverage options, and reserve requirements.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                          <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-lg">Submit Proposals</h3>
                          <p className="text-muted-foreground">
                            Suggest improvements to the protocol by creating governance proposals. Community members can discuss and vote on your ideas.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        variant="outline" 
                        className="border-indigo-200 hover:border-indigo-300 dark:border-indigo-800 dark:hover:border-indigo-700"
                        onClick={provideHapticFeedback}
                      >
                        <Link to="/staking">Explore Staking</Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex-1 order-1 md:order-2"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true, margin: "-100px" }}
                >
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-6 rounded-xl border border-blue-100 dark:border-blue-800 shadow-lg relative">
                    <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-xs font-medium py-1 px-3 rounded-lg">
                      Governance Dashboard
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex justify-between items-center pb-4 border-b border-blue-100 dark:border-blue-800">
                        <div>
                          <h3 className="font-medium">Your Staking Overview</h3>
                        </div>
                        <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-400">
                          Active Staker
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white dark:bg-background rounded-lg border border-border">
                          <div className="text-sm text-muted-foreground">Staked Amount</div>
                          <div className="text-2xl font-bold">1,250 FLS</div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">≈ $625.00 USD</div>
                        </div>
                        
                        <div className="p-4 bg-white dark:bg-background rounded-lg border border-border">
                          <div className="text-sm text-muted-foreground">Voting Power</div>
                          <div className="text-2xl font-bold">0.025%</div>
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1">+0.005% from last month</div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium">Active Proposals</h4>
                        
                        <div className="p-4 bg-white dark:bg-background rounded-lg border border-border">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">FIP-23: Increase Reserve Ratio</div>
                              <div className="text-sm text-muted-foreground">Ends in 3 days</div>
                            </div>
                            <Badge className="bg-yellow-500">In Progress</Badge>
                          </div>
                          <div className="mt-3 pt-3 border-t border-blue-50 dark:border-blue-900/30">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Current Votes</span>
                              <span>72% Yes / 28% No</span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: '72%' }}></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-white dark:bg-background rounded-lg border border-border">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">FIP-24: Add New Coverage Type</div>
                              <div className="text-sm text-muted-foreground">Ends in 5 days</div>
                            </div>
                            <Badge className="bg-yellow-500">In Progress</Badge>
                          </div>
                          <div className="mt-3 pt-3 border-t border-blue-50 dark:border-blue-900/30">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Current Votes</span>
                              <span>85% Yes / 15% No</span>
                            </div>
                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <Button variant="outline" size="sm" onClick={provideHapticFeedback}>
                          View All Proposals
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={provideHapticFeedback}>
                          Cast Vote
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              className="absolute -top-[30%] -right-[10%] w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-3xl"
              animate={{ 
                x: [0, 30, 0],
                y: [0, -30, 0],
              }}
              transition={{ 
                duration: 15, 
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.div 
              className="absolute -bottom-[30%] -left-[10%] w-[500px] h-[500px] bg-purple-400/5 rounded-full blur-3xl"
              animate={{ 
                x: [0, -30, 0],
                y: [0, 30, 0],
              }}
              transition={{ 
                duration: 20, 
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>
        </section>

        {/* 7. Final CTA Section */}
        <section className="py-24 relative bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4">
            <motion.div 
              className="max-w-3xl mx-auto text-center space-y-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Ready to <span className="text-blue-600 dark:text-blue-400">Secure Your Work</span>?
                </h2>
                <p className="text-lg text-muted-foreground">
                  Join thousands of freelancers who trust FreelanceShield to protect their business. Get started in minutes with our simple onboarding process.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={provideHapticFeedback}>
                  Get Started Now
                </Button>
                <Button size="lg" variant="outline" onClick={provideHapticFeedback}>
                  Schedule a Demo
                </Button>
              </div>
              
              <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center p-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-medium mb-2">Protected Payments</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Over $2M in freelance work protected
                  </p>
                </div>
                
                <div className="flex flex-col items-center p-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-medium mb-2">Growing Community</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Join 1,000+ freelancers worldwide
                  </p>
                </div>
                
                <div className="flex flex-col items-center p-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-medium mb-2">Fast Setup</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Get insured in under 5 minutes
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default HowItWorksPage;
