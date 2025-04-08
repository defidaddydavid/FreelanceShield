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
      "bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl border border-shield-purple/10 dark:border-shield-purple/20 p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1",
      "relative overflow-hidden"
    )}
    initial={{ opacity: 0, y: 50 }}
    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
  >
    {/* Background gradient */}
    <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-shield-purple/10 to-shield-purple/20 dark:from-shield-purple/20 dark:to-shield-purple/20 rounded-full blur-xl" />
    
    <div className="relative">
      <div className="bg-shield-purple p-3 rounded-xl w-14 h-14 flex items-center justify-center mb-6 shadow-md">
        <div className="text-white">{icon}</div>
      </div>
      
      <h3 className="text-xl font-display font-bold mb-3 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  </motion.div>
);

const Features = () => {
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1
  });

  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Insurance Protection",
      description: "Smart contract backed protection against project cancellations, payment disputes, and work disruptions."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Risk Assessment",
      description: "Customized risk analysis based on project type, client history, and market conditions."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Decentralized Claims",
      description: "Fair and transparent claims process backed by Solana blockchain technology."
    },
    {
      icon: <BarChart className="h-6 w-6" />,
      title: "Reputation Scoring",
      description: "Build credibility with on-chain reputation that follows you across platforms."
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: "Risk Pooling",
      description: "Community-owned risk pools with transparent governance and yield-generating strategies."
    },
    {
      icon: <BrainCircuit className="h-6 w-6" />,
      title: "AI-Driven Pricing",
      description: "Advanced algorithms calculate fair premiums based on project parameters and risk factors."
    }
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-gray-50 dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-gray-900 -z-10" />
      
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.h2 
            className="text-4xl font-display font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-shield-purple to-deep-purple dark:from-shield-purple dark:to-shield-purple"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            Comprehensive Protection for Freelancers
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Built on Solana for speed, transparency, and minimal fees
          </motion.p>
        </div>
        
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Feature
              key={index}
              index={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
