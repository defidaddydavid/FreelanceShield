import { ArrowRight, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { useSolanaTheme } from '@/contexts/SolanaThemeProvider';

const CallToAction = () => {
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1
  });
  
  const { isDark } = useSolanaTheme();

  return (
    <section className="py-24 relative overflow-hidden" ref={ref}>
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-transparent -z-10" />
      
      {/* Animated shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-shield-purple/5 dark:bg-shield-blue/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-shield-blue/5 dark:bg-shield-blue/5 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
      </div>
      
      <div className="container mx-auto px-4">
        <motion.div 
          className="max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-xl relative"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-shield-purple to-shield-purple/80" />
          
          {/* Animated shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
          
          <div className="relative p-12 md:p-16 flex flex-col md:flex-row items-center">
            {/* Left content */}
            <div className="md:w-3/5 mb-8 md:mb-0 md:pr-8">
              <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-white/20 backdrop-blur-md">
                <Logo size={20} className="text-white mr-2" />
                <span className="text-sm font-display tracking-wide text-white">Decentralized Insurance</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                Secure Your Freelance Income with Solana Smart Contracts
              </h2>
              
              <p className="text-white/90 text-lg mb-8">
                FreelanceShield combines Solana's speed and security with modern insurance principles to protect freelancers from project risks, payment disputes, and work disruptions.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" variant="ghost" className="bg-white text-deep-purple hover:bg-white/90 hover:text-deep-purple/90 dark:bg-white dark:text-shield-blue dark:hover:bg-white/90 dark:hover:text-shield-blue/90">
                  <Link to="/dashboard" className="group">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Link to="/how-it-works">
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Right illustration */}
            <div className="md:w-2/5 flex justify-center">
              <div className="relative w-64 h-64">
                {/* Shield shape */}
                <motion.div 
                  className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-3xl border border-white/30"
                  initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                  animate={inView ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.8, rotate: -5 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="w-24 h-24 text-white" />
                  </div>
                </motion.div>
                
                {/* Solana logo element */}
                <motion.div 
                  className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <div className="text-shield-purple dark:text-shield-blue">
                    <Logo size={32} />
                  </div>
                </motion.div>
                
                {/* Sparkles element */}
                <motion.div 
                  className="absolute -bottom-2 -left-2 bg-white rounded-2xl p-4 shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <Sparkles className="w-6 h-6 text-shield-purple dark:text-shield-blue" />
                </motion.div>
                
                {/* Badge element showing modules in architecture */}
                <motion.div 
                  className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-3 shadow-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="text-xs font-semibold text-deep-purple dark:text-shield-blue">12 Specialized Contracts</div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
