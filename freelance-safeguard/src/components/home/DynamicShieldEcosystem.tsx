import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, Sparkles, Lock, Coins, FileCheck, Users, ArrowRight, ExternalLink } from 'lucide-react';
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
    <div className="relative w-[500px] h-[500px] mx-auto">
      {/* Background glow effect with enhanced Solana gradient */}
      <motion.div 
        className="absolute inset-0 rounded-full blur-3xl"
        style={{
          background: isDark 
            ? 'radial-gradient(circle, rgba(148,85,255,0.3) 0%, rgba(20,241,149,0.1) 70%, transparent 100%)'
            : 'radial-gradient(circle, rgba(148,85,255,0.2) 0%, rgba(20,241,149,0.05) 70%, transparent 100%)'
        }}
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.6, 0.8, 0.6]
        }}
        transition={{ 
          duration: 5, 
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      />
      
      {/* Retro grid background with improved contrast */}
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
      
      {/* 3D Shield with enhanced Solana gradient */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 z-10"
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
            <linearGradient id="solanaShieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9455FF" />
              <stop offset="50%" stopColor="#7B61FF" />
              <stop offset="100%" stopColor="#14F195" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <pattern id="gridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill="none" />
              <path d="M 10 0 L 0 0 0 10" stroke="rgba(148,85,255,0.3)" strokeWidth="0.5" fill="none" />
            </pattern>
          </defs>
          
          {/* Shield body with enhanced Solana gradient and pattern overlay */}
          <motion.path 
            d="M50,5 L95,30 C95,70 75,90 50,95 C25,90 5,70 5,30 L50,5 Z" 
            fill="url(#solanaShieldGradient)"
            filter="url(#glow)"
            initial={{ pathLength: 0, fillOpacity: 0 }}
            animate={{ pathLength: 1, fillOpacity: 0.9 }}
            transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
          />
          
          {/* Pattern overlay for texture */}
          <motion.path 
            d="M50,5 L95,30 C95,70 75,90 50,95 C25,90 5,70 5,30 L50,5 Z" 
            fill="url(#gridPattern)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ duration: 1.5, delay: 1.5 }}
          />
          
          {/* Lock icon with animation */}
          <motion.g
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.5 }}
          >
            <rect x="38" y="45" width="24" height="22" rx="3" fill="white" />
            <rect x="44" y="35" width="12" height="15" rx="6" stroke="white" strokeWidth="4" fill="none" />
          </motion.g>
        </svg>
        
        {/* Multiple pulsing halo rings */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute inset-0 border-2 rounded-full"
            style={{ 
              borderColor: isDark ? 'rgba(148,85,255,0.4)' : 'rgba(148,85,255,0.3)',
              scale: 1 + (i * 0.1)
            }}
            animate={{ 
              scale: [1 + (i * 0.1), 1.15 + (i * 0.1), 1 + (i * 0.1)],
              opacity: [0.7, 0, 0.7]
            }}
            transition={{ 
              duration: 3 + i, 
              delay: i * 0.5,
              repeat: Infinity,
              repeatType: "reverse" 
            }}
          />
        ))}
      </motion.div>
      
      {/* Document elements (increased to 2) */}
      <motion.div
        className="absolute top-[25%] left-[15%] z-10"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        onHoverStart={() => setActiveFeature('contract')}
        onHoverEnd={() => setActiveFeature(null)}
      >
        <div className="flex items-center justify-center w-14 h-14 bg-background/90 dark:bg-gray-800/90 rounded-md shadow-lg border border-shield-purple/30">
          <FileCheck className="h-8 w-8 text-shield-purple" />
        </div>
        
        {/* Tooltip for document */}
        <AnimatePresence>
          {activeFeature === 'contract' && (
            <motion.div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg p-2 z-20 w-48"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              <h4 className="font-['NT_Brick_Sans'] text-sm font-bold text-shield-purple">Smart Contracts</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300">Secure escrow contracts with automatic verification and dispute resolution</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      <motion.div
        className="absolute top-[35%] left-[10%] z-10"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        whileHover={{ scale: 1.1, rotate: -5 }}
        onHoverStart={() => setActiveFeature('verification')}
        onHoverEnd={() => setActiveFeature(null)}
      >
        <div className="flex items-center justify-center w-12 h-12 bg-background/90 dark:bg-gray-800/90 rounded-md shadow-lg border border-shield-purple/30">
          <Users className="h-6 w-6 text-shield-blue" />
        </div>
        
        {/* Tooltip for verification */}
        <AnimatePresence>
          {activeFeature === 'verification' && (
            <motion.div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg p-2 z-20 w-48"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
            >
              <h4 className="font-['NT_Brick_Sans'] text-sm font-bold text-shield-blue">Verification</h4>
              <p className="text-xs text-gray-600 dark:text-gray-300">Multi-party verification ensures work meets requirements</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Token components (enhanced with price data) */}
      <motion.div
        className="absolute top-[25%] right-[15%] z-10"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        whileHover={{ scale: 1.1, rotate: -5 }}
        onClick={() => setShowTokenDetails(!showTokenDetails)}
      >
        <div className="flex items-center justify-center w-14 h-14 bg-[#14F195]/90 rounded-full shadow-lg border border-[#14F195]/30 cursor-pointer">
          <span className="font-bold text-black text-sm">SOL</span>
        </div>
        
        {/* SOL price indicator */}
        <motion.div
          className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full px-2 py-0.5 text-xs font-bold shadow-md border border-shield-purple/20"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2, duration: 0.3 }}
        >
          ${tokenPrices.SOL.price}
        </motion.div>
      </motion.div>
      
      <motion.div
        className="absolute top-[35%] right-[10%] z-10"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3, duration: 0.6 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        onClick={() => setShowTokenDetails(!showTokenDetails)}
      >
        <div className="flex items-center justify-center w-12 h-12 bg-[#2775CA]/90 rounded-full shadow-lg border border-[#2775CA]/30 cursor-pointer">
          <span className="font-bold text-white text-xs">USDC</span>
        </div>
      </motion.div>
      
      {/* Token details panel */}
      <AnimatePresence>
        {showTokenDetails && (
          <motion.div
            className="absolute top-[15%] right-[5%] bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 z-30 w-64 border border-shield-purple/20"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <h3 className="font-['NT_Brick_Sans'] text-sm font-bold text-foreground dark:text-white mb-2">Protection Tokens</h3>
            
            {/* Token list */}
            <div className="space-y-2">
              {Object.entries(tokenPrices).map(([symbol, data]) => {
                const change = formatPriceChange(data.change);
                return (
                  <div key={symbol} className="flex items-center justify-between p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        symbol === 'SOL' ? 'bg-[#14F195]' : 
                        symbol === 'USDC' ? 'bg-[#2775CA]' : 
                        'bg-[#F0B90B]'
                      }`}>
                        <span className={`text-xs font-bold ${symbol === 'SOL' ? 'text-black' : 'text-white'}`}>{symbol.substring(0, 1)}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground dark:text-gray-200">{symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground dark:text-gray-200">
                        ${symbol === 'BONK' ? data.price.toFixed(8) : data.price.toFixed(2)}
                      </div>
                      <div className={`text-xs ${change.color}`}>{change.text}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button className="w-full flex items-center justify-center space-x-1 text-xs text-shield-purple hover:text-shield-blue transition-colors">
                <span>View all tokens</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Connection lines with animated particles */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9455FF" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#9455FF" />
            <stop offset="100%" stopColor="#9455FF" stopOpacity="0.2" />
          </linearGradient>
          
          <filter id="glow2" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Document to shield connection */}
        <motion.path
          d={`M80 140 L200 200`}
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow2)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        />
        
        {/* Second document to shield connection */}
        <motion.path
          d={`M60 170 L200 200`}
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow2)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        />
        
        {/* SOL to shield connection */}
        <motion.path
          d={`M320 140 L200 200`}
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow2)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
        />
        
        {/* USDC to shield connection */}
        <motion.path
          d={`M340 170 L200 200`}
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow2)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 1.7, duration: 0.8 }}
        />
        
        {/* Animated particles on paths */}
        {animationComplete && (
          <>
            {/* Document path particle */}
            <motion.circle
              r="3"
              fill="#9455FF"
              filter="url(#glow2)"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                offsetDistance: ['0%', '100%']
              }}
              style={{ offsetPath: 'path(M80 140 L200 200)' }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            />
            
            {/* SOL path particle */}
            <motion.circle
              r="3"
              fill="#14F195"
              filter="url(#glow2)"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                offsetDistance: ['0%', '100%']
              }}
              style={{ offsetPath: 'path(M320 140 L200 200)' }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1.5
              }}
            />
          </>
        )}
      </svg>
      
      {/* Feature badges (enhanced with hover effects) */}
      <div className="absolute top-0 left-0 w-full h-full">
        {[
          { icon: <Shield className="h-5 w-5 text-shield-purple" />, label: "Protection", position: "top-3 left-1/2 -translate-x-1/2", id: "protection" },
          { icon: <CheckCircle className="h-5 w-5 text-shield-purple" />, label: "Guaranteed", position: "bottom-1/4 right-3 translate-x-1/2", id: "guaranteed" },
          { icon: <Sparkles className="h-5 w-5 text-shield-blue" />, label: "On Solana", position: "bottom-1/4 left-3 -translate-x-1/2", id: "solana" },
          { icon: <Coins className="h-5 w-5 text-[#14F195]" />, label: "Instant Payouts", position: "bottom-10 left-1/2 -translate-x-1/2", id: "payouts" },
        ].map((feature, index) => (
          <motion.div
            key={index}
            className={`absolute ${feature.position} bg-background/90 dark:bg-gray-800/90 rounded-full py-1 px-3 shadow-lg flex items-center space-x-1.5 backdrop-blur-sm border border-shield-purple/20 dark:border-shield-purple/30 cursor-pointer`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.5, 
              delay: 0.8 + (index * 0.15),
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 15px rgba(148, 85, 255, 0.5)"
            }}
            onHoverStart={() => setActiveFeature(feature.id)}
            onHoverEnd={() => setActiveFeature(null)}
          >
            {feature.icon}
            <span className="font-['NT_Brick_Sans'] text-xs text-foreground dark:text-gray-300">{feature.label}</span>
          </motion.div>
        ))}
      </div>
      
      {/* Protection stats panel */}
      <AnimatePresence>
        {activeFeature === 'protection' && (
          <motion.div
            className="absolute top-16 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 z-30 w-64 border border-shield-purple/20"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h3 className="font-['NT_Brick_Sans'] text-sm font-bold text-shield-purple mb-2">Protection Stats</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                <div className="text-xs text-gray-500 dark:text-gray-400">Protected Projects</div>
                <div className="text-lg font-bold text-foreground dark:text-white">{formatNumber(protectionStats.protected)}</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                <div className="text-xs text-gray-500 dark:text-gray-400">Success Rate</div>
                <div className="text-lg font-bold text-[#14F195]">{protectionStats.successRate}%</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                <div className="text-xs text-gray-500 dark:text-gray-400">Avg Response</div>
                <div className="text-lg font-bold text-foreground dark:text-white">{protectionStats.avgResponse}</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Value</div>
                <div className="text-lg font-bold text-shield-blue">{protectionStats.totalValue}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Orbiting particles with enhanced effects */}
      {[...Array(8)].map((_, index) => (
        <motion.div
          key={`particle-${index}`}
          className="absolute top-1/2 left-1/2 rounded-full"
          style={{ 
            x: -4, 
            y: -4,
            width: index % 3 === 0 ? '8px' : '6px',
            height: index % 3 === 0 ? '8px' : '6px',
            background: index % 3 === 0 ? '#14F195' : index % 2 === 0 ? '#7B61FF' : '#9455FF',
            boxShadow: `0 0 10px ${index % 3 === 0 ? '#14F195' : index % 2 === 0 ? '#7B61FF' : '#9455FF'}`
          }}
          animate={{
            x: [0, 0],
            y: [0, 0],
            scale: [1, 1.3, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 4,
            delay: index * 0.5,
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
      
      {/* Call-to-action button */}
      <motion.div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        <button className="bg-shield-purple hover:bg-shield-purple/90 text-white font-['NT_Brick_Sans'] font-medium py-2 px-4 rounded-full flex items-center space-x-2 shadow-lg">
          <span>Get Protected</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </motion.div>
    </div>
  );
};

export default EnhancedDynamicShieldEcosystem;
