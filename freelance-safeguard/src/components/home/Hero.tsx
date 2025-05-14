import { ArrowRight, Shield, CheckCircle, Sparkles, TrendingUp, Zap, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import LaserAnimation from '@/components/ui/LaserAnimation';

// Solana logo component
const SolanaLogo = ({ width = 34, height = 34 }: { width?: number, height?: number }) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 397 311" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className="mr-2"
    >
      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h320.3c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="#9945FF"/>
      <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h320.3c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="#03E1FF"/>
      <path d="M332.4 120.9c-2.4-2.4-5.7-3.8-9.2-3.8H2.9c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h320.3c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="#7C5CFF"/>
    </svg>
  );
};

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-32 bg-transparent text-foreground">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-shield-purple/5 via-transparent to-transparent dark:from-shield-purple/10 dark:via-transparent dark:to-transparent -z-10" />
      
      {/* Laser animation - positioned with higher z-index to be visible across the entire section */}
      <LaserAnimation className="z-5" />
      
      {/* Gradient bubbles with shield purple colors */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-shield-purple/5 dark:bg-shield-purple/3 rounded-full blur-3xl"
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
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-shield-purple/3 dark:bg-shield-purple/2 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1
          }}
        />
      </div>
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="max-w-xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo badge */}
            <motion.div 
              className="inline-block mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-full bg-background/80 dark:bg-gray-900/80 backdrop-blur-md rounded-full border border-shield-purple/20 dark:border-shield-purple/30 shadow-sm">
                <SolanaLogo width={24} height={24} />
                <span className="text-sm font-['NT_Brick_Sans'] tracking-wide text-foreground dark:text-gray-300">Powered by Solana</span>
              </div>
            </motion.div>
            
            {/* Main heading */}
            <motion.h1 
              className="text-5xl md:text-6xl font-['NT_Brick_Sans'] mb-6 leading-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Protect Your 
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-shield-purple to-shield-purple/80">
                Freelance Income
              </span>
            </motion.h1>
            
            {/* Subtitle with improved typography */}
            <motion.p 
              className="text-lg md:text-xl text-foreground dark:text-gray-300 mb-8 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              FreelanceShield provides decentralized insurance policies to protect
              your crypto earnings against project cancellations, payment disputes, and work disruptions.
            </motion.p>
            
            {/* Stats with enhanced styling */}
            <motion.div 
              className="grid grid-cols-3 gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {[
                { value: "3,500+", label: "Policies Created" },
                { value: "99.5%", label: "Claims Approved" },
                { value: "2.1M", label: "SOL Protected" }
              ].map((stat, index) => (
                <div key={index} className="text-center p-3 rounded-xl bg-background/50 dark:bg-gray-900/50 backdrop-blur-sm border border-shield-purple/10 dark:border-shield-purple/20 hover:border-shield-purple/30 transition-all duration-300 hover:shadow-lg hover:shadow-shield-purple/10">
                  <div className="text-xl md:text-2xl font-['NT_Brick_Sans'] text-shield-purple dark:text-shield-purple">{stat.value}</div>
                  <div className="text-xs md:text-sm text-foreground dark:text-gray-400">{stat.label}</div>
                </div>
              ))}
            </motion.div>
            
            {/* CTA buttons with improved styling */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Link to="/new-policy">
                <Button size="lg" className="px-8 py-3 rounded-md font-medium text-white bg-shield-purple hover:bg-shield-purple/90 transition-colors shadow-lg hover:shadow-xl hover:shadow-shield-purple/20 border border-white/10">
                  Get Protected
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="outline" className="px-8 py-3 rounded-md font-medium border border-shield-purple/30 text-shield-purple hover:bg-shield-purple/10 transition-colors hover:shadow-lg">
                  Learn More
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Right side - Shield visualization */}
          <motion.div 
            className="hidden lg:flex lg:items-center lg:justify-center relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="relative w-[400px] h-[400px] flex items-center justify-center">
              {/* Background glow */}
              <motion.div 
                className="absolute inset-0 bg-shield-purple/10 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              
              {/* Shield icon */}
              <motion.div
                className="relative z-10"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <Shield className="w-40 h-40 text-shield-purple" />
              </motion.div>
              
              {/* Orbital ring */}
              <motion.div
                className="absolute w-[300px] h-[300px] rounded-full border border-shield-purple/30"
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 40,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                {/* Orbital dots */}
                {[...Array(6)].map((_, i) => {
                  const angle = (i / 6) * Math.PI * 2;
                  const x = Math.cos(angle) * 150;
                  const y = Math.sin(angle) * 150;
                  
                  return (
                    <motion.div
                      key={`dot-${i}`}
                      className="absolute w-3 h-3 rounded-full bg-shield-purple"
                      style={{
                        top: `calc(50% + ${y}px)`,
                        left: `calc(50% + ${x}px)`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.3,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    />
                  );
                })}
              </motion.div>
              
              {/* Solana logo in center */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center shadow-lg z-20"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <SolanaLogo width={32} height={32} />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
