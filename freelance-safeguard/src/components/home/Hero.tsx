import { ArrowRight, Shield, CheckCircle, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/logo';

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-32">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-blue-950/20 dark:via-background dark:to-background -z-10" />
      
      {/* Animated shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-indigo-400/10 dark:bg-indigo-400/5 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-sky-400/10 dark:bg-sky-400/5 rounded-full blur-3xl animate-pulse-slow animation-delay-4000" />
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
              <div className="flex items-center justify-center space-x-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md py-2 px-4 rounded-full border border-blue-100 dark:border-blue-900/30 shadow-sm hover-lift hover-glow">
                <Logo size={20} className="animate-spin-slow" />
                <span className="text-sm font-medium tracking-wide text-gray-700 dark:text-gray-300">Powered by Solana</span>
              </div>
            </motion.div>
            
            {/* Main heading */}
            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Protect Your 
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
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
                <div key={index} className="text-center p-3 rounded-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-blue-100/50 dark:border-blue-900/20">
                  <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{stat.value}</div>
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
                <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-base font-medium rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 hover-scale hover-bright">
                  Get Protected <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-base font-medium rounded-xl border-2 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 hover-lift">
                  View Pricing
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Hero image/illustration */}
          <motion.div 
            className="hidden lg:block"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="relative">
              {/* Main card */}
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-2xl transform rotate-3 scale-95"></div>
              
              <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Freelance Protection</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Policy #FSH-2025-03</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium rounded-full">
                    Active
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-gray-700 dark:text-gray-300">Coverage Amount</span>
                    </div>
                    <span className="font-semibold">500 SOL</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center space-x-3">
                      <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-gray-700 dark:text-gray-300">Risk Score</span>
                    </div>
                    <span className="font-semibold text-green-600 dark:text-green-400">Low (15/100)</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center space-x-3">
                      <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-gray-700 dark:text-gray-300">Premium</span>
                    </div>
                    <span className="font-semibold">0.25 SOL/month</span>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Protected Against</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        Non-payment, contract disputes, project cancellations, and scope creep
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Animated elements */}
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                
                <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-md animate-bounce-slow">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
