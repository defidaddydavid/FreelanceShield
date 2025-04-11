import * as React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, UserCheck, Landmark } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

// This is a simplified version of ComingSoonPage without wallet dependencies
// for the landing page deployment

const LandingPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Google Form URL for the waitlist (as fallback)
  const WAITLIST_FORM_URL = "https://forms.gle/qZjpDon9kGKqDBJr5";
  
  const joinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call our Vercel API endpoint to add the email and send the welcome email
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Thank you for joining our waitlist!', {
          description: 'We will keep you updated on our launch.',
        });
        
        // Reset the form
        setEmail('');
      } else {
        toast.error(result.message || 'Failed to join waitlist. Please try again.');
        
        // Fallback to Google Form if the API fails
        window.open(WAITLIST_FORM_URL, '_blank');
        toast.info('Waitlist form opened in a new tab as a fallback');
      }
    } catch (error) {
      console.error('Error joining waitlist:', error);
      toast.error('Something went wrong. Please try again later.');
      
      // Fallback to Google Form
      window.open(WAITLIST_FORM_URL, '_blank');
      toast.info('Waitlist form opened in a new tab as a fallback');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Smart Contract Protection',
      description: 'Secure your freelance work with Solana-powered smart contracts that protect against non-payment and disputes'
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Secure Escrow',
      description: 'Funds are held in a secure, trustless escrow until work milestones are verified and approved'
    },
    {
      icon: <UserCheck className="w-6 h-6" />,
      title: 'Reputation System',
      description: 'Build your on-chain reputation with every successful project, increasing trust and opportunities'
    },
    {
      icon: <Landmark className="w-6 h-6" />,
      title: 'Decentralized Arbitration',
      description: 'Fair dispute resolution through a decentralized network of industry experts and stakeholders'
    }
  ];
  
  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Background grid */}
      <div 
        className="absolute inset-0 z-0" 
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(153, 69, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(153, 69, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Animated circles */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-[#9945FF] to-[#14F195] opacity-10"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
            }}
            animate={{
              x: [0, Math.random() * 50 - 25],
              y: [0, Math.random() * 50 - 25],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="flex flex-col items-center justify-center min-h-[90vh]">
          {/* Logo and Heading */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6 px-4"
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold bg-gradient-to-r from-[#9945FF] to-[#14F195] text-transparent bg-clip-text tracking-tight break-words">
              FreelanceShield
            </h1>
          </motion.div>
          
          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-12 px-4"
          >
            <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              The first decentralized insurance protocol for freelancers on Solana
            </p>
          </motion.div>
          
          {/* Example Policy Window */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-gray-900/80 border border-[#9945FF]/30 p-3 sm:p-4 rounded-lg shadow-lg shadow-[#9945FF]/20 backdrop-blur-sm mb-16 w-full max-w-2xl mx-3 sm:mx-auto overflow-hidden"
          >
            <div className="flex items-center mb-3">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500 mr-2"></div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500 mr-2"></div>
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-xs sm:text-sm text-gray-400">policy.rs</span>
            </div>
            
            <pre className="text-xs sm:text-sm text-gray-300 font-mono overflow-x-auto p-1 sm:p-2">
              <code>
{`#[derive(Accounts)]
pub struct CreatePolicy<'info> {
    #[account(mut)]
    pub freelancer: Signer<'info>,
    #[account(mut)]
    pub client: Signer<'info>,
    
    #[account(
        init,
        payer = client,
        space = Policy::SIZE,
        seeds = [
            b"policy",
            freelancer.key().as_ref(),
            client.key().as_ref(),
        ],
        bump
    )]
    pub policy: Account<'info, Policy>,
    
    pub system_program: Program<'info, System>,
}`}
              </code>
            </pre>
          </motion.div>
          
          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16 w-full max-w-4xl px-4"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.3 }}
                className="bg-gray-900/50 border border-[#9945FF]/20 p-5 rounded-lg flex flex-col items-center text-center hover:border-[#9945FF]/50 transition-all"
              >
                <div className="bg-[#9945FF]/20 p-3 rounded-full mb-4">
                  <div className="text-[#14F195]">{feature.icon}</div>
                </div>
                <h3 className="text-white font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Waitlist */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="max-w-md w-full px-4"
          >
            <div className="bg-gray-900/50 border border-[#9945FF]/30 p-4 sm:p-6 rounded-lg text-center backdrop-blur-sm">
              <h2 className="text-white text-lg sm:text-xl font-bold mb-2">Join the Waitlist</h2>
              <p className="text-gray-400 text-sm mb-4">Be first to experience secure freelancing on Solana</p>
              
              <form onSubmit={joinWaitlist} className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white focus:border-[#9945FF]"
                  disabled={isSubmitting}
                />
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-[#8A3BFF] hover:to-[#12E085] text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Joining...' : 'Join'}
                </Button>
              </form>
            </div>
          </motion.div>
          
          {/* Footer */}
          <div className="text-center mt-16 text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} FreelanceShield. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
