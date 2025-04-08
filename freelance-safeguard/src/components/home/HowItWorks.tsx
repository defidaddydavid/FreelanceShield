import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Shield, WalletCards, FileCheck, ShieldCheck, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const HowItWorks = () => {
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1
  });
  
  const steps = [
    {
      number: "01",
      title: "Connect Your Wallet",
      description: "Connect your Solana wallet to access the FreelanceShield platform and manage your insurance policies.",
      icon: <WalletCards className="h-8 w-8 text-shield-purple" />,
      highlight: "Phantom Wallet Integration"
    },
    {
      number: "02",
      title: "Select Coverage",
      description: "Choose from different insurance plans based on your freelance activity and risk tolerance.",
      icon: <Shield className="h-8 w-8 text-shield-purple" />,
      highlight: "Custom Coverage Options"
    },
    {
      number: "03",
      title: "Pay Premium",
      description: "Pay your premium in USDC with minimal fees thanks to Solana's efficient blockchain.",
      icon: <FileCheck className="h-8 w-8 text-shield-purple" />,
      highlight: "Low Solana Transaction Fees"
    },
    {
      number: "04",
      title: "Get Protected",
      description: "Your policy is active immediately with all details secured on the blockchain.",
      icon: <ShieldCheck className="h-8 w-8 text-shield-purple" />,
      highlight: "Instant On-Chain Protection"
    },
    {
      number: "05",
      title: "File Claims Easily",
      description: "If needed, file claims through our streamlined process with on-chain verification.",
      icon: <FileSpreadsheet className="h-8 w-8 text-shield-purple" />,
      highlight: "Smart Contract Automation"
    }
  ];

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        {/* Retro grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage: 'linear-gradient(0deg, transparent 97%, #9945FF 98%, #9945FF 98%, transparent 99%), linear-gradient(90deg, transparent 97%, #9945FF 98%, #9945FF 98%, transparent 99%)',
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Glowing orbs */}
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-shield-purple/10 dark:bg-shield-purple/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-64 h-64 bg-shield-purple/10 dark:bg-shield-purple/20 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.h2 
            className="text-5xl font-['NT_Brick_Sans'] tracking-wide mb-6 bg-clip-text text-transparent bg-gradient-to-r from-shield-purple to-shield-purple/80"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            How FreelanceShield Works
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-300 font-['Open_Sans']"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Simple, transparent, and secure freelance insurance on Solana
          </motion.p>
        </div>
        
        <div className="relative mt-24">
          {/* Timeline connector */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-shield-purple/80 via-shield-purple/40 to-shield-purple/80 transform -translate-x-1/2 rounded-full" />
          
          {/* Steps */}
          <div className="relative z-10">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                className={cn(
                  "flex mb-16 items-center",
                  index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                )}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Content box */}
                <div className={cn(
                  "w-5/12 backdrop-blur-sm p-8 rounded-xl",
                  "border-2 border-shield-purple/20 dark:border-shield-purple/30",
                  "bg-white/80 dark:bg-gray-900/80",
                  "hover:border-shield-purple/50 dark:hover:border-shield-purple/50 transition-colors duration-300",
                  "shadow-[0_4px_20px_-12px_rgba(153,69,255,0.3)]",
                  index % 2 === 0 ? "text-right" : "text-left"
                )}>
                  <div className={cn("flex items-center gap-3 mb-3", index % 2 === 0 ? "justify-end" : "justify-start")}>
                    {index % 2 === 1 && step.icon}
                    <h3 className="text-2xl font-['NT_Brick_Sans'] tracking-wide font-bold text-gray-900 dark:text-white">{step.title}</h3>
                    {index % 2 === 0 && step.icon}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">{step.description}</p>
                  <div className={cn(
                    "inline-block px-3 py-1 rounded-md text-sm font-semibold",
                    "bg-shield-purple/10 dark:bg-shield-purple/20 text-shield-purple"
                  )}>
                    {step.highlight}
                  </div>
                </div>
                
                {/* Number bubble */}
                <div className="w-2/12 flex justify-center">
                  <div className="flex">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-shield-purple/20 rounded-full blur-md animate-pulse-slow group-hover:bg-shield-purple/40 transition-colors"></div>
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-shield-purple to-shield-purple/80 flex items-center justify-center text-white font-['NT_Brick_Sans'] text-xl font-bold shadow-lg relative z-10 border-2 border-shield-purple/20">
                        {step.number}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Empty space for alignment */}
                <div className="w-5/12"></div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* CTA Section */}
        <motion.div 
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Link to="/new-policy">
            <Button className="px-8 py-6 text-lg rounded-xl font-['NT_Brick_Sans'] tracking-wide shadow-[0_4px_20px_-4px_rgba(153,69,255,0.5)]">
              Get Protected Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
