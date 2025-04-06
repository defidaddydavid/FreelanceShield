import { ArrowRight, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Logo } from '@/components/ui/logo';

const CallToAction = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <section className="py-24 relative overflow-hidden" ref={ref}>
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-deep-purple/5 via-background to-background dark:from-deep-purple/10 dark:via-background dark:to-background -z-10" />
      
      {/* Animated shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-deep-purple/5 dark:bg-deep-purple/3 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-electric-blue/5 dark:bg-electric-blue/3 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
      </div>
      
      <div className="container mx-auto px-4">
        <motion.div 
          className="max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-xl relative"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-deep-purple to-electric-blue dark:from-deep-purple dark:to-electric-blue" />
          
          {/* Animated shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
          
          <div className="relative p-12 md:p-16 text-center text-white">
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center justify-center px-4 py-1.5 mb-8 rounded-full bg-white/20 backdrop-blur-sm text-white font-['NT_Brick_Sans'] text-sm border border-white/30"
              initial={{ opacity: 0, y: -20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Shield className="mr-2 h-4 w-4" />
              <span className="font-['NT_Brick_Sans']">Secure Your Freelance Future</span>
            </motion.div>
            
            {/* Logo */}
            <motion.div
              className="mb-8 flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Logo size={60} withText={true} textSize="text-2xl" className="text-white" />
            </motion.div>
            
            {/* Heading */}
            <motion.h2 
              className="text-3xl md:text-4xl lg:text-5xl font-['NT_Brick_Sans'] mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Join thousands of freelancers protecting their income on Solana
            </motion.h2>
            
            {/* Description */}
            <motion.p 
              className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              Create your first insurance policy in minutes and join our growing community of protected freelancers.
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Link to="/new-policy">
                <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-base font-['Open_Sans'] rounded-xl bg-white hover:bg-white/90 text-deep-purple shadow-md hover:shadow-lg transition-all duration-200">
                  Get Protected Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-base font-['Open_Sans'] rounded-xl border-2 border-white/50 hover:border-white/70 text-white hover:bg-white/10 transition-all duration-200">
                  Learn More
                </Button>
              </Link>
            </motion.div>
            
            {/* Features */}
            <motion.div 
              className="mt-12 flex flex-wrap justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              {["Instant Coverage", "Automatic Payouts", "Transparent Claims", "Community Governed"].map((feature, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-['NT_Brick_Sans'] border border-white/20">
                  <Sparkles className="inline-block mr-1 h-3 w-3" />
                  {feature}
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
