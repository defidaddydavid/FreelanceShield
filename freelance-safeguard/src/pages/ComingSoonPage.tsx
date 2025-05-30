import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Shield, Terminal, ExternalLink, ChevronRight, Code, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/logo';
import { useNavigate } from 'react-router-dom';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';
import { Input } from '@/components/ui/input';

// Feature cards for main functionality showcase
const features = [
  {
    icon: <motion.div className="relative flex items-center justify-center">
      <Shield className="w-7 h-7 text-[#9945FF]" />
      <motion.div 
        className="absolute inset-0 rounded-full border border-[#9945FF]"
        animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
    </motion.div>,
    title: 'Smart Contract Protection',
    description: 'Secure your freelance work with Solana-powered smart contracts that protect against non-payment and disputes'
  },
  {
    icon: <motion.div className="relative">
      <motion.div 
        animate={{ rotate: [0, 360] }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        className="text-xl"
      >📊</motion.div>
      <motion.div
        className="absolute -top-1 -right-1 w-3 h-3 bg-[#00FFFF] rounded-full"
        animate={{ opacity: [1, 0.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      />
    </motion.div>,
    title: 'Bayesian Reputation System',
    description: 'Our on-chain reputation system uses Bayesian algorithms to provide fraud-resistant verification of freelancer and client trustworthiness'
  },
  {
    icon: <motion.div className="relative flex items-center justify-center">
      <div className="relative">
        <motion.div
          animate={{ x: [-3, 3, -3] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >⚖️</motion.div>
        <motion.div
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-gradient-to-r from-[#9945FF] to-[#00FFFF] rounded-full"
          animate={{ width: ['40%', '80%', '40%'], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />
      </div>
    </motion.div>,
    title: 'Decentralized Arbitration',
    description: 'Fair and transparent dispute resolution through our Solana-based DAO voting system and objective evidence verification'
  },
  {
    icon: <motion.div className="relative">
      <motion.div 
        animate={{ rotate: [0, 5, 0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="text-xl"
      >🔐</motion.div>
      <motion.div
        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-[2px]"
        style={{
          background: 'linear-gradient(to right, #9945FF, #00FFFF)',
        }}
        animate={{ width: ['30%', '70%', '30%'] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      />
    </motion.div>,
    title: 'Milestone-Based Escrow',
    description: 'Secure payment releases based on completed milestones with client verification through our programmable escrow contracts'
  },
  {
    icon: <motion.div className="relative flex items-center justify-center">
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="text-xl"
      >💰</motion.div>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ 
          background: 'radial-gradient(circle, rgba(0,255,255,0.2) 0%, rgba(0,255,255,0) 70%)'
        }}
        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.2, 0.5, 0.2] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      />
    </motion.div>,
    title: 'Risk Pool Staking',
    description: 'Earn rewards by staking into risk pools that provide protection for the ecosystem while generating yield on Solana'
  },
  {
    icon: <motion.div className="relative flex items-center justify-center">
      <motion.div 
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >🏛️</motion.div>
      <motion.div
        className="absolute inset-0"
        style={{ 
          background: 'conic-gradient(from 0deg, rgba(153,69,255,0.2), rgba(0,255,255,0.2), rgba(153,69,255,0))'
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
      />
    </motion.div>,
    title: 'DAO-Based Governance',
    description: 'On-chain governance through community voting that determines protocol parameters, fee structures, and arbitration rules'
  }
];

// Animated text for the terminal effect
const terminalTexts = [
  "Initializing FreelanceShield Protocol...",
  "Loading smart contract protection models...",
  "Calibrating Bayesian reputation algorithms...",
  "Connecting to Solana blockchain...",
  "Setting up decentralized arbitration system...",
  "Configuring token-based risk pools...",
  "Implementing milestone-based escrow contracts...",
  "System ready for launch."
];

// Google Form URL for the waitlist (as fallback)
const WAITLIST_FORM_URL = "https://forms.gle/qZjpDon9kGKqDBJr5"; // FreelanceShield waitlist form

export default function ComingSoonPage() {
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [currentTerminalTextIndex, setCurrentTerminalTextIndex] = useState(0);
  const [showTerminalCursor, setShowTerminalCursor] = useState(true);
  const [isDevMode, setIsDevMode] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isDark } = useSolanaTheme();
  
  // Check if developer bypass is already enabled
  useEffect(() => {
    const devBypass = localStorage.getItem('freelanceShield_devBypass') === 'true';
    setIsDevMode(devBypass);
  }, []);
  
  // Rotate through features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // Terminal text animation
  useEffect(() => {
    const textInterval = setInterval(() => {
      setCurrentTerminalTextIndex((prev) => {
        if (prev >= terminalTexts.length - 1) {
          clearInterval(textInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    
    const cursorInterval = setInterval(() => {
      setShowTerminalCursor((prev) => !prev);
    }, 500);
    
    return () => {
      clearInterval(textInterval);
      clearInterval(cursorInterval);
    };
  }, []);
  
  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call our Vercel API endpoint to add the email and send the welcome email
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Thank you for joining our waitlist!', {
          description: 'We will keep you updated on our launch.',
        });
        
        // Reset the form
        setEmail('');
      } else {
        toast.error(result.message || 'Failed to join waitlist. Please try again.');
        
        // Fallback to Google Form if the API fails
        window.open(WAITLIST_FORM_URL, '_blank');
        toast.info('Waitlist form opened in a new tab as a fallback');
      }
    } catch (error) {
      console.error('Error joining waitlist:', error);
      toast.error('Something went wrong. Please try again later.');
      
      // Fallback to Google Form
      window.open(WAITLIST_FORM_URL, '_blank');
      toast.info('Waitlist form opened in a new tab as a fallback');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDevBypass = () => {
    localStorage.setItem('freelanceShield_devBypass', 'true');
    toast.success('Developer bypass enabled');
    navigate('/dashboard');
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      "bg-gradient-to-br from-black via-gray-900 to-[#0a0a18]",
      "overflow-hidden relative"
    )}>
      {/* Grid pattern background with animated scan line */}
      <div className="absolute inset-0 z-0">
        {/* Enhanced grid pattern with depth effect */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to bottom, rgba(153, 69, 255, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(153, 69, 255, 0.025) 2px, transparent 2px)
            `,
            backgroundSize: '100% 40px, 100% 10px'
          }}
        />
        
        {/* Vertical grid lines with perspective effect */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(to right, rgba(0, 255, 255, 0.025) 2px, transparent 2px)
            `,
            backgroundSize: '40px 100%, 10px 100%'
          }}
        />
        
        {/* Animated grid overlay with perspective effect */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `
              radial-gradient(circle at 50% 50%, rgba(153, 69, 255, 0.1) 0%, rgba(153, 69, 255, 0) 60%),
              radial-gradient(circle at 80% 20%, rgba(0, 255, 255, 0.1) 0%, rgba(0, 255, 255, 0) 40%)
            `
          }}
        />
        
        {/* Perspective grid effect */}
        <div className="absolute inset-0 opacity-30 overflow-hidden">
          <div className="absolute left-0 right-0 bottom-0 h-[40vh]"
            style={{
              background: `linear-gradient(to top, transparent, rgba(153, 69, 255, 0.05))`,
              transform: 'perspective(500px) rotateX(60deg)',
              transformOrigin: 'bottom',
              backgroundImage: `
                linear-gradient(to bottom, rgba(153, 69, 255, 0.1) 1px, transparent 1px),
                linear-gradient(to right, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />
        </div>
        
        {/* Animated scan line */}
        <motion.div 
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00FFFF]/50 to-transparent z-10"
          initial={{ top: '-10%' }}
          animate={{ top: '110%' }}
          transition={{ 
            repeat: Infinity, 
            duration: 15, 
            ease: "linear",
          }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 py-16 overflow-hidden container mx-auto max-w-7xl">
        {/* Logo */}
        <div className="mb-6">
          <Logo size="lg" className="h-24 w-auto" />
        </div>

        {/* Animated tag line */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes silverShine {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .silver-text {
              background: linear-gradient(to right, #7d7d7d 0%, #d9d9d9 25%, #8e8e8e 50%, #ffffff 75%, #7d7d7d 100%);
              background-size: 200% auto;
              background-clip: text;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              text-shadow: 0px 2px 5px rgba(0,0,0,0.4), 0px 0px 15px rgba(25,113,233,0.3);
              animation: silverShine 5s linear infinite;
            }
          `}} />
          <h1 className="font-heading text-5xl md:text-7xl mb-4 font-bold silver-text">
            FreelanceShield
          </h1>
          <p className="text-lg md:text-xl text-center mx-auto mb-6 max-w-2xl bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-300 font-medium">
            The first decentralized insurance protocol for freelancers on Solana
          </p>
        </motion.div>

        {/* Terminal display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-2xl mb-12"
        >
          <div className="w-full bg-black/80 backdrop-blur-sm rounded-lg border border-[#1971E9]/30 overflow-hidden shadow-[0_0_15px_rgba(25,113,233,0.15)]">
            <div className="flex items-center justify-between p-2 bg-gray-800/80 border-b border-gray-700">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-xs text-gray-400">FreelanceShield Interface v0.1</div>
              <div><Terminal className="w-4 h-4 text-gray-400" /></div>
            </div>
            <div className="p-4 font-mono text-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTerminalTextIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[#00FFFF]"
                >
                  {`> ${terminalTexts[currentTerminalTextIndex]}`}
                  {currentTerminalTextIndex === terminalTexts.length - 1 && showTerminalCursor && (
                    <span className="ml-1 inline-block w-2 h-4 bg-[#00FFFF]"></span>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Launch info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-10 text-center"
        >
          <div className="inline-block px-4 py-2 rounded-full bg-[#1971E9]/10 backdrop-blur-sm border border-[#1971E9]/30 mb-6">
            <span className="inline-block w-2 h-2 rounded-full bg-[#00FFFF] animate-pulse mr-2"></span>
            <span className="text-gray-300">Launching Soon on Solana</span>
          </div>
        </motion.div>

        {/* Google Form waitlist button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="w-full max-w-sm mb-14"
        >
          <div className="p-[1px] rounded-lg bg-gradient-to-r from-[#9945FF]/40 via-[#00FFFF]/30 to-[#9945FF]/40">
            <div className="p-5 rounded-lg bg-black/60 backdrop-blur-sm flex flex-col items-center text-center border border-[#9945FF]/10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#9945FF]/10 mb-3 border border-[#9945FF]/20">
                  <Shield className="w-6 h-6 text-[#00FFFF]" />
                </div>
              </motion.div>
              <h3 className="text-lg font-heading text-white mb-1 font-bold">Join Our Waitlist</h3>
              <p className="text-gray-300 mb-4 text-sm">Be the first to know when FreelanceShield launches.</p>
              
              <form onSubmit={handleJoinWaitlist}>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full max-w-xs mb-4"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#9945FF] to-[#00FFFF] hover:opacity-90 text-white font-medium py-3 px-6 rounded-md w-full max-w-xs transition-all duration-300 transform hover:scale-105 shadow-[0_0_10px_rgba(153,69,255,0.2)]"
                >
                  <span className="flex items-center justify-center">
                    Join Waitlist
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </span>
                </Button>
              </form>
            </div>
          </div>
        </motion.div>

        {/* Policy Preview Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0 }}
          className="w-full max-w-3xl mb-16"
        >
          <div className="relative overflow-hidden rounded-lg border border-[#9945FF]/30 bg-black/40 backdrop-blur-sm shadow-[0_0_25px_rgba(153,69,255,0.2)]">
            {/* Window header */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#1A1A2E] to-[#16213E] border-b border-[#9945FF]/20">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-xs text-gray-400 font-mono">smart-contract-policy.sol</div>
              <div className="w-5"></div>
            </div>
            
            {/* Policy content */}
            <div className="p-4 font-mono text-xs overflow-hidden">
              <div className="flex space-x-4">
                {/* Line numbers */}
                <div className="flex-none text-gray-500 select-none text-right">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                
                {/* Code with syntax highlighting */}
                <div className="flex-1 text-gray-300 overflow-x-auto">
                  <div><span className="text-[#9945FF]">contract</span> <span className="text-[#00FFFF]">FreelancePolicy</span> {'{'}</div>
                  <div className="pl-4"><span className="text-[#9945FF]">address</span> <span className="text-gray-400">public</span> freelancer;</div>
                  <div className="pl-4"><span className="text-[#9945FF]">address</span> <span className="text-gray-400">public</span> client;</div>
                  <div className="pl-4"><span className="text-[#9945FF]">uint256</span> <span className="text-gray-400">public</span> coverageAmount;</div>
                  <div className="pl-4"><span className="text-[#9945FF]">uint256</span> <span className="text-gray-400">public</span> premium;</div>
                  <div className="pl-4"><span className="text-[#9945FF]">uint256</span> <span className="text-gray-400">public</span> validUntil;</div>
                  <div className="pl-4"><span className="text-pink-500">mapping</span>(<span className="text-[#9945FF]">uint256</span> =&gt; <span className="text-[#9945FF]">Milestone</span>) <span className="text-gray-400">public</span> milestones;</div>
                  <div className="pl-4"><span className="text-[#9945FF]">bool</span> <span className="text-gray-400">public</span> isActive = <span className="text-[#00FFFF]">true</span>;</div>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="pl-4 text-green-400"
                  >
                    <span className="text-pink-500">// Protected by FreelanceShield</span>
                  </motion.div>
                  <div>{'}'};</div>
                </div>
              </div>
              
              {/* Animated typing cursor */}
              <motion.div 
                className="absolute bottom-4 right-5 w-2 h-4 bg-[#00FFFF]"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            </div>
            
            {/* Security shield badge */}
            <motion.div
              className="absolute top-1/2 right-2 transform -translate-y-1/2 opacity-5"
              animate={{ rotate: [0, 10, 0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
            >
              <Shield className="w-40 h-40 text-[#9945FF]" />
            </motion.div>
          </div>
        </motion.div>

        {/* Animated features showcase */}
        <div className="w-full max-w-6xl mb-20">
          <h2 className="text-2xl md:text-3xl font-heading text-center mb-12 font-bold">
            <span className="relative inline-block">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#9945FF] to-[#8752F3]">
                Key Features
              </span>
              <motion.span 
                className="absolute -bottom-2 left-0 w-full h-[3px] bg-gradient-to-r from-[#9945FF] to-[#00FFFF]"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.5, duration: 1 }}
              />
            </span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className={cn(
                  "p-6 rounded-lg border backdrop-blur-sm transition-all duration-300 group hover:transform hover:scale-105",
                  currentFeatureIndex === index 
                    ? "bg-[#9945FF]/10 border-[#9945FF]/40 shadow-[0_0_15px_rgba(153,69,255,0.15)]" 
                    : "bg-gray-900/30 border-gray-700 hover:border-[#9945FF]/30 hover:bg-[#9945FF]/5"
                )}
              >
                <div className="text-3xl mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-black/30 border border-gray-700 group-hover:border-[#9945FF]/30">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-heading text-white mb-2 font-bold">{feature.title}</h3>
                <p className="text-white">{feature.description}</p>
                <motion.div 
                  className="w-full h-[1px] mt-4 bg-gradient-to-r from-transparent via-[#9945FF]/30 to-transparent"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Developer bypass button */}
        {isDevMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="w-full max-w-md mb-16"
          >
            <div className="p-1 rounded-lg bg-gradient-to-r from-pink-500 via-[#00FFFF] to-[#1971E9]">
              <div className="p-6 rounded-lg bg-gray-900 flex flex-col items-center text-center">
                <Button
                  onClick={handleDevBypass}
                  className="bg-gradient-to-r from-pink-500 to-[#1971E9] hover:opacity-90 text-white font-medium py-6 px-8 rounded-md w-full max-w-xs transition-all duration-300 transform hover:scale-105"
                >
                  <span className="flex items-center justify-center">
                    Enable Developer Bypass
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
