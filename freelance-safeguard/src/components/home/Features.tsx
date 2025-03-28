import { Shield, TrendingUp, Users, BarChart, Database, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
  inView: boolean;
}

const Feature = ({ icon, title, description, index, inView }: FeatureProps) => (
  <motion.div 
    className={cn(
      "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-blue-100 dark:border-blue-900/30 p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1",
      "relative overflow-hidden"
    )}
    initial={{ opacity: 0, y: 50 }}
    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
  >
    {/* Background gradient */}
    <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full blur-xl" />
    
    <div className="relative">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-3 rounded-xl w-14 h-14 flex items-center justify-center mb-6 shadow-md">
        <div className="text-white">{icon}</div>
      </div>
      
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  </motion.div>
);

const Features = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Decentralized Risk Pool",
      description: "Transparent, community-funded insurance pools secured by Solana smart contracts."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Reputation-Based Premiums",
      description: "Lower your insurance costs by building a strong freelance track record."
    },
    {
      icon: <BrainCircuit className="h-6 w-6" />,
      title: "AI Claim Verification",
      description: "Advanced AI models verify claims quickly and accurately with minimal human intervention."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "DAO Governance",
      description: "Community governance allows policy holders to vote on platform changes and improvements."
    },
    {
      icon: <BarChart className="h-6 w-6" />,
      title: "Dynamic Risk Assessment",
      description: "Real-time risk analysis based on market conditions and project parameters."
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: "On-Chain Transparency",
      description: "All transactions and policy details are transparent and verifiable on the Solana blockchain."
    }
  ];

  return (
    <section className="py-20 relative overflow-hidden" ref={ref}>
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-blue-50/30 to-background dark:from-background dark:via-blue-950/10 dark:to-background -z-10" />
      
      <div className="container mx-auto px-4">
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-sm">
            <Shield className="h-4 w-4 mr-2" />
            Powered by Solana Blockchain
          </div>
          
          <h2 className="text-4xl font-bold mb-6">
            Advanced Features for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Modern Freelancers</span>
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-300">
            FreelanceShield combines blockchain technology, AI, and community governance to provide
            secure, affordable insurance tailored to crypto freelancers.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Feature 
              key={index} 
              {...feature} 
              index={index}
              inView={inView} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
