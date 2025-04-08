import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';
import GridBackground from '@/components/ui/GridBackground';
import { 
  Wallet, 
  ArrowRight, 
  ShieldCheck, 
  Shield, 
  CreditCard, 
  BarChart4, 
  CheckCircle, 
  PencilRuler,
  Wrench, 
  Code, 
  FileCheck2, 
  Vote, 
  Contact, 
  Gavel,
  Percent, 
  TrendingUp, 
  ExternalLink, 
  Blocks, 
  Landmark, 
  FileQuestion, 
  ShieldClose, 
  Clock, 
  Database, 
  FileCheck, 
  Activity, 
  UploadCloud, 
  Users, 
  MessageSquare,
  ArrowUp,
  SendHorizonal,
  X,
  ChevronDown,
  FileText
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { NETWORK_CONFIG, RISK_WEIGHTS } from '@/lib/solana/constants';

const HowItWorksPage = () => {
  const { isDark } = useSolanaTheme();
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
    'staking-governance': false,
    'arbitration': false
  });
  
  // Refs for each section for smooth scrolling
  const connectWalletRef = useRef<HTMLDivElement>(null);
  const choosePlanRef = useRef<HTMLDivElement>(null);
  const payPremiumRef = useRef<HTMLDivElement>(null);
  const riskPoolRef = useRef<HTMLDivElement>(null);
  const submitClaimRef = useRef<HTMLDivElement>(null);
  const stakingGovernanceRef = useRef<HTMLDivElement>(null);
  const arbitrationRef = useRef<HTMLDivElement>(null);
  
  // Function to provide haptic feedback
  const provideHapticFeedback = () => {
    if (window.navigator.vibrate) {
      window.navigator.vibrate(5);
    }
  };
  
  // Function to scroll to section
  const scrollToSection = (sectionId: string) => {
    provideHapticFeedback();
    
    const sectionRef = 
      sectionId === 'connect-wallet' ? connectWalletRef :
      sectionId === 'choose-plan' ? choosePlanRef :
      sectionId === 'pay-premium' ? payPremiumRef :
      sectionId === 'risk-pool' ? riskPoolRef :
      sectionId === 'submit-claim' ? submitClaimRef :
      sectionId === 'staking-governance' ? stakingGovernanceRef :
      sectionId === 'arbitration' ? arbitrationRef : null;
    
    if (sectionRef?.current) {
      const yOffset = -80; // Adjust for fixed header
      const y = sectionRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({ top: y, behavior: 'smooth' });
      
      // Update active section
      setActiveSection(sectionId);
      
      // Expand the section
      setExpandedSections(prev => ({
        ...prev,
        [sectionId]: true
      }));
    }
  };
  
  // Handle scroll to update active section
  useEffect(() => {
    const handleScroll = () => {
      // Determine which section is in view
      const sectionRefs = [
        { id: 'connect-wallet', ref: connectWalletRef },
        { id: 'choose-plan', ref: choosePlanRef },
        { id: 'pay-premium', ref: payPremiumRef },
        { id: 'risk-pool', ref: riskPoolRef },
        { id: 'submit-claim', ref: submitClaimRef },
        { id: 'staking-governance', ref: stakingGovernanceRef },
        { id: 'arbitration', ref: arbitrationRef }
      ];
      
      for (const { id, ref } of sectionRefs) {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    provideHapticFeedback();
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <Layout>
      <GridBackground
        className="w-full min-h-screen"
        withBottomAccent
        density="medium"
      >
        {/* Hero Section */}
        <div className={cn(
          "relative overflow-hidden py-20 lg:py-28",
        )} ref={heroRef}>
          {/* Background grid and gradients are now provided by the parent GridBackground component */}
          
          {/* Enhanced retro elements */}
          <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-shield-purple/20 blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-shield-purple/10 blur-3xl animate-pulse-slow animation-delay-2000" />
          <div className="absolute top-1/3 right-20 w-16 h-16 rounded-full bg-shield-purple/15 blur-2xl animate-pulse-slow animation-delay-4000" />
          
          {/* Diagonal glowing line accent */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className={cn(
              "absolute h-[1px] w-[200%] -rotate-45 origin-top-left",
              isDark 
                ? "bg-gradient-to-r from-transparent via-shield-purple/30 to-transparent" 
                : "bg-gradient-to-r from-transparent via-shield-purple/20 to-transparent"
            )} />
            <div className={cn(
              "absolute h-[1px] w-[200%] -rotate-[60deg] origin-bottom-left translate-y-[30vh]",
              isDark 
                ? "bg-gradient-to-r from-transparent via-shield-purple/20 to-transparent" 
                : "bg-gradient-to-r from-transparent via-shield-purple/10 to-transparent"
            )} />
          </div>
          
          {/* Cyberpunk corner accent */}
          <div className="absolute top-0 right-0 h-28 w-28 overflow-hidden pointer-events-none">
            <div className={cn(
              "absolute top-12 right-0 h-[1px] w-16 animate-glow",
              isDark ? "bg-shield-purple/50" : "bg-shield-purple/40"
            )} />
            <div className={cn(
              "absolute top-0 right-12 h-16 w-[1px] animate-glow animation-delay-2000",
              isDark ? "bg-shield-purple/50" : "bg-shield-purple/40"
            )} />
          </div>
          
          {/* Glowing grid points */}
          <div className="absolute inset-0 pointer-events-none">
            <div className={cn(
              "absolute top-1/3 left-1/4 h-2 w-2 rounded-full animate-pulse-slow",
              isDark ? "bg-shield-purple/60" : "bg-shield-purple/50"
            )} />
            <div className={cn(
              "absolute top-2/3 left-3/4 h-2 w-2 rounded-full animate-pulse-slow animation-delay-2000",
              isDark ? "bg-shield-purple/60" : "bg-shield-purple/50"
            )} />
            <div className={cn(
              "absolute top-1/4 left-2/3 h-2 w-2 rounded-full animate-pulse-slow animation-delay-4000",
              isDark ? "bg-shield-purple/60" : "bg-shield-purple/50"
            )} />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <Badge className={cn(
                "mb-4 border text-xs py-1 px-3",
                isDark 
                  ? "bg-shield-purple/20 text-shield-purple border-shield-purple/50" 
                  : "bg-shield-purple/10 text-shield-purple border-shield-purple/30"
              )}>
                Decentralized Freelance Insurance
              </Badge>
              
              <h1 className={cn(
                "text-4xl md:text-6xl font-['NT_Brick_Sans'] font-bold mb-4",
                isDark ? "text-white" : "text-foreground"
              )}>
                How <span className="text-shield-purple">FreelanceShield</span> Works
              </h1>
              
              <p className={cn(
                "text-lg mb-10 max-w-3xl mx-auto",
                isDark ? "text-gray-400" : "text-gray-600"
              )}>
                FreelanceShield combines the power of Solana smart contracts with decentralized insurance principles to protect freelancers from project risks and payment disputes.
              </p>
              
              {/* Navigation pills */}
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                {[
                  { id: 'connect-wallet', label: '01 Connect Wallet' },
                  { id: 'choose-plan', label: '02 Choose Plan' },
                  { id: 'pay-premium', label: '03 Pay Premium' },
                  { id: 'risk-pool', label: '04 Risk Pool' },
                  { id: 'submit-claim', label: '05 Submit Claim' },
                  { id: 'arbitration', label: '06 Arbitration' },
                  { id: 'staking-governance', label: '07 Staking & Governance' }
                ].map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      "rounded-full border transition-all",
                      isDark
                        ? "border-shield-purple/30 bg-shield-purple/5" 
                        : "border-shield-purple/20 bg-shield-purple/5",
                      "text-sm",
                      activeSection === item.id 
                        ? "bg-shield-purple text-white" 
                        : "text-shield-purple hover:bg-shield-purple/20"
                    )}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-20">
          {/* Connect Wallet Section */}
          <div className="py-20">
            <div className="container mx-auto px-4">
              <div className="relative">
                {/* Section accent */}
                <div className="absolute -left-4 top-0 bottom-0 w-[1px]">
                  <div className={cn(
                    "h-full w-full",
                    isDark 
                      ? "bg-gradient-to-b from-transparent via-shield-purple/40 to-transparent" 
                      : "bg-gradient-to-b from-transparent via-shield-purple/30 to-transparent"
                  )} />
                </div>
                
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* Content */}
                  <div className="space-y-6">
                    <div className="inline-flex items-center space-x-2">
                      <Badge variant="outline" className={cn(
                        "rounded-sm px-3 py-1 text-xs font-medium uppercase tracking-wider",
                        isDark 
                          ? "border-shield-blue/50 text-shield-blue" 
                          : "border-shield-purple/50 text-shield-purple"
                      )}>
                        Step 1
                      </Badge>
                      <div className={cn(
                        "h-[1px] w-12",
                        isDark ? "bg-shield-blue/50" : "bg-shield-purple/50"
                      )} />
                    </div>
                    
                    <h2 className={cn(
                      "text-3xl md:text-4xl font-['NT_Brick_Sans'] font-bold mb-4",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      Connect Your <span className="text-shield-purple">Wallet</span>
                    </h2>
                    
                    <p className={cn(
                      "mb-6",
                      isDark ? "text-gray-400" : "text-gray-600"
                    )}>
                      To get started with FreelanceShield, connect your Solana wallet to access our decentralized insurance platform. This creates a secure connection between your wallet and our smart contracts.
                    </p>
                    
                    <div className="space-y-4">
                      <div className={cn(
                        "flex items-start gap-3 p-4 rounded-lg",
                        isDark 
                          ? "bg-gray-800/50" 
                          : "bg-gray-50"
                      )}>
                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                          isDark 
                            ? "bg-shield-purple/20 text-shield-purple" 
                            : "bg-shield-purple/10 text-shield-purple"
                        )}>
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className={cn(
                            "text-sm font-semibold mb-1",
                            isDark ? "text-white" : "text-gray-900"
                          )}>
                            Secure & Non-Custodial
                          </h3>
                          <p className={cn(
                            "text-sm",
                            isDark ? "text-gray-400" : "text-gray-600"
                          )}>
                            We never take custody of your funds. All transactions occur directly on the Solana blockchain.
                          </p>
                        </div>
                      </div>
                      
                      <div className={cn(
                        "flex items-start gap-3 p-4 rounded-lg",
                        isDark 
                          ? "bg-gray-800/50" 
                          : "bg-gray-50"
                      )}>
                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                          isDark 
                            ? "bg-shield-purple/20 text-shield-purple" 
                            : "bg-shield-purple/10 text-shield-purple"
                        )}>
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className={cn(
                            "text-sm font-semibold mb-1",
                            isDark ? "text-white" : "text-gray-900"
                          )}>
                            Multiple Wallets Supported
                          </h3>
                          <p className={cn(
                            "text-sm",
                            isDark ? "text-gray-400" : "text-gray-600"
                          )}>
                            Compatible with Phantom, Solflare, Ledger, Slope, and Torus wallets.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:w-1/2">
                    <div className={cn(
                      "rounded-xl overflow-hidden border backdrop-filter backdrop-blur-sm h-full flex items-center justify-center p-6 relative",
                      isDark 
                        ? "bg-gray-800/30 border-shield-purple/20" 
                        : "bg-gray-50/50 border-shield-purple/10"
                    )}>
                      {/* Stylized wallet connection visualization */}
                      <div className="relative w-full max-w-md mx-auto">
                        {/* Background grid effect */}
                        <div className={cn(
                          "absolute inset-0 rounded-lg",
                          isDark 
                            ? "bg-[linear-gradient(to_right,#6a4abc0d_1px,transparent_1px),linear-gradient(to_bottom,#6a4abc0d_1px,transparent_1px)]" 
                            : "bg-[linear-gradient(to_right,#6a4abc0a_1px,transparent_1px),linear-gradient(to_bottom,#6a4abc0a_1px,transparent_1px)]",
                          "bg-[size:20px_20px]"
                        )} />
                        
                        {/* Wallet UI */}
                        <div className={cn(
                          "relative rounded-xl overflow-hidden border shadow-lg",
                          isDark 
                            ? "bg-gray-900 border-shield-purple/30" 
                            : "bg-white border-shield-purple/20"
                        )}>
                          {/* Wallet header */}
                          <div className={cn(
                            "flex items-center justify-between p-4 border-b",
                            isDark 
                              ? "bg-shield-purple text-white border-shield-purple/50" 
                              : "bg-shield-purple/90 text-white border-shield-purple/30"
                          )}>
                            <div className="flex items-center">
                              <Shield className="w-5 h-5 mr-2" />
                              <span className="font-medium">Connect Wallet</span>
                            </div>
                            <X className="w-4 h-4 opacity-70" />
                          </div>
                          
                          {/* Wallet content */}
                          <div className="p-6 space-y-4">
                            <p className={cn(
                              "text-sm text-center",
                              isDark ? "text-gray-300" : "text-gray-700"
                            )}>
                              Select your preferred wallet
                            </p>
                            
                            {/* Phantom wallet option */}
                            <div className={cn(
                              "flex items-center p-3 rounded-lg cursor-pointer transition-colors",
                              isDark 
                                ? "bg-gray-800 hover:bg-shield-purple/10" 
                                : "bg-gray-50 hover:bg-shield-purple/5"
                            )}>
                              <div className="w-8 h-8 rounded-full bg-[#AB9FF2] mr-3 flex items-center justify-center">
                                <span className="text-white font-bold text-xs">P</span>
                              </div>
                              <span className={isDark ? "text-white" : "text-gray-900"}>Phantom</span>
                            </div>
                            
                            {/* Solflare wallet option */}
                            <div className={cn(
                              "flex items-center p-3 rounded-lg cursor-pointer transition-colors",
                              isDark 
                                ? "bg-gray-800 hover:bg-shield-purple/10" 
                                : "bg-gray-50 hover:bg-shield-purple/5"
                            )}>
                              <div className="w-8 h-8 rounded-full bg-[#FC9965] mr-3 flex items-center justify-center">
                                <span className="text-white font-bold text-xs">S</span>
                              </div>
                              <span className={isDark ? "text-white" : "text-gray-900"}>Solflare</span>
                            </div>
                            
                            {/* Indicator showing connection in progress */}
                            <div className="pt-4 text-center">
                              <div className={cn(
                                "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                                isDark 
                                  ? "bg-shield-purple/10 text-shield-purple" 
                                  : "bg-shield-purple/5 text-shield-purple"
                              )}>
                                <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                                Awaiting Connection
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Pool Section */}
          <div className="py-20 mt-12">
            <div className="container mx-auto px-4">
              <div className="relative">
                {/* Section accent */}
                <div className="absolute -left-4 top-0 bottom-0 w-[1px]">
                  <div className={cn(
                    "h-full w-full",
                    isDark 
                      ? "bg-gradient-to-b from-transparent via-shield-blue/40 to-transparent" 
                      : "bg-gradient-to-b from-transparent via-shield-purple/30 to-transparent"
                  )} />
                </div>
                
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* Visual */}
                  <div className="order-2 lg:order-1">
                    <div className={cn(
                      "rounded-xl overflow-hidden border backdrop-filter backdrop-blur-sm h-full flex items-center justify-center p-6 relative",
                      isDark 
                        ? "bg-gray-800/30 border-shield-blue/20" 
                        : "bg-gray-50/50 border-shield-purple/10"
                    )}>
                      {/* Animation container */}
                      <div className="relative w-full max-w-md mx-auto">
                        {/* Background grid effect with diagonal accent */}
                        <div className={cn(
                          "absolute inset-0 rounded-lg",
                          isDark 
                            ? "bg-[linear-gradient(to_right,#6a4abc0d_1px,transparent_1px),linear-gradient(to_bottom,#6a4abc0d_1px,transparent_1px)]" 
                            : "bg-[linear-gradient(to_right,#6a4abc0a_1px,transparent_1px),linear-gradient(to_bottom,#6a4abc0a_1px,transparent_1px)]",
                          "bg-[size:20px_20px]"
                        )} />
                        
                        {/* Diagonal accent line */}
                        <div className={cn(
                          "absolute h-[1px] w-[120%] -rotate-[30deg] left-0 top-1/2",
                          isDark 
                            ? "bg-gradient-to-r from-transparent via-shield-blue/40 to-transparent animate-glow" 
                            : "bg-gradient-to-r from-transparent via-shield-purple/30 to-transparent animate-glow"
                        )} />
                        
                        {/* Risk pool visualization */}
                        <div className="relative z-10 flex flex-col items-center py-8">
                          {/* Risk pool circle */}
                          <div className={cn(
                            "w-48 h-48 rounded-full flex items-center justify-center relative",
                            isDark 
                              ? "bg-gray-800/70 border border-shield-blue/30" 
                              : "bg-white/70 border border-shield-purple/20 shadow-lg"
                          )}>
                            {/* Ripple effect */}
                            <div className={cn(
                              "absolute w-full h-full rounded-full animate-pulse-slow",
                              isDark 
                                ? "border-2 border-shield-blue/20" 
                                : "border-2 border-shield-purple/15"
                            )} />
                            <div className={cn(
                              "absolute w-[110%] h-[110%] rounded-full animate-pulse-slow animation-delay-2000",
                              isDark 
                                ? "border border-shield-blue/10" 
                                : "border border-shield-purple/10"
                            )} />
                            
                            {/* Center icon */}
                            <div className={cn(
                              "w-20 h-20 rounded-full flex items-center justify-center",
                              isDark 
                                ? "bg-shield-blue/20" 
                                : "bg-shield-purple/10"
                            )}>
                              <Shield className={cn(
                                "w-10 h-10",
                                isDark ? "text-shield-blue" : "text-shield-purple"
                              )} />
                            </div>
                          </div>
                          
                          {/* Metrics */}
                          <div className="grid grid-cols-2 gap-6 mt-8 w-full">
                            <div className={cn(
                              "rounded-lg p-3 text-center",
                              isDark 
                                ? "bg-gray-800 border border-shield-blue/20" 
                                : "bg-white border border-shield-purple/10 shadow-sm"
                            )}>
                              <div className={cn(
                                "text-xs uppercase font-medium mb-1",
                                isDark ? "text-gray-400" : "text-gray-500"
                              )}>
                                Pool Size
                              </div>
                              <div className={cn(
                                "text-xl font-bold",
                                isDark 
                                  ? "text-shield-blue" 
                                  : "text-shield-purple"
                              )}>
                                ◎ 250,000
                              </div>
                            </div>
                            
                            <div className={cn(
                              "rounded-lg p-3 text-center",
                              isDark 
                                ? "bg-gray-800 border border-shield-blue/20" 
                                : "bg-white border border-shield-purple/10 shadow-sm"
                            )}>
                              <div className={cn(
                                "text-xs uppercase font-medium mb-1",
                                isDark ? "text-gray-400" : "text-gray-500"
                              )}>
                                Active Policies
                              </div>
                              <div className={cn(
                                "text-xl font-bold",
                                isDark 
                                  ? "text-shield-blue" 
                                  : "text-shield-purple"
                              )}>
                                1,250+
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-6 order-1 lg:order-2">
                    <div className="inline-flex items-center space-x-2">
                      <Badge variant="outline" className={cn(
                        "rounded-sm px-3 py-1 text-xs font-medium uppercase tracking-wider",
                        isDark 
                          ? "border-shield-blue/50 text-shield-blue" 
                          : "border-shield-purple/50 text-shield-purple"
                      )}>
                        Step 2
                      </Badge>
                      <div className={cn(
                        "h-[1px] w-12",
                        isDark ? "bg-shield-blue/50" : "bg-shield-purple/50"
                      )} />
                    </div>
                    
                    <h2 className={cn(
                      "text-3xl md:text-4xl font-['NT_Brick_Sans'] font-bold mb-4",
                      isDark ? "text-white" : "text-gray-900"
                    )}>
                      Risk <span className="text-shield-purple">Pool</span> Management
                    </h2>
                    
                    <p className={cn(
                      "mb-6",
                      isDark ? "text-gray-400" : "text-gray-600"
                    )}>
                      Our risk pools are community-owned and provide the foundation for all insurance policies. Liquidity providers earn rewards for staking tokens in the risk pool.
                    </p>
                    
                    <div className="space-y-4">
                      <div className={cn(
                        "flex items-start gap-3 p-4 rounded-lg",
                        isDark 
                          ? "bg-gray-800/50" 
                          : "bg-gray-50"
                      )}>
                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                          isDark 
                            ? "bg-shield-purple/20 text-shield-purple" 
                            : "bg-shield-purple/10 text-shield-purple"
                        )}>
                          <CoinsIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className={cn(
                            "text-sm font-semibold mb-1",
                            isDark ? "text-white" : "text-gray-900"
                          )}>
                            Diversified Risk Management
                          </h3>
                          <p className={cn(
                            "text-sm",
                            isDark ? "text-gray-400" : "text-gray-600"
                          )}>
                            Pools are diversified across multiple risk categories to ensure solvency and provide optimal coverage.
                          </p>
                        </div>
                      </div>
                      
                      <div className={cn(
                        "flex items-start gap-3 p-4 rounded-lg",
                        isDark 
                          ? "bg-gray-800/50" 
                          : "bg-gray-50"
                      )}>
                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                          isDark 
                            ? "bg-shield-purple/20 text-shield-purple" 
                            : "bg-shield-purple/10 text-shield-purple"
                        )}>
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className={cn(
                            "text-sm font-semibold mb-1",
                            isDark ? "text-white" : "text-gray-900"
                          )}>
                            Transparent & On-Chain
                          </h3>
                          <p className={cn(
                            "text-sm",
                            isDark ? "text-gray-400" : "text-gray-600"
                          )}>
                            All risk pool activities are transparent and recorded on-chain, ensuring absolute trust and auditability.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Rest of your content sections would go here */}
          {/* This is just a simplified version to ensure proper routing and layout */}
        </div>
        
        {/* Footer with CTA */}
        <div className={cn(
          "border-t py-16",
          isDark 
            ? "bg-gray-900/50 border-shield-purple/20" 
            : "bg-gray-50 border-shield-purple/10"
        )}>
          <div className="container mx-auto px-4 text-center">
            <h2 className={cn(
              "text-3xl lg:text-4xl font-['NT_Brick_Sans'] tracking-wide mb-4",
              isDark ? "text-white" : "text-gray-900"
            )}>
              Ready to <span className="text-shield-purple">Get Protected</span>?
            </h2>
            <p className={cn(
              "text-lg mb-8 max-w-2xl mx-auto",
              isDark ? "text-gray-400" : "text-gray-600"
            )}>
              Join thousands of freelancers who trust FreelanceShield for secure, decentralized protection against project risks.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-shield-purple hover:bg-shield-purple/90 text-white">
                Get Started Now
              </Button>
              <Button size="lg" variant="outline" className={cn(
                isDark
                  ? "border-shield-purple/50 text-shield-purple hover:bg-shield-purple/10"
                  : "border-shield-purple/30 text-shield-purple hover:bg-shield-purple/5"
              )}>
                View Pricing Plans
              </Button>
            </div>
          </div>
        </div>
      </GridBackground>
    </Layout>
  );
};

export default HowItWorksPage;
