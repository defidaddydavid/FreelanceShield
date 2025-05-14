import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  Sparkles, 
  Lock, 
  Coins, 
  FileCheck, 
  Users, 
  ArrowRight, 
  ExternalLink,
  Zap
} from 'lucide-react';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';

// Token price simulation - in a real implementation, this would come from your data fetching utilities
const tokenPrices = {
  SOL: { price: 142.87, change: 3.2 },
  USDC: { price: 1.00, change: 0.01 },
  BONK: { price: 0.00002341, change: -1.2 }
};

/**
 * Enhanced Dynamic Shield Ecosystem Component
 * 
 * An interactive, animated visualization that represents the FreelanceShield protection
 * ecosystem with Solana-inspired design elements, token components, and dynamic interactions.
 * Supports both light and dark modes through the Solana theme provider.
 */
const EnhancedDynamicShieldEcosystem: React.FC = () => {
  const { isDark } = useSolanaTheme();
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [showTokenDetails, setShowTokenDetails] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Simulate protection stats
  const protectionStats = {
    protected: 1250,
    successRate: 99.2,
    avgResponse: '4.3h',
    totalValue: '$2.4M'
  };

  // Handle animation completion
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  // Add parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      
      const elements = containerRef.current.querySelectorAll('.parallax-element');
      elements.forEach((el) => {
        const depth = parseFloat(el.getAttribute('data-depth') || '0');
        const moveX = x * depth * 30;
        const moveY = y * depth * 30;
        (el as HTMLElement).style.transform = `translate(${moveX}px, ${moveY}px)`;
      });
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Format price change with color and sign
  const formatPriceChange = (change: number): { text: string, color: string } => {
    const sign = change > 0 ? '+' : '';
    const color = change > 0 ? 'text-[#14F195]' : change < 0 ? 'text-red-500' : 'text-gray-400';
    return { text: `${sign}${change.toFixed(2)}%`, color };
  };

  return (
    <div ref={containerRef} className="relative w-[550px] h-[550px] mx-auto">
      {/* Enhanced background glow effect with animated Solana gradient */}
      <motion.div 
        className="absolute inset-0 rounded-full blur-3xl"
        style={{
          background: isDark 
            ? 'radial-gradient(circle, rgba(148,85,255,0.4) 0%, rgba(20,241,149,0.15) 70%, transparent 100%)'
            : 'radial-gradient(circle, rgba(148,85,255,0.3) 0%, rgba(20,241,149,0.1) 70%, transparent 100%)'
        }}
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.7, 0.9, 0.7]
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      />
      
      {/* Animated geometric shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`shape-${i}`}
            className="absolute rounded-lg parallax-element"
            data-depth={0.5 + (i * 0.1)}
            style={{
              width: 60 + (i * 15),
              height: 60 + (i * 15),
              border: `1px solid rgba(148, 85, 255, ${0.1 + (i * 0.05)})`,
              background: `linear-gradient(135deg, rgba(148, 85, 255, ${0.05 + (i * 0.01)}) 0%, rgba(20, 241, 149, ${0.05 + (i * 0.01)}) 100%)`,
              left: `${10 + (i * 15)}%`,
              top: `${15 + (i * 12)}%`,
              transform: 'rotate(45deg)',
              backdropFilter: 'blur(5px)',
            }}
            animate={{
              rotate: [45, 45 + (i * 5), 45],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 8 + (i * 2),
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
      </div>
      
      {/* Enhanced retro grid background with improved contrast and animation */}
      <div className="absolute inset-0 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30"></div>
        <div className="w-full h-full grid grid-cols-12 grid-rows-12">
          {[...Array(144)].map((_, i) => (
            <motion.div 
              key={i}
              className="border-[0.5px] border-shield-purple/20 dark:border-shield-purple/15"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.005 * i, duration: 0.2 }}
            />
          ))}
        </div>
      </div>
      
      {/* Enhanced 3D Shield with improved Solana gradient and glow effects */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 z-10 parallax-element"
        data-depth="0.2"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8, type: "spring" }}
      >
        {/* Shield shape with enhanced Solana gradient */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-2xl"
        >
          <defs>
            <radialGradient id="solanaShieldGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#9455FF" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#14F195" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#9455FF" stopOpacity="0.4" />
            </radialGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Shield base with enhanced gradient */}
          <path 
            d="M50,5 L95,25 L95,60 C95,75 75,95 50,95 C25,95 5,75 5,60 L5,25 L50,5 Z" 
            fill="url(#solanaShieldGradient)"
            stroke="#9455FF"
            strokeWidth="0.5"
            filter="url(#glow)"
          />
          
          {/* Inner shield details */}
          <path 
            d="M50,15 L85,30 L85,60 C85,70 70,85 50,85 C30,85 15,70 15,60 L15,30 L50,15 Z" 
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="0.5"
            strokeDasharray="1,1"
          />
          
          {/* Shield emblem */}
          <g transform="translate(35, 35) scale(0.3)">
            <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h320.3c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="#9945FF"/>
            <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h320.3c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="#03E1FF"/>
            <path d="M332.4 120.9c-2.4-2.4-5.7-3.8-9.2-3.8H2.9c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h320.3c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="#7C5CFF"/>
          </g>
        </svg>
        
        {/* Animated glow ring */}
        <motion.div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(148,85,255,0.3) 0%, rgba(20,241,149,0.1) 70%, transparent 100%)',
            filter: 'blur(15px)'
          }}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
      </motion.div>
      
      {/* Enhanced token cards with improved styling and animations */}
      <div className="absolute inset-0">
        {Object.entries(tokenPrices).map(([token, data], index) => {
          const angle = (index * (360 / Object.keys(tokenPrices).length)) * (Math.PI / 180);
          const radius = 180;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const priceChange = formatPriceChange(data.change);
          
          return (
            <motion.div
              key={token}
              className="absolute top-1/2 left-1/2 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-lg p-3 backdrop-blur-md border border-shield-purple/20 z-20 parallax-element"
              data-depth={0.4 + (index * 0.1)}
              style={{ 
                width: 120,
                marginLeft: -60,
                marginTop: -40,
              }}
              initial={{ opacity: 0, x, y }}
              animate={{ 
                opacity: 1, 
                x, 
                y,
                scale: activeFeature === token ? 1.1 : 1,
                boxShadow: activeFeature === token ? '0 0 20px rgba(148,85,255,0.5)' : '0 0 10px rgba(0,0,0,0.1)'
              }}
              transition={{ 
                delay: 0.8 + (index * 0.2),
                duration: 0.5,
                type: "spring"
              }}
              whileHover={{ scale: 1.1 }}
              onHoverStart={() => setActiveFeature(token)}
              onHoverEnd={() => setActiveFeature(null)}
            >
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-shield-purple/20 flex items-center justify-center mr-2">
                  <Coins className="w-4 h-4 text-shield-purple" />
                </div>
                <span className="font-['NT_Brick_Sans'] font-bold text-foreground dark:text-white">{token}</span>
              </div>
              
              <div className="flex justify-between items-baseline">
                <div className="text-lg font-bold text-foreground dark:text-white">
                  ${token === 'BONK' ? data.price.toFixed(8) : data.price.toFixed(2)}
                </div>
                <div className={`text-xs font-medium ${priceChange.color}`}>
                  {priceChange.text}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Enhanced feature icons with improved positioning and animations */}
      <div className="absolute inset-0">
        {[
          { id: 'protection', icon: <Shield className="w-5 h-5 text-shield-purple" />, label: 'Protection', angle: 45 },
          { id: 'verification', icon: <CheckCircle className="w-5 h-5 text-shield-purple" />, label: 'Verification', angle: 135 },
          { id: 'rewards', icon: <Sparkles className="w-5 h-5 text-shield-purple" />, label: 'Rewards', angle: 225 },
          { id: 'security', icon: <Lock className="w-5 h-5 text-shield-purple" />, label: 'Security', angle: 315 },
        ].map((feature, index) => {
          const angle = (feature.angle) * (Math.PI / 180);
          const radius = 220;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          return (
            <motion.div
              key={feature.id}
              className="absolute top-1/2 left-1/2 flex flex-col items-center justify-center z-20 parallax-element"
              data-depth="0.3"
              style={{ 
                marginLeft: -40,
                marginTop: -40,
                width: 80
              }}
              initial={{ opacity: 0, x, y }}
              animate={{ 
                opacity: 1, 
                x, 
                y,
                scale: activeFeature === feature.id ? 1.1 : 1
              }}
              transition={{ 
                delay: 1.2 + (index * 0.2),
                duration: 0.5
              }}
              whileHover={{ 
                scale: 1.1,
                filter: 'drop-shadow(0 0 8px rgba(148,85,255,0.5))'
              }}
              onHoverStart={() => setActiveFeature(feature.id)}
              onHoverEnd={() => setActiveFeature(null)}
            >
              <div className="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md flex items-center justify-center mb-2 shadow-lg border border-shield-purple/20">
                {feature.icon}
              </div>
              <span className="font-['NT_Brick_Sans'] text-xs text-foreground dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded-full backdrop-blur-sm">{feature.label}</span>
            </motion.div>
          );
        })}
      </div>
      
      {/* Enhanced protection stats panel with improved styling */}
      <AnimatePresence>
        {activeFeature === 'protection' && (
          <motion.div
            className="absolute top-16 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-xl p-4 z-30 w-72 border border-shield-purple/30 backdrop-blur-md parallax-element"
            data-depth="0.1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h3 className="font-['NT_Brick_Sans'] text-sm font-bold text-shield-purple mb-3 flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              Protection Stats
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50/80 dark:bg-gray-700/50 p-2 rounded-md">
                <div className="text-xs text-gray-500 dark:text-gray-400">Protected Projects</div>
                <div className="text-lg font-bold text-foreground dark:text-white">{formatNumber(protectionStats.protected)}</div>
              </div>
              
              <div className="bg-gray-50/80 dark:bg-gray-700/50 p-2 rounded-md">
                <div className="text-xs text-gray-500 dark:text-gray-400">Success Rate</div>
                <div className="text-lg font-bold text-[#14F195]">{protectionStats.successRate}%</div>
              </div>
              
              <div className="bg-gray-50/80 dark:bg-gray-700/50 p-2 rounded-md">
                <div className="text-xs text-gray-500 dark:text-gray-400">Avg Response</div>
                <div className="text-lg font-bold text-foreground dark:text-white">{protectionStats.avgResponse}</div>
              </div>
              
              <div className="bg-gray-50/80 dark:bg-gray-700/50 p-2 rounded-md">
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Value</div>
                <div className="text-lg font-bold text-shield-blue">{protectionStats.totalValue}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Enhanced orbiting particles with improved effects */}
      {[...Array(12)].map((_, index) => (
        <motion.div
          key={`particle-${index}`}
          className="absolute top-1/2 left-1/2 rounded-full parallax-element"
          data-depth={0.6 + (index * 0.05)}
          style={{ 
            x: -4, 
            y: -4,
            width: index % 3 === 0 ? '8px' : '6px',
            height: index % 3 === 0 ? '8px' : '6px',
            background: index % 3 === 0 ? '#14F195' : index % 2 === 0 ? '#7B61FF' : '#9455FF',
            boxShadow: `0 0 ${index % 3 === 0 ? '15' : '10'}px ${index % 3 === 0 ? '#14F195' : index % 2 === 0 ? '#7B61FF' : '#9455FF'}`
          }}
          animate={{
            x: [0, 0],
            y: [0, 0],
            scale: [1, 1.3, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 4 + (index % 3),
            delay: index * 0.3,
            repeat: Infinity,
            repeatType: "reverse",
            times: [0, 0.5, 1],
            path: {
              type: "circle",
              clockwise: index % 2 === 0,
              radius: 140 + (index * 8),
            }
          }}
        />
      ))}
      
      {/* Connection lines between elements */}
      <svg className="absolute inset-0 w-full h-full z-5 opacity-30">
        <motion.path
          d="M275,275 L350,200 L425,275 L350,350 Z"
          stroke="#9455FF"
          strokeWidth="1"
          fill="none"
          strokeDasharray="5,5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 2, delay: 1.5 }}
        />
        <motion.path
          d="M275,275 L200,200 L125,275 L200,350 Z"
          stroke="#14F195"
          strokeWidth="1"
          fill="none"
          strokeDasharray="5,5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 2, delay: 1.8 }}
        />
      </svg>
      
      {/* Enhanced call-to-action button with improved styling */}
      <motion.div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 parallax-element"
        data-depth="0.2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        <button className="bg-shield-purple hover:bg-shield-purple/90 text-white font-['NT_Brick_Sans'] font-medium py-2.5 px-5 rounded-full flex items-center space-x-2 shadow-lg border border-white/10 transition-all duration-300 hover:shadow-xl hover:shadow-shield-purple/20">
          <span>Get Protected</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </motion.div>
      
      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"
        }}
      />
    </div>
  );
};

export default EnhancedDynamicShieldEcosystem;
