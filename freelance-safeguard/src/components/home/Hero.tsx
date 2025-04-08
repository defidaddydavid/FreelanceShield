import { ArrowRight, Shield, CheckCircle, Sparkles, TrendingUp, Zap, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/logo';
import DynamicShieldEcosystem from './DynamicShieldEcosystem';

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-32 bg-transparent text-foreground">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-shield-purple/5 via-transparent to-transparent dark:from-shield-purple/10 dark:via-transparent dark:to-transparent -z-10" />
      
      {/* Animated shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-shield-purple/10 dark:bg-shield-purple/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-shield-purple/10 dark:bg-shield-purple/5 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-shield-purple/10 dark:bg-shield-purple/5 rounded-full blur-3xl animate-pulse-slow animation-delay-4000" />
      </div>
      
      <div className="container mx-auto px-4">
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
              <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-background/80 dark:bg-gray-900/80 backdrop-blur-md py-2 px-4 rounded-full border border-shield-purple/20 dark:border-shield-purple/30 shadow-sm">
                <Logo size={34} />
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
            
            {/* Stats */}
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
                <div key={index} className="text-center p-3 rounded-xl bg-background/50 dark:bg-gray-900/50 backdrop-blur-sm border border-shield-purple/10 dark:border-shield-purple/20">
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
                <Button size="lg" className="px-8 py-3 rounded-md font-medium text-white bg-shield-purple hover:bg-shield-purple/90 transition-colors shadow-lg">
                  Get Protected
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="outline" className="px-8 py-3 rounded-md font-medium border border-shield-purple/30 text-shield-purple hover:bg-shield-purple/10 transition-colors">
                  Learn More
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Hero visualization - Dynamic Shield Ecosystem */}
          <motion.div 
            className="hidden lg:flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <DynamicShieldEcosystem />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
