import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

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
    <section className="bg-shield-navy py-24 text-white dark:bg-gray-900" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="heading-lg mb-6">
            How <span className="text-shield-blue-light dark:text-blue-400">FreelanceShield</span> Works
          </h2>
          <p className="text-white/80 dark:text-white/70 text-lg">
            A simple, transparent process to protect your freelance business
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={cn(
                  "relative transition-all duration-700 opacity-0 translate-y-8",
                  inView && "opacity-100 translate-y-0"
                )}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start">
                  <div className="bg-shield-blue dark:bg-blue-600 rounded-lg p-2 text-white font-bold text-lg mr-4 flex items-center justify-center min-w-[36px]">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-medium mb-2">
                      {step.title}
                    </h3>
                    <p className="text-white/70 dark:text-white/60">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="h-12 w-0.5 bg-shield-blue-light/20 dark:bg-blue-400/20 absolute left-[1.125rem] top-12 ml-px hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
