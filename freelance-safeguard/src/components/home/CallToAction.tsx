import { ArrowRight, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const CallToAction = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <section className="py-24 relative overflow-hidden" ref={ref}>
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 via-background to-background dark:from-blue-950/10 dark:via-background dark:to-background -z-10" />
      
      {/* Animated shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-400/5 dark:bg-blue-400/3 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-400/5 dark:bg-indigo-400/3 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
      </div>
      
      <div className="container mx-auto px-4">
        <motion.div 
          className="max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-xl relative"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700" />
          
          {/* Animated shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
          
          <div className="relative p-12 md:p-16 text-center text-white">
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center justify-center px-4 py-1.5 mb-8 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium text-sm border border-white/30"
              initial={{ opacity: 0, y: -20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Solana-Powered Protection
            </motion.div>
            
            <motion.h2 
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Ready to Protect Your Freelance Income?
            </motion.h2>
            
            <motion.p 
              className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Join thousands of freelancers who trust FreelanceShield for their income protection.
              Get started in minutes with our simple onboarding process.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-5"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Link to="/new-policy">
                <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-base font-medium rounded-xl bg-white text-blue-600 hover:bg-white/90 shadow-md hover:shadow-lg transition-all duration-200 hover-scale">
                  Get Protected <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-base font-medium rounded-xl border-2 border-white/50 text-white hover:bg-white/10 transition-all duration-200 hover-lift">
                  View Pricing
                </Button>
              </Link>
            </motion.div>
            
            {/* Shield icon */}
            <motion.div 
              className="absolute -top-6 -right-6 w-24 h-24 md:w-32 md:h-32 opacity-20"
              initial={{ opacity: 0, rotate: -20 }}
              animate={inView ? { opacity: 0.2, rotate: 0 } : { opacity: 0, rotate: -20 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Shield className="w-full h-full" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
