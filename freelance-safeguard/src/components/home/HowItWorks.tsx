import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const HowItWorks = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  
  const steps = [
    {
      number: "01",
      title: "Connect Your Wallet",
      description: "Connect your Solana wallet to access the FreelanceShield platform and manage your insurance policies."
    },
    {
      number: "02",
      title: "Select Coverage",
      description: "Choose from different insurance plans based on your freelance activity and risk tolerance."
    },
    {
      number: "03",
      title: "Pay Premium",
      description: "Pay your premium in USDC with minimal fees thanks to Solana's efficient blockchain."
    },
    {
      number: "04",
      title: "Get Protected",
      description: "Your policy is active immediately with all details secured on the blockchain."
    },
    {
      number: "05",
      title: "Submit Claims",
      description: "If an insured event occurs, submit your claim through our intuitive interface."
    },
    {
      number: "06",
      title: "Receive Payment",
      description: "Once verified by our AI system, receive your payout instantly to your wallet."
    }
  ];

  return (
    <section className="bg-gray-900 py-24 text-white" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.h2 
            className="text-4xl font-brick font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            How <span className="text-transparent bg-clip-text bg-gradient-to-r from-deep-purple to-electric-blue">FreelanceShield</span> Works
          </motion.h2>
          <motion.p 
            className="text-white/80 text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            A simple, transparent process to protect your freelance business
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              className={cn(
                "bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 border border-gray-700",
                "relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              )}
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-deep-purple/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="text-4xl font-brick font-bold text-transparent bg-clip-text bg-gradient-to-r from-deep-purple to-electric-blue mb-4">
                  {step.number}
                </div>
                
                <h3 className="text-xl font-brick font-bold mb-3 text-white">
                  {step.title}
                </h3>
                
                <p className="text-white/70">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
