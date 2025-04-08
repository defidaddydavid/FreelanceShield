import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, Zap, LineChart, TrendingUp, LockKeyhole } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';
import { Link } from 'react-router-dom';

interface FeaturePoint {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  position: string;
  delay: number;
}

const ShieldVisualization: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [pulseEffect, setPulseEffect] = useState(true);
  const { isDark } = useSolanaTheme();
  
  // Automatically cycle through features
  useEffect(() => {
    if (!isAnimating) return;
    
    const features = featurePoints.map(f => f.id);
    const interval = setInterval(() => {
      setActiveFeature(current => {
        const currentIndex = features.indexOf(current || features[0]);
        const nextIndex = (currentIndex + 1) % features.length;
        return features[nextIndex];
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isAnimating]);
  
  // Create pulsing effect for the shield
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseEffect(prev => !prev);
    }, 2000);
    
    return () => clearInterval(pulseInterval);
  }, []);
  
  const featurePoints: FeaturePoint[] = [
    {
      id: 'protection',
      icon: <Shield className="h-6 w-6" />,
      title: "Protection",
      description: "Smart contract-backed coverage for freelance work, protecting against client disputes and project cancellations.",
      position: "top-[15%] left-[5%]",
      delay: 0
    },
    {
      id: 'guaranteed',
      icon: <CheckCircle className="h-6 w-6" />,
      title: "Guaranteed",
      description: "Automated claim payouts with Solana's lightning-fast transaction finality.",
      position: "top-[15%] right-[5%]",
      delay: 0.1
    },
    {
      id: 'fast-claims',
      icon: <Zap className="h-6 w-6" />,
      title: "Fast Claims",
      description: "File and receive claim payouts in minutes, not weeks or months.",
      position: "top-[50%] left-[0%]",
      delay: 0.2
    },
    {
      id: 'transparent',
      icon: <LineChart className="h-6 w-6" />,
      title: "Transparent",
      description: "All insurance policies and claims are verifiable on-chain for complete transparency.",
      position: "bottom-[25%] left-[10%]",
      delay: 0.3
    },
    {
      id: 'reputation',
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Reputation",
      description: "Build your on-chain freelance reputation to unlock premium discounts and higher coverage.",
      position: "bottom-[10%] right-[10%]",
      delay: 0.4
    },
    {
      id: 'security',
      icon: <LockKeyhole className="h-6 w-6" />,
      title: "Security",
      description: "Military-grade Solana smart contract security with regular audits.",
      position: "top-[50%] right-[0%]",
      delay: 0.5
    }
  ];
  
  const handleFeatureClick = (id: string) => {
    setActiveFeature(id);
    setIsAnimating(false); // Stop auto-cycling when user interacts
  };
  
  const getActiveContent = () => {
    const feature = featurePoints.find(f => f.id === activeFeature);
    if (!feature) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="text-center mb-6"
      >
        <h3 className="font-['NT_Brick_Sans'] text-2xl mb-2 text-shield-purple tracking-wider">{feature.title}</h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto font-['Open_Sans']">{feature.description}</p>
      </motion.div>
    );
  };
  
  return (
    <div className="py-20 relative overflow-hidden">
      {/* Background Elements - Arcade Style */}
      <div className="absolute inset-0 z-0">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(0deg, transparent 97%, #9945FF 98%, #9945FF 98%, transparent 99%)',
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Vertical grid lines */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(90deg, transparent 97%, #9945FF 98%, #9945FF 98%, transparent 99%)',
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-shield-purple/10 blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] rounded-full bg-shield-purple/10 blur-[100px] animate-pulse-slow animation-delay-1000" />
      </div>
      
      <div className="relative z-10">
        <h2 className="font-['NT_Brick_Sans'] text-5xl text-center mb-4 tracking-widest uppercase">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-shield-purple to-shield-purple/80">
            Insurance Powered by
          </span>
        </h2>
        <div className="flex justify-center mb-16">
          <div className="px-6 py-2 rounded-md bg-gray-900 border border-shield-purple/20 inline-flex items-center">
            <span className="text-3xl font-['NT_Brick_Sans'] text-white mr-2">SOLANA</span>
            {/* Simplified Solana Logo */}
            <svg width="32" height="32" viewBox="0 0 128 114" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M26.5 86.4C27.3 85.6 28.4 85.1 29.6 85.1H126.3C128.4 85.1 129.5 87.7 128 89.2L101.5 115.7C100.7 116.5 99.6 117 98.4 117H1.7C-0.4 117 -1.5 114.4 0 112.9L26.5 86.4Z" fill="#9945FF"/>
              <path d="M26.5 1.7C27.4 0.9 28.5 0.4 29.6 0.4H126.3C128.4 0.4 129.5 3 128 4.5L101.5 31C100.7 31.8 99.6 32.3 98.4 32.3H1.7C-0.4 32.3 -1.5 29.7 0 28.2L26.5 1.7Z" fill="#9945FF"/>
              <path d="M101.5 44C100.7 43.2 99.6 42.7 98.4 42.7H1.7C-0.4 42.7 -1.5 45.3 0 46.8L26.5 73.3C27.3 74.1 28.4 74.6 29.6 74.6H126.3C128.4 74.6 129.5 72 128 70.5L101.5 44Z" fill="#9945FF"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="relative h-[620px] flex items-center justify-center">
          {/* Shield Background with Glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              className="w-[450px] h-[550px] bg-shield-purple/5 dark:bg-shield-purple/10 rounded-full blur-3xl"
              animate={{ scale: pulseEffect ? 1.05 : 1 }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
            />
          </div>
          
          {/* Shield Border */}
          <svg
            className="absolute w-[380px] h-[460px] z-10"
            viewBox="0 0 100 120"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.path
              d="M50 5 L95 20 L95 50 C95 80 75 100 50 115 C25 100 5 80 5 50 L5 20 L50 5"
              fill="none"
              strokeWidth="1.5"
              stroke="rgba(153, 69, 255, 0.8)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            <motion.path
              d="M50 15 L85 27 L85 50 C85 73 70 90 50 102 C30 90 15 73 15 50 L15 27 L50 15"
              fill="none"
              strokeWidth="1"
              stroke="rgba(153, 69, 255, 0.6)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
            />
            <motion.path
              d="M50 25 L75 35 L75 50 C75 67 65 80 50 90 C35 80 25 67 25 50 L25 35 L50 25"
              fill="none"
              strokeWidth="1"
              stroke="rgba(153, 69, 255, 0.4)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, ease: "easeInOut", delay: 1 }}
            />
          </svg>
          
          {/* Shield Inner Fill with Grid Pattern */}
          <div className="absolute w-[340px] h-[420px] overflow-hidden rounded-[40%_40%_45%_45%] z-0">
            <div className={cn(
              "w-full h-full",
              "bg-gradient-to-b from-black to-gray-900",
            )}>
              {/* Retro Grid */}
              <div className="absolute inset-0 opacity-30" 
                   style={{ 
                     backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(153, 69, 255, .3) 25%, rgba(153, 69, 255, .3) 26%, transparent 27%, transparent 74%, rgba(153, 69, 255, .3) 75%, rgba(153, 69, 255, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(153, 69, 255, .3) 25%, rgba(153, 69, 255, .3) 26%, transparent 27%, transparent 74%, rgba(153, 69, 255, .3) 75%, rgba(153, 69, 255, .3) 76%, transparent 77%, transparent)',
                     backgroundSize: '30px 30px' 
                   }}
              />
              
              {/* Pulsing Glow in center */}
              <motion.div 
                className="absolute inset-0 bg-shield-purple/10 blur-xl"
                animate={{ opacity: [0.1, 0.3, 0.1] }} 
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
          </div>
          
          {/* Connecting Lines from Center to Features */}
          {featurePoints.map((point) => {
            // Calculate connection line path based on position
            const isLeftSide = point.position.includes('left');
            const isTopHalf = point.position.includes('top');
            
            return (
              <React.Fragment key={`line-${point.id}`}>
                <motion.div
                  className={`absolute z-5 w-24 h-0.5 origin-left
                    ${isLeftSide ? 'left-1/2' : 'right-1/2 rotate-180 origin-right'}
                    ${isTopHalf ? 'top-1/2 -rotate-45' : 'bottom-1/2 rotate-45'}
                    ${point.position.includes('50%') ? '!rotate-0' : ''}
                  `}
                  style={{
                    background: `linear-gradient(90deg, rgba(153, 69, 255, 0.8), rgba(153, 69, 255, 0.1))`,
                    opacity: activeFeature === point.id ? 1 : 0.4,
                    transformOrigin: isLeftSide ? 'left center' : 'right center'
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: point.delay + 1.8 }}
                />
              </React.Fragment>
            );
          })}
          
          {/* Shield Logo in Center */}
          <motion.div 
            className="absolute z-20 flex items-center justify-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
          >
            <div className="relative">
              <Shield className="w-20 h-20 text-shield-purple" />
              <motion.div 
                className="absolute inset-0 w-20 h-20 text-shield-purple blur-md"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Shield className="w-20 h-20" />
              </motion.div>
            </div>
          </motion.div>
          
          {/* Feature Points around the shield */}
          {featurePoints.map((point) => (
            <motion.div
              key={point.id}
              className={cn(
                "absolute z-30 cursor-pointer",
                point.position
              )}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: point.delay + 1.5 }}
              onClick={() => handleFeatureClick(point.id)}
            >
              <motion.div 
                className={cn(
                  "flex items-center gap-2 p-3 px-4 rounded-xl backdrop-blur-md shadow-lg transition-all duration-300",
                  "border-2 border-shield-purple/20",
                  activeFeature === point.id 
                    ? "bg-shield-purple text-white scale-110 border-shield-purple/80" 
                    : "bg-gray-900/70 text-white hover:bg-gray-800/90 hover:border-shield-purple/40"
                )}
                whileHover={{ scale: 1.05 }}
                animate={activeFeature === point.id ? 
                  { boxShadow: ['0 0 0 rgba(153, 69, 255, 0.3)', '0 0 15px rgba(153, 69, 255, 0.6)', '0 0 0 rgba(153, 69, 255, 0.3)'] } :
                  {}}
                transition={{ duration: 2, repeat: activeFeature === point.id ? Infinity : 0 }}
              >
                <div>{point.icon}</div>
                <p className="font-['NT_Brick_Sans'] text-sm whitespace-nowrap tracking-wide">{point.title}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
        
        {/* Active Feature Content */}
        <div className="h-28 mt-4 flex justify-center items-center">
          <AnimatePresence mode="wait">
            {activeFeature && getActiveContent()}
          </AnimatePresence>
        </div>
        
        {/* Control Buttons - Arcade Style */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => {
              setIsAnimating(true);
              setActiveFeature('protection');
            }}
            className="px-6 py-3 font-['NT_Brick_Sans'] tracking-wide text-white rounded-md border-2 border-shield-purple/60 bg-gray-900/90 hover:bg-shield-purple/80 transition-colors shadow-[0_0_10px_rgba(153,69,255,0.3)] uppercase"
          >
            Restart Demo
          </button>
          
          <Link to="/new-policy">
            <button className="px-6 py-3 font-['NT_Brick_Sans'] tracking-wide text-white rounded-md border-2 border-shield-purple bg-shield-purple hover:bg-shield-purple/90 transition-colors shadow-[0_0_10px_rgba(153,69,255,0.5)] uppercase">
              Get Protected
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ShieldVisualization;
