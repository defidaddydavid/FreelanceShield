import { ArrowRight, Shield, CheckCircle, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/logo';

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-32">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-deep-purple/5 via-background to-background dark:from-deep-purple/10 dark:via-background dark:to-background -z-10" />
      
      {/* Animated shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-deep-purple/10 dark:bg-deep-purple/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-electric-blue/10 dark:bg-electric-blue/5 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-silver/10 dark:bg-silver/5 rounded-full blur-3xl animate-pulse-slow animation-delay-4000" />
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
              <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md py-2 px-4 rounded-full border border-deep-purple/20 dark:border-deep-purple/30 shadow-sm">
                <Logo size={20} />
                <span className="text-sm font-['NT_Brick_Sans'] tracking-wide text-gray-700 dark:text-gray-300">Powered by Solana</span>
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
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-deep-purple to-electric-blue dark:from-deep-purple dark:to-electric-blue">
                Freelance Income
              </span>
            </motion.h1>
            
            {/* Subtitle with improved typography */}
            <motion.p 
              className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
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
                <div key={index} className="text-center p-3 rounded-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-deep-purple/10 dark:border-deep-purple/20">
                  <div className="text-xl md:text-2xl font-['NT_Brick_Sans'] text-deep-purple dark:text-deep-purple">{stat.value}</div>
                  <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                </div>
              ))}
            </motion.div>
            
            {/* CTA buttons with improved styling */}
            <motion.div 
              className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Link to="/new-policy">
                <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-base font-['Open_Sans'] rounded-xl bg-deep-purple hover:bg-deep-purple/90 text-white shadow-md hover:shadow-lg transition-all duration-200">
                  Get Protected
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-base font-['Open_Sans'] rounded-xl border-2 border-deep-purple/20 hover:border-deep-purple/30 text-gray-700 dark:text-gray-300 hover:bg-deep-purple/5 dark:hover:bg-deep-purple/10 transition-all duration-200">
                  Learn More
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Hero image - Shield with animation */}
          <motion.div 
            className="hidden lg:flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="relative">
              {/* Large shield logo */}
              <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
                <Logo size={400} className="drop-shadow-2xl" />
              </div>
              
              {/* Animated features around the shield */}
              <div className="absolute top-0 left-0 w-full h-full">
                {[
                  { icon: <Shield className="h-8 w-8 text-deep-purple" />, label: "Protection", position: "top-10 -left-10" },
                  { icon: <CheckCircle className="h-8 w-8 text-deep-purple" />, label: "Guaranteed", position: "top-1/4 -right-16" },
                  { icon: <Sparkles className="h-8 w-8 text-electric-blue" />, label: "Transparent", position: "bottom-1/4 -left-16" },
                  { icon: <TrendingUp className="h-8 w-8 text-electric-blue" />, label: "Reputation", position: "bottom-10 -right-10" },
                  { icon: <Zap className="h-8 w-8 text-deep-purple" />, label: "Fast Claims", position: "top-1/2 -left-20" },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className={`absolute ${feature.position} bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg flex items-center space-x-2`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + (index * 0.1) }}
                  >
                    {feature.icon}
                    <span className="font-['NT_Brick_Sans'] text-gray-700 dark:text-gray-300">{feature.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
