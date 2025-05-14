import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { Lock, CheckCircle, Zap } from 'lucide-react';

// Solana logo component
const SolanaLogo = ({ width = 34, height = 34 }: { width?: number, height?: number }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 397 311" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h320.3c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="#9945FF"/>
      <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h320.3c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="#03E1FF"/>
      <path d="M332.4 120.9c-2.4-2.4-5.7-3.8-9.2-3.8H2.9c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h320.3c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="#7C5CFF"/>
    </svg>
  );
};

const ModernHeroVisual: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.3 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  // Mouse parallax effect
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
        (el as HTMLElement).style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      });
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[500px] overflow-hidden rounded-2xl"
    >
      {/* Simplified background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-shield-purple/5 dark:from-gray-900 dark:via-gray-900 dark:to-shield-purple/10 z-0" />
      
      {/* Central shield element */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Animated glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-shield-purple/10 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
        
        {/* Orbital ring */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-shield-purple/20 parallax-element"
          data-depth="0.1"
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 60, 
            repeat: Infinity,
            ease: "linear" 
          }}
        >
          {/* Orbital particles */}
          {[...Array(6)].map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * 32;
            const y = Math.sin(angle) * 32;
            
            return (
              <motion.div
                key={`orbital-${i}`}
                className="absolute w-3 h-3 rounded-full bg-shield-purple/80"
                style={{
                  top: `calc(50% + ${y}px)`,
                  left: `calc(50% + ${x}px)`,
                  transform: 'translate(-50%, -50%)'
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
            );
          })}
        </motion.div>
        
        {/* Central shield icon with Solana logo */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 parallax-element"
          data-depth="0.05"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <div className="relative">
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center shadow-lg"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <SolanaLogo width={24} height={24} />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
      
      {/* Feature cards - positioned in a more fluid layout */}
      <div className="absolute inset-0">
        {[
          { 
            title: "Smart Contracts", 
            icon: <Lock className="w-5 h-5 text-white" />,
            position: "top-1/4 left-1/4 -translate-x-1/2",
            delay: 0.2,
            depth: 0.2
          },
          { 
            title: "Instant Claims", 
            icon: <Zap className="w-5 h-5 text-white" />,
            position: "top-1/4 right-1/4 translate-x-1/2",
            delay: 0.4,
            depth: 0.25
          },
          { 
            title: "Verification", 
            icon: <CheckCircle className="w-5 h-5 text-white" />,
            position: "bottom-1/4 left-1/2 -translate-x-1/2",
            delay: 0.6,
            depth: 0.3
          }
        ].map((feature, index) => (
          <motion.div
            key={`feature-${index}`}
            className={`absolute ${feature.position} parallax-element`}
            data-depth={feature.depth}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: feature.delay }}
          >
            <div className="flex items-center bg-background/40 dark:bg-gray-800/40 backdrop-blur-md p-3 rounded-lg border border-shield-purple/20 shadow-lg">
              <div className="w-10 h-10 rounded-full bg-shield-purple flex items-center justify-center mr-3">
                {feature.icon}
              </div>
              <div>
                <div className="text-sm font-bold text-foreground dark:text-white">{feature.title}</div>
                <div className="h-1 w-12 bg-shield-purple/30 rounded-full mt-1">
                  <motion.div
                    className="h-1 bg-shield-purple rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1, delay: feature.delay + 0.3 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Floating particles */}
      {[...Array(12)].map((_, index) => (
        <motion.div
          key={`particle-${index}`}
          className="absolute rounded-full bg-shield-purple"
          style={{ 
            width: 2 + (index % 3),
            height: 2 + (index % 3),
            top: `${10 + (index * 7) % 80}%`,
            left: `${5 + (index * 8) % 90}%`,
          }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 2 + (index % 3),
            delay: index * 0.2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      ))}
      
      {/* Stats card - simplified and better positioned */}
      <motion.div
        className="absolute bottom-10 right-10 bg-background/40 dark:bg-gray-800/40 backdrop-blur-md p-4 rounded-lg border border-shield-purple/20 shadow-lg parallax-element"
        data-depth="0.15"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
      >
        <div className="flex items-center mb-2">
          <div className="w-3 h-3 rounded-full bg-shield-purple mr-2" />
          <div className="text-sm font-bold text-foreground dark:text-white">Protection Stats</div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-foreground/70 dark:text-gray-400">Success Rate</div>
            <div className="text-lg font-bold text-shield-purple">99.5%</div>
          </div>
          
          <div>
            <div className="text-xs text-foreground/70 dark:text-gray-400">Total Value</div>
            <div className="text-lg font-bold text-shield-purple">2.1M</div>
          </div>
        </div>
      </motion.div>
      
      {/* Connecting lines - more organic and fluid */}
      <svg className="absolute inset-0 w-full h-full z-5 opacity-30">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9945FF" stopOpacity="0" />
            <stop offset="50%" stopColor="#9945FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#9945FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <motion.path
          d="M150,150 C200,100 300,100 350,150"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
        
        <motion.path
          d="M150,150 C100,200 100,300 150,350"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 1.5, delay: 0.7 }}
        />
        
        <motion.path
          d="M350,150 C400,200 400,300 350,350"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 1.5, delay: 0.9 }}
        />
        
        <motion.path
          d="M150,350 C200,400 300,400 350,350"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 1.5, delay: 1.1 }}
        />
      </svg>
      
      {/* Subtle noise texture */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay z-30"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"
        }}
      />
    </div>
  );
};

export default ModernHeroVisual;
