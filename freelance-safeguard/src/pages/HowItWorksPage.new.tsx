import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
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
      <div className="w-full min-h-screen bg-[#0a0a0a] text-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden py-20 lg:py-28" ref={heroRef}>
          {/* Background elements */}
          <div className="absolute inset-0 bg-shield-purple/5 z-0" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-shield-purple via-shield-purple/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-shield-purple/30 via-shield-purple/10 to-transparent" />
          
          {/* Grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8878782d_1px,transparent_1px),linear-gradient(to_bottom,#8878782d_1px,transparent_1px)] bg-[size:28px_28px]" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              <Badge className="mb-4 bg-shield-purple/20 text-shield-purple border-shield-purple/50 text-xs py-1 px-3">
                Decentralized Freelance Insurance
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-['NT_Brick_Sans'] font-bold mb-4 text-white">
                How <span className="text-shield-purple">FreelanceShield</span> Works
              </h1>
              
              <p className="text-lg text-gray-400 mb-10 max-w-3xl mx-auto">
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
                      "rounded-full border border-shield-purple/30 bg-shield-purple/5 text-sm transition-all",
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
          {/* Rest of your content sections would go here */}
          {/* This is just a simplified version to ensure proper routing and layout */}
        </div>
        
        {/* Footer with CTA */}
        <div className="bg-gray-900/50 border-t border-shield-purple/20 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-['NT_Brick_Sans'] tracking-wide text-white mb-4">
              Ready to <span className="text-shield-purple">Get Protected</span>?
            </h2>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of freelancers who trust FreelanceShield for secure, decentralized protection against project risks.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-shield-purple hover:bg-shield-purple/90 text-white">
                Get Started Now
              </Button>
              <Button size="lg" variant="outline" className="border-shield-purple/50 text-shield-purple hover:bg-shield-purple/10">
                View Pricing Plans
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HowItWorksPage;
